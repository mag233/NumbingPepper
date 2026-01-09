# SRS (Software Requirements Specification) — Project Index

PRD answers “what and why”. SRS answers “what exactly and how to verify”.

## Scope
- SRS is for complex, cross-cutting, or high-risk technical requirements.
- Keep SRS testable: include data contracts, edge cases, and acceptance criteria.

## Files
- Reader highlighting, chat drafts, and writer requirements have been merged into this file.
- Archived source files live under `docs/_archive/` (local-only).

## Conventions
- Every SRS must include: Goals, Non-goals, Data contracts, Behaviors, Edge cases, Acceptance tests, Risks & mitigations.
- When PRD and SRS conflict on a detail: update PRD for priority/intent; SRS is authoritative for technical specifics.

---

# SRS - Reader Highlighting

## 1. Goals
- Kindle-like highlights that users trust: aligned to text, stable across zoom/window size, persisted and restorable.
- Support highlight creation from selection, selection clearing, and overlay rendering without visual artifacts.
- Provide interactions: click-to-select, edit color, edit note, delete (confirm), and context-aware actions (Ask AI / Summarize / Explain / Generate Questions).

## 2. Non-goals (for Alpha)
- OCR-based selectable text for scanned PDFs.
- Cross-device sync.
- Perfect glyph-accurate highlighting (PDF text layer limitations); we target "close enough" per line.

## 3. Data Contracts
### 3.1 Highlight
- `id: string` (UUID)
- `bookId: string`
- `content: string` (selected text)
- `color: 'yellow'|'red'|'blue'`
- `note?: string | null`
- `contextRange`:
  - `page: number` (1-based)
  - `rects: Array<{ x:number; y:number; width:number; height:number; normalized:true }>` (normalized 0-1 relative to a stable page host)
  - `zoom?: number | null` (optional)
- `createdAt: number` (ms epoch)

### 3.2 Storage
- Desktop: SQLite `highlights` table.
- Web fallback: localStorage key `ai-readwrite-flow-highlights`.

## 4. Geometry & Rendering
### 4.1 Normalization host
- Rect normalization MUST use a stable host per page, not the `.react-pdf__Page` element itself.
- The host is an element with attribute `data-arwf-page-host`.

### 4.2 Rect generation
- Use `range.getClientRects()` to capture per-line fragments.
- Filter out zero-area rects.
- Clamp each rect to `[0,1]` bounds.

### 4.3 Overlap control
- Vertical clamp: prevent a rect from overlapping the rect above/below on adjacent lines by enforcing a minimum gap (or trimming).
- Horizontal clamp: rects must not exceed page width.

### 4.4 Repeated highlights
- If the new highlight overlaps an existing highlight on the same page:
  - Preferred: merge into a single highlight (union of rects) and keep content concatenated or preserve earliest content.
  - Alternative: keep separate highlights but cap alpha so stacking does not darken.

### 4.5 Layering
- Overlays must render above the PDF canvas/text layers (z-index above).
- Use blend mode (`mix-blend-multiply`) to keep text legible.
- Default overlays must be non-interactive (pointer-events none) except when selecting an existing highlight.

## 5. User Interactions
### 5.1 Create
- Select text -> click `Highlight` -> highlight is persisted; selection clears; overlay appears immediately.

### 5.2 Select existing highlight
- Clicking an overlay selects it (single selection).
- Selected state shows outline and popover.

### 5.3 Edit
- Popover allows:
  - Change color.
  - Add/edit note.
  - Ask AI (opens Chat with `Context:` + `Instruction:` and focuses input for additional typing).
  - Summarize / Explain (shortcut prompts; may auto-send).
  - Generate Questions (shortcut prompt; may auto-send).

### 5.4 Delete
- Delete action removes highlight; requires a confirm step (2-click) to prevent accidental deletion.

