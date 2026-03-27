import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  getGarysEventsMcpEnabled,
  getGarysEventsMcpFailOpen,
  getGarysEventsMcpModule,
  getGarysEventsMcpRepoPath,
  getGarysEventsMcpStartupRetryAttempts,
  getGarysEventsMcpStartupRetryDelayMs,
  getGarysEventsMcpStartupTimeoutMs,
  getGarysEventsRestApiBaseUrl,
  getGarysEventsRestApiToken,
  getGarysEventsRestApiTimeoutMs,
} from "@/lib/config/env";
import {
  GARYS_EVENTS_MCP_TOOL_NAME,
  mapGarysEventsChatToolToMcpName,
} from "./garys-events-alias";

export type GarysEventsQueryInput = {
  ai_only?: boolean;
  limit: number;
  tags?: string[];
  date_from?: string;
  date_to?: string;
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

  const baseUrl = getGarysEventsRestApiBaseUrl();
  if (baseUrl) {
    env.GARYS_EVENTS_REST_API_BASE_URL = baseUrl;
  }

  const apiToken = getGarysEventsRestApiToken();
  if (apiToken) {
    env.API_TOKEN = apiToken;
  }

  env.GARYS_EVENTS_REST_API_TIMEOUT_MS = String(
    getGarysEventsRestApiTimeoutMs(),
  );
  env.GARYS_EVENTS_MCP_ENABLED = getGarysEventsMcpEnabled() ? "true" : "false";

  return env;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}

function shouldFallbackToDirectEvents(result: unknown): boolean {
  if (!result || typeof result !== "object") {
    return false;
  }

  const payload = result as {
    ok?: unknown;
    error?: { code?: unknown };
  };

  return (
    payload.ok === false && payload.error?.code === "upstream_client_error"
  );
}

function buildEventsParams(args: GarysEventsQueryInput): URLSearchParams {
  const params = new URLSearchParams();
  params.set("limit", String(args.limit));

  if (typeof args.ai_only === "boolean") {
    params.set("ai_only", args.ai_only ? "true" : "false");
  }
  if (args.date_from) {
    params.set("date_from", args.date_from);
  }
  if (args.date_to) {
    params.set("date_to", args.date_to);
  }
  if (Array.isArray(args.tags) && args.tags.length > 0) {
    params.set("tags", args.tags.join(","));
  }

  return params;
}

async function queryGarysEventsRestDirect(
  baseUrl: string,
  args: GarysEventsQueryInput,
  apiToken: string | undefined,
  controller: AbortController,
): Promise<unknown> {
  const directUrl = new URL("/events", baseUrl);
  directUrl.search = buildEventsParams(args).toString();

  const response = await fetch(directUrl.toString(), {
    method: "GET",
    headers: {
      ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
    },
    signal: controller.signal,
  });

  if (!response.ok) {
    return normalizeRuntimeError(
      "mcp_http_error",
      `Gary events REST endpoint returned ${response.status}.`,
      response.status === 408 ||
        response.status === 429 ||
        response.status >= 500,
    );
  }

  const payload = await response.json();
  if (!payload || typeof payload !== "object") {
    return normalizeRuntimeError(
      "mcp_parse_error",
      "Gary events REST endpoint returned an invalid JSON payload.",
      false,
    );
  }

  const events = Array.isArray((payload as { events?: unknown[] }).events)
    ? (payload as { events: unknown[] }).events
    : [];
  const countValue = (payload as { count?: unknown }).count;

  return {
    ok: true,
    data: {
      count: typeof countValue === "number" ? countValue : events.length,
      events,
    },
  };
}

