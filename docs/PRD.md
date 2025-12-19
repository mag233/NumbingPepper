# AI-ReadWrite-Flow — Product Requirements
**Version:** 3.2 (Alpha-bound)  
**Status:** Active Development — explicit Alpha must-have vs can-slip

## 1. Vision & Principles
- Local-first, privacy-friendly workspace bridging Reading (input) and Writing (output) with AI.
- Platforms: Desktop-first (Windows/macOS) on Tauri v2; touch-friendly/mobile-ready (375px baseline) to keep future iOS/Android viable.
- Discipline: logic before pixels; strict typing (no `any`); Zod for external data; files <250 lines, functions <30 lines, max 3 nesting levels.

## 2. Scope & Priority
- **Alpha (must ship):** Settings save/test; library import with persistence; open PDFs; last-read restore; floating menu actions (summarize/explain/chat); buffered chat with retry + latency/tokens; highlight save + overlay; drafts/chats persisted; theme selection (light + presets); mobile tabs + desktop split; basic error boundaries; library path hygiene.
- **Alpha-can-slip (P1 targets):** RAG “Ask the book” (global search) — not a blocker; highlight-to-note sidebar; gestures; advanced editor insertions; streaming chat; Flomo; OCR.
- **Backlog (P2+):** Streaming, OCR, Flomo export, advanced block commands, EPUB, theme polish beyond presets, desktop keyboard gesture equivalents if desired, highlight UI polish (floating menu spacing/visibility/touch targets).

**Backlog (New Proposals):**
1. Context-aware LLM function — automatically take context from the reader.
2. Multi-round chat / chat history.
3. Support for screenshots/figures/pictures.
4. Chat UI improvements (e.g., markdown rendering, code blocks, auto size).

## 3. Data Model (SQLite + store/localStorage fallback)
- **settings (P0):** api_key, base_url, model, theme (`light`|`ocean`|`forest`|`sand`), updated_at.
- **books (P0):** id (UUID), title, author, cover_path, file_path, format ('pdf'|'epub'), file_hash (sha256), file_size, mtime, last_read_position JSON `{ page: number; scroll_y?: number; zoom?: number }`, processed_for_search (bool), added_at.
- **highlights (P0):** id, book_id FK, content, context_range JSON `{ page: number; rects: { x: number; y: number; width: number; height: number; normalized: true }[] }` (normalized 0–1), color ('yellow'|'red'|'blue'), note (nullable), created_at. Overlaps allowed.
- **chats (P0):** id, session_id, role ('user'|'assistant'), content, reference_highlight_id (nullable), created_at.
- **drafts (P1):** id, editor_doc JSON, updated_at.
- **book_text_index (FTS5, P1/backlog for Alpha):** book_id, chunk, chunk_id, page, created_at. Fallback: skip RAG when empty/offline and state “No document context available.”

## 4. Storage Paths & Cache
- Library root: `%APPDATA%/AI-ReadWrite-Flow/library/{bookId}/original.pdf` (Win) | `~/Library/Application Support/AI-ReadWrite-Flow/library/{bookId}/` (macOS) | `$XDG_DATA_HOME/AI-ReadWrite-Flow/library/{bookId}/` (Linux). Normalize separators.
- Cache: `$APPDATA/.../cache/` for temp thumbnails/text chunks; soft cap 512MB with LRU eviction; never critical data.
- Collision & dupes: scope files by `bookId`; preserve original filename inside folder. Store hash/size/mtime; if hash matches existing, surface “already imported” and reuse record (best-effort).

## 5. Functional Requirements
### Settings & Connectivity (P0)
- Defaults: base `https://xiaoai.plus/v1`, model `gpt-5-mini`, empty api_key. Test `/models`, show latency/model presence. Persist locally; guard empty key; buffered errors with retry.

### Library Import & Hydration (P0)
- Drag/drop or picker. Copy file to library root; write `books` row. On partial copy failure, clean folder and show inline error. Permissions prompts surfaced. Hydrate list on launch. Goal: quickly reopen recent readings; dedupe via hash.
- Library management (P1+):
  - Show and sort by **recently opened** (backed by `books.last_opened_at`).
  - Safe cleanup: **Trash** (soft delete) + **Restore**; optional **Delete app copy** (desktop only, double confirm).
  - Organization (P2/backlog): tags/collections for grouping and filtering PDFs (not Alpha-critical).

