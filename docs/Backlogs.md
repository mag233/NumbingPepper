## 2025-12-14
1. After highlighting and user clicking Chat, the chat input box should be pre-filled with the highlighted text as context for the AI. The input icon should be focused and ready for user to type additional instructions.
2. Need a new shortcut for "Generating Questions" when user has highlighted text in the reader.
3. Need a place to centralize all AI templates for different tasks (e.g., Summarize, Generate Questions, Explain Like I'm 5, etc.) so that user can select from a list of templates when interacting with highlighted text.
4. RAG functionality for books as a whole (optional), not just highlights. When user asks a question, AI can reference the entire book content if user enables that option.

## AI Chat UX
- After user clicks "Ask AI" on a highlight, the chat input should be pre-filled with the highlighted text as "Context", and the input should be focused with the cursor ready for the user to type additional instructions.

## Reader Highlight Shortcuts
- Add a shortcut action "Generate Questions" when user has highlighted text in the reader (selection-based), producing a list of questions for active recall.

## Reader Highlight Popover UX (polish)
- Keep action labels single-line (e.g., "Ask AI" must not wrap to two lines).
- Reuse the existing "Summarize" and "Explain" actions for persistent highlights (same as temporary selection menu).
- Add a "Generate Questions" action for persistent highlights (in popover), consistent with selection-based shortcut.

## Reader PDF Ergonomics (planned)
- Zoom in/out/reset, fit-width/fit-page, and keyboard shortcuts (desktop) with mobile-friendly controls.
- Copy selection with clear feedback, and a simple Find-in-document flow (next/prev matches).

## Reader Highlight Geometry (known issues)
- Multi-column PDFs: some selections spanning columns still produce highlight rects that bridge the gutter. Non-blocker; defer for later refinement.

## Reader Find (known issues)
- Some PDFs show minor misalignment for the first match on a page in Find-in-document (likely TextLayer transforms/kerning). Non-blocker; track via `docs/QA.md` (28-QA-009).

## Library Management (planned)
- Safe deletion: "Remove from library" (DB-only) and optional "Delete local file" (desktop-only, double confirm).
- Organization: tags/collections for grouping and filtering PDFs (P2/backlog).
