# Project Tasks / Plan / Progress

## Current Focus
- Deliver Alpha must-haves per PRD: settings save/test; persistent library import; open PDFs with last-read restore; floating menu actions; buffered chat with retry/metrics; highlight persistence/overlay; drafts/chats persisted; theme presets; mobile tabs + desktop split; error boundaries.

## Task Board (numbered; status / priority / risk)
| #  | Status      | Priority | Task                                                                                                         | Risk / Notes |
| -- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------ | ----------- |
| 1  | Done        | P0       | Bootstrap Tauri v2 + React + TS + Tailwind workspace with required deps (zustand, plugin-sql).              | Low |
| 2  | Done        | P0       | Register tauri-plugin-sql with settings migration; add settings persistence with SQLite/store fallback.     | Low |
| 3  | Done        | P1       | Implement mobile-first layout with tabs and desktop split view.                                              | Low |
| 4  | Done        | P2       | Desktop layout refinements: top bar + nav collapsible, Reader width 60-65%, Writer/Chat stack.              | Low |
| 5  | Done        | P2       | Reader UX: wheel-scoped navigation; continuous scroll toggle; prevent page scroll bleed.                    | Low |
| 6  | Done        | P2       | Collapsible UI: top settings bar and left nav toggle on desktop.                                             | Low |
| 7  | Done        | P1       | Wire real AI calls using saved API key/base/model (ChatSidebar).                                             | Medium - streaming deferred. |
| 8  | Done        | P0       | Define and migrate SQLite schemas for settings/books/highlights/chats/drafts/book_text_index.               | High - schema impacts persistence and future RAG. |
| 9  | Done        | P0       | Implement file copy into `$APP_DATA/library`, persist metadata (hash/size/mtime) in SQLite, hydrate on load.| Medium - OS paths, permissions, partial copy cleanup. |
| 10 | Backlog     | P2       | Reader selection UX polish (reduce adjacent-line overlap; predictable menu bounds).                          | Low - non-blocker; some PDFs still overlap. |
| 11 | Done        | P0       | Save/restore `last_read_position` (page/scroll/zoom/fit_mode) per book.                                      | Medium - continuous vs paged restore details. |
| 12 | In Progress | P0       | Highlights: persistence + overlays + interactions (see breakdown below).                                     | Medium - geometry edge cases + perf. |
| 13 | In Progress | P0       | Persist chat history and writer drafts; add basic telemetry/logging (local-only).                            | Medium - 13-QA-001..002 pass; 13-QA-003 pending; 13-QA-004 N/A (Writer is project-scoped; see 18-QA-021/022). |
| 14 | Done        | P0       | Add error boundaries for Reader/Chat (and Writer later) with reload affordance.                              | Low |
| 15 | Todo        | P1       | Add smoke tests (stores/hooks/api client); mock Tauri plugins.                                               | Medium - harness setup needed. |
| 16 | Todo        | P1       | Performance guards: virtualization for large lists (>100), main-thread budget on import.                    | Medium - needs profiling and thresholds. |
| 17 | Done        | P1       | Theme presets (soft-dark/light/ocean/forest/sand) with persistence and OS-pref initial detect.              | Low - minor palette tweaks may still happen based on preference. |
| 18 | In Progress | P1       | Writer/Editor: entries+tags, AI actions, writer chat, markdown, Flomo export, personalization.              | High - scope creep; keep spec+acceptance gated (see Task 18 breakdown + `docs/writer-srs.md`). |
| 19 | In Progress | P1       | Library duplicate detection via hash; graceful collision handling and recent-open tracking.                 | Medium - needs QA for delete/dedupe/recents + new ergonomics. |
| 20 | Backlog     | P1       | RAG "Ask the book" global search using FTS; prompt with citations; fallback when empty/offline.             | High - requires extraction/indexing. |
| 21 | Backlog     | P1       | Extraction & indexing: Rust background text extraction, chunking, insert into FTS with progress.            | High - Rust worker and error reporting. |
| 22 | Backlog     | P1       | Gestures (mobile): swipe delete in Library; swipe back in Reader; consider desktop shortcuts later.         | Low |
| 23 | In Progress | P1       | Flomo export (core API + plain-text formatting first; UI/wiring later).                                      | Low |
| 24 | Backlog     | P2       | Streaming chat responses and editor auto-insert sequencing.                                                  | Medium |
| 25 | Backlog     | P2       | OCR for scanned PDFs via Rust/Tesseract; plain-text per page; optional FTS ingest.                          | Medium |
| 26 | Backlog     | P2       | EPUB support and multi-theme polish beyond presets.                                                          | Low |
| 27 | Backlog     | P2       | Security hardening: base_url allowlist/SSRF guard, future key encryption task.                               | Medium - track for later. |
| 28 | In Progress | P1       | Reader: PDF ergonomics (zoom/fit/copy/find/shortcuts) and UX polish.                                         | Low - 28.4 find deferred; 28.6 page labels queued. |
| 29 | In Progress | P0       | Reader hardening & completion (stability, TOC/outline, error boundaries, UX polish).                         | Medium - keep Reader-first; defer non-blockers. |
| 30 | Backlog     | P2       | Cache management: 512MB soft cap + LRU eviction for `$APP_DATA/cache` (never critical data).                | Low - prevents unbounded growth; housekeeping. |
| 31 | Backlog     | P2       | Library organization: tags/collections for PDFs (grouping + filters).                                        | Medium - requires new schema + UI; not Alpha-critical. |
| 32 | Done        | P2       | Code discipline compliance: add Zod validation for persisted JSON, split oversized modules, remove lint suppressions. | Low - refactor-only; behavior should remain stable. |
| 33 | Done        | P1       | Reader AI templates + Questions shortcut (selection + highlight popover).                                     | Low - QA 33-QA-001..004 pass. |
| 34 | In Progress | P1       | Desktop layout density: Settings drawer + left Library + bottom PDF toolbar (Reader/Writer share global settings). | Medium - layout refactor; must not break mobile or web/desktop separation. |
| 35 | Done        | P1       | Writer layout density: adjustable Editor↔Chat split + compact spacing (Writer-only).                          | Medium - user-adjustable layout needs min-width guards + reset; migrate to Reader later if proven. |
| 36 | Done        | P1       | Desktop sidebar resizing + nav toggle ergonomics.                                                             | Medium - resizable sidebar needs min/max + reset; avoid mobile impact and keep controls discoverable. |
| 37 | Done        | P1       | Global Layout toggle + per-view adjustments (Reader split + scope hint).                                      | Medium - desktop complete; mobile QA deferred. |

