# AI-ReadWrite-Flow â€?Product Requirements
**Version:** 3.3 (Alpha-bound)  
**Status:** Active Development â€?explicit Alpha must-have vs can-slip

## 1. Vision & Principles
- Local-first, privacy-friendly workspace bridging Reading (input) and Writing (output) with AI.
- Platforms: Desktop-first (Windows/macOS) on Tauri v2; phone-first mobile scope (375px baseline) to keep future iOS/Android viable; tablet view deferred.
- Discipline: logic before pixels; strict typing (no `any`); Zod for external data; files <250 lines, functions <30 lines, max 3 nesting levels.

## 2. Scope & Priority
- **Alpha (must ship):** Settings save/test; library import with persistence; open PDFs; last-read restore; floating menu actions (summarize/explain/chat); buffered chat with retry + latency/tokens; highlight save + overlay; drafts/chats persisted; theme selection (light + presets); desktop split; **phone UI: Writer-first with Reader/Library disabled + chat overlay + compact Settings entry**; basic error boundaries; library path hygiene.
- **Alpha-can-slip (P1 targets):** RAG â€œAsk the bookâ€?(global search) â€?not a blocker; highlight-to-note sidebar; gestures; advanced editor insertions; streaming chat; Flomo; OCR.
- **Backlog (P2+):** Streaming, OCR, Flomo export, advanced block commands, EPUB, theme polish beyond presets, desktop keyboard gesture equivalents if desired, highlight UI polish (floating menu spacing/visibility/touch targets).

**Backlog (New Proposals):**
1. Context-aware LLM function â€?automatically take context from the reader.
2. Multi-round chat / chat history.
3. Support for screenshots/figures/pictures.
4. Chat UI improvements (e.g., markdown rendering, code blocks, auto size).

## 3. Data Model (SQLite + store/localStorage fallback)
- **settings (P0):** api_key, base_url, model, theme (`light`|`ocean`|`forest`|`sand`), updated_at.
- **books (P0):** id (UUID), title, author, cover_path, file_path, format ('pdf'|'epub'), file_hash (sha256), file_size, mtime, last_read_position JSON `{ page: number; scroll_y?: number; zoom?: number }`, processed_for_search (bool), added_at.
- **highlights (P0):** id, book_id FK, content, context_range JSON `{ page: number; rects: { x: number; y: number; width: number; height: number; normalized: true }[] }` (normalized 0â€?), color ('yellow'|'red'|'blue'), note (nullable), created_at. Overlaps allowed.
- **chats (P0):** id, session_id, role ('user'|'assistant'), content, reference_highlight_id (nullable), created_at.
- **drafts (P1):** id, editor_doc JSON, updated_at.
- **book_text_index (FTS5, P1/backlog for Alpha):** book_id, chunk, chunk_id, page, created_at. Fallback: skip RAG when empty/offline and state â€œNo document context available.â€?
- **project_books (P1):** join table for project â†?book assignment (`project_id`, `book_id`, `created_at`). A book can belong to multiple projects; removing a book from a project does **not** delete it from the global library.

## 4. Storage Paths & Cache
- Library root: `%APPDATA%/AI-ReadWrite-Flow/library/{bookId}/original.pdf` (Win) | `~/Library/Application Support/AI-ReadWrite-Flow/library/{bookId}/` (macOS) | `$XDG_DATA_HOME/AI-ReadWrite-Flow/library/{bookId}/` (Linux). Normalize separators.
- Cache: `$APPDATA/.../cache/` for temp thumbnails/text chunks; soft cap 512MB with LRU eviction; never critical data.
- Collision & dupes: scope files by `bookId`; preserve original filename inside folder. Store hash/size/mtime; if hash matches existing, surface â€œalready importedâ€?and reuse record (best-effort).

## 5. Functional Requirements
### Settings & Connectivity (P0)
- Defaults: base `https://xiaoai.plus/v1`, model `gpt-5-mini`, empty api_key. Test `/models`, show latency/model presence. Persist locally; guard empty key; buffered errors with retry.
- **PRD-SHELL-SETTINGS-001 (P1): Shared global settings**
  - Reader and Writer must share global settings (LLM base/model/key and theme) and expose them from both views.
  - Writer must not reuse Reader-only top bar status; top bar content is view-aware (show Writer-relevant state when in Writer view).