### Reader Core (P0)
- Render PDF via react-pdf; page nav + continuous scroll toggle; wheel scoped. Restore `last_read_position`. Floating menu on selection: Summarize/Explain/Chat/Save Highlight. Selection bounding uses normalized page coords (0–1); store zoom when available to aid re-projection.

### Highlights & Notes (P0/P1)
- Overlay colors: yellow/red/blue; z-index above text layer; allow text selection through when not hovered; hover shows outline. Overlaps allowed; render in insertion order (or explicit merge rules). Save normalized context_range. Note editing inline in sidebar; delete with confirm.
- Data shape for highlights (SQLite):
  - `id` (UUID), `book_id` FK, `content` (text), `color` ('yellow'|'red'|'blue'), `note` (nullable), `context_range` JSON:
    ```json
    {
      "page": 1,
      "rects": [
        { "x": 0.12, "y": 0.34, "width": 0.22, "height": 0.05, "normalized": true }
      ],
      "zoom": null
    }
    ```
- Overlap handling/render:
  - Must support multi-rect highlights (one rect per line fragment).
  - Must clip rects to page bounds and prevent line-to-line overlap (vertical clamp).
  - Repeated highlights should either merge (recommended) or cap alpha to avoid “dark stacking”.
- Interactions:
  - Click to select an existing highlight (single select).
  - Popover actions: change color, delete, add/edit note, ask AI about highlight.
  - One highlight can link to many chat messages (via `chats.reference_highlight_id`).

### AI Pipeline (P0 base, P1 extras)
- Alpha uses buffered responses; streaming is backlog. Retry with capped exponential backoff (3 tries, max 2s backoff). Latency target p95 < 8s. Editor auto-insert sequence (opt-in): send → receive → append to cursor. Respect stored base/model/key; block empty key.

### RAG / “Ask the Book” (Backlog, not Alpha-blocking)
- Chunk ~800–1200 chars, 10–15% overlap; top-K = 3–5. Prompt template: system preamble + user question + cited chunks (`[p{page}] excerpt`). If FTS empty/offline, fall back to normal chat and state no context. Not an Alpha blocker.

### Writer / Editor (P1)
**Status note:** Writer UX is **deferred until Reader completion** (`docs/TASKS.md` Task 29). Alpha only guarantees local draft persistence to prevent data loss.

**P0 (usable writing) — requirements**
- Large editing area suitable for long-form writing.
- Persist last edit locally; restore after refresh/restart/crash.
- Saved entries (“documents”) with:
  - Default title: first line is the title.
  - In-editor tags: auto-detect `#tag` and `#tag/subtag`.

**P1 (AI-assisted writing) — requirements**
- Highlight/selection actions (examples): Simplify, Concise, Rewrite, Translate, Explain.
- Right-side AI assistant chat for writing (shortcuts TBD).
- Writer Studio “Artifacts” (writing-first): Kickoff/Definition/Explanation/Rewrite(style)/Polish produce saved artifacts first (no auto-overwrite); user clicks Insert to apply. Citation constraint is On by default when references are available.
- Markdown support: at minimum import/export; full markdown-native editing optional (define fidelity expectations).

**P2 (integrations & personalization) — requirements**
- One-click export to Flomo (API), with clear failure handling.
- Quick synonyms/translation via remote LLM first; local model optional later.
- “Can my writing be learned?” requires an explicit privacy-first definition; default is **no server-side training**. Consider local-only “style profile” prompts or local retrieval over drafts.

