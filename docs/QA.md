# QA / Manual Test Log

## 2025-12-14 — Reader Highlights (Task 12)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 12-QA-001 | Multi-line highlight geometry | Select a multi-line paragraph → click Highlight | Each line highlighted; no spill into margins; minimal overlap | Pass (new highlights) | Adjacent-line overlap for persisted highlights is no longer observed; remaining overlap reports are from native selection (Task 10). Legacy highlights created before geometry updates may appear misaligned; acceptable for now. |
| 12-QA-002 | Re-highlighting does not stack | Highlight the same text again | No darker stacking; highlights merge | Pass (new highlights) | Same note re: legacy highlights. |
| 12-QA-003 | Persistence after restart/refresh | Create highlight → restart app / refresh web | Highlight reappears on same page | Pass |  |
| 12-QA-004 | Popover + Ask AI focus | Click highlight → popover → click Ask AI | Chat input contains `Context:` + `Instruction:`; cursor focused in textarea | Pass |  |
| 12-QA-005 | Delete confirmation | Click highlight → Delete once → button becomes Confirm → click again | Highlight deleted and stays deleted after restart/refresh | Pass |  |
| 12-QA-006 | Note save feedback | Type note → Save | Shows “Saving…” then “Saved”; persists after restart/refresh | Pass |  |
| 12-QA-007 | Layout toggle stability | With persisted highlights on a page, toggle desktop navigation (Show/Hide navigation) | Highlights stay anchored to the same text (no horizontal shift) | Pass | Verified after anchoring overlays to a page-sized host. |
| 12-QA-008 | Continuous scroll performance | Open a large PDF (>= 50 pages) with highlights; enable continuous scroll; scroll from top to bottom | Scrolling remains responsive; pages load progressively without long UI freezes | Pass | Scrolled ~20+ pages without obvious issues. |
| 12-QA-009 | Multi-column highlight | On a 2-column PDF page, select text spanning both columns → Highlight | Highlight should not fill the column gutter; rects stay in their columns | Fail | Still highlights the gutter in some cases; defer as non-blocker. |

## 2025-12-14 – Reader Selection UX (Task 10)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 10-QA-001 | Selection ghosting / double shading | In Reader, drag-select across lines (before clicking Highlight) | Selection highlight is single and stable; no obvious “double shadow” or adjacent-line overlap | Partial | Ghosting improved; adjacent-line overlap still present in some PDFs. This is native browser/PDF text-layer selection styling (not persisted highlight rendering). |
| 10-QA-002 | Custom selection overlay | Drag-select across multiple lines in Reader | Selection overlay shows per-line blue rects without heavy adjacent-line overlap; no “double shadow”; dragging through whitespace should not create a huge blue block | Pass | Custom overlay visible (z-index fixed) and render-time rect filtering prevents “giant blue blocks” when dragging into whitespace. |
| 10-QA-003 | Floating menu clamped | Select text near the right side of the PDF page (close to the chat panel) | Floating menu stays fully visible (not covered by the chat sidebar) | Pass | Verified. |

## 2025-12-14 — Reader PDF Ergonomics (Task 28)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 28-QA-001 | Zoom buttons | Click Zoom + / − / Reset in left nav | PDF scales; highlights stay aligned | Pass | Verified. |
| 28-QA-002 | Zoom shortcuts | Ctrl/⌘ + `+` / `-` / `0` while focus is not in an input | Zoom changes; does not interfere with typing in Chat/inputs | Pass | Shortcuts work; ignored while typing in inputs (expected). |
| 28-QA-003 | Fit width | Switch to paged scroll → click Fit width | Page fits container width; no highlight drift | Pass | Verified. |
| 28-QA-004 | Fit page | In paged scroll, click Fit page | Page fits available viewport height; no highlight drift | Pass | Verified. |
| 28-QA-005 | Copy selection | Select text in PDF → click Copy in floating menu | Clipboard contains selected text; button shows “Copied” briefly | Pass | Verified. |
| 28-QA-006 | Copy newline cleanup | Select text spanning a wrapped line → Copy | Clipboard does not contain a hard line break mid-sentence | Pass | Verified. |
| 28-QA-011 | Page labels + jump by label | Open a PDF with printed PageLabels (e.g., roman numerals then 1…); in Jump input, type `iv` or `1` and Go | Jumps to the correct printed page label; current page display shows label (and PDF physical page when different) | Pass | Also supports `pdf:15` to force physical page numbers. |
| 28-QA-007 | Find-in-document | In ReaderNav, search for a unique word → Next/Prev | Jumps to pages with matches; highlights matches; “active” match stays stable | Deferred | Non-blocker for now; remaining issues tracked under Task 28.4 backlog. |