- **PRD-SHELL-SETTINGS-002 (P1): Settings drawer (desktop density)**
  - Desktop should not dedicate large always-visible screen space to Settings or Template panels.
  - Provide a single settings entry (e.g., top-right `âš™`) that opens a drawer/modal with sections/tabs: Global / Reader templates / Chat templates.

### Library Import & Hydration (P0)
- Drag/drop or picker. Copy file to library root; write `books` row. On partial copy failure, clean folder and show inline error. Permissions prompts surfaced. Hydrate list on launch. Goal: quickly reopen recent readings; dedupe via hash.
- Library management (P1+):
  - Show and sort by **recently opened** (backed by `books.last_opened_at`).
  - Safe cleanup: **Trash** (soft delete) + **Restore**; optional **Delete app copy** (desktop only, double confirm).
  - **Project assignment (P1):** allow assigning a book to one or more projects (multi-select). "Remove from project" only removes the relationship.
  - Organization (P2/backlog): tags/collections for grouping and filtering PDFs (not Alpha-critical).
- **PRD-LIB-HUB-001 (P1): Library management hub**
  - Add a top-level **Library** tab alongside Reader/Writer.
  - Library contains page tabs: **Books / Projects / Tags**.
  - All file/project/tag management happens in Library; Reader/Writer do not show global management controls.
- **PRD-LIB-BOOKS-UI-001 (P1): Book list density + priorities**
  - Book list prioritizes **metadata title** and **tags** as primary information.
  - File size/year/path are secondary (detail panel or hover), not primary list lines.
- **PRD-LIB-PROJECTS-001 (P1): Projects page**
  - Central place to create/edit/delete projects.
  - Show counts and membership; allow assigning/removing books from projects here.
- **PRD-LIB-TAGS-001 (P1): Tags page**
  - Central tag management (create/rename/delete/merge).
  - Multi-filter views (AND/OR include, exclude) with optional saved views.
- Drag/drop or picker. Copy file to library root; write `books` row. On partial copy failure, clean folder and show inline error. Permissions prompts surfaced. Hydrate list on launch. Goal: quickly reopen recent readings; dedupe via hash.
- Library management (P1+):
  - Show and sort by **recently opened** (backed by `books.last_opened_at`).
  - Safe cleanup: **Trash** (soft delete) + **Restore**; optional **Delete app copy** (desktop only, double confirm).
  - **Project assignment (P1):** allow assigning a book to one or more projects (multi-select). â€œRemove from projectâ€?only removes the relationship.
  - Organization (P2/backlog): tags/collections for grouping and filtering PDFs (not Alpha-critical).
- **PRD-LIB-UX-001 (P2): Library pop-out + Recent reads summary**
  - Desktop left sidebar should display a compact "Recent Reads" card (3 most recent items) rather than the full library list.
  - Full library access via a pop-out drawer/modal (triggered by "View All" or similar action).
  - Pop-out supports filtering, search, and full library operations (import, trash, delete).
  - State (open/closed) persists locally; responsive behavior on mobile deferred.
- **PRD-LIB-ORGANIZE-001 (P2): Folders, tags, and reading status**
  - Support organizing PDFs via tags/folders (e.g., "To Read", "Finished", custom categories).
  - Users can assign multiple tags per book and filter library by tag.
  - Support a reading status field (`in-progress`, `done`, `to-read`) with quick toggles.
  - Desktop Reader provides a "Mark as Done" action (e.g., in bookmarks area or Reader toolbar).
  - Schema: add `library_tags` table (book_id, tag, created_at) and `books.status` field.
- **PRD-LIB-METADATA-001 (P2): Auto-extract article titles**
  - On import, attempt to extract real article title from PDF metadata (title field, first-page heuristics).
  - Fall back to filename if extraction fails or metadata is empty.
  - Allow manual title editing in library UI.
  - Best-effort only; no external API calls; avoid blocking import on slow parsing.

### App Shell & Layout (P1)
- **PRD-SHELL-LAYOUT-001 (P1): Desktop three-panel workspace**
  - Desktop workspace prioritizes reading: left sidebar (Library + TOC/Bookmarks/Highlights), center PDF, right Chat.
  - Left sidebar uses independent scroll areas: Library list scroll does not affect TOC/Bookmarks scroll.
