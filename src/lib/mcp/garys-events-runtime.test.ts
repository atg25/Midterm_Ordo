import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canStartGarysEventsMcpSubprocess,
  shouldRegisterGarysEventsTool,
} from "./garys-events-runtime";

describe("garys events runtime registration policy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not register when MCP is disabled", () => {
    vi.stubEnv("GARYS_EVENTS_MCP_ENABLED", "false");
    expect(shouldRegisterGarysEventsTool()).toBe(false);
  });

  it("registers in fail-closed mode even when repo path is missing", () => {
    vi.stubEnv("GARYS_EVENTS_MCP_ENABLED", "true");
    vi.stubEnv("GARYS_EVENTS_MCP_FAIL_OPEN", "false");
    vi.stubEnv("GARYS_EVENTS_MCP_REPO_PATH", "/definitely/missing/path");

    expect(shouldRegisterGarysEventsTool()).toBe(true);
  });

  it("does not register in fail-open mode when repo path is missing", () => {
    vi.stubEnv("GARYS_EVENTS_MCP_ENABLED", "true");
    vi.stubEnv("GARYS_EVENTS_MCP_FAIL_OPEN", "true");
    vi.stubEnv("GARYS_EVENTS_MCP_REPO_PATH", "/definitely/missing/path");

    expect(canStartGarysEventsMcpSubprocess()).toBe(false);
    expect(shouldRegisterGarysEventsTool()).toBe(false);
  });

  it("does not register in fail-open mode when REST base URL is missing", () => {
    vi.stubEnv("GARYS_EVENTS_MCP_ENABLED", "true");
    vi.stubEnv("GARYS_EVENTS_MCP_FAIL_OPEN", "true");
    vi.stubEnv("GARYS_EVENTS_MCP_REPO_PATH", ".");
    vi.stubEnv("GARYS_EVENTS_REST_API_BASE_URL", "");

    expect(canStartGarysEventsMcpSubprocess()).toBe(false);
    expect(shouldRegisterGarysEventsTool()).toBe(false);
  });

  it("registers in fail-closed mode when REST base URL is missing", () => {
    vi.stubEnv("GARYS_EVENTS_MCP_ENABLED", "true");
    vi.stubEnv("GARYS_EVENTS_MCP_FAIL_OPEN", "false");
    vi.stubEnv("GARYS_EVENTS_REST_API_BASE_URL", "");

    expect(shouldRegisterGarysEventsTool()).toBe(true);
  });
});
