/**
 * PyPack Webscraper MCP Runtime
 * Handles subprocess spawning, MCP communication, and HTTP bridge fallback
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  getWebscraperMcpEnabled,
  getWebscraperMcpFailOpen,
  getWebscraperMcpModule,
  getWebscraperMcpRepoPath,
  getWebscraperMcpStartupRetryAttempts,
  getWebscraperMcpStartupRetryDelayMs,
  getWebscraperMcpStartupTimeoutMs,
  getWebscraperRestApiBaseUrl,
  getWebscraperRestApiToken,
  getWebscraperRestApiTimeoutMs,
} from "@/lib/config/env";
import { mapWebscraperChatToolToMcpName } from "./webscraper-alias";

export type WebscraperScrapeInput = {
  operation?: "fetch" | "history" | "health";
  strategy?: "api" | "scraper" | "auto";
  search_term?: string;
  limit?: number;
  persist?: boolean;
  db_path?: string;
};

function normalizeRuntimeError(
  code: string,
  message: string,
  retriable: boolean,
): { ok: false; error: { code: string; message: string; retriable: boolean } } {
  return {
    ok: false,
    error: {
      code,
      message,
      retriable,
    },
  };
}

function extractTextContent(result: unknown): string | null {
  if (!result || typeof result !== "object") {
    return null;
  }

  if (
    "content" in result &&
    Array.isArray((result as { content?: unknown[] }).content)
  ) {
    const textPart = (
      result as { content: Array<{ type?: string; text?: string }> }
    ).content.find(
      (item) => item?.type === "text" && typeof item.text === "string",
    );
    return textPart?.text ?? null;
  }

  if ("toolResult" in result) {
    const toolResult = (result as { toolResult?: unknown }).toolResult;
    if (typeof toolResult === "string") {
      return toolResult;
    }
    if (toolResult !== undefined) {
      return JSON.stringify(toolResult);
    }
  }

  return null;
}

function parseMaybeJson(text: string): unknown {
  const trimmed = text.trim();
  if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) {
    return text;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return text;
  }
}

function isRetriableMcpError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("econnreset") ||
    message.includes("econnrefused") ||
    message.includes("ehostunreach") ||
    message.includes("enotfound") ||
    message.includes("network")
  );
}

function getSpawnEnv(): Record<string, string> {
  const envEntries = Object.entries(process.env).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  );
  const env = Object.fromEntries(envEntries);

  const baseUrl = getWebscraperRestApiBaseUrl();
  if (baseUrl) {
    env.WEBSCRAPER_REST_API_BASE_URL = baseUrl;
  }

  const apiToken = getWebscraperRestApiToken();
  if (apiToken) {
    env.WEBSCRAPER_API_TOKEN = apiToken;
  }

  env.WEBSCRAPER_REST_API_TIMEOUT_MS = String(getWebscraperRestApiTimeoutMs());
  env.WEBSCRAPER_MCP_ENABLED = getWebscraperMcpEnabled() ? "true" : "false";

  return env;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}

function buildFetchParams(args: WebscraperScrapeInput): URLSearchParams {
  const params = new URLSearchParams();

  if (args.strategy) {
    params.set("strategy", args.strategy);
  }
  if (args.search_term) {
    // Support both legacy and current API query key conventions.
    params.set("search", args.search_term);
    params.set("q", args.search_term);
  }
  if (typeof args.limit === "number") {
    params.set("limit", String(args.limit));
  }

  return params;
}

function buildHistoryParams(args: WebscraperScrapeInput): URLSearchParams {
  const params = new URLSearchParams();

  if (args.db_path) {
    params.set("db_path", args.db_path);
  }

  return params;
}

function getOperationFallbackEndpoints(args: WebscraperScrapeInput): string[] {
  const operation = args.operation ?? "fetch";

  if (operation === "health") {
    return ["/health"];
  }

  if (operation === "history") {
    return ["/products/history", "/history"];
  }

  return ["/products/search", "/fetch"];
}

function buildOperationParams(args: WebscraperScrapeInput): URLSearchParams {
  const operation = args.operation ?? "fetch";
  if (operation === "history") {
    return buildHistoryParams(args);
  }
  if (operation === "health") {
    return new URLSearchParams();
  }

  return buildFetchParams(args);
}

async function queryProductHuntTrackerApi(
  baseUrl: string,
  args: WebscraperScrapeInput,
  apiToken: string | undefined,
  controller: AbortController,
): Promise<unknown> {
  const fallbackEndpoints = getOperationFallbackEndpoints(args);
  const params = buildOperationParams(args);
  let lastStatus = 0;

  for (const candidateEndpoint of fallbackEndpoints) {
    const operationUrl = new URL(candidateEndpoint, baseUrl);

    if (params.toString()) {
      operationUrl.search = params.toString();
    }

    const response = await fetch(operationUrl.toString(), {
      method: "GET",
      headers: {
        ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
      },
      signal: controller.signal,
    });

    if (response.ok) {
      return response.json();
    }

    lastStatus = response.status;
    if (response.status !== 404) {
      return normalizeRuntimeError(
        "webscraper_http_error",
        `ph_ai_tracker API returned ${response.status} for ${candidateEndpoint}.`,
        response.status === 408 ||
          response.status === 429 ||
          response.status >= 500,
      );
    }
  }

  return normalizeRuntimeError(
    "webscraper_http_error",
    `ph_ai_tracker API endpoint not found for operation '${args.operation ?? "fetch"}'. Tried: ${fallbackEndpoints.join(", ")}.` +
      (lastStatus ? ` Last status: ${lastStatus}.` : ""),
    false,
  );
}

async function scrapeViaHttpBridge(
  _chatToolName: string,
  args: WebscraperScrapeInput,
): Promise<unknown | undefined> {
  const baseUrl = getWebscraperRestApiBaseUrl();
  if (!baseUrl) {
    return undefined;
  }

  const timeoutMs = getWebscraperRestApiTimeoutMs();
  const apiToken = getWebscraperRestApiToken();
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // API-first mode for ph_ai_tracker service.
    return await queryProductHuntTrackerApi(
      baseUrl,
      args,
      apiToken,
      controller,
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return normalizeRuntimeError(
        "webscraper_runtime_error",
        `ph_ai_tracker API call timed out after ${timeoutMs}ms.`,
        true,
      );
    }

    return normalizeRuntimeError(
      "webscraper_runtime_error",
      error instanceof Error
        ? error.message
        : "Unknown ph_ai_tracker API error.",
      isRetriableMcpError(error),
    );
  } finally {
    clearTimeout(timeoutHandle);
  }
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(
        new Error(`Webscraper MCP startup timed out after ${timeoutMs}ms.`),
      );
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

export function canStartWebscraperMcpSubprocess(): boolean {
  const repoPath = resolve(getWebscraperMcpRepoPath());
  return existsSync(repoPath);
}

export function shouldRegisterWebscraperTool(): boolean {
  if (!getWebscraperMcpEnabled()) {
    return false;
  }

  if (!getWebscraperMcpFailOpen()) {
    return true;
  }

  if (getWebscraperRestApiBaseUrl()) {
    return true;
  }

  return canStartWebscraperMcpSubprocess();
}

class WebscraperMcpRuntime {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private shutdownHooksRegistered = false;

  private resetRuntimeState(): void {
    this.client = null;
    this.transport = null;
  }

  private async closeTransportSilently(): Promise<void> {
    try {
      await this.transport?.close();
    } catch {
      // ignore shutdown exceptions during retry cleanup
    } finally {
      this.resetRuntimeState();
    }
  }

  private registerShutdownHooks(): void {
    if (this.shutdownHooksRegistered) {
      return;
    }

    this.shutdownHooksRegistered = true;

    const onSignal = (signal: string) => {
      console.info(
        `[webscraper-mcp] received ${signal}; closing MCP transport`,
      );
      void this.closeTransportSilently();
    };

    process.on("SIGTERM", () => onSignal("SIGTERM"));
    process.on("SIGINT", () => onSignal("SIGINT"));
    process.on("beforeExit", () => {
      void this.closeTransportSilently();
    });
  }

  private async ensureClient(): Promise<Client> {
    if (this.client) {
      return this.client;
    }

    const repoPath = resolve(getWebscraperMcpRepoPath());
    const startupTimeoutMs = getWebscraperMcpStartupTimeoutMs();
    const startupRetryAttempts = getWebscraperMcpStartupRetryAttempts();
    const startupRetryDelayMs = getWebscraperMcpStartupRetryDelayMs();

    let lastError: unknown;
    for (let attempt = 1; attempt <= startupRetryAttempts + 1; attempt += 1) {
      try {
        this.transport = new StdioClientTransport({
          command: "poetry",
          args: ["run", "python", "-m", getWebscraperMcpModule()],
          cwd: repoPath,
          env: getSpawnEnv(),
          stderr: "pipe",
        });

        this.transport.onerror = (error) => {
          console.error("[webscraper-mcp] transport error", error);
        };

        this.transport.onclose = () => {
          this.resetRuntimeState();
        };

        const client = new Client({
          name: "studio-ordo-webscraper-client",
          version: "1.0.0",
        });

        await withTimeout(client.connect(this.transport), startupTimeoutMs);

        this.registerShutdownHooks();
        this.client = client;
        return this.client;
      } catch (error) {
        lastError = error;
        await this.closeTransportSilently();

        if (attempt <= startupRetryAttempts) {
          console.warn(
            `[webscraper-mcp] startup attempt ${attempt} failed, retrying in ${startupRetryDelayMs}ms...`,
            error,
          );
          await sleep(startupRetryDelayMs);
        }
      }
    }

    throw lastError;
  }

  async scrape(
    toolName: string,
    args: WebscraperScrapeInput,
  ): Promise<unknown> {
    try {
      const client = await this.ensureClient();
      const response = await client.callTool({
        name: mapWebscraperChatToolToMcpName(toolName),
        arguments: args,
      });

      const textContent = extractTextContent(response);
      if (textContent) {
        return parseMaybeJson(textContent);
      }

      return response;
    } catch (error) {
      console.error("[webscraper-mcp] tool call failed", error);

      return normalizeRuntimeError(
        "webscraper_mcp_error",
        error instanceof Error ? error.message : "Unknown MCP error",
        isRetriableMcpError(error),
      );
    }
  }
}

const pcmcpRuntime = new WebscraperMcpRuntime();

export async function queryWebscraperMcp(
  toolName: string,
  args: WebscraperScrapeInput,
): Promise<unknown> {
  // 1. Try HTTP bridge first (if configured)
  const httpResult = await scrapeViaHttpBridge(toolName, args);
  if (httpResult !== undefined) {
    return httpResult;
  }

  // 2. Fallback to subprocess MCP
  return pcmcpRuntime.scrape(toolName, args);
}