## 2025-12-16 — Reader Find-in-document follow-ups (Task 28.4)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 28-QA-008 | Find should not scroll window | Search → Next/Prev several times | App header/top controls do not disappear; only the PDF viewport scrolls | Pass | Fixed by scrolling the PDF container (not the window). |
| 28-QA-009 | Find highlight stability | On pages with multiple matches, Next/Prev repeatedly | “Active” (blue) highlight stays on the correct match; no drifting | Partial | Some PDFs show minor misalignment on first match; treat as non-blocker for Alpha. |
| 28-QA-010 | Find intermittent missing highlight | Click Find, then Next/Prev across multiple pages | Hit page renders yellow highlight reliably without extra clicks | Partial | Still occasionally missing until another click; track as non-blocker. |

## Writer (Projects)
| ID | Title | Steps | Expected | Status | Notes |
| -- | ----- | ----- | -------- | ------ | ----- |
| 18-QA-001 | Projects list + active project | Open Writer; click Projects → +; rename; select another; delete with double confirm; refresh/restart | Active project persists; drafts do not follow Reader book selection; delete removes project | Pass | Notes: new project starts as “Untitled”; rename requires an extra click (tracked for polish). |
| 18-QA-002 | Context persistence | In Writer, pick a project; type text into Context; switch to another project; return; refresh/restart; test Clear | Context persists per project; switching projects restores correct context; Clear empties | Pass | Shows `chars` + `~tokens` and warns on soft token limit; Ctrl+Z works for manual typing; “Undo append” only appears after append-style actions (e.g., Reader→Writer in 18.5). |
| 18-QA-011 | Context guardrails | In Writer Context, paste a long text until `~tokens` exceeds the soft limit badge; verify warning shows; clear context removes warning | `chars`/`~tokens` updates; soft-limit badge appears/disappears correctly | Pending | Token estimate is approximate (heuristic); use as a guardrail only. |
| 18-QA-012 | Writer AI template insert | In Writer AI, choose a template → click Insert → verify textarea contains template text and cursor is active in textarea; verify it does not auto-send | Text inserted; focus/cursor at end; no message sent until user presses Send | Pending | Insert appends if textarea already has content. |
| 18-QA-013 | Desktop “one screen” layout | Desktop: hide Top Bar; in Writer view scroll wheel should not scroll the entire app; panels should scroll internally if needed | No global page scroll; internal scroll works (Nav / Editor / Chats) | Pending | Aims to keep Writer usable on 16" without vertical page scroll. |
| 18-QA-003 | Content draft per project | In Writer, Project A type “AAA”; switch to Project B type “BBB”; switch back; refresh/restart | Content is isolated per project and persists | Pass | TipTap re-initializes per `draftId`; projects without a saved draft load empty. |
| 18-QA-004 | References + include toggle | In Writer, open a project; add a manual reference; toggle “include in context” on/off; delete with double confirm; refresh/restart | Reference list persists per project; include flag persists; delete removes reference | Pass | Task 18.4 (jump-to-reader comes later in 18.5). Consider moving References into left sidebar later for better UX. |
| 18-QA-005 | Reader highlight popover → Writer add actions | In Reader, click an existing highlight → popover → “To Context” and “To Ref”; if no active project, choose Create in the prompt; switch to Writer to verify | Context appends snippet; Reference is created with snippet and included=false; persists after restart/refresh | Pass | Task 18.5. |
| 18-QA-006 | Reader selection menu → Writer add actions | In Reader, drag-select text (floating menu appears) → click “To Context” / “To Ref” (without persisting highlight); if no active project, choose Create; verify in Writer | Same as 18-QA-005; works without needing to click Highlight first | Partial | Verified write to Context/Reference with an active project. “No active project → Create” path not re-tested. |
| 18-QA-007 | Writer assistant chat (per project) | In Writer, Project A send 2 messages; switch to Project B send 1; switch back; refresh/restart | Chat history is isolated per project and persists across restart/refresh | Pass | New Writer-only chat replaces Reader book chat in Writer view; does not follow PDF selection. |
| 18-QA-008 | Writer chat collapse | In Writer, click Hide on Writer AI panel; then Show Writer Chat | Panel collapses/expands without affecting Writer content; collapsed state does not leave a large blank column; collapsed button does not overlap editor | Pass | Collapsed control uses icon-only button. |
| 18-QA-010 | Markdown preview | In Writer, type markdown in Content (e.g., `## Title` + `- item` + `**bold**`); click Preview; then back to Edit | Preview renders markdown read-only; switching back preserves text exactly | Pass | Verified in-app; headings/lists/bold render correctly; raw text remains unchanged when toggling back to Edit. |
| 18-QA-014 | Writer sidebar layout | Desktop: switch to Writer; ensure left sidebar is WriterSidebar (Projects + References) instead of ReaderNav; verify Content/Context default ratio is usable without scrolling a full-page layout; hide Top Bar and verify there is no global page scroll (internal panels scroll instead) | Writer uses WriterSidebar; Context is not squeezed; no global page scroll when Top Bar hidden | Pass | Fixed sidebar overflow by making header controls wrap and constraining the Projects popover to the sidebar width; also set desktop shell to `h-screen overflow-hidden` to prevent window scrolling. |
| 18-QA-015 | Content selection AI actions | In Writer Content, drag-select text; choose an action (e.g., Simplify/Concise/Rewrite/Translate/Explain); verify it inserts a suggestion (or fills chat input, per spec) and undo still works | Action menu appears on selection; result is non-destructive by default; Undo restores previous content | Pending | Define exact insertion behavior (replace vs insert vs preview) before implementing. |
| 18-QA-016 | Projects picker UX | Open Writer sidebar Projects menu; verify it closes by clicking outside, pressing Esc, and clicking X; click + and verify it shows an input + Save/Cancel and does not create until Save; rename shows Save+Cancel and Cancel does not change title | Close mechanisms work; no accidental project creation; rename is reversible until Save | Pass | Verified by user. |
| 18-QA-017 | Writer Studio artifacts | In Writer, ensure at least 1 reference is included; generate Kickoff/Definition/Explanation; verify an artifact entry is created; verify it does not auto-modify Content; click Insert to apply; verify undo works; Save as Reference creates a new manual reference with included=false | Artifacts are project-scoped and persisted; safe insert; citation constraint applied when refs exist | Pending | Implemented (DB migration v15 + localStorage fallback). Prompts are medium-complexity v1; iterate later based on output quality. |
| 18-QA-009 | Tags extraction + filter | In Writer, Project A add “#tag/subtag” to Content; open Projects and filter by `#tag` then `#tag/subtag` | Tag list updates; filtering shows matching projects; nested tag produces prefix matches | Pass | Tags are derived from Content (TipTap JSON) and normalized to lowercase. |