## 6. Acceptance Tests (Manual)
1. Create highlight on a single line: overlay fits the line and does not overflow into margins.
2. Create highlight across multiple lines: overlays appear per line, no overlap between lines.
3. Create highlight twice on same text: overlays do not create darker stacked blocks beyond expectations (merge or alpha cap).
4. Restart app / refresh web: highlights reappear on correct pages.
5. Resize window: highlights remain aligned to text.
6. Click existing highlight: popover appears; Ask AI opens Chat and focuses the textarea for extra instructions.
7. Save note: show "Saving..." then "Saved" persists after restart/refresh.
8. Delete: requires confirm; persists after restart/refresh.

## 7. Risks & Mitigations
- PDF text layer transforms differ across platforms -> rely on `getClientRects()` and stable host normalization; add clamps/merge.
- Continuous scroll mounting/unmounting pages -> render highlights only for mounted pages; hydrate per book on open.

---

# SRS - Chat History & Writer Draft Persistence (Task 13)

## Goals
- Persist chat history locally (desktop + web dev) so refresh/restart restores messages.
- Persist writer drafts locally so typed content is not lost on refresh/restart.
- Keep data model compatible with current SQLite schema (`chats`, `drafts`).
- Avoid logging secrets (API key must never be persisted to logs).

## Non-goals (Alpha)
- Multi-device sync.
- Full conversation/thread management UI.
- RAG / "Ask the book".
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

Session strategy (Alpha):
- `session_id = book:{bookId}` when a book is active.
- `session_id = global` when no book is active.

### `drafts` (SQLite)
Schema (already migrated in Rust):
- `id` TEXT PK
- `editor_doc` TEXT (TipTap JSON string)
- `updated_at` INTEGER (ms since epoch)

Draft ID strategy (current):
- Writer drafts are project-scoped:
  - `id = project:{projectId}` for a real project.
  - `id = project:global` when no project is active (fallback).
- Legacy note: older builds used `id = book:{bookId}`; this is no longer the primary Writer scope.

### Web fallback storage
When not in Tauri (web dev), persistence uses `localStorage`:
- `ai-readwrite-flow-chat:{sessionId}` -> array of chat messages
- `ai-readwrite-flow-draft:{draftId}` -> draft JSON

All reads from storage are treated as untrusted and must be validated (Zod).

## Behaviors

### Chat
- On entering a session: load existing messages ordered by `created_at`.
- Sending a message: append `user`, then append `assistant` on success; persist both.
- Clear: deletes persisted messages for current session and clears UI.
- Session switch (book changes): swap to the new `session_id` history.

### Drafts
- On entering a draft scope: load `editor_doc` if present and set editor content.
- On edit: persist with debounce (e.g., 500ms) to avoid excessive writes.
- Switching projects: flush pending save for previous draft, then load next.

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
- Per-project draft:
  1) Create/select Project A, type "A"
  2) Create/select Project B, type "B"
  3) Switch back: Project A shows "A" Project B shows "B"
- Book switching does not affect Writer:
  1) With a Writer project open and unsent edits present, switch Reader books.
  2) Writer content stays unchanged.

## Risks & Mitigations
- TipTap JSON shape changes: validate minimally (`type: 'doc'`) and store as-is.
- DB write frequency: debounce draft saves; cap chat history; batch insert optional later.
- Session semantics: current session mapping may change when we introduce explicit "conversations" keep `session_id` string strategy so we can migrate later.

---

# SRS - Writer (Editor) Requirements (Deferred until Reader complete)

## Status
- Phase: Deferred (implement after Reader completion: `docs/TASKS.md` Task 29).
- Reason: Writer needs a cohesive workflow spec and stable data model before building UI.
- Phone scope note: Writer remains available on phone; Reader/Library are disabled; chat is opened via an overlay action; Settings uses a compact icon entry.

## Core UX Model (agreed)
Writer is organized around a Writing Project, with a workspace split into:
- Content (top): the main writing area (plain text; Markdown syntax allowed).
- Context (bottom): an editable plain-text block used alongside Content for LLM interactions; supports external paste.
- Action row (middle): actions TBD (e.g., AI transforms, export, templates).

Left side navigation:
- Top: project list.
- Bottom: current project's References list.

