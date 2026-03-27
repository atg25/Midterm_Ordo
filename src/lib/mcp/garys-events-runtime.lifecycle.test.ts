import { afterEach, describe, expect, it, vi } from "vitest";

type RuntimeModule = {
  queryGarysEventsMcp: (
    chatToolName: string,
    args: { limit: number },
  ) => Promise<unknown>;
  shutdownGarysEventsMcpRuntime: () => Promise<void>;
};

async function loadRuntimeWithMocks(options?: {
  connectImpl?: () => Promise<void>;
  callToolResult?: unknown;
}) {
  vi.resetModules();

  const connectMock = vi.fn<() => Promise<void>>(
    options?.connectImpl ?? (async () => Promise.resolve()),
  );
  const callToolMock = vi.fn(
    async () =>
      options?.callToolResult ?? {
        content: [{ type: "text", text: '{"ok":true,"data":{}}' }],
      },
  );
  const closeMock = vi.fn(async () => Promise.resolve());
  const transportCtorMock = vi.fn();

  class MockTransport {
    public onerror?: (error: unknown) => void;
    public onclose?: () => void;

    constructor(options: unknown) {
      transportCtorMock(options);
    }

    close = closeMock;
  }

  class MockClient {
    connect = connectMock;
    callTool = callToolMock;
  }

  vi.doMock("@modelcontextprotocol/sdk/client/stdio.js", () => ({
    StdioClientTransport: MockTransport,
  }));

  vi.doMock("@modelcontextprotocol/sdk/client/index.js", () => ({
    Client: MockClient,
  }));

  const runtimeModule =
    (await import("./garys-events-runtime")) as RuntimeModule;

  return {
    runtimeModule,
    connectMock,
    callToolMock,
    closeMock,
    transportCtorMock,
  };
}

describe("garys events runtime lifecycle", () => {
  afterEach(async () => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("returns timeout runtime error when startup connect exceeds configured timeout", async () => {
    vi.stubEnv("GARYS_EVENTS_MCP_REPO_PATH", ".");
    vi.stubEnv("GARYS_EVENTS_MCP_STARTUP_TIMEOUT_MS", "5");
    vi.stubEnv("GARYS_EVENTS_MCP_STARTUP_RETRY_ATTEMPTS", "1");
    vi.stubEnv("GARYS_EVENTS_MCP_STARTUP_RETRY_DELAY_MS", "1");
    vi.stubEnv("GARYS_EVENTS_REST_API_BASE_URL", "http://localhost:8000");

    const neverConnects = () => new Promise<void>(() => {});
    const { runtimeModule, connectMock } = await loadRuntimeWithMocks({
      connectImpl: neverConnects,
    });

    const result = (await runtimeModule.queryGarysEventsMcp(
      "garys_events_query_events",
      { limit: 5 },
    )) as {
      ok: boolean;
      error?: { code: string; retriable: boolean; message: string };
    };

    expect(connectMock).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe("mcp_runtime_error");
    expect(result.error?.retriable).toBe(true);
    expect(result.error?.message).toContain("timed out");
  });

  it("retries startup after crash and succeeds on a later attempt", async () => {
    vi.stubEnv("GARYS_EVENTS_MCP_REPO_PATH", ".");
    vi.stubEnv("GARYS_EVENTS_MCP_STARTUP_TIMEOUT_MS", "100");
    vi.stubEnv("GARYS_EVENTS_MCP_STARTUP_RETRY_ATTEMPTS", "1");
    vi.stubEnv("GARYS_EVENTS_MCP_STARTUP_RETRY_DELAY_MS", "1");
    vi.stubEnv("GARYS_EVENTS_REST_API_BASE_URL", "http://localhost:8000");

    const { runtimeModule, connectMock, callToolMock, closeMock } =
      await loadRuntimeWithMocks();

    connectMock
      .mockRejectedValueOnce(new Error("network crash during startup"))
      .mockResolvedValueOnce(undefined);

    callToolMock.mockResolvedValueOnce({
      content: [{ type: "text", text: '{"ok":true,"data":{"count":1}}' }],
    });

    const result = (await runtimeModule.queryGarysEventsMcp(
      "garys_events_query_events",
      { limit: 1 },
    )) as { ok: boolean; data?: { count?: number } };

    expect(connectMock).toHaveBeenCalledTimes(2);
    expect(closeMock).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(true);
    expect(result.data?.count).toBe(1);
  });

  it("registers shutdown hooks and closes transport on explicit shutdown", async () => {
    vi.stubEnv("GARYS_EVENTS_MCP_REPO_PATH", ".");
    vi.stubEnv("GARYS_EVENTS_MCP_STARTUP_TIMEOUT_MS", "100");
    vi.stubEnv("GARYS_EVENTS_MCP_STARTUP_RETRY_ATTEMPTS", "0");
    vi.stubEnv("GARYS_EVENTS_MCP_STARTUP_RETRY_DELAY_MS", "1");
    vi.stubEnv("GARYS_EVENTS_REST_API_BASE_URL", "http://localhost:8000");

    const onSpy = vi
      .spyOn(process, "on")
      .mockImplementation(
        ((..._args: unknown[]) => process) as typeof process.on,
      );

    const { runtimeModule, closeMock } = await loadRuntimeWithMocks({
      callToolResult: {
        content: [{ type: "text", text: '{"ok":true}' }],
      },
    });

    await runtimeModule.queryGarysEventsMcp("garys_events_query_events", {
      limit: 2,
    });

    expect(onSpy).toHaveBeenCalledWith("SIGTERM", expect.any(Function));
    expect(onSpy).toHaveBeenCalledWith("SIGINT", expect.any(Function));
    expect(onSpy).toHaveBeenCalledWith("beforeExit", expect.any(Function));

    await runtimeModule.shutdownGarysEventsMcpRuntime();
    expect(closeMock).toHaveBeenCalledTimes(1);
  });
});