## 2025-12-16 — Chat History + Writer Drafts Persistence (Task 13)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 13-QA-001 | Chat persists after restart/refresh | Open a book → send 2 messages → refresh/restart | Messages still visible | Pass | Desktop uses SQLite; web uses localStorage fallback. |
| 13-QA-002 | Chat is per book | Open Book A → send message → open Book B → switch back | Book B chat is separate; switching back restores A | Pass | Session id is `book:{bookId}`; no book uses `global`. |
| 13-QA-003 | Draft persists after restart/refresh | Open Writer → type text → refresh/restart | Draft restored | Pass | Draft saves with debounce; switching books flushes pending save. |
| 13-QA-004 | Draft is per book | Book A write “A” → Book B write “B” → switch back | Correct draft restored per book | Pending | Not re-tested yet. |

## 2025-12-16 — Writer UX Gaps (Defer until Reader complete)

| ID | Issue | Impact | Decision |
| -- | ----- | ------ | -------- |
| 18-QA-001 | Writer right-side chat follows PDF selection | Confusing coupling; Writer lacks independent workflow | Defer Writer UX until Reader milestones completed; keep draft persistence to prevent data loss. |
| 18-QA-002 | Writer lacks core editing features (outline/entries, error controls, navigation) | Writer not usable beyond demo | Defer to post-Reader; track as Task 18 breakdown when resumed. |