Right side:
- Optional collapsible multi-round LLM chat panel.
- Desktop-only layout controls (Task 35): Editor/Writer AI split ratio is user-adjustable (default 65/35, min widths 520/320), and spacing density supports Comfortable/Compact to reduce wasted space. Writer-only first; migrate later if proven.
- Task 35 UI polish (Writer-only):
  - Middle column uses two sibling cards: Content (top) + Context (bottom) with default height ratio 65/35 (reduces nested-card feel).
  - Right column uses two sibling cards: Studio (top, default collapsed to title bar) + Chat (bottom); Hide chat fully reclaims space and exposes a right-edge show handle.
  - Artifacts list is compact (single-line items; preview collapsible per item).

## Definitions
- Project: unit of work; everything in Writer is scoped to a project.
- Reference: a "reference card" representing a snippet + metadata; can be sourced from Reader highlights or created manually.
- Context membership: per reference include/exclude toggle controlling whether it participates in Context (and in what order).
- Active project: the project currently receiving edits and Reader-to-Writer additions; must be visible in Writer.

## Requirements by Priority
### P0 - Usable Writing (no data loss)
1) Large editing area
- Comfortable long-form writing surface.
- Writer must be usable without selecting a PDF (Reader must not drive Writer state).

2) Persist last edits (local-first)
- Restore after refresh/restart/crash.
- Debounced writes; flush on project switch and app close.

3) Projects + titles
- Maintain a list of projects.
- Default title rule: first line of Content is the title (editable).
- Optional: "pin title" to stop auto-title changes (P1 if needed).

4) Context block
- Editable plain text, supports paste.
- Supports Clear and Undo last append.
- Shows context size (P0: char count + item count; P1: token estimate).

5) References (cards)
- Each project has a list of reference cards.
- References can be created from Reader highlights and manually.
- Clicking a reference navigates back to Reader location when the source is a PDF highlight.

6) Include/exclude references into Context
- Each reference has a toggle (checkbox/switch) to include in Context.
- Context composition is deterministic: stable ordering and predictable updates.

### P1 - AI-Assisted Writing
7) AI actions on highlighted text (Writer)
- Select text in Content -> actions (e.g., Simplify, Concise, Rewrite, Translate, Explain).
- Non-destructive by default: preview/insert at cursor; undo works.
- UX polish (Task 39): after applying a suggestion (Replace/Insert), the newly inserted text briefly flash-highlights (theme-aware) and clears on next user input or after 7s. This highlight is non-persistent and must not affect undo history.

7.2) Writer templates management (Settings) (18-QA-029)
- Writer selection actions use a safe default template registry; templates are end-user editable via Settings.
- `Use defaults`:
  - When on, Writer selection actions must use built-in defaults immediately (ignore overrides).
  - Overrides may still be edited/saved but must not affect runtime until `Use defaults` is turned off.
- Reset safety:
  - `Reset` restores a single template override back to default.
  - `Reset all` clears all overrides.

7.3) Rewrite tone profiles (Settings) (18-QA-032)
- Rewrite tone is driven by per-tone profiles with `directive`, `description`, and optional `examples`.
- The base Rewrite template remains a single template (`writer-rewrite`) and tone profiles are applied as extra prompt directives.
- Examples are limited to 3 lines, 60 words per example (validation blocks Save when exceeded).
- Future requirement (Option B): allow separate per-tone rewrite templates if tone profiles are insufficient.
- Tone profile overrides follow the same recovery semantics:
  - `Use defaults` ignores tone profile overrides immediately.
  - `Reset` restores one tone profile to default.
  - `Reset all tones` clears tone profile overrides.

7.4) Writer global search (18-QA-033)
- Provide a Writer search modal with a query input and filters for Content, Context, References, Chat, and Studio.
- Results are clickable and jump to the matching area (editor selection, context focus, or card scroll).
- Follow-up UX polish (low priority): inline match highlight with next/prev navigation, keyboard shortcuts, and a scope toggle (current project vs all projects).

7.1) Writer Studio - Artifacts (writing-first, safe insert)
- Goal: generate reusable writing blocks (artifacts) that are stored first, then optionally inserted into Content/Context/References.
- Default safety rule (agreed): never auto-modify Content; generation must create an Artifact first; user clicks Insert to apply.
- Citation constraint (agreed): On by default. When there are included references, outputs must be grounded in those snippets and avoid inventing unsupported claims.

