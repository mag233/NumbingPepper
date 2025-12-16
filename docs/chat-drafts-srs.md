# SRS — Chat History & Writer Draft Persistence (Task 13)

## Goals
- Persist **chat history** locally (desktop + web dev) so refresh/restart restores messages.
- Persist **writer drafts** locally so typed content is not lost on refresh/restart.
- Keep data model compatible with current SQLite schema (`chats`, `drafts`).
- Avoid logging secrets (API key must never be persisted to logs).

## Non-goals (Alpha)
- Multi-device sync.
- Full conversation/thread management UI.
- RAG / “Ask the book”.
- Streaming chat persistence (buffered-only is fine).

## Data Contracts

### `chats` (SQLite)
Schema (already migrated in Rust):
- `id` TEXT PK (UUID)
- `session_id` TEXT (required)
- `role` TEXT enum: `user` | `assistant`
- `content` TEXT
- `reference_highlight_id` TEXT nullable
- `created_at` INTEGER (ms since epoch)

**Session strategy (Alpha):**
- `session_id = book:{bookId}` when a book is active.
- `session_id = global` when no book is active.

### `drafts` (SQLite)
Schema (already migrated in Rust):
- `id` TEXT PK
- `editor_doc` TEXT (TipTap JSON string)
- `updated_at` INTEGER (ms since epoch)

**Draft ID strategy (Alpha):**
- `id = book:{bookId}` when a book is active.
- `id = global` when no book is active.

### Web fallback storage
When not in Tauri (web dev), persistence uses `localStorage`:
- `ai-readwrite-flow-chat:{sessionId}` -> array of chat messages
- `ai-readwrite-flow-draft:{draftId}` -> draft JSON

All reads from storage are treated as **untrusted** and must be validated (Zod).

## Behaviors

### Chat
- On entering a session: load existing messages ordered by `created_at`.
- Sending a message: append `user`, then append `assistant` on success; persist both.
- Clear: deletes persisted messages for current session and clears UI.
- Session switch (book changes): swap to the new `session_id` history.

### Drafts
- On entering a draft scope: load `editor_doc` if present and set editor content.
- On edit: persist with debounce (e.g., 500ms) to avoid excessive writes.
- Switching books: flush pending save for previous draft, then load next.

## Edge Cases
- Invalid stored JSON: ignore and start empty (do not crash UI).
- Large histories: cap to latest N messages per session (default N=200) to avoid unbounded growth.
- Desktop DB unavailable: fall back to `localStorage` (already used elsewhere).

## Acceptance Tests (Manual)
- Chat persistence:
  1) Open a PDF, send 2 messages in chat.
  2) Refresh web / restart desktop app.
  3) Chat messages still visible.
- Per-book chat session:
  1) Open Book A, send a message.
  2) Open Book B, chat is empty or shows B history.
  3) Switch back to Book A, history shows A messages.
- Draft persistence:
  1) Type content in Writer.
  2) Refresh/restart.
  3) Content remains.
- Per-book draft:
  1) Open Book A, type “A”.
  2) Open Book B, type “B”.
  3) Switch back: A draft shows “A”, B shows “B”.

## Risks & Mitigations
- **TipTap JSON shape changes**: validate minimally (`type: 'doc'`) and store as-is.
- **DB write frequency**: debounce draft saves; cap chat history; batch insert optional later.
- **Session semantics**: current session mapping may change when we introduce explicit “conversations”; keep `session_id` string strategy so we can migrate later.