## 2025-12-16 — Reader/Chat Error Boundaries (Task 29.1)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 29-QA-001 | Panel crash recovery | Trigger a panel crash in DEV: set localStorage `arwf:crash=reader` (or `chat`), then reload; click “Reload panel”; clear the flag and reload again | Panel shows friendly error with “Reload panel”; clicking reload restores the panel; app shell remains usable | Pass | Use crash flag; module-level `throw` is not catchable by boundaries. |
| 29-QA-002 | TOC/outline quick jump | Open a PDF known to have an outline (bookmarks) → check TOC list in left nav → click an item | Outline list renders; clicking jumps to target page; if in continuous mode, app switches to paged for stable jumps | Pass | Uses physical PDF pages; printed page labels may differ (tracked as Task 28.6). |

## 2025-12-16 – Library duplicate detection + recents (Task 19)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 19-QA-001 | Duplicate import message | Import PDF A → import PDF B → import PDF A again | Shows “Already imported…” and does not add a new record | Pass | Hash-based dedupe works even when another import happens in between. |
| 19-QA-002 | No duplicate records | Import the same PDF twice | Library contains only one record for that PDF | Pass | Verified on app + web. |
| 19-QA-003 | Filename collision | Import two different PDFs with the same filename | Both appear as separate books and open correctly | Pass (unit) | Covered by `ai-readwrite-flow/src/features/library/services/libraryImport.test.ts`. Still recommended to spot-check in UI. |
| 19-QA-004 | Recents order | Open Book A → Book B → Book A | Library recents order reflects last opened | Pass (unit) | Covered by `ai-readwrite-flow/src/stores/libraryStore.test.ts`. Still recommended to spot-check in UI. |
| 19-QA-005 | Move to Trash + restore | In Library, select a book → Move to Trash → confirm → switch to Trash view → Restore | Book disappears from Library, appears in Trash; Restore brings it back and it opens | Pass | Restore works; Trash title rendering fixed. |
| 19-QA-006 | Delete app copy (destructive) | In Trash view, select a book → Delete app copy → confirm twice | Book disappears from Trash; its app-data folder is removed (desktop only) | Pass | Desktop-only; destructive path gated by double confirmation. |
| 19-QA-007 | List scroll + select without opening | With >=4 books, select Book A (for actions) without changing the preview; list should scroll after ~3 items; click Open to switch preview | Panel does not grow indefinitely; preview stays stable until Open; actions apply to selected item | Pass | Verified on web + desktop. |

## 2025-12-17 — Theme presets (Task 17)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 17-QA-001 | Theme switch + persistence | Open Settings → Theme dropdown → switch to Soft Dark/Ocean/Forest/Sand/Light; refresh/restart | Theme changes immediately; selection persists across restart/refresh | Pass | Token-based styling applied across Reader/Writer/Chat/Library; highlight colors remain independent. |
