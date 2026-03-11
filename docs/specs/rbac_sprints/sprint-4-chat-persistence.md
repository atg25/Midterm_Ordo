# Sprint 4 — Chat Persistence

> **Goal:** Authenticated users get persistent conversation history.  
> **Spec ref:** §3.5, §7, §8 Phase 3  
> **Prerequisite:** Sprint 3 complete  
> **Note:** Sprint 3 already wired `getSessionUser()`, `buildSystemPrompt(role)`, `getToolsForRole(role)` into both chat routes. Sprint 4 builds on top of that — the stream route gains persistence but keeps all Sprint 3 role-aware behavior.

---

## Task 4.1 — Chat entities + schema

**What:** Create conversation/message entity types and DB tables.

| Item | Detail |
|------|--------|
| **Create** | `src/core/entities/conversation.ts` — `Conversation` (id, userId, title, createdAt, updatedAt), `ConversationSummary` (id, title, updatedAt, messageCount), `Message` (id, conversationId, role, parts/content, createdAt), `NewMessage` (omit id/createdAt) |
| **Modify** | `src/lib/db/schema.ts` — add `conversations` and `messages` tables per §3.2 SQL. Use `CREATE TABLE IF NOT EXISTS` + idempotent pattern matching existing `ensureSchema()`. Add indexes: `idx_conv_user` on `conversations(user_id)`, `idx_msg_conv` on `messages(conversation_id)`. `messages.conversation_id` → `ON DELETE CASCADE`. |
| **Spec** | §3.2 (conversations + messages SQL), §4, §12 (ConversationSummary includes `messageCount` for API list response) |
| **Tests** | Build passes; schema migration idempotent |
| **Key details** | `ConversationSummary.messageCount` is required by the `GET /api/conversations` response (§12). The `messages.parts` column stores JSON — typed as `MessagePart[]` in the entity. |

---

## Task 4.2 — Chat ports

**What:** Define persistence contracts for conversations and messages.

| Item | Detail |
|------|--------|
| **Create** | `src/core/use-cases/ConversationRepository.ts` — `create(conv)`, `listByUser(userId): ConversationSummary[]`, `findById(id)`, `delete(id)`, `updateTitle(id, title)`, `touch(id)` |
| **Create** | `src/core/use-cases/MessageRepository.ts` — `create(msg)`, `listByConversation(conversationId)`, `countByConversation(conversationId)` |
| **Spec** | §2A Issue C, §3.5 port interfaces |
| **Tests** | Interface-only; verified by build |
| **Key details** | `touch(id)` updates `conversations.updated_at` to current timestamp — called by `ConversationInteractor` after appending a message (TEST-CHAT-02 requires `updated_at` refresh). `countByConversation()` is needed for the 100-message hard limit (§7, NEG-DATA-3). `listByUser()` returns `ConversationSummary[]` with `messageCount` for the API list endpoint. |

---

## Task 4.3 — ConversationInteractor (use case)

**What:** CRUD orchestration with ownership enforcement, limit checks, and auto-titling.

| Item | Detail |
|------|--------|
| **Create** | `src/core/use-cases/ConversationInteractor.ts` — create, get, list, delete with `userId` ownership checks; auto-title from first user message (truncated to 80 chars, CHAT-3); message count validation (100 hard limit); conversation count check (50 soft limit, auto-delete oldest); calls `touch(conversationId)` after message append |
| **Spec** | §2A Issue C, §3.5 step 4 (auto-title), CHAT-1–10, NEG-DATA-1–4, NEG-ARCH-2 |
| **Key details** | Ownership: `conversation.user_id !== currentUser.id` → 404 (not 403, NEG-SEC-6). Message limit: `countByConversation() >= 100` → 400. Conversation limit: `conversations.length >= 50` → delete oldest. Auto-title: first user message content truncated to 80 chars (CHAT-3). After persisting a message, call `conversationRepo.touch(conversationId)` to refresh `updated_at` (TEST-CHAT-02). |
| **Tests (new)** | Ownership enforcement (TEST-CHAT-03); message limit (TEST-CHAT-09); conversation count limit (TEST-CHAT-10); auto-title truncation; `updated_at` refresh after append |

---

## Task 4.4 — Chat data mappers (adapters)

**What:** SQLite implementations of conversation and message repositories.

| Item | Detail |
|------|--------|
| **Create** | `src/adapters/ConversationDataMapper.ts` — implements `ConversationRepository`. `listByUser()` uses a `LEFT JOIN` + `COUNT(messages.id)` to include `messageCount` in results. `touch()` runs `UPDATE conversations SET updated_at = datetime('now') WHERE id = ?`. |
| **Create** | `src/adapters/MessageDataMapper.ts` — implements `MessageRepository`. `create()` stores `parts` as serialized JSON text. `listByConversation()` deserializes JSON parts back to typed array. Ordered by `created_at ASC`. |
| **Spec** | §2A Issue C adapters. No authorization logic — NEG-ARCH-2 (auth stays in interactor). |
| **Tests (new)** | Integration: create → listByUser (with messageCount) → findById → delete (CASCADE). Messages: create → listByConversation (ordered). Parts JSON round-trip. `touch()` updates timestamp. |

