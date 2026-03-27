export const GARYS_EVENTS_MCP_TOOL_NAME = "garys_events.query_events";
export const GARYS_EVENTS_CHAT_TOOL_ALIAS = "garys_events_query_events";

export function resolveGarysEventsChatToolName(
  dotNameCompatible: boolean,
): string {
  return dotNameCompatible
    ? GARYS_EVENTS_MCP_TOOL_NAME
    : GARYS_EVENTS_CHAT_TOOL_ALIAS;
}

export function mapGarysEventsChatToolToMcpName(chatToolName: string): string {
  if (chatToolName === GARYS_EVENTS_CHAT_TOOL_ALIAS) {
    return GARYS_EVENTS_MCP_TOOL_NAME;
  }

  return chatToolName;
}
