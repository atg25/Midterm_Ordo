import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/mcp/garys-events-runtime", () => ({
  queryGarysEventsMcp: vi.fn(async () => ({
    ok: true,
    data: { count: 1, events: [] },
  })),
}));

import { createGarysEventsQueryTool } from "./garys-events-query.tool";

describe("garys events query tool", () => {
  it("defines a strict input schema", () => {
    const tool = createGarysEventsQueryTool();
    const schema = tool.schema.input_schema as {
      type: string;
      required?: string[];
      additionalProperties?: boolean;
      properties?: Record<string, unknown>;
    };

    expect(schema.type).toBe("object");
    expect(schema.required).toEqual(["limit"]);
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties).toBeTruthy();
  });

  it("executes via MCP runtime bridge", async () => {
    const tool = createGarysEventsQueryTool();
    const result = await tool.command.execute({ limit: 10 });

    expect(result).toEqual({ ok: true, data: { count: 1, events: [] } });
  });
});
