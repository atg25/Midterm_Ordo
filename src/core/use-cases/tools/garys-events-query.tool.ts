import type { ToolDescriptor } from "@/core/tool-registry/ToolDescriptor";
import type { ToolCommand } from "@/core/tool-registry/ToolCommand";
import type { ToolExecutionContext } from "@/core/tool-registry/ToolExecutionContext";
import {
  queryGarysEventsMcp,
  type GarysEventsQueryInput,
} from "@/lib/mcp/garys-events-runtime";
import { getGarysEventsChatDotNameCompatible } from "@/lib/config/env";
import { resolveGarysEventsChatToolName } from "@/lib/mcp/garys-events-alias";

class GarysEventsQueryCommand implements ToolCommand<
  GarysEventsQueryInput,
  unknown
> {
  constructor(private readonly toolName: string) {}

  async execute(
    input: GarysEventsQueryInput,
    _context?: ToolExecutionContext,
  ): Promise<unknown> {
    return queryGarysEventsMcp(this.toolName, input);
  }
}

export function createGarysEventsQueryTool(): ToolDescriptor {
  const toolName = resolveGarysEventsChatToolName(
    getGarysEventsChatDotNameCompatible(),
  );

  return {
    name: toolName,
    schema: {
      description:
        "Query Gary's NYC events via MCP with optional AI-only and date/tag filtering.",
      input_schema: {
        type: "object",
        properties: {
          ai_only: {
            type: "boolean",
            description: "Filter for AI-related events only (default true).",
          },
          limit: {
            type: "number",
            minimum: 0,
            maximum: 500,
            description: "Maximum number of events to return (0-500).",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Optional lowercase tags to filter by.",
          },
          date_from: {
            type: "string",
            pattern: "^\\d{4}-\\d{2}-\\d{2}$",
            description: "Optional start date in YYYY-MM-DD format.",
          },
          date_to: {
            type: "string",
            pattern: "^\\d{4}-\\d{2}-\\d{2}$",
            description: "Optional end date in YYYY-MM-DD format.",
          },
        },
        required: ["limit"],
        additionalProperties: false,
      },
    },
    command: new GarysEventsQueryCommand(toolName),
    roles: ["AUTHENTICATED", "APPRENTICE", "STAFF", "ADMIN"],
    category: "content",
  };
}
