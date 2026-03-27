const EMPTY_ENV_MESSAGE = "must be set to a non-empty value";
const warnedLegacyKeys = new Set<string>();

function readEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return undefined;
}

function warnLegacy(legacyKey: string, primaryKey: string) {
  if (warnedLegacyKeys.has(legacyKey)) {
    return;
  }

  warnedLegacyKeys.add(legacyKey);
  console.warn(
    `Deprecated environment variable ${legacyKey} is in use. Prefer ${primaryKey} for new deployments.`,
  );
}

function requireNonEmpty(value: string | undefined, keysLabel: string): string {
  if (!value) {
    throw new Error(`${keysLabel} ${EMPTY_ENV_MESSAGE}.`);
  }

  return value;
}

function readPrimaryThenLegacy(
  primaryKey: string,
  legacyKey: string,
): string | undefined {
  const primary = readEnv(primaryKey);
  if (primary) {
    return primary;
  }

  const legacy = readEnv(legacyKey);
  if (legacy) {
    warnLegacy(legacyKey, primaryKey);
    return legacy;
  }

  return undefined;
}

export function getAnthropicApiKey(): string {
  const value = readPrimaryThenLegacy(
    "ANTHROPIC_API_KEY",
    "API__ANTHROPIC_API_KEY",
  );
  return requireNonEmpty(value, "ANTHROPIC_API_KEY/API__ANTHROPIC_API_KEY");
}

export function getOpenaiApiKey(): string {
  const value = readPrimaryThenLegacy("OPENAI_API_KEY", "API__OPENAI_API_KEY");
  return requireNonEmpty(value, "OPENAI_API_KEY/API__OPENAI_API_KEY");
}

export function getAnthropicModel(): string {
  return (
    readPrimaryThenLegacy("ANTHROPIC_MODEL", "API__ANTHROPIC_MODEL") ??
    "claude-haiku-4-5"
  );
}