Artifact types (v1, writing-first)
- Kickoff: opening paragraph + thesis framing + 2-3 paragraph plan (prose-ready).
- Definition: define a term (1-2 sentences) + key attributes + optional example.
- Explanation: explain with configurable depth (peer/simple/analogy); prose-ready.
- Rewrite (style): generate 2-3 candidate rewrites in requested style (e.g., academic/concise/policy memo).
- Polish: grammar/clarity/flow improvements (suggested revision; do not overwrite automatically).
- (Later) Claim -> Evidence map: structure a claim with evidence bullets tied to references.

Scopes (inputs)
- Context: uses Writer Context text.
- Included references: uses reference snippets where included=true (preferred when available).
- Content selection (Task 18.13): selecting text in Writer Content enables selection actions (Simplify/Concise/Rewrite[tone]/Translate/Explain + Ask AI). Ask AI is draft-only; other actions auto-send and return applyable suggestion cards (replace/insert/copy) with clean Undo.
- Manual: user-provided input text (paste).

Result handling
- Each generation produces an Artifact record bound to the active project.
- Artifact actions:
  - Insert to Content (append by default; later allow cursor/selection targets).
  - Append to Context (must enable Undo append).
  - Save as Reference (creates a manual reference card from the artifact output; default included=false).
  - Regenerate (creates a new artifact version or overwrites; decide per implementation).

Prompt quality (agreed)
- Use medium-complexity prompts to control format and reduce hallucinations; iterate later.
- Each template must specify: required structure, tone, and how references are injected and cited.

8) Writer chat (collapsible, multi-round)
- Dedicated assistant panel that is independent from Reader's per-book chat by default.
- Optional opt-in: "link to current book" to include Reader book context (future).
- Supports prompt presets/templates (define list + editing UX later).

9) Markdown preview toggle
- Content accepts Markdown syntax.
- P1 provides Edit/Preview toggle (preview is read-only render; editing remains plain text).

### P2 - Integrations & Personalization
10) Flomo export
- Export selected text or whole project via Flomo API.
- Clear user feedback; retries and error handling.

11) Synonyms & translation
- Quick actions for synonyms and translation (remote LLM first; local model optional later).

12) Personalization ("can my writing be learned?")
- Must be local-first and privacy-preserving by default (explicit opt-in).
- Acceptable definitions:
  - Local "style profile" prompts derived from the user's writing.
  - Local retrieval over drafts (embeddings) for suggestions.
- Not in scope by default: server-side training on user content.

## Data Contracts (proposed)
These are storage-level contracts; UI can evolve without changing their meaning.

### Tables (SQLite)
- writing_projects: id, title, created_at, updated_at
- writing_contents: project_id (PK/FK), content_text, updated_at
- writing_contexts: project_id (PK/FK), context_text, updated_at
- writing_references:
  - id, project_id (FK), source_type ('highlight' | 'manual' | 'file')
  - book_id?, page_index?, rects_json? (normalized)
  - title?, author?, snippet_text, created_at
- writing_context_membership:
  - project_id, reference_id, included (0/1), order_index

### Types (conceptual)
- WritingProject { id, title, createdAt, updatedAt }
- WritingContent { projectId, contentText, updatedAt }
- WritingContext { projectId, contextText, updatedAt }
- WritingReference { id, projectId, sourceType, source?, title?, author?, snippetText, createdAt }
- WritingContextMembership { projectId, referenceId, included, orderIndex }

### Tags (in-editor)
- Parse Content text for tokens matching #tag or #tag/subtag and attach to the project (indexing/filtering can be P1).
- Define exclusions later (e.g., code blocks) once Markdown preview exists.

## Reader -> Writer Integration (requirements)
- From a Reader highlight:
  - Add to writing context: append snippet to active project Context; show toast ("Added to Context" with Undo).
  - Add to [project name] (reference): create a reference card with book/page/rects/snippet; default included=false.
