# AI ReadWrite Flow

Local-first workspace for reading PDFs and turning highlights into writing with AI. Built with Tauri, React, and Vite.

100% built with AI assistance (Codex + GPT-5.1).

## Features
- PDF reader with highlights, notes, bookmarks, and last-read restore.
- Floating selection actions: summarize, explain, ask AI, and questions.
- Writer workspace with projects, context, references, and AI-assisted actions.
- Local persistence (SQLite/store) and offline-friendly drafts.
- Theme presets and desktop/phone layouts.

## Screenshots
![Reader view](docs/screenshots/reader.png)
![Writer workspace](docs/screenshots/writer.png)
![Highlights and chat](docs/screenshots/highlights-chat.png)

## Getting Started
Requirements:
- Node.js 20+
- Rust toolchain (for Tauri desktop builds)

Install dependencies:
```bash
cd ai-readwrite-flow
npm install
```

Run the web app:
```bash
npm run dev
```

Run the desktop app:
```bash
npm run tauri:dev
```

## Configuration
Copy the example env file and fill in your values:
```bash
cd ai-readwrite-flow
copy .env.example .env
```

Notes:
- `OPENAI_API_KEY` is required for AI features.
- `VITE_` variables are embedded in client bundles; avoid putting secrets there for web builds.

## Docs
- Product and specs: `docs/PRD.md`, `docs/SRS.md`, `docs/writer-srs.md`
- QA and tasks: `docs/QA.md`, `docs/TASKS.md`, `docs/Backlogs.md`
- Maintenance: `docs/MAINTENANCE.md`
