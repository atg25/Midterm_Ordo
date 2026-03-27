import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getAnthropicApiKey,
  getAnthropicModel,
  getAnthropicRequestRetryAttempts,
  getAnthropicRequestRetryDelayMs,
  getAnthropicRequestTimeoutMs,
  getGarysEventsChatDotNameCompatible,
  getGarysEventsMcpEnabled,
  getGarysEventsMcpFailOpen,
  getGarysEventsMcpModule,
  getGarysEventsMcpRepoPath,
  getGarysEventsMcpStartupRetryAttempts,
  getGarysEventsMcpStartupRetryDelayMs,
  getGarysEventsMcpStartupTimeoutMs,
  getGarysEventsRestApiBaseUrl,
  getGarysEventsRestApiTimeoutMs,
  getModelFallbacks,
  validateRequiredRuntimeConfig,
} from "@/lib/config/env";

describe("env config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("reads ANTHROPIC_API_KEY first", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "new-key");
    vi.stubEnv("API__ANTHROPIC_API_KEY", "legacy-key");

    expect(getAnthropicApiKey()).toBe("new-key");
  });

  it("falls back to API__ANTHROPIC_API_KEY", () => {
    const warningSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("API__ANTHROPIC_API_KEY", "legacy-key");

    expect(getAnthropicApiKey()).toBe("legacy-key");
    expect(warningSpy).toHaveBeenCalled();
  });

  it("throws when no anthropic key is provided", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("API__ANTHROPIC_API_KEY", "   ");

    expect(() => getAnthropicApiKey()).toThrow(
      "must be set to a non-empty value",
    );
  });

  it("uses configured model if provided", () => {
    const warningSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    vi.stubEnv("API__ANTHROPIC_MODEL", "claude-sonnet-4-6");

    expect(getAnthropicModel()).toBe("claude-sonnet-4-6");
    expect(warningSpy).toHaveBeenCalled();
  });

  it("falls back to default model", () => {
    vi.stubEnv("ANTHROPIC_MODEL", "");
    vi.stubEnv("API__ANTHROPIC_MODEL", "");

    expect(getAnthropicModel()).toBe("claude-haiku-4-5");
  });

  it("returns ordered unique model fallbacks", () => {
    vi.stubEnv("API__ANTHROPIC_MODEL", "claude-sonnet-4-6");

    expect(getModelFallbacks()).toEqual([
      "claude-sonnet-4-6",
      "claude-haiku-4-5",
      "claude-opus-4-6",
    ]);
  });

  it("uses default Anthropic request resilience settings", () => {
    expect(getAnthropicRequestTimeoutMs()).toBe(45000);
    expect(getAnthropicRequestRetryAttempts()).toBe(3);
    expect(getAnthropicRequestRetryDelayMs()).toBe(150);
  });

  it("reads configured Anthropic request resilience settings", () => {
    vi.stubEnv("ANTHROPIC_REQUEST_TIMEOUT_MS", "18000");
    vi.stubEnv("ANTHROPIC_RETRY_ATTEMPTS", "2");
    vi.stubEnv("ANTHROPIC_RETRY_DELAY_MS", "250");

    expect(getAnthropicRequestTimeoutMs()).toBe(18000);
    expect(getAnthropicRequestRetryAttempts()).toBe(2);
    expect(getAnthropicRequestRetryDelayMs()).toBe(250);
  });

  it("falls back when Anthropic request resilience settings are invalid", () => {
    vi.stubEnv("ANTHROPIC_REQUEST_TIMEOUT_MS", "0");
    vi.stubEnv("ANTHROPIC_RETRY_ATTEMPTS", "-1");
    vi.stubEnv("ANTHROPIC_RETRY_DELAY_MS", "not-a-number");

    expect(getAnthropicRequestTimeoutMs()).toBe(45000);
    expect(getAnthropicRequestRetryAttempts()).toBe(3);
    expect(getAnthropicRequestRetryDelayMs()).toBe(150);
  });

  it("validates runtime config successfully when key exists", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "new-key");

    expect(() => validateRequiredRuntimeConfig()).not.toThrow();
  });

  it("fails runtime config validation when key missing", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("API__ANTHROPIC_API_KEY", "");

    expect(() => validateRequiredRuntimeConfig()).toThrow(
      "must be set to a non-empty value",
    );
  });

  it("uses Garys MCP defaults", () => {
    expect(getGarysEventsMcpEnabled()).toBe(true);
    expect(getGarysEventsMcpFailOpen()).toBe(true);
    expect(getGarysEventsChatDotNameCompatible()).toBe(false);
    expect(getGarysEventsMcpRepoPath()).toBe("../PyPack_GarysGuide");
    expect(getGarysEventsMcpModule()).toBe("garys_nyc_events.mcp.server");
    expect(getGarysEventsMcpStartupTimeoutMs()).toBe(8000);
    expect(getGarysEventsMcpStartupRetryAttempts()).toBe(1);
    expect(getGarysEventsMcpStartupRetryDelayMs()).toBe(250);
    expect(getGarysEventsRestApiBaseUrl()).toBeUndefined();
    expect(getGarysEventsRestApiTimeoutMs()).toBe(10000);
  });

  it("reads Garys MCP configured values", () => {
    vi.stubEnv("GARYS_EVENTS_MCP_ENABLED", "false");
    vi.stubEnv("GARYS_EVENTS_MCP_FAIL_OPEN", "no");
    vi.stubEnv("GARYS_EVENTS_CHAT_DOT_NAME_COMPATIBLE", "true");
    vi.stubEnv("GARYS_EVENTS_MCP_REPO_PATH", "../custom-repo");
    vi.stubEnv("GARYS_EVENTS_MCP_MODULE", "custom.module");
    vi.stubEnv("GARYS_EVENTS_MCP_STARTUP_TIMEOUT_MS", "12000");
    vi.stubEnv("GARYS_EVENTS_MCP_STARTUP_RETRY_ATTEMPTS", "3");
    vi.stubEnv("GARYS_EVENTS_MCP_STARTUP_RETRY_DELAY_MS", "700");
    vi.stubEnv("GARYS_EVENTS_REST_API_BASE_URL", "http://localhost:8000");
    vi.stubEnv("GARYS_EVENTS_REST_API_TIMEOUT_MS", "25000");

    expect(getGarysEventsMcpEnabled()).toBe(false);
    expect(getGarysEventsMcpFailOpen()).toBe(false);
    expect(getGarysEventsChatDotNameCompatible()).toBe(true);
    expect(getGarysEventsMcpRepoPath()).toBe("../custom-repo");
    expect(getGarysEventsMcpModule()).toBe("custom.module");
    expect(getGarysEventsMcpStartupTimeoutMs()).toBe(12000);
    expect(getGarysEventsMcpStartupRetryAttempts()).toBe(3);
    expect(getGarysEventsMcpStartupRetryDelayMs()).toBe(700);
    expect(getGarysEventsRestApiBaseUrl()).toBe("http://localhost:8000");
    expect(getGarysEventsRestApiTimeoutMs()).toBe(25000);
  });
});
