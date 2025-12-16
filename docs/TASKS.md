# Project Tasks / Plan / Progress

## Current Focus
- Deliver Alpha must-haves per PRD: settings save/test; persistent library import; open PDFs with last-read restore; floating menu actions; buffered chat with retry/metrics; highlight persistence/overlay; drafts/chats persisted; theme presets; mobile tabs + desktop split; error boundaries.

## Task Board (numbered; status / priority / risk)
| #  | Status      | Priority | Task                                                                                                         | Risk / Notes |
| -- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------ | ----------- |
| 1  | Done        | P0       | Bootstrap Tauri v2 + React + TS + Tailwind workspace with required deps (zustand, plugin-sql).              | Low |
| 2  | Done        | P0       | Register tauri-plugin-sql with settings migration; add settings persistence with SQLite/store fallback.     | Low |
| 3  | Done        | P1       | Implement mobile-first layout with tabs and desktop split view.                                              | Low |
| 4  | Done        | P2       | Desktop layout refinements: top bar + nav collapsible, Reader width 60–65%, Writer/Chat stack.              | Low |
| 5  | Done        | P2       | Reader UX: wheel-scoped navigation; continuous scroll toggle; prevent page scroll bleed.                    | Low |
| 6  | Done        | P2       | Collapsible UI: top settings bar and left nav toggle on desktop.                                             | Low |
| 7  | Done        | P1       | Wire real AI calls using saved API key/base/model (ChatSidebar).                                             | Medium — streaming deferred. |
| 8  | Done        | P0       | Define and migrate SQLite schemas for settings/books/highlights/chats/drafts/book_text_index.               | High — schema impacts persistence and future RAG. |
| 9  | Done        | P0       | Implement file copy into `$APP_DATA/library`, persist metadata (hash/size/mtime) in SQLite, hydrate on load.| Medium — OS paths, permissions, partial copy cleanup. |
| 10 | In Progress | P1       | Add PDF pagination polish and accurate text selection bounding for floating menu.                            | Medium — PDF coords across zoom/scroll. |
| 11 | Done        | P0       | Save/restore `last_read_position` (page/scroll/zoom/fit_mode) per book.                                      | Medium — continuous vs paged restore details. |
| 12 | In Progress | P0       | Highlights: persistence + overlays + interactions (see breakdown below).                                     | Medium — geometry edge cases + perf. |
| 13 | Todo        | P0       | Persist chat history and writer drafts; add basic telemetry/logging (local-only).                            | Medium — shapes must align with future linking. |
| 14 | Todo        | P0       | Add error boundaries for Reader/Editor/Chat with reload affordance.                                          | Low |
| 15 | Todo        | P1       | Add smoke tests (stores/hooks/api client); mock Tauri plugins.                                               | Medium — harness setup needed. |
| 16 | Todo        | P1       | Performance guards: virtualization for large lists (>100), main-thread budget on import.                    | Medium — needs profiling and thresholds. |
| 17 | Todo        | P1       | Theme presets (light/ocean/forest/sand) with persistence and OS-pref initial detect.                        | Low |
| 18 | Todo        | P1       | Writer/Editor: persist drafts; `/` commands for highlight import and chat-selection (buffered insert).      | Medium — editor integration with storage. |
| 19 | Todo        | P1       | Library duplicate detection via hash; graceful collision handling and recent-open tracking.                 | Low |
| 20 | Backlog     | P1       | RAG “Ask the book” global search using FTS; prompt with citations; fallback when empty/offline.             | High — requires extraction/indexing. |
| 21 | Backlog     | P1       | Extraction & indexing: Rust background text extraction, chunking, insert into FTS with progress.            | High — Rust worker and error reporting. |
| 22 | Backlog     | P1       | Gestures (mobile): swipe delete in Library; swipe back in Reader; consider desktop shortcuts later.         | Low |
| 23 | Backlog     | P1       | Flomo export from chat bubble with validation and markdown stripping.                                        | Low |
| 24 | Backlog     | P2       | Streaming chat responses and editor auto-insert sequencing.                                                  | Medium |
| 25 | Backlog     | P2       | OCR for scanned PDFs via Rust/Tesseract; plain-text per page; optional FTS ingest.                          | Medium |
| 26 | Backlog     | P2       | EPUB support and multi-theme polish beyond presets.                                                          | Low |
| 27 | Backlog     | P2       | Security hardening: base_url allowlist/SSRF guard, future key encryption task.                               | Medium — track for later. |
| 28 | In Progress | P1       | Reader: PDF ergonomics (zoom/fit/copy/find/shortcuts) and UX polish.                                         | Medium — PDF.js constraints + UX expectations. |