async function queryGarysEventsHttpBridge(
  chatToolName: string,
  args: GarysEventsQueryInput,
): Promise<unknown | undefined> {
  const baseUrl = getGarysEventsRestApiBaseUrl();
  if (!baseUrl) {
    return undefined;
  }

  const timeoutMs = getGarysEventsRestApiTimeoutMs();
  const apiToken = getGarysEventsRestApiToken();
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(new URL("/mcp", baseUrl).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
      },
      body: JSON.stringify({
        method: "CallTool",
        params: {
          name: mapGarysEventsChatToolToMcpName(chatToolName),
          arguments: args,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return normalizeRuntimeError(
        "mcp_http_error",
        `MCP HTTP bridge returned ${response.status}.`,
        response.status === 408 ||
          response.status === 429 ||
          response.status >= 500,
      );
    }

    const bridgePayload = await response.json();
    if (!shouldFallbackToDirectEvents(bridgePayload)) {
      return bridgePayload;
    }

    // Fallback when backend MCP proxy cannot query upstream /events due auth mismatch.
    return await queryGarysEventsRestDirect(
      baseUrl,
      args,
      apiToken,
      controller,
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return normalizeRuntimeError(
        "mcp_runtime_error",
        `MCP HTTP bridge timed out after ${timeoutMs}ms.`,
        true,
      );
    }

    return normalizeRuntimeError(
      "mcp_runtime_error",
      error instanceof Error ? error.message : "Unknown MCP HTTP bridge error.",
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
      reject(new Error(`MCP startup timed out after ${timeoutMs}ms.`));
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

export function canStartGarysEventsMcpSubprocess(): boolean {
  const repoPath = resolve(getGarysEventsMcpRepoPath());
  return existsSync(repoPath) && Boolean(getGarysEventsRestApiBaseUrl());
}

export function shouldRegisterGarysEventsTool(): boolean {
  if (!getGarysEventsMcpEnabled()) {
    return false;
  }

  if (!getGarysEventsMcpFailOpen()) {
    return true;
  }

  return canStartGarysEventsMcpSubprocess();
}

class GarysEventsMcpRuntime {
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
        `[garys-events-mcp] received ${signal}; closing MCP transport`,
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

    const repoPath = resolve(getGarysEventsMcpRepoPath());
    const startupTimeoutMs = getGarysEventsMcpStartupTimeoutMs();
    const startupRetryAttempts = getGarysEventsMcpStartupRetryAttempts();
    const startupRetryDelayMs = getGarysEventsMcpStartupRetryDelayMs();

    let lastError: unknown;
    for (let attempt = 1; attempt <= startupRetryAttempts + 1; attempt += 1) {
      try {
        this.transport = new StdioClientTransport({
          command: "poetry",
          args: ["run", "python", "-m", getGarysEventsMcpModule()],
          cwd: repoPath,
          env: getSpawnEnv(),
          stderr: "pipe",
        });

        this.transport.onerror = (error) => {
          console.error("[garys-events-mcp] transport error", error);
        };

        this.transport.onclose = () => {
          this.resetRuntimeState();
        };

        const client = new Client({
          name: "studio-ordo-garys-events-client",
          version: "0.1.0",
        });

        await withTimeout(client.connect(this.transport), startupTimeoutMs);
        this.registerShutdownHooks();

        this.client = client;
        return client;
      } catch (error) {
        lastError = error;
        await this.closeTransportSilently();

        if (attempt <= startupRetryAttempts) {
          await sleep(startupRetryDelayMs);
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Unable to start Garys events MCP subprocess.");
  }

  async queryEvents(
    chatToolName: string,
    args: GarysEventsQueryInput,
  ): Promise<unknown> {
    try {
      const httpResult = await queryGarysEventsHttpBridge(chatToolName, args);
      if (httpResult !== undefined) {
        return httpResult;
      }

      const client = await this.ensureClient();
      const result = await client.callTool({
        name: mapGarysEventsChatToolToMcpName(chatToolName),
        arguments: args,
      });

      const text = extractTextContent(result);
      if (!text) {
        return normalizeRuntimeError(
          "mcp_empty_result",
          "MCP tool returned no usable content.",
          false,
        );
      }

      return parseMaybeJson(text);
    } catch (error) {
      return normalizeRuntimeError(
        "mcp_runtime_error",
        error instanceof Error ? error.message : "Unknown MCP runtime error.",
        isRetriableMcpError(error),
      );
    }
  }

  async shutdown(): Promise<void> {
    await this.closeTransportSilently();
  }
}

const runtime = new GarysEventsMcpRuntime();

export async function queryGarysEventsMcp(
  chatToolName: string,
  args: GarysEventsQueryInput,
): Promise<unknown> {
  return runtime.queryEvents(chatToolName, args);
}

export async function shutdownGarysEventsMcpRuntime(): Promise<void> {
  return runtime.shutdown();
}

export function getGarysEventsMcpCanonicalToolName(): string {
  return GARYS_EVENTS_MCP_TOOL_NAME;
}
