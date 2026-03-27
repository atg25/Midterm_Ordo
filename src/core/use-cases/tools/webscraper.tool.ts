import type { ToolDescriptor } from "@/core/tool-registry/ToolDescriptor";
import type { ToolCommand } from "@/core/tool-registry/ToolCommand";
import type { ToolExecutionContext } from "@/core/tool-registry/ToolExecutionContext";
import {
  queryWebscraperMcp,
  type WebscraperScrapeInput,
} from "@/lib/mcp/webscraper-runtime";
import { getWebscraperChatDotNameCompatible } from "@/lib/config/env";
import { resolveWebscraperChatToolName } from "@/lib/mcp/webscraper-alias";

class WebscraperScrapeCommand implements ToolCommand<
  WebscraperScrapeInput,
  unknown
> {
  constructor(private readonly toolName: string) {}

  async execute(
    input: WebscraperScrapeInput,
    _context?: ToolExecutionContext,
  ): Promise<unknown> {
    return queryWebscraperMcp(this.toolName, input);
  }
}

export function createWebscraperTool(): ToolDescriptor {
  const toolName = resolveWebscraperChatToolName(
    getWebscraperChatDotNameCompatible(),
  );

  return {
    name: toolName,
    schema: {
      description:
        "Fetch Product Hunt AI products from the ph_ai_tracker API, with strategy control and optional history/health operations.",
      input_schema: {
        type: "object",
        properties: {
          operation: {
            type: "string",
            enum: ["fetch", "history", "health"],
            description:
              "Operation to run. 'fetch' returns product results, 'history' returns saved snapshots, 'health' checks service status. Defaults to 'fetch'.",
          },
          strategy: {
            type: "string",
            enum: ["api", "scraper", "auto"],
            description:
              "Fetch strategy for 'fetch' operation. 'auto' tries API then scraper fallback.",
          },
          search_term: {
            type: "string",
            description:
              "Search keyword for Product Hunt fetch. Defaults to 'AI'.",
          },
          limit: {
            type: "number",
            minimum: 1,
            maximum: 50,
            description:
              "Maximum number of products to return for 'fetch' operation (1-50).",
          },
          persist: {
            type: "boolean",
            description:
              "If false, request runtime fetch without database persistence when API supports it.",
          },
          db_path: {
            type: "string",
            description:
              "Optional database path override for fetch/history when API supports it.",
          },
        },
        required: [],
        additionalProperties: false,
      },
    },
    command: new WebscraperScrapeCommand(toolName),
    roles: ["AUTHENTICATED", "APPRENTICE", "STAFF", "ADMIN"],
    category: "content",
  };
}