- **PRD-SHELL-LAYOUT-002 (P1): Bottom PDF toolbar**
  - Common PDF actions (page jump, find, zoom, fit modes) are available in a compact bottom toolbar (desktop), always visible.
  - Sidebar focuses on structure/navigation (TOC/bookmarks/highlights) rather than duplicating page tools.
- **PRD-SHELL-LAYOUT-003 (P1): Phone scope (Writer-first)**
  - Phone keeps the tab-based layout shell but **Reader/Library tabs are disabled** with a clear hint (not removed).
  - Phone chat is accessed via a compact action button that opens an overlay/drawer (not a full tab).
  - Phone Settings panel is **not** the large panel; use a compact top-right icon entry.
  - Desktop-only layout density changes must not break phone behavior.
- **PRD-SHELL-CHAT-OVERLAY-001 (P1): Mobile chat overlay**
  - On phone width (~375px), Chat opens as a full-height (or near full-height) sheet/drawer with a single scroll area.
  - Header is minimal: title + model/context hint + close; Clear stays secondary.
  - Remove desktop-style nested borders/shadows/max-height clamps; favor readable padding/line-height and single scroll.
  - Chat input sticks to the bottom, grows up to ~3 lines, respects safe area; template picker is a lightweight sheet, not persistent inline.
  - Long messages may fold with â€œShow moreâ€? auto-scroll pauses when user scrolls up, with a â€œJump to latestâ€?affordance.

### Project Scope (P1)
- **PRD-PROJ-SCOPE-001 (P1): Project-driven workspace**
  - Projects are global and shared between Reader and Writer.
  - A book can belong to multiple projects via `project_books`.
  - The active project filters Reader's visible book list and scopes Writer content/context/references.
  - Search scope must be explicit: **Library search = global**; **Project search = current project**.
  - Flomo default tags use the **current project** when multiple project memberships exist.
  - Reading position remains **per book** (not per project); users can manage project-specific navigation via bookmarks.
- **PRD-PROJ-SCOPE-002 (P1): Reader sidebar scope-only**
  - Reader sidebar shows only the current project's books + reader navigation.
  - Global Library management moves to the Library tab.
- **PRD-PROJ-SCOPE-001 (P1): Project-driven workspace**
  - Projects are global and shared between Reader and Writer.
  - A book can belong to multiple projects via `project_books`.
  - The active project filters Reader's visible book list and scopes Writer content/context/references.
  - Search scope must be explicit: **Library search = global**; **Project search = current project**.
  - Flomo default tags use the **current project** when multiple project memberships exist.
  - Reading position remains **per book** (not per project); users can manage project-specific navigation via bookmarks.

**Scope rationale (2026-01-17):**
- Projects are a **classifier**, not a container; do not move books between projects.
- Reduce destructive errors by separating "Remove from project" vs "Delete from Library".
- Keep Reader/Writer in sync under a single active project while preserving simple, book-level reading progress.

### Reader Core (P0)

- **PRD-RDR-AI-001 (P1): Reader "Questions" shortcut (active recall)**
  - From Reader selection menu and persisted highlight popover, provide `Questions` (Generate Questions).
  - Output contract (default): generate **3â€?** `Q:`/`A:` pairs grounded only in the provided context, covering **terminology**, **logic flow**, and **insight/implications** (tags allowed). If context is insufficient, ask clarifying questions instead of guessing.
- **PRD-RDR-AI-002 (P1): Shared Reader shortcut templates**
  - Reader actions `Ask AI` / `Summarize` / `Explain` / `Questions` must use a shared template registry so prompts and behaviors stay consistent across selection menu and highlight popover.
- **PRD-RDR-AI-003 (P1): End-user editable templates with safe defaults**
  - Provide Settings UI to edit the Reader shortcut templates (instruction text) locally.
  - Must include a fail-safe recovery: `Use defaults` + per-template reset + reset all overrides.
- Render PDF via react-pdf; page nav + continuous scroll toggle; wheel scoped. Restore `last_read_position`. Floating menu on selection: Summarize/Explain/Chat/Save Highlight. Selection bounding uses normalized page coords (0â€?); store zoom when available to aid re-projection.
- **PRD-RDR-NAV-001 (P1): Bookmarks add UX**
  - Provide an explicit "Add bookmark" action in Reader.
  - Bookmarks persist per book and appear in the Bookmarks list with page labels.
