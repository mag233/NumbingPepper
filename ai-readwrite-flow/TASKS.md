# Project Tasks / Plan / Progress

## Current Focus
- Deliver Alpha must-haves per PRD: settings save/test; persistent library import; open PDFs with last-read restore; floating menu actions; buffered chat with retry/metrics; highlight persistence/overlay; drafts/chats persisted; theme presets; mobile tabs + desktop split; error boundaries.

## Task Board (numbered; status / priority / risk)
| #  | Status       | Priority | Task                                                                                                        | Risk / Notes |
| -- | ------------ | -------- | ----------------------------------------------------------------------------------------------------------- | ------------ |
| 1  | Done         | P0       | Bootstrap Tauri v2 + React + TS + Tailwind workspace with required deps (zustand, plugin-sql).              | Low |
| 2  | Done         | P0       | Register tauri-plugin-sql with settings migration; add settings persistence with SQLite/store fallback.    | Low |
| 3  | Done         | P1       | Implement mobile-first layout with tabs and desktop split view.                                             | Low |
| 4  | Done         | P2       | Desktop layout refinements: top bar + nav collapsible, Reader width 60-65%, Writer/Chat stack.             | Low |
| 5  | Done         | P2       | Reader UX: wheel-scoped navigation; continuous scroll toggle; prevent page scroll bleed.                    | Low |
| 6  | Done         | P2       | Collapsible UI: top settings bar and left nav toggle on desktop.                                            | Low |
| 7  | Done         | P1       | Wire real AI calls using saved API key/base/model (ChatSidebar).                                            | Medium — streaming deferred. |
| 8  | Todo         | P0       | Define and migrate SQLite schemas for settings/books/highlights/chats/drafts/book_text_index.              | High — schema impacts persistence and RAG. |
| 9  | Todo         | P0       | Implement file copy into `$APP_DATA/library`, persist metadata (hash/size/mtime) in SQLite, hydrate on load.| Medium — OS path handling and partial copy cleanup. |
| 10 | In Progress  | P1       | Add PDF pagination polish and accurate text selection bounding for floating menu.                           | Medium — PDF coords across zoom/scroll. |
| 11 | Todo         | P0       | Save/restore last_read_position (page/scroll/zoom) per book.                                               | Medium — needs reliable viewport capture. |
| 12 | Todo         | P0       | Persist highlights with normalized coordinates; render overlays on reopen; allow delete/edit note.          | Medium — coordinate math and overlay UX. |
| 13 | Todo         | P0       | Persist chat history and writer drafts; add basic telemetry/logging (local-only).                           | Medium — shapes must align with future linking. |
| 14 | Todo         | P0       | Add error boundaries for Reader/Editor/Chat with reload affordance.                                         | Low |
| 15 | Todo         | P1       | Add smoke tests (stores/hooks/api client, Rust import command tests); mock Tauri plugins.                   | Medium — harness setup needed. |
| 16 | Todo         | P1       | Performance guards: virtualization for large lists (>100), main-thread budget on import.                   | Medium — needs profiling and thresholds. |
| 17 | Todo         | P1       | Theme presets (light/ocean/forest/sand) with persistence and OS-pref initial detect.                       | Low |
| 18 | Todo         | P1       | Writer/Editor: persist drafts; `/` commands for highlight import and chat-selection (buffered insert).     | Medium — TipTap integration with storage. |
| 19 | Todo         | P1       | Library duplicate detection via hash; graceful collision handling and recent-open tracking.                | Low |
| 20 | Backlog      | P1       | RAG “Ask the book” global search using FTS; prompt with citations; fallback when empty/offline.            | High — requires extraction/indexing. |
| 21 | Backlog      | P1       | Extraction & indexing: Rust background text extraction, chunking, insert into FTS with progress.           | High — Rust worker and error reporting. |
| 22 | Backlog      | P1       | Gestures (mobile): swipe delete in Library; swipe back in Reader; consider desktop shortcuts later.         | Low |
| 23 | Backlog      | P1       | Flomo export from chat bubble with validation and markdown stripping.                                      | Low |
| 24 | Backlog      | P2       | Streaming chat responses and editor auto-insert sequencing.                                               | Medium |
| 25 | Backlog      | P2       | OCR for scanned PDFs via Rust/Tesseract; plain-text per page; optional FTS ingest.                         | Medium |
| 26 | Backlog      | P2       | EPUB support and multi-theme polish beyond presets.                                                       | Low |
| 27 | Backlog      | P2       | Security hardening: base_url allowlist/SSRF guard, future key encryption task.                            | Medium — track for later. |

## Progress Notes
- Core scaffolding and UI flows are in place; build succeeds (`npm run build`).
- Settings panel pre-fills defaults (`https://xiaoai.plus/v1`, `gpt-5-mini`); `/models` connectivity test implemented.
- Library/Reader/Writer/Chat surfaces implemented with mobile tabs and desktop split.
- Reader has page nav + continuous scroll toggle and floating menu; selection bounding accuracy/persistence still pending.
- ChatSidebar calls live API with loading/error/retry, auto-scrolls to latest, shows token/latency metrics, supports custom prompt templates.
- Library import is in-memory only; file copy + SQLite metadata persistence are not yet wired.
- Pending Alpha must-haves: schema/migrations, library persistence, last-read restore, highlight persistence, chat/draft persistence, theme presets, error boundaries, tests.
