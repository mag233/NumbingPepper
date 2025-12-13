# Changelog

## Unreleased
- Added SQLite migrations for books/highlights/chats/drafts/FTS; Tauri import command now copies to per-book folders with hash/mtime/size metadata.
- Library store hydrates from DB, dedupes by hash, persists last_read_position (page+scroll), and uses base64/asset loading in app.
- Web imports store data URLs to survive refresh; web hides desktop-only entries to avoid broken previews and guides users to re-import on web.
- Reader saves/restores position and handles PDF loading with app/web paths and clearer errors.
- App imports/preview fixed; web import/preview works when files are imported via web; desktop imports remain desktop-only.
