/**
 * Product Hunt AI tracker MCP/API naming conventions.
 */

export const WEBSCRAPER_MCP_TOOL_NAME = "ph_ai_tracker.fetch_products";
export const WEBSCRAPER_CHAT_TOOL_ALIAS = "ph_ai_tracker_fetch_products";

export function resolveWebscraperChatToolName(
  dotNameCompatible: boolean,
): string {
  return dotNameCompatible
    ? WEBSCRAPER_MCP_TOOL_NAME
    : WEBSCRAPER_CHAT_TOOL_ALIAS;
}

export function mapWebscraperChatToolToMcpName(chatToolName: string): string {
  if (chatToolName === WEBSCRAPER_CHAT_TOOL_ALIAS) {
    return WEBSCRAPER_MCP_TOOL_NAME;
  }

  return chatToolName;
}
