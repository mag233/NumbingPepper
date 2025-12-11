# Project Name: AI-ReadWrite-Flow (Alpha Phase)
# Version: 2.1.0 (MVP)

## 1. Project Vision
Local workspace where Reading (input) and Writing (output) happen side-by-side, glued by AI. Target runtime: Tauri v2 + React/TS. Platform focus is Desktop (Windows/Mac) first, but architecture must remain mobile-ready (iOS/Android).

## 2. Core User Stories & Interaction (with status)

### Story A: The Reader (Contextual AI) - status: UI done; data wiring pending
- Action: user selects text in a PDF; floating menu appears near the cursor with `[Summarize]`, `[Explain]`, `[Chat]`.
- Result: clicking `[Explain]` opens the right sidebar; AI explains the selected text.

### Story B: The Writer (AI Copilot) - status: TipTap + "/" menu done
- Action: user types `/` in the editor; dropdown shows AI commands (e.g., Fix Grammar, Continue Writing).
- Result: AI output is inserted into the editor at the cursor position.

### Story C: Setup (First Run) - status: UI + defaults done; real API call pending
- Action: user configures the AI model.
- Default config: API Base `https://xiaoai.plus/v1`, Model `gpt-5-mini`, Key entered by user.
- Connectivity test: test button calls `/models` and shows latency/result.

## 3. UI/UX Specifications (Mobile-First)

### 3.1 Layout System
- Desktop (>768px): Nav | Reader | Writer/Chat. Reader uses 60-65% of maximized window width; Nav is a narrow column (bookmarks/TOC/jump); Writer/Chat stacked on the right.
- Mobile (<768px): tab navigation `[Library | Reader | Editor | Chat]`.
- Implementation: use Tailwind responsive utilities or screen-width hooks for conditional rendering.
- Top bar: AI config and local resource import side-by-side; allow collapsing the top bar on desktop.
- Nav bar: left PDF nav (bookmarks/TOC/jump) is collapsible on desktop.

### 3.2 AI Sidebar
- Behavior: persistent chat interface (UI done).
- Context: automatically appends selected text to the prompt when active (wiring pending).
- Error/loading UX: show spinner and inline error when API fails; allow retry without losing draft.
- Layout: chat panel has its own scroll area; history and input roughly 2:1 height split; avoid unbounded panel growth.

## 4. Functional Modules (MVP)

### Module 1: Settings & System (Priority 0) - Status: Partial
- Storage: SQLite `settings` table with fallback to localStorage (done; tauri-plugin-sql + tauri-plugin-store configured).
- Connectivity: test button hits `/models` (implemented via fetch); save/hydrate flows work. Not yet wired into chat/completion pipeline.
- DX: `tauri:dev` / `tauri:build` scripts and strict TS (done).

### Module 2: Library (Priority 1) - Status: UI-only
- Drag & drop/import UI works and tracks files in memory.
- Copy to `$APP_DATA/library` via Tauri command and metadata persistence in SQLite are not implemented.
- Placement in top bar alongside AI config is done.

### Module 3: Reader (Priority 2) - Status: Partial
- `react-pdf` render works; floating menu on text selection is functional.
- Page nav + continuous scroll toggle exist; wheel is scoped when not in continuous mode.
- Precise selection bounding across pages/zoom, pagination polish, and persistence of position/highlights are not implemented.

### Module 4: Editor (Priority 2) - Status: Partial
- TipTap + "/" command menu work; commands insert prompt text and set quick prompt.
- Real AI insertion and draft persistence are not implemented.

### Module 5: AI Request Pipeline (Priority 0.5) - Status: Not started
- ChatSidebar still uses mock assistant replies; no streaming/buffering or error handling.
- Reader/Writer prompts are forwarded as quick prompts only; no real API calls beyond `/models` test.

## 5. Success Metrics (current status)
1. App launches and connects to SQLite. - Met (settings table migration + store fallback in place).
2. User can save API key and successfully ping the `gpt-5-mini` model (live call). - Partially met (testConnection hits `/models`; chat pipeline not using it).
3. PDF text selection triggers the floating menu correctly (basic success; precise coordinates/pagination pending). - Met at basic level.
4. Resizing to mobile width switches layout to tabs. - Met.
5. AI responses flow into ChatSidebar and optionally editor with error handling. - Not met (mock only, no error states).
6. Core flows remain stable under network failure and recovery. - Not evaluated; no error handling implemented for AI calls.

# Version: 3.0.0 (Full Scope / Alpha Phase)
- Context: MVP verified. Moving to persistence, lightweight RAG, and mobile polish.

## 1. Project Vision
- Persistence: every highlight, note, and chat history must be saved locally and restored on reopen.
- Depth: AI should understand the whole book, not only selected text (basic retrieval-augmented generation using local search).
- Mobile-native: interface feels native on touch screens (gestures, touch targets).
- Data foundation: use SQLite via `tauri-plugin-sql` for all persistent data and search.

## 2. Core User Stories & Interaction (with status)

### Story A: Study Session - status: design ready; build pending
- Open a book (e.g., The Great Gatsby); app restores position to the last page/scroll.
- User selects a paragraph; floating menu appears; user clicks "Save Highlight"; highlight turns yellow.
- User clicks the highlight -> menu appears -> clicks "Ask AI"; right sidebar opens with system prompt: "User is asking about this specific text: [Text]. Context: [Book Title]."