function parsePositiveIntegerEnv(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function parseBooleanEnv(
  value: string | undefined,
  fallback: boolean,
): boolean {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

export function getAnthropicRequestTimeoutMs(): number {
  return parsePositiveIntegerEnv(
    readPrimaryThenLegacy(
      "ANTHROPIC_REQUEST_TIMEOUT_MS",
      "API__ANTHROPIC_REQUEST_TIMEOUT_MS",
    ),
    45000,
  );
}

export function getAnthropicRequestRetryAttempts(): number {
  return parsePositiveIntegerEnv(
    readPrimaryThenLegacy(
      "ANTHROPIC_RETRY_ATTEMPTS",
      "API__ANTHROPIC_RETRY_ATTEMPTS",
    ),
    3,
  );
}

export function getAnthropicRequestRetryDelayMs(): number {
  return parsePositiveIntegerEnv(
    readPrimaryThenLegacy(
      "ANTHROPIC_RETRY_DELAY_MS",
      "API__ANTHROPIC_RETRY_DELAY_MS",
    ),
    150,
  );
}

export function getGarysEventsMcpEnabled(): boolean {
  return parseBooleanEnv(readEnv("GARYS_EVENTS_MCP_ENABLED"), true);
}

export function getGarysEventsMcpFailOpen(): boolean {
  return parseBooleanEnv(readEnv("GARYS_EVENTS_MCP_FAIL_OPEN"), true);
}

export function getGarysEventsChatDotNameCompatible(): boolean {
  return parseBooleanEnv(
    readEnv("GARYS_EVENTS_CHAT_DOT_NAME_COMPATIBLE"),
    false,
  );
}

export function getGarysEventsMcpRepoPath(): string {
  return readEnv("GARYS_EVENTS_MCP_REPO_PATH") ?? "../PyPack_GarysGuide";
}

export function getGarysEventsMcpModule(): string {
  return readEnv("GARYS_EVENTS_MCP_MODULE") ?? "garys_nyc_events.mcp.server";
}

export function getGarysEventsRestApiBaseUrl(): string | undefined {
  return readEnv("GARYS_EVENTS_REST_API_BASE_URL");
}

export function getGarysEventsRestApiToken(): string | undefined {
  return readEnv("GARYS_EVENTS_REST_API_TOKEN", "API_TOKEN");
}

export function getGarysEventsRestApiTimeoutMs(): number {
  return parsePositiveIntegerEnv(
    readEnv("GARYS_EVENTS_REST_API_TIMEOUT_MS"),
    10000,
  );
}

export function getGarysEventsMcpStartupTimeoutMs(): number {
  return parsePositiveIntegerEnv(
    readEnv("GARYS_EVENTS_MCP_STARTUP_TIMEOUT_MS"),
    8000,
  );
}

export function getGarysEventsMcpStartupRetryAttempts(): number {
  return parsePositiveIntegerEnv(
    readEnv("GARYS_EVENTS_MCP_STARTUP_RETRY_ATTEMPTS"),
    1,
  );
}

export function getGarysEventsMcpStartupRetryDelayMs(): number {
  return parsePositiveIntegerEnv(
    readEnv("GARYS_EVENTS_MCP_STARTUP_RETRY_DELAY_MS"),
    250,
  );
}

// ---------------------------------------------------------------------------
// Webscraper MCP Configuration
// ---------------------------------------------------------------------------

export function getWebscraperMcpEnabled(): boolean {
  return parseBooleanEnv(readEnv("WEBSCRAPER_MCP_ENABLED"), false);
}

export function getWebscraperMcpFailOpen(): boolean {
  return parseBooleanEnv(readEnv("WEBSCRAPER_MCP_FAIL_OPEN"), true);
}

export function getWebscraperChatDotNameCompatible(): boolean {
  return parseBooleanEnv(readEnv("WEBSCRAPER_CHAT_DOT_NAME_COMPATIBLE"), false);
}

export function getWebscraperMcpRepoPath(): string {
  return readEnv("WEBSCRAPER_MCP_REPO_PATH") ?? "../ph_ai_tracker";
}

export function getWebscraperMcpModule(): string {
  return readEnv("WEBSCRAPER_MCP_MODULE") ?? "ph_ai_tracker.api";
}

export function getWebscraperRestApiBaseUrl(): string | undefined {
  return readEnv("WEBSCRAPER_REST_API_BASE_URL");
}

export function getWebscraperRestApiToken(): string | undefined {
  return readEnv("WEBSCRAPER_REST_API_TOKEN", "WEBSCRAPER_API_TOKEN");
}

export function getWebscraperRestApiTimeoutMs(): number {
  return parsePositiveIntegerEnv(
    readEnv("WEBSCRAPER_REST_API_TIMEOUT_MS"),
    10000,
  );
}

export function getWebscraperMcpStartupTimeoutMs(): number {
  return parsePositiveIntegerEnv(
    readEnv("WEBSCRAPER_MCP_STARTUP_TIMEOUT_MS"),
    8000,
  );
}

export function getWebscraperMcpStartupRetryAttempts(): number {
  return parsePositiveIntegerEnv(
    readEnv("WEBSCRAPER_MCP_STARTUP_RETRY_ATTEMPTS"),
    1,
  );
}

export function getWebscraperMcpStartupRetryDelayMs(): number {
  return parsePositiveIntegerEnv(
    readEnv("WEBSCRAPER_MCP_STARTUP_RETRY_DELAY_MS"),
    250,
  );
}

export function getModelFallbacks(): string[] {
  const configured = readPrimaryThenLegacy(
    "ANTHROPIC_MODEL",
    "API__ANTHROPIC_MODEL",
  );
  const models = [
    configured,
    "claude-haiku-4-5",
    "claude-sonnet-4-6",
    "claude-opus-4-6",
  ].filter(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );

  return [...new Set(models)];
}

export function validateRequiredRuntimeConfig() {
  getAnthropicApiKey();
}
