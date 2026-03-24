# System Architecture

This document explains how Studio Ordo is put together as a product and as an engineering system. Read this after the root README if you want the textual version of the architecture rather than the diagram-only view.

## 1. System Intent

Studio Ordo is a chat-first application for workflow guidance, implementation support, training-oriented assistance, and operator decision support. The system is designed to let an LLM move work forward through tools, while preventing the common failure modes of unconstrained agent behavior.

The architecture has four explicit goals:

- keep chat grounded in real corpus and system state
- keep tool access aligned with RBAC
- keep prompts structured and auditable
- keep runtime operations visible through scripts, tests, and MCP tooling

## 2. Top-Level Architecture

At a high level, the system is composed of six layers.

| Layer | Responsibility |
| --- | --- |
| Browser and UI shell | Homepage chat, library, blog, auth pages, and action-link navigation |
| Next.js routes and APIs | User-facing pages plus API endpoints for chat, auth, preferences, workflow records, and operations |
| Policy and orchestration | System prompt building, role directives, routing context, user preferences, and tool manifest injection |
| Tool execution | Internal `ToolRegistry`, middleware, formatters, and typed tool commands |
| Adapters and repositories | SQLite data mappers, corpus repository, blog repository, embeddings, vector store, BM25 store |
| External and MCP boundaries | Anthropic, OpenAI, local embedding models, and MCP servers |

## 3. Request Flow

The main request path is the streaming chat route.

1. The browser sends a message to `/api/chat/stream`.
2. The route resolves the current user and role through `src/lib/auth.ts`.
3. The system builds a prompt using base identity, role directive, user preferences, summary, routing context, and task-origin handoff.
4. The route fetches role-scoped tool schemas from `ToolRegistry.getSchemasForRole(role)`.
5. The same schemas are sent to the LLM and rendered into the dynamic `TOOLS AVAILABLE TO YOU:` prompt section.
6. If the model requests a tool call, execution is routed through the registry and middleware stack.
7. Middleware enforces logging and RBAC before the tool command runs.
8. Tool results come back to the model as structured deterministic output.
9. The final answer streams back to the UI.

The critical design decision is that prompt-visible tool access and executable tool access come from the same registry source. That removes the ghost-tool class of bugs where the prompt claims a tool exists but RBAC blocks it.

## 4. Prompt Architecture

Prompt construction is handled by `SystemPromptBuilder` and related policy sources.

### Prompt sections

| Priority | Section | Source |
| --- | --- | --- |
| 10 | `identity` | base prompt from config identity source |
| 15 | `tool_manifest` | live `ToolRegistry.getSchemasForRole(role)` output |
| 20 | `role_directive` | fallback or stored role directive |
| 30 | `user_preferences` | persisted user preferences |
| 40 | `summary` | server-owned conversation summary |
| 50 | `routing` | routing lane and confidence metadata |
| 90 | `task_origin_handoff` | optional task-origin block |

### Why this matters

- base prompt defines global behavior
- role directives frame the assistant differently for anonymous, customer, apprentice, staff, and admin use
- the dynamic tool manifest prevents prompt drift from the registry
- user preference and routing sections let the system adapt without granting freeform prompt mutation to the user

Prompt versioning is additionally exposed through MCP tools such as `prompt_list`, `prompt_get`, `prompt_set`, `prompt_rollback`, and `prompt_diff`.

## 5. Role System

The role model is defined in `src/core/entities/user.ts` and shaped further by `src/core/entities/role-directives.ts`.

| Role | Primary audience | Notes |
| --- | --- | --- |
| `ANONYMOUS` | unauthenticated visitor | limited chat and corpus/UI tool access |
| `AUTHENTICATED` | signed-in customer or practitioner | full member tool set |
| `APPRENTICE` | student/apprentice user | same member tool set with learning-oriented directive framing |
| `STAFF` | internal team member | same member tool set with operational framing |
| `ADMIN` | operator/founder/admin | member tools plus admin analytics, search, and content tools |

`getSessionUser()` supports real sessions and an optional role-overlay cookie for simulation workflows. Anonymous access remains the default fallback.

## 6. Tool Architecture

Studio Ordo uses an internal tool architecture distinct from MCP.

### Internal tool execution path

- tool descriptors live under `src/core/use-cases/tools/`
- the composition root is `src/lib/chat/tool-composition-root.ts`
- `ToolRegistry` owns registration, RBAC-aware schema lookup, and execution
- middleware composes logging and RBAC guard behavior
- tool results are formatted through `RoleAwareSearchFormatter`