## Progress Notes
- Core scaffolding and UI flows are in place; build succeeds (`npm run build`).
- Library import persists to app data via Tauri (hash/mtime/size); web imports store data URLs to survive refresh; web hides desktop-only entries.
- Reader saves/restores `last_read_position` (page + scroll + zoom + fit mode); app/web PDF loading paths are separated.
- Task 13: chat history persists per book; draft persistence exists (Writer UX intentionally deferred).

## Task 12 Breakdown (Highlights) - Specification & Verifiable
| ID | Status | Priority | Sub-task | Spec (summary) | Verify (manual) | Tracking |
| -- | ------ | -------- | -------- | -------------- | --------------- | -------- |
| 12.1 | Done | P0 | Geometry correctness | Multi-rect; normalize to stable per-page host; clamp to bounds; prevent line overlap (vertical gap trimming); choose merge vs alpha-cap rule | Pass for new highlights; layout toggles don't shift persisted highlights | `docs/QA.md` |
| 12.2 | Done | P0 | Interaction model | Click-to-select single highlight; popover: recolor/delete/note/actions | Popover works; delete confirm; Ask AI focuses input | `docs/QA.md` |
| 12.3 | Done | P0 | Persistence & restore | Write-through create/edit/delete; hydrate by book; skip invalid rows | Restart/refresh restores; note persists | `docs/QA.md` |
| 12.4 | Backlog | P2 | Performance | Progressive rendering in continuous scroll; avoid heavy work on scroll | Verify smooth scroll on >=50 pages; no long UI freezes | `docs/QA.md` |
| 12.5 | Backlog | P2 | Multi-column gutter | Improve rect splitting so highlights spanning columns do not fill the gutter | Multi-column highlight should not bridge gutter | `docs/QA.md` (12-QA-009) |

## Task 10 Notes (Selection UX)
- 10.1 (P1): Investigate and mitigate selection "ghosting/double shading" and adjacent-line overlap during drag-select (web + app). Track via `docs/QA.md` (10-QA-001).