- **PRD-RDR-NAV-002 (P1): Mode switch preserves position**
  - Switching between Paged and Continuous must preserve the current reading position (no jump to page 1).
  - TOC jumps should not force a mode switch; the user controls the mode.
- **PRD-RDR-NAV-003 (P1): Paged navigation inputs**
  - In Paged mode, allow keyboard navigation (arrow keys) and optional wheel-to-next-page when at the bottom/top.
- **PRD-RDR-NAV-004 (P1): Continuous page controls**
  - In Continuous mode, page controls must either be disabled with a clear affordance or scroll to the next/previous page anchor.

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
  - Repeated highlights should either merge (recommended) or cap alpha to avoid â€œdark stackingâ€?
- Interactions:
  - Click to select an existing highlight (single select).
  - Popover actions: change color, delete, add/edit note, ask AI about highlight.
  - One highlight can link to many chat messages (via `chats.reference_highlight_id`).

### AI Pipeline (P0 base, P1 extras)
- Alpha uses buffered responses; streaming is backlog. Retry with capped exponential backoff (3 tries, max 2s backoff). Latency target p95 < 8s. Editor auto-insert sequence (opt-in): send â†?receive â†?append to cursor. Respect stored base/model/key; block empty key.

### RAG / â€œAsk the Bookâ€?(Backlog, not Alpha-blocking)
- Chunk ~800â€?200 chars, 10â€?5% overlap; top-K = 3â€?. Prompt template: system preamble + user question + cited chunks (`[p{page}] excerpt`). If FTS empty/offline, fall back to normal chat and state no context. Not an Alpha blocker.

### Writer / Editor (P1)
**Status note:** Writer UX is **deferred until Reader completion** (`docs/TASKS.md` Task 29). Alpha only guarantees local draft persistence to prevent data loss.