### Story B: Ask the Book (Global Search) - status: design ready; build pending
- User opens Chat Sidebar with no selection and types "Summarize the main conflict."
- System detects no selection, queries `book_text_index` (FTS) for relevant chunks, injects top 3 excerpts into the prompt, and AI responds with citations.

### Story C: Mobile Native Navigation - status: design ready; build pending
- Swipe left on a book in Library to delete; swipe right in Reader to go back.
- All tappable elements meet 44x44 px targets; chat/editor/reader remain usable on small screens.

## 3. UI/UX Specifications (Mobile + Desktop)

### 3.1 Layout & Navigation
- Annotation sidebar: highlights can be pinned as notes; clicking a highlight scrolls the Note/Chat panel to its entry.
- Reader shows highlight overlays at stored coordinates; reopening a book restores highlights and scroll/page.
- Left nav (bookmarks/TOC/jump) remains collapsible; top bar can collapse to maximize Reader.

### 3.2 Visuals, Accessibility, Gestures
- Themes: light/dark toggle using Tailwind `dark:` classes.
- Touch and gesture support: swipe left/right behaviors as above; ensure scroll areas remain independent (reader vs page).
- Responsiveness: maintain desktop split layout and mobile tabs; keep chat panel scrollable with a balanced history/input ratio.

### 3.3 Interaction Flows (reference)

#### Flow 1: The Study Session
- Open "The Great Gatsby.pdf"; app restores position to page 42.
- User selects a paragraph; floating menu appears; user clicks "Save Highlight"; highlight turns yellow.
- User clicks the highlight -> menu appears -> clicks "Ask AI"; right sidebar opens with the system prompt above.

#### Flow 2: The Ask Book (Global Search)
- User opens Chat Sidebar with no text selected and types a question (e.g., "Summarize the main conflict.").
- System detects no selection, queries `book_text_index` for "conflict," and injects top excerpts into the prompt.
- AI responds with citations.

## 4. Functional Modules (Full Scope)

### Module 0: Data & Schema (Priority 0) - Status: Not started
- Use SQLite via `tauri-plugin-sql` for all persistence.
- Tables:
  - `books`: id (UUID), title, author, cover_path, file_path, format ('pdf'|'epub'), last_read_position (JSON `{ page, scroll_y }` or CFI), processed_for_search (boolean).
  - `highlights`: id (UUID), book_id (FK), content, context_range (JSON: coordinates/locator), color ('yellow'|'red'|'blue'), note (nullable), created_at.
  - `chats`: id (UUID), session_id, role ('user'|'assistant'), content, reference_highlight_id (FK, nullable).
  - `book_text_index` (FTS5): stores extracted text chunks for retrieval.

### Module A: Advanced Reader (Persistence) - Priority 1 - Status: Not started
- Persist highlights with PDF coordinates (Rect: x, y, w, h) and restore them visually on reopen.
- Annotation sidebar with pinned notes; clicking a highlight scrolls to the linked note/chat entry.

### Module B: The Brain (Local RAG Lite) - Priority 1 - Status: Not started
- Extraction: when adding a book, extract raw text in background (Rust).
- Indexing: store text chunks in `book_text_index` (SQLite FTS5).
- Retrieval: for "chat with document," run keyword search, inject top chunks into the system prompt, and send to `gpt-5-mini`.

### Module C: Editor (Block-Based) - Priority 2 - Status: Not started
- Upgrade from plain Markdown to block-based editing (Notion-style).
- Slash Command 2.0: `/import-highlights` opens a modal to insert highlights from the current book; `/chat-selection` sends selected editor text to AI for rewriting.

### Module D: UI/UX & Mobile Polish - Priority 2 - Status: Partial (desktop/mobile layout base exists)
- Light/dark theme toggle; gesture support (swipe left delete in Library; swipe right back in Reader); touch targets >=44x44 px.

### Module E: Engineering Hardening - Priority 2 - Status: Not started
- Rust backend handles heavy tasks (file parsing, text extraction) on background threads to keep UI responsive.
- Virtualization (e.g., react-window) for Library when >100 books.
- Error boundaries wrap Reader and Editor so one crash does not kill the app.

### Module F: Technical Refactoring Guide (Support) - Status: Not started
- Move heavy lifting (file parsing, text extraction) to Rust threads; do not block the UI.
- Use virtualization for large Library views; guard Reader/Editor with error boundaries.
- Keep chat/editor/reader scroll areas scoped to avoid whole-page scroll conflicts.

## 5. Success Metrics (current status)
1. Opening a previously read book restores last position and all highlights at correct coordinates. - Not started.
2. Background text extraction completes and builds `book_text_index`; "Ask the book" queries return relevant excerpts and citations. - Not started.
3. Highlight-to-note/chat linking works both ways (clicking highlight scrolls to note; clicking note focuses highlight). - Not started.
4. Block-based editor supports slash commands including highlight import and chat-selection rewrite. - Not started.
5. Mobile gestures work and touch targets meet 44x44 px; light/dark theme toggle persists. - Not started (only base responsive layout exists).
6. Reader/Editor failures are isolated by error boundaries; UI remains responsive while extraction runs in Rust. - Not started.