## Task 28 Breakdown (Reader PDF ergonomics)
| ID | Status | Priority | Sub-task | Spec (summary) | Verify (manual) | Tracking |
| -- | ------ | -------- | -------- | -------------- | --------------- | -------- |
| 28.1 | Done | P1 | Zoom controls | Zoom in/out/reset; persist per book session | Buttons + shortcuts work; no overlay drift | `docs/QA.md` |
| 28.2 | Done | P1 | Fit modes | Fit width / fit page toggles for paged mode | Fit page works (incl. from continuous via auto-switch) | `docs/QA.md` |
| 28.3 | Done | P1 | Copy selection | Copy selected text with user feedback | "Copied" feedback; soft line breaks cleaned | `docs/QA.md` |
| 28.4 | Backlog | P2 | Find-in-document | Search text with next/prev; highlight matches; stable active hit | Search count works; Next/Prev jump; active hit outlined and stable | `docs/QA.md` (28-QA-007..010) |
| 28.5 | Backlog | P2 | Page tools | Rotate page / download export current PDF | Actions work and don't break persistence |  |
| 28.6 | Done | P2 | Page labels | If PDF provides printed page labels (PageLabels), show them alongside physical page numbers and allow jump by label | Pass (`docs/QA.md` 28-QA-011) |  |

## Task 29 Breakdown (Reader hardening & completion - before returning to Writer)
| ID | Status | Priority | Item | Spec (summary) | Verify |
| -- | ------ | -------- | ---- | -------------- | ------ |
| 29.1 | Done | P0 | Error boundaries (Reader/Chat) | Failures show fallback + "Reload panel" without losing state | Pass (`docs/QA.md` 29-QA-001) |
| 29.2 | Done | P0 | Highlights correctness | New highlights accurate; persistence stable across zoom/layout; popover UX solid | Pass with known non-blockers tracked (`docs/QA.md` 12-QA-009, 10-QA-001) |
| 29.3 | Backlog | P2 | Find stability | No header jump; mostly stable highlight; known PDF outliers tracked | `docs/QA.md` (28-QA-007..010) |
| 29.4 | Done | P1 | TOC/outline | Parse PDF outline (if present) for quick jump | Pass (`docs/QA.md` 29-QA-002) |
| 29.5 | Done | P1 | Selection UX | Reduce adjacent-line selection overlap during drag-select via custom selection overlay; keep menu consistent | Pass (`docs/QA.md` 10-QA-002); remaining native overlap edge cases tracked under 10-QA-001 |

## Task 33 Breakdown (Reader AI templates + Questions shortcut)
Progress update (reported by user): 33-QA-001..004 pass.
| ID | Status | Priority | Sub-task | Spec (summary) | Verify |
| -- | ------ | -------- | -------- | -------------- | ------ |
| 33.1 | Done | P1 | Central template registry (Summarize/Explain/Ask AI/Questions) | Single source of truth; templates are end-user editable with `Use defaults` + per-template reset + reset-all overrides | Unit (Vitest): prompt building + action mapping |
| 33.2 | Done | P1 | Selection menu: Questions action | Action appears in floating menu; auto-sends; default output: 3–5 Q/A pairs covering terminology + logic flow + insight | Manual: selection → Questions → auto-send + focused input |
| 33.3 | Done | P1 | Highlight popover: Questions action | Popover includes Questions; reuses same template registry as selection menu | Manual: click highlight → popover → Questions |
| 33.4 | Done | P1 | UX polish | Single-line labels; tooltip “Generate Questions”; menu clamped to avoid being covered; mobile 375px checks | Manual: 375px + desktop split view |
| 33.5 | Done | P1 | Docs/QA | Add QA rows for Questions + templates UI + defaults fallback | `docs/QA.md` 33-QA-001..004 |