- If there is no active project, prompt the user to choose/create a project. Never silently write into an unknown target.
- Reader actions must not switch tabs or disrupt the current Reader flow.

## Acceptance Tests (Manual)
1) Create project A -> type Content -> restart -> Content restores.
2) Content first line becomes title; edit first line -> title updates.
3) Paste text into Context; Clear removes; Undo restores last append.
4) Add manual Reference -> appears in list; toggle include -> Context composition changes deterministically.
5) In Reader, highlight -> "Add to writing context" -> Writer Context contains appended snippet (no tab switch).
6) In Reader, highlight -> "Add to [project] (reference)" -> Reference card created and can jump back to the same location.
7) Writer chat: switch PDFs in Reader -> Writer chat does not change.
8) Markdown preview toggle: switch to Preview -> formatting renders; switch back -> text unchanged.
9) Flomo export: success shows confirmation; failure shows retry.
10) Studio artifacts: generate a Kickoff/Definition/Explanation artifact using Context + included references; verify it is stored; click Insert to Content; verify Content changes; save as Reference and verify a new manual reference appears.

## Risks & Mitigations
- R-W-001 (Scope creep): enforce phased delivery (P0/P1/P2) and keep prompt/template work separate.
- R-W-002 (Coupling): Writer state must not follow Reader selection; explicit active project and optional linking.
- R-W-003 (Context bloat): show size, default included=false for new references, provide Clear/Undo and per-ref toggles.
- R-W-004 (Locator drift): PDF locators can shift across render modes; use stable page_index + rects (already used by highlights).
- R-W-005 (Markdown expectations): start with plain text + preview; avoid WYSIWYG promises until validated.
- R-W-006 (Personalization privacy): default off; clear settings; no server-side training by default.
- R-W-007 (Artifacts quality): outputs can drift without grounding; default citation constraint On; show which refs were used; keep safe insert (no auto-overwrite).

---

# Risk Register

This file tracks cross-cutting risks (not tied to a single feature doc). Each feature SRS should also include a local "Risks & Mitigations" section.

| ID | Area | Risk | Impact | Likelihood | Mitigation | Status |
| -- | ---- | ---- | ------ | ---------- | ---------- | ------ |
| R-001 | Reader/Highlights | PDF text layer geometry causes selection rect overlap and highlight drift (incl. layout toggle shifts) | High | High | Store multi-rect (client rects), normalize to stable page host sized to the page, clamp/clip, add merge rules; accept native selection overlap limits | Open |
| R-002 | Reader/Highlights | Repeated highlights stack darker and exceed glyph bounds | Medium | High | Merge overlapping rects or cap alpha; vertical clamp between lines | Open |
| R-003 | Persistence | Schema drift between PRD/TASKS/implementation | High | Medium | Keep TASKS status in sync; add decision log for schema changes | Open |
| R-004 | Web vs Desktop | Desktop-imported native paths cannot be loaded on web | Medium | High | Keep explicit separation: web stores data URLs; hide desktop-only items on web | Mitigated |
| R-005 | Performance | Large PDFs/highlight counts cause scroll jank | High | Medium | Only render highlights for mounted pages; virtualization when >100 items | Open |
| R-006 | Tooling | PowerShell execution policy blocks `npm.ps1` | Medium | Medium | Use `cmd /c npm ...` or adjust policy; document in instructions | Mitigated |
| R-007 | Library Management | Destructive deletion can remove user files unexpectedly (wrong bookId, confusion between remove vs delete) | High | Medium | Separate actions: remove DB-only by default; destructive delete is desktop-only with double-confirm + clear warning; add undo window if feasible | Open |
| R-008 | Layout / UX | User-adjustable Writer split or density can create an unusable layout (too small Chat/Editor, confusing locked state) | Medium | Medium | Enforce minimum widths, provide Reset to defaults, and keep adjustments in an explicit `Layout` mode | Open |
| R-009 | Layout / UX | User-adjustable sidebar widths can create unusable layouts or hide key controls | Medium | Medium | Enforce min/max, provide Reset to defaults, and keep changes discoverable with a clear handle; avoid mobile impact | Open |