### Internal chat tool groups

| Group | Tools |
| --- | --- |
| Universal UI/utilities | `calculator`, `set_theme`, `adjust_ui`, `navigate` |
| Member productivity | `generate_chart`, `generate_audio`, `set_preference`, `search_my_conversations` |
| Corpus and retrieval | `search_corpus`, `get_corpus_summary`, `get_section`, `get_checklist`, `list_practitioners` |
| Admin-only | `admin_web_search`, `admin_prioritize_leads`, `admin_prioritize_offer`, `admin_triage_routing_risk`, `draft_content`, `publish_content` |

The registry can also be filtered by `config/tools.json`, which allows instance-level tool enable/disable control without editing code.

## 7. MCP Architecture

MCP is used as a structured operational boundary.

### MCP servers shipped in this repo

| Server | Command | Purpose |
| --- | --- | --- |
| Calculator MCP server | `npm run mcp:calculator` | exposes the standalone `calculator` MCP tool |
| Embedding MCP server | `npm run mcp:embeddings` | embeddings, corpus management, prompt management, and analytics tools |

### Embedding MCP server capability groups

- Embeddings and search: `embed_text`, `embed_document`, `search_similar`, `rebuild_index`, `get_index_stats`, `delete_embeddings`
- Corpus management: `corpus_list`, `corpus_get`, `corpus_add_document`, `corpus_add_section`, `corpus_remove_document`, `corpus_remove_section`
- Prompt management: `prompt_list`, `prompt_get`, `prompt_set`, `prompt_rollback`, `prompt_diff`
- Conversation analytics: `conversation_analytics`, `conversation_inspect`, `conversation_cohort`

The MCP layer is not the only source of truth. It sits beside the main Next.js application and internal tool registry, sharing the same repositories and SQLite state where appropriate.

## 8. Data And Storage

The system uses a hybrid storage model.

| Store | Purpose |
| --- | --- |
| SQLite | users, sessions, conversations, messages, events, prompt versions, preferences, workflow records, analytics state |
| file system corpus under `docs/_corpus/` | canonical corpus documents and chapters |
| blog repository | draft and published content pipeline |
| vector store | local embeddings for retrieval and similarity search |
| BM25 index store | lexical search and hybrid ranking support |

This split keeps authored content and transactional application state in the storage form that best matches their update patterns.

## 9. User-Facing Product Areas

### Homepage chat

The homepage is the primary product surface. It resolves the current session, then renders an embedded chat shell. The chat route handles streaming, role-aware prompts, tool execution, referral capture, and conversation continuity.

### Library and corpus

The `/library` surface presents the corpus as books and chapters rather than isolated markdown files. The search stack supports both chat grounding and direct route-based reading.

### Blog

Published posts appear under `/blog`. Admin content tools support drafting and publishing through the same codebase.

### Workflow records

The backend supports consultation requests, deal records, and training path records. Those features are partially user-facing and partially operator-facing, depending on role.

## 10. Operational Model

The repository includes explicit commands for:

- environment validation
- health and diagnostics
- stateless-runtime checks
- release manifest and evidence generation
- deterministic tests
- browser/UI verification

These are documented further in [admin-runbook.md](admin-runbook.md) and [environment-matrix.md](environment-matrix.md).

## 11. Verification Strategy

The system treats verification as multi-layered.

| Layer | Examples |
| --- | --- |
| Unit and integration tests | Vitest suites across routes, tools, prompts, auth, and workflows |
| UI checks | browser-oriented Vitest suites and Playwright smoke coverage |
| Runtime safety | env validation, health sweeps, diagnostics, secret scanning |
| Release verification | manifest generation, release evidence, staging canaries |
| Spec/process verification | feature specs, sprint docs, QA passes |

This matters because a passing unit test is not treated as proof that the system is correct in production behavior.

## 12. Key Architectural Rules

1. The model must not infer tool access from prose. It gets tool access from the registry.
2. Prompt and RBAC scope must stay aligned.
3. Specs and sprint docs are delivery contracts, not optional notes.
4. MCP tools are operational interfaces, not a replacement for application architecture.
5. Browser-visible behavior should be verified with runtime evidence when necessary.

For a task-oriented guide to using the system, see [user-handbook.md](user-handbook.md).