## Task 34 Breakdown (Desktop layout density + Settings drawer)
| ID | Status | Priority | Sub-task | Spec (summary) | Verify |
| -- | ------ | -------- | -------- | -------------- | ------ |
| 34.1 | Done | P1 | Docs: layout + settings IA | Define desktop three-panel layout, settings drawer sections (Global/Reader/Chat), and bottom PDF toolbar scope | PRD IDs present; TASKS breakdown present |
| 34.2 | Done | P1 | Settings drawer | Replace always-visible Settings panels with a top-right `⚙` drawer/modal; sections/tabs for Global / Reader templates / Chat templates | Manual: open from Reader + Writer; settings editable |
| 34.3 | Done | P1 | Left sidebar restructure | Left sidebar = Library (top) + TOC/Bookmarks/Highlights (bottom); independent scroll areas | Manual: scroll independence verified |
| 34.4 | Done | P1 | Bottom PDF toolbar | Page jump / find / zoom / fit controls in a compact always-visible bottom bar (desktop) | Manual: actions work; menus not obscured |
| 34.5 | Done | P1 | Writer top bar alignment | Writer view shows Writer-relevant state; shares Global settings; avoids Reader-only status noise | Manual: Writer header meaningful; settings entry consistent |
| 34.7 | Done | P1 | TOC collapse | Allow collapsing long TOC sections (per heading) to improve navigation on large outlines | Manual: collapse/expand works; jump still works |
| 34.6 | Todo | P1 | QA | Run 34-QA scenarios and record results | `docs/QA.md` 34-QA-001.. |

## Task 35 Breakdown (Writer layout density + adjustable split)
| ID | Status | Priority | Sub-task | Spec (summary) | Verify |
| -- | ------ | -------- | -------- | -------------- | ------ |
| 35.1 | Done | P1 | Docs: layout + density spec | Define Writer-only Layout adjust mode (lock/unlock), default Editor/Chat ratio 65/35, min widths 520/320, and density presets (Comfortable/Compact) scoped to Writer desktop | PRD IDs present; QA rows present |
| 35.2 | Done | P1 | Layout button | Add a top-right `Layout` control next to Settings (Writer desktop only); default Locked; Done returns to Locked | Manual: toggle visible only in Writer desktop; no effect in Reader/mobile |
| 35.3 | Done | P1 | Draggable splitter | Implement Editor↔Writer AI draggable boundary; enforce min widths; live resize feedback | Manual: drag resizes; cannot shrink below mins |
| 35.4 | Done | P1 | Persist + reset | Persist ratio + density locally; provide Reset to defaults; restore on relaunch | Manual: persists; reset restores 65/35 + Comfortable |
| 35.5 | Done | P1 | Density presets | Provide Comfortable/Compact density that reduces header/toolbars/panel gutters/card paddings (Writer-only) | Manual: visible reduction without breaking layout |
| 35.6 | Done | P1 | QA | Run 35-QA scenarios and record results | `docs/QA.md` 35-QA-001.. |
| 35.7 | Done | P2 | Writer middle column: 2-card split | Split middle column into two sibling cards: Content (top) and Context (bottom), default height ratio 65/35; reduce nested-card feel | Manual: Content/Context look like peers; no confusing nesting |
| 35.8 | Done | P2 | Writer right column: Studio + Chat cards | Split right column into two sibling cards: Studio (top) and Chat (bottom); Studio default collapsed showing only title bar | Manual: Studio no longer appears to “float over”/cover chat; Chat remains usable |
| 35.9 | Done | P2 | Artifacts list density | Render each artifact as a single-line list item with compact actions; preview is collapsible per item (default collapsed) | Manual: artifacts list no longer dominates vertical space |
| 35.10 | Done | P1 | Hide chat: reclaim space + show handle | Writer AI Hide fully removes chat column (Editor expands immediately); provide a comfortable “Show Writer AI” handle on the right edge | Manual: Hide expands editor; Show handle easy to discover; no layout jump |

## Task 36 Breakdown (Desktop sidebar resizing + nav toggle ergonomics)
| ID | Status | Priority | Sub-task | Spec (summary) | Verify |
| -- | ------ | -------- | -------- | -------------- | ------ |
| 36.1 | Todo | P1 | Docs: shell layout spec | Define desktop left sidebar resizable width (drag handle), min/max, persist + reset, and nav-toggle icon placement | PRD IDs present; QA rows present |
| 36.2 | In Progress | P1 | Sidebar splitter | Implement draggable splitter for left sidebar width (desktop only; gated by Writer Layout Adjust mode) | Manual: in Adjust mode drag works; in Locked mode disabled; width clamps |
| 36.3 | Done | P1 | Persist + reset | Persist sidebar width locally; add Reset to default width | Manual: persists across restart; reset restores |
| 36.4 | Done | P2 | Nav toggle ergonomics | Replace “Hide navigation” text button with a compact icon toggle in a consistent location | Manual: toggle still works; no duplicate controls |
| 36.5 | Done | P1 | QA | Run 36-QA scenarios and record results | `docs/QA.md` 36-QA-001.. |

