# Privacy

AI ReadWrite Flow stores data locally by default.

## What is stored locally
- Settings, API keys, and preferences (SQLite or localStorage)
- Library metadata and highlights (SQLite)
- Drafts, writer content, and references (SQLite/localStorage)
- Local logs (if enabled)

## What is sent externally
- AI requests only when you configure a provider and trigger an action.
- Flomo requests only when you configure a webhook and send notes.

## Data deletion
You can delete app data by removing the app data directory and local storage.