**Writer workflow model (spec-only; implementation deferred)**
- **Projects:** Writer work is organized into “Writing Projects”. A project is the unit of saved work and has its own content/context/references.
- **Workspace layout:** top = **Content** (writing), bottom = **Context** (plain text, editable, supports paste), with an action row between (actions TBD).
- **Left navigation:** top = project list; bottom = current project’s **References** list.
- **References (minimum unit):** “reference cards” with `source` (bookId/page/rects), `title`, `snippet`, `createdAt`, optional `author`; can be created from Reader highlights or manually.
- **Context membership:** each reference has an include/exclude toggle; context displays “items/size” and supports **Clear** and **Undo last append**.
- **Active project is explicit:** Writer must show the currently active project; Reader “add to writing …” actions must not be allowed to silently write into an unknown project (prompt to choose/create if none).
- **Reader → Writer actions:** from a Reader highlight:
  - “Add to writing context” appends snippet to the active project context (toast + undo).
  - “Add to [project name] (reference)” creates a reference card (default included = false to avoid context bloat).
- **Writer assistant:** right-side **collapsible** multi-round chat, decoupled from Reader’s per-book chat unless user explicitly opts in; supports prompt presets/templates (TBD).
- **Markdown:** content accepts Markdown syntax. P1 adds an **Edit/Preview** toggle (preview is read-only render; editing remains plain text).

See `docs/writer-srs.md` for testable details and acceptance criteria.

### Gestures & Theme (P1)
- Mobile gestures: swipe left delete in Library; swipe right back in Reader (low priority). Desktop equivalents may be keyboard shortcuts later; otherwise mobile-only.
- Theme persisted in settings; default light; presets `light|ocean|forest|sand`. Respect OS preference only on first run if unset; user override sticks.

### Extraction & Indexing (P1)
- Rust background task extracts text on import; UI non-blocking; show progress/error. Insert chunks into `book_text_index`; if fail, mark processed_for_search false and continue core flows.

### Error Boundaries & Resilience (P0)
- Wrap Reader, Editor, Chat; show friendly fallback with “Reload panel.” Network failures show inline retry; keep drafts intact. Avoid logging secrets.

### Telemetry/Logging (Low priority)
- Local-only (console or rolling file, 7-day retention) with redaction of secrets; optional disable. Non-core.

### OCR (Backlog)
- For scanned PDFs: run Tesseract via Rust; output plain text per page (readable). Store alongside book folder; optional ingest into FTS when available.

### Flomo (P1/backlog)
- Button on chat bubble to POST structured payload (quote, question, AI reply, optional note) with markdown stripped. Validate URL presence; surface toast on success/error.

## 6. AI Prompt Contract (Baseline)
- System prompt defines assistant role/safety. Selection-based: `Explain this text: "<quote>"`. Global query: plain question. When RAG active, append cited chunks with `[p{page}]` tags and require citations; if none, state lack of context.

## 7. Testing Plan
- **Manual P0 smoke (run by you):** first-run settings save/test; import PDF; reopen restores last page; select text → floating menu actions; chat success + retry; highlight save + overlay on reopen; theme persists; mobile tabs at 375px render correctly.
- **Automated (dev-owned):** unit for stores (settings/library/reader/chat/drafts/highlights), apiClient fetch behaviors (mocked), selection → normalized rect helpers, Rust command tests for import/copy. Mock Tauri plugins; no real file/network in unit tests.

## 8. Performance Targets
- Import 100MB PDF copy < 20s on baseline laptop; main thread blocks < 100ms at kickoff. Reader render p95 < 200ms per page nav. Virtualize lists when >100 items (library/highlights/chat) to keep scroll smooth.

## 9. Security & Privacy
- API key stored locally (SQLite/store); no encryption now. Do not log keys. Validate base_url as HTTPS and disallow localhost/file to reduce SSRF; if override needed, add explicit allowlist toggle. Track future task: key encryption at rest.

## 10. Open Questions
- EPUB timing (Alpha or later)?
- Single-window sufficient for Alpha?

## 11. Success Criteria (Alpha)
- Settings persist; connectivity test passes with valid key.
- Import persists book; reopen shows last position and highlights overlaid.
- Chat buffered with retry and metrics; floating menu actions round-trip successfully.
- Theme and layout adapt between desktop split and mobile tabs without UI breakage.

## Current Progress (Brief)
- Desktop: imports persist to app data with hash/mtime/size and render in Reader; last_read_position (page + scroll) saves/restores.
- Web: web imports are stored as data URLs and survive refresh; desktop-imported files are hidden to avoid broken previews.
- Highlight persistence exists but geometry/overlap/merge and interactions (select/edit/delete) are still being hardened.