## Task 37 Breakdown (Global Layout toggle + per-view adjustments)
| ID | Status | Priority | Sub-task | Spec (summary) | Verify |
| -- | ------ | -------- | -------- | -------------- | ------ |
| 37.1 | Done | P1 | Docs: PRD/QA/task breakdown | Define global Layout toggle, scope hint, per-view Reset semantics, Reader main split data contract + persistence shape | PRD ID added; `docs/QA.md` 37-QA rows added |
| 37.2 | Done | P1 | Global Layout toggle | Desktop header shows `Layout/Done` in Reader+Writer; Adjusting scope hint; no change on mobile | Manual: button visible on desktop both views; scope hint correct; mobile unchanged |
| 37.3 | Done | P1 | Reader main split | Reader supports adjusting Reader↔Chat width split (desktop only) gated by Layout Adjust mode; persist + clamp + Reset (Reader-only) | Manual: drag works; persists; reset only affects Reader |
| 37.4 | Done | P1 | Reset semantics | Reset affects only current view (Reader reset does not affect Writer; Writer reset does not affect Reader) | Manual: reset isolation verified |
| 37.5 | Done | P1 | Reader density + divider clarity | Reader adds Comfortable/Compact density in Layout Adjust (Reader-only; persisted+Zod; Reset Reader-only); locked mode dividers are non-draggable and split gutters are consistent | Manual: density affects Reader only; persists; Reset resets Reader density; locked mode dividers don't look draggable |

## Task 18 Breakdown (Writer - deferred until Task 29 complete)
| ID | Status | Priority | Sub-task | Spec (summary) | Verify |
| -- | ------ | -------- | -------- | -------------- | ------ |
| 18.1 | Done | P1 | Writer data model | Define Projects/Content/Context/References/ContextMembership tables + TS contracts + Zod validation | Unit: `writingRepo.test.ts` + `writingTypes.ts` Zod parsing; Desktop: migrations v10–v14 added |
| 18.2 | Done | P1 | Projects list + active project | Create/select/rename/delete project; persist active project; Writer no longer follows Reader book selection | Pass (`docs/QA.md` 18-QA-001) |
| 18.3 | Done | P1 | Content + Context persistence | Persist Content and Context per project; Context shows chars+~tokens, warns on soft token limit; supports Clear + Undo last append | Pass (`docs/QA.md` 18-QA-002, 18-QA-003) |
| 18.4 | Done | P1 | References + context inclusion | Reference cards (manual + from Reader); include/exclude toggle + stable order; click ref jumps to Reader | Pass (`docs/QA.md` 18-QA-004) |
| 18.5 | Done | P1 | Reader → Writer actions | From Reader selection menu or highlight popover: Add to context + Add to project(reference); if no active project prompt choose/create; no tab switch | Pass (`docs/QA.md` 18-QA-005); Partial (`docs/QA.md` 18-QA-006) |
| 18.6 | Done | P1 | Writer assistant chat | Collapsible multi-round writer chat; per-project history; decoupled from Reader by default; prompt templates can be inserted into input and focuses textarea (no auto-send) | Pass (`docs/QA.md` 18-QA-007, 18-QA-008) |
| 18.7 | Done | P1 | Tags extraction | Extract `#tag` and `#tag/subtag` from Content; filter projects by tag (prefix matches for nested) | Pass (`docs/QA.md` 18-QA-009) |
| 18.8 | Done | P2 | Markdown preview | Edit/Preview toggle (preview render is read-only) | Pass (`docs/QA.md` 18-QA-010) |
| 18.12 | Done | P1 | Writer sidebar layout | Writer view hides ReaderNav and uses WriterSidebar (Projects + References); set a sane default Content/Context ratio (or adjustable split) so context is not squeezed | Pass (`docs/QA.md` 18-QA-014) |
| 18.14 | Done | P1 | Projects picker UX | Projects menu closes via outside click/Esc/X; create project requires explicit Save/Cancel; rename supports Save/Cancel | Pass (`docs/QA.md` 18-QA-016) |
| 18.13 | In Progress | P1 | Content selection AI actions | Select text in Writer Content → action menu: Simplify/Concise/Rewrite (tone submenu)/Translate/Explain/Ask AI; auto-send except Ask AI; results appear as applyable suggestion cards in Writer chat (Replace/Insert/Copy) with an explicit Undo affordance (mobile-friendly) | Phase A verified (`docs/QA.md` 18-QA-023..025); remaining: apply Undo bar + verify (`docs/QA.md` 18-QA-026). |
| 18.15 | Done | P1 | Writer Studio artifacts | Kickoff/Definition/Explanation/Rewrite(style)/Polish generate saved artifacts first; Insert applies to Content; citation constraint On by default when refs available | Pass (`docs/QA.md` 18-QA-017). Includes “Recent 3 + All…” artifacts list to keep chat usable. |
| 18.16 | In Progress | P1 | Outline + reference preview | Outline derives from markdown headings in Content and supports click-to-jump; references support expand/collapse preview; sidebar width increased for readability | Manual (`docs/QA.md` 18-QA-019, 18-QA-020) |
| 18.17 | In Progress | P0 | Draft persistence hardening | Prevent empty overwrites during Writer mount/project switch (hydration gate); drafts should survive abrupt app restarts with write-through local fallback + flush-on-exit | Manual (`docs/QA.md` 18-QA-021, 18-QA-022) |
| 18.18 | Todo | P1 | Snapshots / History (manual) | Add manual snapshots for Writer Content (title+note+timestamp) with restore/duplicate; prevents autosave from overwriting “ideal” versions and provides safe rollbacks | Manual: create snapshot, restore snapshot, duplicate project |
| 18.9 | Backlog | P2 | Flomo export | Export entry/selection to Flomo with templates + retry + success/failure feedback | Manual: success + failure paths |
| 18.10 | Backlog | P2 | Synonyms/translation | Quick lookup via remote LLM first; local model optional later | Manual: action returns output |
| 18.11 | Backlog | P2 | Personalization | Define "learn my writing" as local-only style profile or local retrieval; default off | Manual: enable/disable and effect |

