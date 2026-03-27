import { describe, expect, it } from "vitest";
import {
  GARYS_EVENTS_CHAT_TOOL_ALIAS,
  GARYS_EVENTS_MCP_TOOL_NAME,
  mapGarysEventsChatToolToMcpName,
  resolveGarysEventsChatToolName,
} from "./garys-events-alias";

describe("garys events alias mapping", () => {
  it("uses canonical tool name when dot names are compatible", () => {
    expect(resolveGarysEventsChatToolName(true)).toBe(
      GARYS_EVENTS_MCP_TOOL_NAME,
    );
  });

  it("uses alias when dot names are not compatible", () => {
    expect(resolveGarysEventsChatToolName(false)).toBe(
      GARYS_EVENTS_CHAT_TOOL_ALIAS,
    );
  });

  it("maps alias to canonical MCP tool name", () => {
    expect(mapGarysEventsChatToolToMcpName(GARYS_EVENTS_CHAT_TOOL_ALIAS)).toBe(
      GARYS_EVENTS_MCP_TOOL_NAME,
    );
  });

  it("passes canonical name through unchanged", () => {
    expect(mapGarysEventsChatToolToMcpName(GARYS_EVENTS_MCP_TOOL_NAME)).toBe(
      GARYS_EVENTS_MCP_TOOL_NAME,
    );
  });
});
