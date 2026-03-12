import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getDb } from "@/lib/db";
import { getBookRepository } from "@/adapters/RepositoryFactory";
import { LocalEmbedder } from "@/adapters/LocalEmbedder";
import { SQLiteVectorStore } from "@/adapters/SQLiteVectorStore";
import { SQLiteBM25IndexStore } from "@/adapters/SQLiteBM25IndexStore";
import { EmbeddingPipelineFactory } from "@/core/search/EmbeddingPipelineFactory";
import { BM25Scorer } from "@/core/search/BM25Scorer";
import { QueryProcessor } from "@/core/search/QueryProcessor";
import { LowercaseStep } from "@/core/search/query-steps/LowercaseStep";
import { StopwordStep } from "@/core/search/query-steps/StopwordStep";
import { SynonymStep } from "@/core/search/query-steps/SynonymStep";
import { HybridSearchEngine } from "@/core/search/HybridSearchEngine";
import {
  HybridSearchHandler,
  BM25SearchHandler,
  LegacyKeywordHandler,
  EmptyResultHandler,
} from "@/core/search/SearchHandlerChain";
import { STOPWORDS } from "@/core/search/data/stopwords";
import { SYNONYMS } from "@/core/search/data/synonyms";
import type { EmbeddingToolDeps } from "./embedding-tool";
import {
  embedText,
  embedDocument,
  searchSimilar,
  rebuildIndex,
  getIndexStats,
  deleteEmbeddings,
} from "./embedding-tool";

const MODEL_VERSION = "all-MiniLM-L6-v2@1.0";

function buildDeps(): EmbeddingToolDeps {
  const db = getDb();
  const embedder = new LocalEmbedder();
  const vectorStore = new SQLiteVectorStore(db);
  const bm25IndexStore = new SQLiteBM25IndexStore(db);
  const bookRepo = getBookRepository();

  const pipelineFactory = new EmbeddingPipelineFactory(
    embedder,
    vectorStore,
    MODEL_VERSION,
  );

  const bm25Scorer = new BM25Scorer();
  const vectorProcessor = new QueryProcessor([
    new LowercaseStep(),
    new StopwordStep(STOPWORDS),
  ]);
  const bm25Processor = new QueryProcessor([
    new LowercaseStep(),
    new StopwordStep(STOPWORDS),
    new SynonymStep(SYNONYMS),
  ]);
  const engine = new HybridSearchEngine(
    embedder,
    vectorStore,
    bm25Scorer,
    bm25IndexStore,
    vectorProcessor,
    bm25Processor,
    { vectorTopN: 50, bm25TopN: 50, rrfK: 60, maxResults: 10 },
  );
  const hybrid = new HybridSearchHandler(engine, embedder, bm25IndexStore);
  const bm25 = new BM25SearchHandler(
    bm25Scorer,
    bm25IndexStore,
    vectorStore,
    bm25Processor,
  );
  const legacy = new LegacyKeywordHandler(bookRepo);
  const empty = new EmptyResultHandler();
  hybrid.setNext(bm25);
  bm25.setNext(legacy);
  legacy.setNext(empty);

  return {
    embedder,
    vectorStore,
    bm25IndexStore,
    searchHandler: hybrid,
    pipelineFactory,
    bookRepo,
  };
}

let deps: EmbeddingToolDeps | null = null;
function getDeps(): EmbeddingToolDeps {
  if (!deps) deps = buildDeps();
  return deps;
}

const server = new Server(
  { name: "embedding-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "embed_text",
      description: "Embed arbitrary text, return vector dimensions and preview.",
      inputSchema: {
        type: "object" as const,
        properties: {
          text: { type: "string", description: "Text to embed." },
        },
        required: ["text"],
        additionalProperties: false,
      },
    },
    {
      name: "embed_document",
      description:
        "Chunk, embed, and store a document into the vector store.",
      inputSchema: {
        type: "object" as const,
        properties: {
          source_type: {
            type: "string",
            description: "Source type (e.g. 'book_chunk').",
          },
          source_id: {
            type: "string",
            description: "Source ID (e.g. 'book-slug/chapter-slug').",
          },
          content: {
            type: "string",
            description: "Document content to embed.",
          },
        },
        required: ["source_type", "source_id", "content"],
        additionalProperties: false,
      },
    },
    {
      name: "search_similar",
      description: "Hybrid similarity search (BM25 + vector + RRF).",
      inputSchema: {
        type: "object" as const,
        properties: {
          query: { type: "string", description: "Search query." },
          source_type: {
            type: "string",
            description: "Filter by source type.",
          },
          limit: { type: "number", description: "Max results." },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
    {
      name: "rebuild_index",
      description:
        "Full or incremental rebuild of embeddings for a source type.",
      inputSchema: {
        type: "object" as const,
        properties: {
          source_type: {
            type: "string",
            description: "Source type to rebuild (e.g. 'book_chunk').",
          },
          force: {
            type: "boolean",
            description: "Force full rebuild (delete existing first).",
          },
        },
        required: ["source_type"],
        additionalProperties: false,
      },
    },
    {
      name: "get_index_stats",
      description: "Embedding counts, BM25 stats, model readiness.",
      inputSchema: {
        type: "object" as const,
        properties: {
          source_type: {
            type: "string",
            description: "Source type filter.",
          },
        },
        additionalProperties: false,
      },
    },
    {
      name: "delete_embeddings",
      description: "Remove all embeddings for a specific source ID.",
      inputSchema: {
        type: "object" as const,
        properties: {
          source_id: {
            type: "string",
            description: "Source ID to delete.",
          },
        },
        required: ["source_id"],
        additionalProperties: false,
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const d = getDeps();
  const a = (args ?? {}) as Record<string, unknown>;

  let result: unknown;
  switch (name) {
    case "embed_text":
      result = await embedText(d, a as { text: string });
      break;
    case "embed_document":
      result = await embedDocument(
        d,
        a as { source_type: string; source_id: string; content: string },
      );
      break;
    case "search_similar":
      result = await searchSimilar(
        d,
        a as { query: string; source_type?: string; limit?: number },
      );
      break;
    case "rebuild_index":
      result = await rebuildIndex(
        d,
        a as { source_type: string; force?: boolean },
      );
      break;
    case "get_index_stats":
      result = getIndexStats(d, a as { source_type?: string });
      break;
    case "delete_embeddings":
      result = deleteEmbeddings(d, a as { source_id: string });
      break;
    default:
      throw new Error(`Unknown tool: ${name}`);
  }

  return {
    content: [{ type: "text", text: JSON.stringify(result) }],
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