## Task 19 Breakdown (Library duplicate detection + recent-open tracking)
| ID | Status | Priority | Sub-task | Spec (summary) | Verify (manual) | Tracking |
| -- | ------ | -------- | -------- | -------------- | --------------- | -------- |
| 19.1 | Done | P1 | Canonical file identity | Canonical identity uses `file_hash` (sha256) primary; store `file_size` + `mtime` for diagnostics; hash computed consistently across platforms | Import same PDF twice shows "Already imported" | `docs/QA.md` (19-QA-001) |
| 19.2 | Done | P1 | Duplicate detection on import | On import: compute hash -> check existing by hash -> if found, do not copy again; restore from Trash if needed and select existing book | Import same file twice; library has one record | `docs/QA.md` (19-QA-002) |
| 19.3 | Done | P1 | Collision handling | Different PDFs with same filename must not overwrite; book storage remains scoped by `bookId` | Import two PDFs with same filename; both open correctly | `docs/QA.md` (19-QA-003) |
| 19.4 | Done | P1 | Recent-open tracking | Add `last_opened_at` to `books`; update on open; allow sorting by recent | Open A -> B -> A; recent order reflects opens | `docs/QA.md` (19-QA-004) |
| 19.5 | Done | P1 | Tests | Unit tests cover hash match, "already imported" selection, and recent-open update; mock web/app differences | `npm test` passes | Vitest |
| 19.6 | Done | P1 | Trash + restore + delete app copy | Replace hard remove with Trash (soft delete) + Restore; destructive "Delete app copy" is desktop-only and double-confirm | Move to Trash, restore, delete app copy behave as expected | `docs/QA.md` (19-QA-005..006) |
| 19.7 | Done | P2 | Library list ergonomics | Keep the list in a fixed-height scroll area (so the panel doesn't grow); add selection-for-actions without switching preview; add explicit Open to switch preview | Pass (`docs/QA.md` 19-QA-007) |  |

### Mapping / Tracking Rules (Highlights)
- Authoritative spec: `docs/reader-highlighting-srs.md`
- Cross-cutting risks: `docs/RISKS.md`
- Record notable behavior changes: `docs/CHANGELOG.md`

## Backlog (New Proposals)
1. Context-aware LLM function: automatically take context from the reader.
2. Multi-round chat / chat history.
3. Support for screenshots/figures/pictures.
4. Book-level RAG (optional, local-first) when ready.