## Progress Notes
- Core scaffolding and UI flows are in place; build succeeds (`npm run build`).
- Settings panel pre-fills defaults (`https://xiaoai.plus/v1`, `gpt-5-mini`); connectivity test implemented.
- Library import persists to app data via Tauri (hash/mtime/size); web imports store data URLs to survive refresh; web hides desktop-only entries.
- Reader saves/restores `last_read_position` (page + scroll + zoom + fit mode); app/web PDF loading paths are separated.
- Highlights: persistence, click-to-select, popover edit/delete/recolor/note, and highlight-linked AI actions are implemented; remaining work is geometry edge cases + polish.

## Task 12 Breakdown (Highlights) — Specification & Verifiable
| ID | Status | Priority | Sub-task | Spec (summary) | Verify (manual) | Tracking |
| -- | ------ | -------- | -------- | -------------- | --------------- | -------- |
| 12.1 | In Progress | P0 | Geometry correctness | Multi-rect; normalize to stable per-page host; clamp to bounds; prevent line overlap; choose merge vs alpha-cap rule | Pass for new highlights; verify layout toggles don’t shift persisted highlights | `docs/QA.md` |
| 12.2 | Done | P0 | Interaction model | Click-to-select single highlight; popover: recolor/delete/note/actions | Popover works; delete confirm; Ask AI focuses input | `docs/QA.md` |
| 12.3 | Done | P0 | Persistence & restore | Write-through create/edit/delete; hydrate by book; skip invalid rows | Restart/refresh restores; note persists | `docs/QA.md` |
| 12.4 | In Progress | P1 | Performance | Progressive rendering in continuous scroll; avoid heavy work on scroll | Verify smooth scroll on >=50 pages; no long UI freezes | `docs/QA.md` |

## Task 10 Notes (Selection UX)
- 10.1 (P1): Investigate and mitigate selection “ghosting/double shading” and adjacent-line overlap during drag-select (web + app). Track via `docs/QA.md` (10-QA-001).

## Task 28 Breakdown (Reader PDF ergonomics)
| ID | Status | Priority | Sub-task | Spec (summary) | Verify (manual) | Tracking |
| -- | ------ | -------- | -------- | -------------- | --------------- | -------- |
| 28.1 | Done | P1 | Zoom controls | Zoom in/out/reset; persist per book session | Buttons + shortcuts work; no overlay drift | `docs/QA.md` |
| 28.2 | Done | P1 | Fit modes | Fit width / fit page toggles for paged mode | Fit page works (incl. from continuous via auto-switch) | `docs/QA.md` |
| 28.3 | Done | P1 | Copy selection | Copy selected text with user feedback | “Copied” feedback; soft line breaks cleaned | `docs/QA.md` |
| 28.4 | In Progress | P1 | Find-in-document | Search text with next/prev; highlight matches; stable active hit | Search count works; Next/Prev jump; active hit outlined and stable | `docs/QA.md` (28-QA-007, 28-QA-008, 28-QA-009, 28-QA-010) |
| 28.5 | Backlog | P2 | Page tools | Rotate page / download export current PDF | Actions work and don’t break persistence |  |

### Mapping / Tracking Rules (Highlights)
- Authoritative spec: `docs/reader-highlighting-srs.md`
- Implementation checkpoints: `docs/TASKS.md` tables above
- Cross-cutting risks: `docs/RISKS.md`
- Record notable behavior changes: `docs/CHANGELOG.md`

## Backlog (New Proposals)
1. Context-aware LLM function: automatically take context from the reader.
2. Multi-round chat / chat history.
3. Support for screenshots/figures/pictures.
4. Book-level RAG (optional, local-first) when ready.
