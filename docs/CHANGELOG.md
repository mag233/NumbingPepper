# Changelog

## Unreleased
- Added SQLite migrations for books/highlights/chats/drafts/FTS; Tauri import command copies to per-book folders with hash/mtime/size metadata.
- Library store hydrates from DB, dedupes by hash, persists `last_read_position` (page+scroll+zoom+fit_mode), and uses base64/asset loading in app.
- Web imports store data URLs to survive refresh; web hides desktop-only entries to avoid broken previews and guides users to re-import on web.
- Reader: improved highlight geometry by merging selection fragments per line; merge overlapping highlights to avoid dark stacking.
- Highlights: click-to-select via hit-testing and a popover for recolor/delete/note/Ask AI/Summarize/Explain/Questions; added save feedback + delete confirm.
- Reader: anchored highlight overlays to a page-sized host so layout toggles (Show/Hide navigation) don’t shift highlights.
- Reader: continuous scroll uses progressive page rendering to reduce jank on large PDFs.
- Reader: zoom (buttons + Ctrl/⌘ shortcuts), fit modes (manual/fit width/fit page), and copy selection with newline cleanup.
- Reader: added Find-in-document (paged-mode search with next/prev and in-page highlighting).
- Reader: Find highlight now tracks an “active” hit (blue outline) and retries longer until the text layer is measurable to reduce “no highlight on first jump”.
- Known: multi-column PDFs can still produce gutter-bridging highlight rects; tracked as a non-blocker in `docs/QA.md`.
- Chat: persist messages per book session (`session_id=book:{bookId}`) with localStorage fallback for web dev.
- Writer: persist TipTap draft per book (`drafts.id=book:{bookId}`) with debounce + flush on book switch; localStorage fallback for web dev.
- Logging: added local-only event logging with secret redaction and 7-day retention; stores to localStorage and to a `app_logs` SQLite table (created if missing).
- Docs: expanded Writer requirements in `docs/PRD.md`, added `docs/writer-srs.md`, and added Task 18 breakdown in `docs/TASKS.md` (Writer deferred until Task 29 complete).
- Reader/Chat: added per-panel error boundaries with a “Reload panel” recovery action (Task 29.1).
- Reader: show PDF outline/TOC (if present) in the left nav for quick page jumps (Task 29.4).
- Library: hash-based de-duplication on import (no extra copy), recent-open tracking, and safe deletion actions (remove vs delete local file) (Task 19).
- Library: added Trash/Restore (soft delete) to avoid “removed but app copy still exists” confusion; destructive delete now labeled as deleting the app copy (Task 19.6).
- Library: constrain library list height with scrolling; add selection-for-actions without switching the current preview (explicit Open to switch) (Task 19.7).