---

## Task 4.5 — Conversation API routes

**What:** REST endpoints for conversation CRUD.

| Item | Detail |
|------|--------|
| **Create** | `src/app/api/conversations/route.ts` — GET (list) + POST (create). Use `runRouteTemplate()` from `@/lib/chat/http-facade` for consistency with existing chat routes. |
| **Create** | `src/app/api/conversations/[id]/route.ts` — GET (with messages) + DELETE. Use `runRouteTemplate()`. |
| **Spec** | §12 Conversations API reference, CHAT-5–8, NEG-SEC-6 |
| **Key details** | All routes require valid session — middleware already protects `/api/conversations` (cookie presence check). Handler validates session via `validateSession(token)` from `@/lib/auth`. Ownership violations → 404 (not 403). `GET /api/conversations` returns `{ conversations: [{ id, title, updatedAt, messageCount }] }` per §12. |
| **Tests (new)** | TEST-RBAC-05 (ANONYMOUS → 401); TEST-CHAT-06 (list ordered by updated_at); TEST-CHAT-05 (delete cascades) |

---

## Task 4.6 — Chat stream persistence integration

**What:** Update `/api/chat/stream` to persist messages for authenticated users.

| Item | Detail |
|------|--------|
| **Modify** | `src/app/api/chat/stream/route.ts` — full 9-step flow from §3.5: accept optional `conversationId` in request body, create conversation if needed (auto-title from first message, 80 chars), persist user message before Anthropic call, persist assistant message after stream completes (single row, full parts array), return `conversationId` in first SSE event |
| **Spec** | §3.5 flow (9 steps), CHAT-1–4, CHAT-6, CHAT-9, NEG-DATA-2 |
| **Key details** | ANONYMOUS check: `user.roles[0] === "ANONYMOUS"` → skip all persistence (no conversationId in SSE response, NEG-DATA-2). Authenticated → full persistence. Route already has `getSessionUser()`, `buildSystemPrompt(role)`, `getToolsForRole(role)` from Sprint 3 — add persistence around the existing agent-loop call. Agent-loop → single assistant row with complete `MessagePart[]` array (CHAT-9). Calls `ConversationInteractor` for ownership checks + limit enforcement. |
| **Tests (new)** | TEST-CHAT-01 (first message creates conv), TEST-CHAT-02 (appends + updated_at refresh), TEST-CHAT-08 (ANONYMOUS not persisted) |

---

## Task 4.7 — Client-side conversation state + plumbing

**What:** Extend `useGlobalChat` to track conversations and integrate with server. Update stream infrastructure to carry `conversationId`.

| Item | Detail |
|------|--------|
| **Modify** | `src/hooks/useGlobalChat.tsx` — add `conversationId` to state; add `conversations` list; add `LOAD_CONVERSATION`, `NEW_CONVERSATION`, `SET_CONVERSATIONS` actions; include `conversationId` in POST body; parse from first SSE event |
| **Modify** | `src/core/entities/chat-stream.ts` — add `{ type: "conversation_id"; id: string }` to `StreamEvent` union type |
| **Modify** | `src/core/use-cases/ChatStreamProvider.ts` — update `fetchStream()` signature to accept `{ messages, conversationId? }` |
| **Modify** | `src/adapters/ChatStreamAdapter.ts` — pass `conversationId` in POST body to `/api/chat/stream` |
| **Modify** | `src/lib/chat/StreamStrategy.ts` (or equivalent) — add `ConversationIdStrategy` to handle the new `conversation_id` SSE event type and dispatch to reducer |
| **Spec** | §3.5 client-side, CHAT-4, CHAT-10, UI-6–7 |
| **Tests** | Build passes; manual verification of conversation switching |

---

## Task 4.8 — Conversation UI

**What:** Add conversation sidebar/selector and "New Chat" button.

| Item | Detail |
|------|--------|
| **Create/Modify** | Conversation sidebar or dropdown component; "New Chat" button; conversation title in header; delete conversation option |
| **Spec** | §3.5 UI additions, UI-6, UI-7, TEST-CHAT-07, TEST-PAGE-02 |
| **Key details** | Sidebar only visible to authenticated users (ANONYMOUS sees no sidebar). Fetch conversation list from `GET /api/conversations` on mount. "New Chat" dispatches `NEW_CONVERSATION` action. Selecting a conversation dispatches `LOAD_CONVERSATION` + fetches messages from `GET /api/conversations/[id]`. Delete triggers `DELETE /api/conversations/[id]` + removes from list. |
| **Tests** | Manual verification; build passes |
