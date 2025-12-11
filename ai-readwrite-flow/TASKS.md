# Project Tasks / Plan / Progress

## Current Focus
- Deliver AI-ReadWrite-Flow MVP per PRD: settings (API key/model), library import, reader selection -> floating AI menu, writer "/" commands, chat sidebar.

## Task Board
- [x] Bootstrap Tauri v2 + React + TS + Tailwind workspace with required deps (zustand, plugin-sql, lucide-react, react-pdf, TipTap).
- [x] Register tauri-plugin-sql with settings migration; add settings persistence (SQLite fallback to localStorage).
- [x] Implement mobile-first layout with tabs (Library/Reader/Writer/Chat) and desktop split view.
- [x] Wire real AI calls using saved API key/base/model (replace mock in ChatSidebar).
- [ ] Implement file copy into `$APP_DATA/library` via Tauri command and persist library metadata.
- [ ] Add PDF pagination and accurate text selection bounding for floating menu (basic pagination exists; precision/persistence pending).
- [ ] Persist chat history and writer drafts; add basic telemetry/logging for errors.
- [ ] Add smoke tests (frontend unit for stores/hooks, Rust command tests where applicable).
- [x] Desktop layout: top bar (AI config + Library import), left nav (page jump/bookmarks placeholder), center Reader at 60-65% width, right Writer + Chat stack; container widened to screen-2xl.
- [x] Reader UX: wheel-based navigation scoped to PDF; allow continuous scroll mode toggle; ensure Reader scroll does not move the whole page.
- [x] Collapsible UI: top settings bar and left nav can be hidden on desktop to maximize Reader.

## Progress Notes
- Core scaffolding and UI flows are in place; build succeeds (`npm run build`).
- Settings panel pre-fills PRD defaults (`https://xiaoai.plus/v1`, `gpt-5-mini`); `/models` connectivity test implemented.
- Library/Reader/Writer/Chat surfaces implemented with mobile tabs and desktop split.
- Reader has page nav + continuous scroll toggle and floating menu; selection bounding accuracy/persistence still pending.
- ChatSidebar now calls live API with loading/error/retry and supports custom prompt templates.
- Pending: file storage to app data, persistence of chats/drafts, pagination accuracy, and tests.
