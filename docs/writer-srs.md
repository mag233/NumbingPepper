# SRS — Writer (Editor) Requirements (Deferred until Reader complete)

## Status
- **Phase:** Deferred (implement after Reader completion: `docs/TASKS.md` Task 29).
- **Reason:** Current project priority is Reader stability and core reading workflows; Writer needs a cohesive workflow spec before building UI/features.

## Goals (P0 “usable writing”)
1) **Large editing area**
- Comfortable long-form writing surface.
- Reading should not “drive” Writer UX (Writer should be usable without selecting a PDF).

2) **Persist last edit**
- Draft restores after refresh/restart/crash (local-first).
- Debounced writes; flush on scope switch.

3) **Entries + tags**
- Writer maintains a list of saved entries (“documents”).
- Default title rule: **first line is title** (editable).
- In-editor tags: `#tag` and `#tag/subtag` are auto-extracted and indexed.

## Goals (P1 “AI-assisted writing”)
4) **AI actions on highlighted text**
- Select text in editor → actions (e.g., Simplify, Concise, Rewrite, Translate, Explain).
- Actions must be non-destructive by default: preview/insert at cursor; undo works.

5) **Right-side AI chat**
- Writer has a dedicated assistant panel.
- Chat context rules are explicit (Writer chat must not follow Reader book selection unless user opts in).
- Shortcuts: TBD (define before implementation).

6) **Markdown support**
- Minimum: import/export Markdown for entries.
- Full markdown-native editing is optional; clarify fidelity expectations (TipTap ↔ Markdown round-trip can be lossy).

## Goals (P2 “integrations & personalization”)
7) **One-click export to Flomo**
- Export selected text or whole entry via Flomo API.
- Failure handling: retries and clear user feedback.

8) **Synonyms & translation**
- Quick actions for synonyms and translation.
- Support remote LLM first; local model optional later due to packaging/perf.

9) **Personalization (“can my writing be learned?”)**
- Must be local-first and privacy-preserving by default.
- Clarify definition before build:
  - Option A: “style profile” prompts derived from your writing.
  - Option B: local embeddings/RAG over your drafts for suggestions.
  - Not in scope: server-side training on user content by default.

## Data Contracts (proposed)
### Draft/Entry storage
Current DB table exists:
- `drafts`: `id`, `editor_doc` (TipTap JSON), `updated_at`.

To support “entries list” and tags, we will likely need an additional table (P1 for Writer):
- `draft_entries`: `id`, `title`, `editor_doc`, `tags_json`, `created_at`, `updated_at`.
- Or evolve `drafts` into “entries” with additional columns.

### Tag extraction
- Parse editor text for tokens matching:
  - `#tag`
  - `#tag/subtag` (multiple segments)
- Exclude tags inside code blocks if we support them (define later).

## Behaviors
- Switching between entries does not lose unsaved content.
- Title updates when first line changes (unless user “pins” a custom title).
- Tag list updates live as user types.
- AI actions:
  - Use selected text (required) + surrounding context (optional, bounded).
  - Result insertion: at cursor or replace selection (explicit user choice).

## Acceptance Tests (Manual)
1) Create entry, type content, restart → content restores.
2) First line becomes title; editing first line updates title; pin title prevents auto-update.
3) Add `#tag/subtag` in text → entry tag list shows it; search/filter by tag works.
4) Select text → click “Simplify” → output appears without destroying original; undo restores.
5) Writer chat does not change when switching PDFs (unless “link to reader” is enabled).
6) Export to Flomo returns success toast; failure shows retry.

## Risks & Mitigations
- **R-W-001 (Scope creep):** Writer features can balloon quickly → enforce phased delivery (P0/P1/P2).
- **R-W-002 (Coupling):** Writer chat tied to Reader selection confuses users → define independent session rules.
- **R-W-003 (Markdown fidelity):** TipTap ↔ Markdown may be lossy → set expectations; start with export/import.
- **R-W-004 (Personalization privacy):** “learning” must be explicit and local-first → default off, clear settings, no training by default.