**P0 (usable writing) â€?requirements**
- Large editing area suitable for long-form writing.
- Persist last edit locally; restore after refresh/restart/crash.
- Saved entries (â€œdocumentsâ€? with:
  - Default title: first line is the title.
  - In-editor tags: auto-detect `#tag` and `#tag/subtag`.

**P1 (AI-assisted writing) â€?requirements**
- **PRD-WTR-AI-001 (P1): Writer selection AI actions (auto-send)**
  - In Writer Content, selecting text shows a compact action menu: `Simplify` / `Concise` / `Rewrite` / `Translate` / `Explain` / `Ask AI`.
  - `Simplify/Concise/Rewrite/Translate/Explain` auto-send and write a result card into Writer chat.
  - After applying a suggestion via `Replace selection` or `Insert below`, the newly inserted text briefly flash-highlights (theme-aware) and clears on next user input or after 7s.
  - `Rewrite` supports a tone submenu: Default / Formal / Friendly / Academic / Bullet.
  - `Translate` default target language is configurable in Settings (initial default: English).
- **PRD-WTR-AI-002 (P1): Writer â€œAsk AIâ€?is draft-only**
  - `Ask AI` must NOT auto-send; it pre-fills the chat input with `Context:` (selected text) + `Instruction:` and focuses the cursor at the end.
- **PRD-WTR-AI-003 (P1): Centralized Writer templates with safe defaults**
  - Writer selection actions share a template registry (single source of truth) and are end-user editable.
  - Settings exposes a Writer templates editor with:
    - `Use defaults` (ignore overrides; instant recovery if overrides break prompts)
    - `Reset` per template and `Reset all` for overrides
  - Rewrite tone is implemented as a set of tone profiles (directive/description/examples) applied as additional prompt directives; tone does not require separate template IDs.
  - Tone profile examples are optional; limit to 3 examples with 60 words max per example.
  - Must include `Use defaults` + per-template reset + reset-all recovery (same behavior expectations as Reader templates).
  - Future requirement (Option B): allow per-tone rewrite templates (separate template IDs) if tone profiles are insufficient.
- **PRD-WTR-AI-004 (P1): Non-destructive apply controls**
  - Result cards provide explicit apply actions: `Replace selection` (default primary), `Insert below`, and `Copy`.
  - Apply actions must preserve a clean single-step Undo for replace/insert.
- **PRD-WTR-CHAT-REF-001 (P1): Writer chat includes references**
  - When references are included in Context (membership on), Writer chat should include those reference snippets by default.
  - Provide a per-chat toggle to include/exclude references.
- **PRD-WTR-CHAT-REF-002 (P1): Writer chat history sanitization**
  - Historical user messages sent to the API must strip prior `Context:` and `References:` blocks.
  - Only the user `Instruction:` content should be retained for previous turns to avoid stale context leakage.
- **PRD-WTR-REF-001 (P1): Reference provenance metadata**
  - On import, capture PDF metadata when available (title/author/year/keywords) and persist on the book record.
  - Writer references created from Reader must store a snapshot of source metadata (title/author/year, file_hash, page_number, page_label) so citations remain stable if the book metadata changes.
  - Provide an explicit "Update metadata" action to refresh the snapshot from the current book metadata without changing selection text or page anchors.
- **PRD-WTR-REF-002 (P1): Citation formatting (APA 7 default)**
  - Writer outputs that use references can include citations in APA 7 format by default.
  - Page numbers/labels must be inserted by the system (no model-generated page values).
  - Missing fields must follow APA fallback rules (e.g., title in author position, `n.d.` for missing year).
  - References list is deduped and sorted.
- **PRD-WTR-REF-003 (P1): Reference tags + system defaults**
- References support user-editable `tags[]` for filtering and search.
- System default tags are generated from source metadata using the `ai_reader/<field>/<value>` namespace (e.g., `ai_reader/title/<title>`).
- Default tag generation is configurable in Settings (which defaults are on/off).
- Tag search covers tags + source metadata + snippet text.
- References panel provides a multi-select tag filter with an option to include system tags.
- System tag display uses `title <value>` / `author <value>` / `year <value>` (no prefix, no colon); user tags render with `#`.
- System tags are not editable and should not appear in the tag editor UI.
- Reader `To Ref` prompts for optional user tags (both selection menu and highlight popover).
- Flomo export prefixes user tags with `#ai_reader/` at send time.
- **PRD-WTR-SEARCH-001 (P1): Writer global search**
  - Writer provides a global search modal with a query input and filters for Content, Context, References, Chat, and Studio.
  - Clicking a result jumps to the corresponding area (editor selection for Content; focus in Context; scroll to reference/chat/studio cards).
  - Follow-up UX polish (low priority): inline match highlight with next/prev navigation, keyboard shortcuts (e.g., Ctrl+K, Enter, Esc), and a scope toggle (current project vs all projects).
- **PRD-CHAT-MM-001 (P1): Multimodal chat image input**
  - Chat messages can include images when the configured model supports image input; otherwise show a clear "unsupported" message.
  - Images are stored locally (app data for desktop, data URL/IndexedDB for web) and referenced by message content parts.
- **PRD-CHAT-RESP-001 (P1): GPT-5 Responses API controls**
  - Chat settings provide a safe toggle between Chat Completions (default) and Responses API.
  - When Responses API is enabled and the model is GPT-5, pass `reasoning.effort`, `text.verbosity`, and `max_output_tokens` settings.
  - Non-GPT-5 models ignore these controls and show a clear hint.
- **PRD-CHAT-UX-001 (P1): Chat role visual distinction**
  - In both Reader and Writer chat, user and assistant/suggestion messages must be visually distinguishable (theme-aware), improving scanability.
- **PRD-CHAT-UX-002 (P2): Reader/Writer chat visual consistency**
  - Reader chat and Writer chat must use the same bubble styling, theme tokens, and layout infrastructure.
  - Both chats share the same store/API infrastructure; only prompt templates differ.
  - Ensure theme changes apply uniformly to both views.
- **PRD-WTR-CTX-OCR-001 (P1): Context image drop + local OCR**
  - Drag/drop images into Context triggers local OCR (no remote upload).
  - After OCR completes, prompt the user to Append to Context or Insert at cursor.
  - OCR failures are recoverable; cache OCR results by image hash to avoid repeated work.
- **PRD-WTR-LAYOUT-001 (P1): Writer Editorâ†”Chat adjustable split**
  - Desktop Writer view supports resizing the boundary between Editor and Writer AI.
  - Default ratio (Editor/Chat) is 65/35 (ratio applies to Editor+Chat only; left sidebar excluded).
  - Enforce minimum widths: Editor â‰?520px; Writer AI â‰?320px.
- **PRD-WTR-LAYOUT-002 (P1): Layout adjust mode (lock/unlock)**
  - Provide a top-right `Layout` control next to Settings (Writer desktop only).
  - Default is Locked; entering Adjust mode shows draggable splitter and allows changes; Done returns to Locked.
  - Adjust mode includes a Reset action to restore defaults.
- **PRD-WTR-DENSITY-001 (P1): Writer spacing density**
  - Provide a Writer-only density setting (at least Comfortable/Compact) to reduce wasted space in: header/toolbars, panel gutters, and card paddings.
  - Must not affect Reader or mobile; migrate later only if proven.
- **PRD-WTR-LAYOUT-003 (P1): Persist layout preferences**
  - Persist Editor/Chat ratio and Writer density locally and restore on launch.
- **PRD-SHELL-LAYOUT-002 (P1): Desktop sidebar resizing + nav toggle ergonomics**
  - Left sidebar supports a user-adjustable width via a draggable splitter (desktop only).
  - Splitter handles appear only in **Layout Adjust mode** (unlocked via Writer top bar `Layout`); otherwise a simple divider is shown (not draggable).
  - Enforce min/max widths and persist width locally; provide a Reset to default width (via Layout controls).
  - Replace the text button â€œHide navigationâ€?with a compact icon toggle placed consistently (desktop view toolbar/top bar).
- **PRD-SHELL-LAYOUT-004 (P1): Global Layout toggle + per-view scope**
  - Desktop header shows a single `Layout` / `Done` toggle in both Reader and Writer views (mobile unaffected).
  - Layout Adjust mode is **global**, but adjustments are **scoped** to the current view; show an explicit scope hint: `Adjusting: Reader` / `Adjusting: Writer`.
  - Reader supports adjusting the **Readerâ†”Chat** width split (desktop only), with min widths, persistence, and Reset (Reader-only).
  - Writer supports adjusting the **Editorâ†”Chat** split and density as before; Reset is Writer-only (does not reset Reader).
- Right-side AI assistant chat for writing (shortcuts TBD).
- Writer Studio â€œArtifactsâ€?(writing-first): Kickoff/Definition/Explanation/Rewrite(style)/Polish produce saved artifacts first (no auto-overwrite); user clicks Insert to apply. Citation constraint is On by default when references are available.
- Markdown support: at minimum import/export; full markdown-native editing optional (define fidelity expectations).

**P2 (integrations & personalization) â€?requirements**
- One-click export to Flomo (API), with clear failure handling.
- Quick synonyms/translation via remote LLM first; local model optional later.
- â€œCan my writing be learned?â€?requires an explicit privacy-first definition; default is **no server-side training**. Consider local-only â€œstyle profileâ€?prompts or local retrieval over drafts.

**Writer workflow model (spec-only; implementation deferred)**
- **Projects:** Writer work is organized into global projects shared with Reader. A project is the unit of saved work and has its own content/context/references.
- **Project books:** A book can belong to multiple projects; Reader lists only books in the active project unless in global mode.
- **Workspace layout:** top = **Content** (writing), bottom = **Context** (plain text, editable, supports paste), with an action row between (actions TBD).
- **Left navigation:** top = project list; bottom = current projectâ€™s **References** list.
- **References (minimum unit):** â€œreference cardsâ€?with `source` (bookId/page/rects), `title`, `snippet`, `createdAt`, optional `author`; can be created from Reader highlights or manually.
- **Reader â†?Writer (reference + highlight):** When selecting text in Reader and choosing `To Ref`, create a Highlight first, then save the Writer reference so the highlight is visible in Reader.
- **References (metadata snapshot):** each reference stores a snapshot of source metadata (title/author/year, file_hash, page_label/page_number) for stable citations, with a manual "Update metadata" action to refresh from the current book metadata.
- **References (tags):** each reference can store user tags; system default tags can be generated from source metadata with user-configurable defaults.
- **Context membership:** each reference has an include/exclude toggle; context displays â€œitems/sizeâ€?and supports **Clear** and **Undo last append**. Clear prompts for context-only vs context+chat.
- **Active project is explicit:** Writer must show the currently active project; Reader â€œadd to writing â€¦â€?actions must not be allowed to silently write into an unknown project (prompt to choose/create if none).
- **Reader â†?Writer actions:** from a Reader highlight:
  - â€œAdd to writing contextâ€?appends snippet to the active project context (toast + undo).
  - â€œAdd to [project name] (reference)â€?creates a reference card (default included = false to avoid context bloat).
- **Writer assistant:** right-side **collapsible** multi-round chat, decoupled from Readerâ€™s per-book chat unless user explicitly opts in; supports prompt presets/templates (TBD).
- **Markdown:** content accepts Markdown syntax. P1 adds an **Edit/Preview** toggle (preview is read-only render; editing remains plain text).

See `docs/writer-srs.md` for testable details and acceptance criteria.

### Gestures & Theme (P1)
- Mobile gestures: swipe left delete in Library; swipe right back in Reader (low priority). Desktop equivalents may be keyboard shortcuts later; otherwise mobile-only. (Phone Reader is disabled for now; keep gestures scoped for future enablement.)
- Theme persisted in settings; default light; presets `light|ocean|forest|sand`. Respect OS preference only on first run if unset; user override sticks.

### Extraction & Indexing (P1)
- Rust background task extracts text on import; UI non-blocking; show progress/error. Insert chunks into `book_text_index`; if fail, mark processed_for_search false and continue core flows.

### Error Boundaries & Resilience (P0)
- Wrap Reader, Editor, Chat; show friendly fallback with â€œReload panel.â€?Network failures show inline retry; keep drafts intact. Avoid logging secrets.

### Telemetry/Logging (Low priority)
- Local-only (console or rolling file, 7-day retention) with redaction of secrets; optional disable. Non-core.

### OCR (Backlog)
- For scanned PDFs: run Tesseract via Rust; output plain text per page (readable). Store alongside book folder; optional ingest into FTS when available.

### Flomo (P1/backlog)
- Reader/Writer: export notes to Flomo via webhook (write-only), plain text with tags (one per line) and default tag prefixes (`#books/<book>` / `#å†™ä½œ/<project>`).
- Reader: selection `Note` flow can save a highlight note and optionally `Save & Send` to Flomo; Writer: export selection (plus Context) to Flomo.
- Writer References: export a reference card to Flomo; user tags are prefixed with `#ai_reader/` and system tags are preserved.
- Explicit Project/Book tags (user-managed) are used as default Flomo tags; Flomo composer can optionally save edits back to defaults.
- Writer: provide a full export to Flomo (Content + Context) from the writer action bar.
- UX/Safety: never reveal or copy the webhook URL in UI; show clear success/error feedback; optionally show a local-only â€œLast sentâ€?timestamp to reduce duplicate sends.
- Writer UX: provide a local-only `Flomo History` list (outbox) per writing project to review what was sent and support quick resend (Flomo is write-only; no remote history).

## 6. AI Prompt Contract (Baseline)
- System prompt defines assistant role/safety. Selection-based: `Explain this text: "<quote>"`. Global query: plain question. When RAG active, append cited chunks with `[p{page}]` tags and require citations; if none, state lack of context.

## 7. Testing Plan
- **Manual P0 smoke (run by you):** first-run settings save/test; import PDF; reopen restores last page; select text â†?floating menu actions; chat success + retry; highlight save + overlay on reopen; theme persists; **phone UI at 375px: Writer usable, Reader/Library disabled with hint, Settings icon present, chat overlay opens.**
- **Automated (dev-owned):** unit for stores (settings/library/reader/chat/drafts/highlights), apiClient fetch behaviors (mocked), selection â†?normalized rect helpers, Rust command tests for import/copy. Mock Tauri plugins; no real file/network in unit tests.

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
- Theme and layout adapt between desktop split and phone layout without UI breakage.
- Phone scope: Writer is usable; Reader/Library are disabled with a clear hint; Settings icon and chat overlay are discoverable.

## Current Progress (Brief)
- Desktop: imports persist to app data with hash/mtime/size and render in Reader; last_read_position (page + scroll) saves/restores.
- Web: web imports are stored as data URLs and survive refresh; desktop-imported files are hidden to avoid broken previews.
- Highlight persistence exists but geometry/overlap/merge and interactions (select/edit/delete) are still being hardened.







