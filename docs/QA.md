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
| 12-QA-009 | Multi-column highlight | On a 2-column PDF page, select text spanning both columns → Highlight | Highlight should not fill the column gutter; rects stay in their columns | Pass | Verified by user. |

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
| 28-QA-012 | Add bookmark | In Reader, click "Add bookmark"; verify it appears in Bookmarks list; restart app | Bookmark appears with correct page label; persists after restart | Pass | Delete/remove flow confirmed. |
| 28-QA-013 | Mode switch preserves position | In Reader, scroll or jump to a mid document location; toggle Paged/Continuous; then use TOC jump | Reading position remains stable; TOC jump does not force a mode switch | Pass | Observed a single flicker when toggling modes. |
| 28-QA-014 | Paged keyboard/wheel navigation | In Paged mode, use arrow keys (left/right or up/down) and scroll wheel at page edges | Page advances/rewinds appropriately; inputs are not hijacked | Pass | - |
| 28-QA-015 | Continuous page controls | In Continuous mode, click page prev/next controls | Controls are disabled with a clear affordance OR scroll to previous/next page anchor | Pass | - |
| 28-QA-016 | Mode toggle flicker | In Reader, toggle Continuous/Paged repeatedly while mid-document | No visible flicker/blink when switching modes | Pending | Low priority polish. |
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
| 18-QA-010 | Markdown preview | In Writer, type markdown in Content (e.g., `## Title` + `- item` + `**bold**` + `---`); click Preview; then back to Edit | Preview renders markdown read-only; switching back preserves text exactly; `---` renders as a horizontal rule in Preview and remains literal `---` in Edit | Pending | Preview now renders from TipTap JSON→Markdown (supports `horizontalRule`). If `---` still auto-converts in Edit, Preview should still show the rule. |
| 18-QA-014 | Writer sidebar layout | Desktop: switch to Writer; ensure left sidebar is WriterSidebar (Projects + References) instead of ReaderNav; verify Content/Context default ratio is usable without scrolling a full-page layout; hide Top Bar and verify there is no global page scroll (internal panels scroll instead) | Writer uses WriterSidebar; Context is not squeezed; no global page scroll when Top Bar hidden | Pass | Fixed sidebar overflow by making header controls wrap and constraining the Projects popover to the sidebar width; also set desktop shell to `h-screen overflow-hidden` to prevent window scrolling. |
| 18-QA-015 | Content selection AI actions (overview) | In Writer Content, drag-select text; use the selection action menu; verify auto-send vs draft behaviors and that applying a suggestion is non-destructive by default (Undo works) | Action menu appears on selection; all actions behave per PRD; apply controls are explicit and Undo is clean | Pending | Spec locked in `docs/PRD.md` PRD-WTR-AI-001..004. |
| 18-QA-023 | Selection action menu visibility | In Writer Content, select text (short + multi-line); then clear selection; then select inside code/markdown; resize window | Menu appears only when a non-empty selection exists; anchors near selection and stays usable on resize | Pass | Verified by user. |
| 18-QA-024 | Auto-send actions send to Writer chat | Select text → click Simplify / Concise / Translate / Explain | Auto-sends; Writer chat shows the user prompt + AI response | Pass | Verified by user. Phase A: response is a normal assistant message; “suggestion card + apply buttons” is tracked under 18-QA-026. |
| 18-QA-025 | Ask AI is draft-only | Select text → click Ask AI | Chat input is prefilled with `Context:` (selected text) + `Instruction:` and focused; does not auto-send | Pass | Verified by user. Must match Reader Ask AI behavior for consistency. |
| 18-QA-026 | Apply actions + Undo | After a suggestion card appears: click Replace selection or Insert below; then click Undo in the apply notice bar (or Ctrl+Z); verify Copy | Replace/Insert change Content correctly (Insert below should add a blank line before inserted text); a single Undo restores the previous state; Copy matches suggestion text | Pass | Verified: Replace/Insert is a single undo step. |
| 18-QA-030 | Suggestion → To Context | After a suggestion card appears: click To Context | Context appends the suggestion text at the end; if Context already has content, it adds a blank line (`\\n\\n`) before the appended text; Content is unchanged | Pass | Verified: separator rules behave as specified. |
| 18-QA-027 | Rewrite tone submenu | Select text → click Rewrite → choose Default/Formal/Friendly/Academic/Bullet (at least 2) | Auto-sends; outputs differ in style/structure; Bullet produces bullet formatting | Pending | Tone is a parameter on the Rewrite template (not separate templates). |
| 18-QA-032 | Rewrite tone profiles (settings) | Settings → Writer AI Templates → Rewrite tone profiles: edit Formal (directive/description/examples); try 4 example lines or >60 words to see validation; run Rewrite→Formal on a selection; toggle Use defaults; test Reset and Reset all tones | Prompt includes updated tone directives; output changes accordingly; validation blocks save when over limits; Use defaults ignores overrides immediately; Reset/Reset all restore defaults | Pass | Also verify the Rewrite submenu labels reflect updated tone labels. |
| 18-QA-033 | Writer global search | In Writer, click Search; query a term that appears in Content/Context/References/Chat/Studio; toggle filters and click results | Modal returns scoped matches; clicking a result scrolls/focuses the correct area; filters update counts | Pass (2026-01-07) | Verified default placement, title-bar-only dragging with move cursor, and persisted coordinates after close/reload. Jumping to Content/Context/References/Chat keeps the modal open, scrolls the correct surface, and flashes `search-highlight-flash`. Counts stay accurate even when a filter is off, backdrop click closes without losing stored position, and non-title drags are ignored. |
| 18-QA-034 | Writer search UX polish | In Writer Search, use next/prev controls and keyboard shortcuts; switch scope between current project and all projects | Matches highlight inline; next/prev traverses consistently; shortcuts work; scope toggle changes result set | Pending | Low priority follow-up. |
| 18-QA-028 | Translate default target language | Open Settings → set Translate default target language; then run Translate on a selection | Translation targets the configured language immediately | Pending | Initial default should be English. |
| 18-QA-029 | Writer templates: defaults + reset safety | Settings → Writer AI Templates → make a template “bad” → run the corresponding action; toggle Use defaults; test Reset and Reset all | Bad template degrades output; Use defaults restores defaults without crashes; Reset/Reset all restore defaults as expected | Pass | Same recovery UX expectations as Reader templates (Use defaults + Reset). |
| 18-QA-031 | Selection menu does not ghost | Select text to show the Writer selection menu → click inside the selected text (not dragging) | Selection highlight clears; the menu disappears and does not re-appear in a “dead” state; selecting again shows a working menu | Pass | Regression guard for the “menu disappears then reappears but buttons do nothing” bug. |
| 18-QA-035 | Writer snapshots | In Writer, click Save snapshot → enter title/note → Save; open Snapshot History → Restore; Duplicate; Delete | Snapshot creates, restores content, duplicates, and deletes correctly | Pass | Verified by user. |
| 18-QA-016 | Projects picker UX | Open Writer sidebar Projects menu; verify it closes by clicking outside, pressing Esc, and clicking X; click + and verify it shows an input + Save/Cancel and does not create until Save; rename shows Save+Cancel and Cancel does not change title | Close mechanisms work; no accidental project creation; rename is reversible until Save | Pass | Verified by user. |
| 18-QA-017 | Writer Studio artifacts | In Writer, ensure at least 1 reference is included; generate Kickoff/Definition/Explanation; verify an artifact entry is created; verify it does not auto-modify Content; click Insert to apply; verify undo works; Save as Reference creates a new manual reference with included=false | Artifacts are project-scoped and persisted; safe insert; citation constraint applied when refs exist | Pass | Implemented (DB migration v15 + localStorage fallback). Prompts are medium-complexity v1; iterate later based on output quality. |
| 18-QA-018 | Writer Studio list density | Generate 6+ artifacts; verify chat messages + input remain visible and usable; verify only recent artifacts are shown by default and the full list is accessible via an explicit action | No sidebar crowding; chat stays usable; artifacts list remains discoverable | Pending | Prefer “Recent 3 + All…” with internal scrolling; avoid shrinking chat to zero. |
| 18-QA-019 | Writer outline | In Writer Content, add headings like `# Title`, `## Section`; verify Outline appears in left sidebar (shows H-level + indentation); click an item jumps/scrolls editor near that heading (in Edit mode) | Outline matches headings; click-to-jump works | Pass (2026-01-07) | Preview mode now keeps the outline list visible, shows a read-only hint, and the same click handler scrolls the rendered preview to the heading while flashing it. Edit mode behavior remains unchanged. |
| 18-QA-020 | Reference preview | In Writer References, add a manual reference with long snippet; click the chevron to expand/collapse; verify delete still works with confirmation | Preview expand/collapse works; delete still safe | Pass (2026-01-07) | Expand/collapse (chevron) works; delete with double-confirm works. No issues found. |
| 18-QA-009 | Tags extraction + filter | In Writer, Project A add “#tag/subtag” to Content; open Projects and filter by `#tag` then `#tag/subtag` | Tag list updates; filtering shows matching projects; nested tag produces prefix matches | Pass | Tags are derived from Content (TipTap JSON) and normalized to lowercase. |

## 2025-12-16 — Chat History + Writer Drafts Persistence (Task 13)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 13-QA-001 | Chat persists after restart/refresh | Open a book → send 2 messages → refresh/restart | Messages still visible | Pass | Desktop uses SQLite; web uses localStorage fallback. |
| 13-QA-002 | Chat is per book | Open Book A → send message → open Book B → switch back | Book B chat is separate; switching back restores A | Pass | Session id is `book:{bookId}`; no book uses `global`. |
| 13-QA-003 | Draft persists after restart/refresh | Open Writer → type text → refresh/restart | Draft restored | Pass | Verified by user (quick close/reopen + normal restart). |
| 13-QA-004 | Draft is per book | Book A write “A” → Book B write “B” → switch back | Correct draft restored per book | N/A | Writer drafts are now project-scoped; book switching must not change Writer content. Validate via 18-QA-021/022. |
| 18-QA-021 | Draft persists across app restarts | Create a new Writer project → type several lines in Content → confirm header shows “Saved …” → fully close app → restart app twice | Content remains and matches last edits | Pass | `Save` button forces a flush; persistence uses both `drafts` (TipTap JSON) and `writing_contents` (markdown fallback). Regression fix: debounce timer is cleared after save to avoid an extra flush overwriting the active project on close. |
| 18-QA-022 | Switching into Writer does not wipe Content | Start on Reader view (Writer not mounted) → click Writer → verify active project Content remains; switch projects A↔B 3 times | No project gets cleared on entering Writer or switching projects | Pass | Protects against hydration race where the initial empty editor state could be auto-saved over an existing draft. |

## 2025-12-16 — Writer UX Gaps (Defer until Reader complete)

| ID | Issue | Impact | Decision |
| -- | ----- | ------ | -------- |
| 18-QA-001 | Writer right-side chat follows PDF selection | Confusing coupling; Writer lacks independent workflow | Defer Writer UX until Reader milestones completed; keep draft persistence to prevent data loss. |
| 18-QA-002 | Writer lacks core editing features (outline/entries, error controls, navigation) | Writer not usable beyond demo | Defer to post-Reader; track as Task 18 breakdown when resumed. |

## 2025-12-16 — Reader/Chat Error Boundaries (Task 29.1)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 29-QA-001 | Panel crash recovery | Trigger a panel crash in DEV: set localStorage `arwf:crash=reader` (or `chat`), then reload; click “Reload panel”; clear the flag and reload again | Panel shows friendly error with “Reload panel”; clicking reload restores the panel; app shell remains usable | Pass | Use crash flag; module-level `throw` is not catchable by boundaries. |
| 29-QA-002 | TOC/outline quick jump | Open a PDF known to have an outline (bookmarks) → check TOC list in left nav → click an item | Outline list renders; clicking jumps to target page; current mode is preserved (no forced switch) | Pending | Uses physical PDF pages; printed page labels may differ (tracked as Task 28.6). |

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

## 2025-12-22 — Reader AI templates + Questions shortcut (Task 33)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 33-QA-001 | Selection → Questions auto-send | Select text in Reader → click `Questions` | Chat auto-sends; output is 3–5 `Q:`/`A:` items and includes [Terminology]/[Logic]/[Insight] coverage | Pass | Verified by user. |
| 33-QA-002 | Highlight popover → Questions parity | Click an existing highlight → popover → click `Questions` | Same behavior as selection Questions; uses highlight content as context | Pass | Verified by user. |
| 33-QA-003 | Templates UI: Use defaults recovery | Settings → Reader AI Templates → edit Questions template to a bad prompt → verify output degrades → turn on `Use defaults` | Defaults take effect immediately; prompts recover without crashes | Pass | Verified by user. |
| 33-QA-004 | Templates UI: reset behaviors | Settings → Reader AI Templates → edit template → `Reset` → edit multiple → `Reset all` | Per-template reset and reset-all restore defaults; overrides persist but are cleared | Pass | Verified by user. |

## 2025-12-22 — Desktop layout density + Settings drawer (Task 34)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 34-QA-001 | Settings drawer replaces always-visible panels | Desktop: open app → locate `⚙` → open/close drawer | No large Settings panels occupy the workspace; settings are accessible via drawer | Pass |  |
| 34-QA-002 | Settings drawer works in Reader + Writer | Switch Reader ↔ Writer → open `⚙` | Same Global settings visible/editable in both views | Pass |  |
| 34-QA-003 | Left sidebar scroll independence | Scroll Library list; then scroll TOC/Bookmarks/Highlights area | Library scroll does not move the TOC/Bookmarks area and vice versa | Pass | Layout note: large blank gap between Library and TOC; prefer Library keep compact height and TOC expands. |
| 34-QA-004 | Bottom PDF toolbar availability | In Reader (desktop), use bottom bar to Jump/Find/Zoom/Fit | Controls work and do not obscure floating menu/popovers | Pass | Fixed by ensuring ReaderPane container is a flex column so the scroll area leaves space for the toolbar. |
| 34-QA-005 | Writer header is view-aware | In Writer view, verify top bar does not show Reader-only status blocks | Header shows Writer-relevant state; Global settings entry remains available | Pass |  |

## 2025-12-26 — Writer layout density + adjustable split (Task 35)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 35-QA-001 | Layout control visibility (Writer-only) | Desktop: switch to Writer → confirm top-right shows `Layout` next to Settings; switch to Reader; switch to mobile width | `Layout` only appears in Writer desktop; Reader/mobile unaffected | Pass | Mobile not tested |
| 35-QA-002 | Lock/unlock behavior | In Writer desktop: confirm default Locked; click `Layout` to enter Adjust mode; click `Done` to lock | In Adjust mode, splitter becomes draggable; in Locked mode, splitter is not draggable (or hidden) | Pass |  |
| 35-QA-003 | Drag split + min widths | In Adjust mode: drag Editor↔Chat boundary left/right | Editor and Chat resize smoothly; cannot shrink Editor < 520px or Chat < 320px | Pass |  |
| 35-QA-004 | Persist + restore | Adjust ratio → refresh/restart app → return to Writer | Ratio restores to last value; no layout break | Pass |  |
| 35-QA-005 | Reset to defaults | In Adjust mode: click Reset | Ratio resets to 65/35 and density resets to Comfortable | Pass |  |
| 35-QA-006 | Density presets (Writer-only) | In Writer desktop: switch density Comfortable↔Compact | Header/toolbars, panel gutters, and card paddings become visibly tighter in Compact; Reader/mobile unchanged | Pass | Mobile not tested |
| 35-QA-007 | Middle column 2-card split | In Writer desktop: verify middle column shows separate Content card and Context card (stacked) | Content and Context read as sibling panels; no nested-card confusion | Pass |  |
| 35-QA-008 | Right column Studio+Chat are siblings | In Writer desktop: verify Studio is its own card above Chat; toggle Studio collapse/expand | Studio never appears to cover chat; Chat messages scroll and input stays visible | Pass |  |
| 35-QA-009 | Artifacts list density | Generate several artifacts; observe list; expand/collapse Preview for one item | Each artifact is a compact single-line item; Preview expands per item without dominating layout | Pass |  |
| 35-QA-010 | Hide chat reclaims space | Click `Hide` in Writer AI; observe editor width; find and click the show handle | Hide removes the chat column entirely and editor expands immediately; show handle is discoverable and restores chat | Pass |  |

## 2026-01-09 — Phone scope (Task 42)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 42-QA-001 | Mobile compact settings entry | Set viewport to ~375px → open header gear icon → open/close Settings drawer | Gear icon visible on mobile; opens SettingsDrawer; closes via X/backdrop; settings editable | Pass | Implemented in App header; SettingsPanel no longer auto-renders on mobile view. |
| 42-QA-002 | Chat UI readability (mobile) | Phone width ~375px, open Chat with an existing conversation | Chat surface remains readable and scannable on mobile | Pass | Mobile chat uses a simplified layout (single scroll history + input pinned at bottom), reduced nested borders/shadows, and clear user/assistant bubble styling. |
| 42-QA-003 | Chat overlay sheet behavior | Mobile ~375px: in Writer, tap Chat button → overlay opens; scroll history; type and send; close | Single scroll area (no double scroll); input anchored at bottom; close returns to Writer state intact | Pass | Overlay locks background scroll; sheet content uses a single scroll container; input stays visible. |
| 42-QA-004 | Visual density & readability | Mobile ~375px: inspect chat header/helper, bubbles, padding/line-height | Header minimal; helper text concise; bubbles have comfortable padding/line-height; no nested heavy borders/shadows; no max-height clamp | Pass | Bubble widths are constrained (~80%) with left/right alignment and distinct backgrounds for user vs assistant. |
| 42-QA-005 | Mobile chat entry + resize sync | Mobile ~375px: confirm no Chat tab; open chat via floating button; resize to desktop width; return to mobile width | Chat is opened via overlay only; resizing to desktop closes the overlay; returning to mobile stays closed until reopened | Pending (2026-01-09) | Needs manual verification after removing the chat tab and adding resize close behavior. |
| 42-QA-006 | Mobile chat close button size | Mobile ~375px: open chat overlay; inspect close button size and tap target | Close button is icon-sized and consistent with header controls; tap target feels balanced | Pass (2026-01-10) | Matched Clear and Close button heights in the mobile chat header. |

## 2026-01-10 — App shell refactor

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| APP-QA-001 | App shell smoke | Desktop: launch app; toggle Layout; open Settings; switch Reader/Writer. Mobile: resize to ~375px; switch tabs; open chat overlay; close; resize back | All views render; controls work; no blank panels; overlay opens/closes; footer copy matches mobile behavior | Pass (2026-01-10) | Verified after App shell hook extraction. |

## 2025-12-30 — Desktop sidebar resizing + nav toggle ergonomics (Task 36)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 36-QA-001 | Sidebar drag + clamp (gated) | Desktop (Writer): click `Layout` to enter Adjust mode → drag left sidebar splitter left/right; click `Done` → try dragging again | In Adjust mode: width changes smoothly and clamps within min/max; in Locked mode: no splitter handle (divider only) and not draggable | Pass | Confirmed after 36.2 gating. |
| 36-QA-002 | Persist + reset | Desktop: click `Layout` (Adjust) → drag sidebar width → restart/refresh → confirm restore; then `Layout` (Adjust) → click Reset | Width restores after restart; Reset returns to default width | Pass | Confirmed after 36.3. |
| 36-QA-003 | Nav toggle icon placement | Desktop: locate nav toggle icon (no text “Hide navigation” button); toggle on/off | Toggle works; control is discoverable; no duplicate toggle | Pass | Verified by user. |
| 36-QA-004 | Mobile unaffected | Narrow to mobile width | No resizer handle; no layout break | Pass | Verified by user. |

## 2026-01-01 – Global Layout toggle (Task 37)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 37-QA-001 | Layout toggle is global (desktop) | Desktop: Reader view → confirm header shows `Layout`; click `Layout` → scope hint shows `Adjusting: Reader`; switch to Writer → scope hint updates | `Layout/Done` available in both views; Adjust mode carries across views but scope hint matches current view | Pass | Verified by user. |
| 37-QA-002 | Reset is per-view | Desktop: in Reader Adjust mode click Reset; then go to Writer and verify Writer split/density unchanged; then in Writer Adjust mode click Reset and verify Reader layout unchanged | Reset affects only current view | Pass | Verified by user. |
| 37-QA-003 | Reader main split adjust + persist | Desktop: in Reader Adjust mode drag Reader↔Chat splitter; refresh/restart; confirm ratio restores; click Reset (Reader) | Drag works and clamps; persists; Reset restores defaults (Reader-only) | Pass | Verified by user. |
| 37-QA-004 | Mobile unaffected | Narrow to mobile width | No Layout controls; no splitters; layout unchanged | Deferred | Mobile optimization postponed; verify later. |
| 37-QA-005 | Reader density presets (Reader-only) | Desktop: Reader view → Layout (Adjust) → toggle Comfortable/Compact → refresh/restart; then switch to Writer and confirm unchanged | Reader spacing tightens/loosens; persists; Writer not affected | Pass | Verified by user. |
| 37-QA-006 | Divider clarity + consistent gutters | Desktop: exit Layout mode (Done) → hover dividers; enter Layout mode (Layout) and compare sidebar divider vs Reader↔Chat divider gutters | Locked mode divider never looks draggable; Adjust mode split gutters match width/visuals | Pass | Verified by user. |

## 2026-01-02 — Flomo export core (Task 23)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 23-QA-001 | Flomo webhook POST smoke | Set `VITE_FLOMO_API` or `FLOMO_API`; run `cd ai-readwrite-flow; node scripts/flomo-smoke.mjs` | A new Flomo note is created; command prints `Flomo POST ok` | Pass | Verified by user. |
| 23-QA-002 | Settings: Flomo URL + Test | Settings → Integrations → (A) Replace → paste Flomo webhook URL OR (B) leave empty when `VITE_FLOMO_API` is set at build time → click `Test & Save`; restart app and confirm URL persists | Test creates a Flomo note; settings persist across restart; URL is never shown or copyable in the UI | Pass | Verified by user. |
| 23-QA-003 | Composer: Reader/Writer drafts | DEV: Settings → Integrations → Dev tools → open Reader/Writer composer; edit Tags; (Writer) collapse/expand Context; click Send | Note is created in Flomo with English headings and tags one-per-line; duplicate tags are removed; Writer Context defaults expanded on desktop and collapsed on mobile | Pass | Verified by user. |
| 23-QA-004 | Reader: Note → Save highlight | Reader: select text in PDF → click `Note` in floating menu → type note → click `Save` | A highlight is created for the selected text; note is saved on that highlight; composer closes; no Flomo note is sent | Pass | Verified by user. |
| 23-QA-005 | Reader: Save & Send to Flomo | Reader: select text → `Note` → type note → click `Save & Send` | Highlight is created (or updated) and note saved; a Flomo card is created with Quote/Note/Tags and no duplicate tags; composer closes on success | Pass | Verified by user. |
| 23-QA-006 | Writer: Export selection to Flomo | Writer: select text in Content → click `Flomo` in selection bubble menu → adjust tags → click `Send` | A Flomo card is created with Selection/Context/Tags; tags are one-per-line and deduped | Pass | Verified by user. |
| 23-QA-007 | Composer: Save vs Save & Close | Reader: select text → Note → type note → click `Save` | Highlight note is saved but composer stays open; `Save & Close` closes; `Save & Send` sends and closes on success | Pass | Verified by user. |
| 23-QA-008 | Composer: Last sent timestamp | (A) Reader: from highlight popover click `Flomo…` → click `Save & Send` → re-open `Flomo…` (B) Writer: open Flomo export → Send → reopen | Composer shows `Last sent: ...` matching the most recent successful send | Pass | Verified by user. |
| 23-QA-009 | Writer: Flomo History (local outbox) | Writer: send 2 different selections via Flomo → click `Flomo History` in Writer header → click `Resend` on an item | History lists both sends (newest first) with time + snippet preview; Resend opens composer with that selection prefilled and can send again | Pass | Verified by user. |

## 2026-01-04 — Settings UX (Task 38)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 38-QA-001 | Reader templates hint clarity | Settings → Reader → select `Explain` then select `Questions` | Only `Questions` shows the contract hint (inside the editor panel, above the textarea); no confusing extra section at the bottom | Pass | Verified by user. |

## 2026-01-04 — Writer suggestion apply flash highlight (Task 39)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 39-QA-001 | Replace/Insert shows flash highlight | In Writer: create a suggestion card → click `Replace selection` or `Insert below` | Newly inserted text shows a slow flashing highlight; highlight clears on next user input or after 7s | Pass | Verified by user. |
| 39-QA-002 | Undo and normal typing behavior | After `Replace/Insert`, press `Ctrl+Z` once; then type normally | Undo restores the pre-apply content in one step and no highlight remains; normal typing does not create flash highlights | Pass | Verified by user. |

## 2026-01-15 – Reference metadata + citations (Task 46)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 46-QA-001 | Import metadata capture | Import a PDF with metadata and one without | Book metadata fields populate when available; fallback to filename when absent | Pending | Implementation done 2026-01-15; manual QA pending. |
| 46-QA-002 | Reference snapshot stability | Create a reference, then edit the book title/author | Reference still shows the original snapshot values | Pending | Implementation done 2026-01-15; manual QA pending. |
| 46-QA-003 | Manual metadata refresh | Click "Update metadata" on a reference after editing book metadata | Reference snapshot updates to the latest book metadata | Pending | Implementation done 2026-01-15; manual QA pending. |
| 46-QA-004 | APA 7 formatting + fallback | Generate output using references with missing author/year | Citations follow APA 7; missing author uses title; missing year shows `n.d.` | Pending | Implementation done 2026-01-15; manual QA pending. |
| 46-QA-005 | Reference tags | Create a reference and add tags; edit and remove tags | Tags persist and can be edited safely | Pending | Implementation done 2026-01-15; manual QA pending. |
| 46-QA-006 | System default tags | Create a reference with defaults enabled | Tags include `#ai_reader/title/<title>` and optional `#ai_reader/author/<author>`/`#ai_reader/year/<year>` | Pending | Implementation done 2026-01-15; manual QA pending. |

## 2026-01-15 – Multimodal chat images (Task 47)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 47-QA-001 | Image input supported | Send an image with a supported model | Response describes the image; no errors | Pending | Use a simple icon image for smoke. |
| 47-QA-002 | Image input unsupported | Send an image with an unsupported model | Clear unsupported message shown; no crash | Pending | Ensure failure message is user-facing. |
| 47-QA-003 | Image persistence | Send an image, refresh/restart | Image still renders in the chat history | Pending | Storage is local-only. |

## 2026-01-15 – Context image DnD + local OCR (Task 48)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 48-QA-001 | Drop image + OCR | Drag/drop an image into Context | OCR runs locally and produces text | Pending | Thumbnail/status are visible during OCR. |
| 48-QA-002 | Post-OCR choice | After OCR completes, choose Append vs Insert at cursor | Append adds to end; Insert places at cursor | Pending | Choice prompt should appear every time. |
| 48-QA-003 | OCR cache | Drop the same image twice | Second drop uses cache without re-running OCR | Pending | Hash-based cache key. |
| 48-QA-004 | OCR failure recovery | Drop an unsupported/corrupt image | Error is shown and user can retry | Pending | No crash. |

## 2026-01-15 – Writer chat refs + tag UX (Task 49)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 49-QA-001 | Writer chat includes references | Include one reference in Context; send a chat message | Prompt includes a References block with the included snippet | Pending | Toggle should default on. |
| 49-QA-002 | Toggle references off | Turn off Include References; send a chat message | Prompt omits References block | Pending | Toggle is per-chat session. |
| 49-QA-003 | Tag multi-line wrap | Add a long tag (newline separated) | Tags wrap and remain readable | Pending | Multi-line input should preserve tags. |
| 49-QA-004 | Source Info separate | Expand a reference card | Source Info displays title/author/year separately from tags | Pending | Tags remain user-editable. |

## 2026-01-15 - Writer chat sanitization + tag namespace (Task 50)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 50-QA-001 | Chat history sanitization | Send a chat with Context; clear Context; send another chat | Response should not reflect cleared Context content | Pending | History should only keep prior Instruction text. |
| 50-QA-002 | Hidden system tags | Create reference from book metadata | Tag editor shows only user tags; system tags not editable | Pending | System tags remain stored. |
| 50-QA-003 | Tag search still works | Search by book title/author/year | Reference is still found via system tags | Pending | Uses `ai_reader/...` tags. |
| 50-QA-004 | Flomo tag prefixing | Writer → References → expand → Flomo → send with user tags | Flomo tags include `#ai_reader/...` for user tags (system tags preserved) | Pending | Verify no double-prefix. |

## 2026-01-15 - Reader To Ref auto-highlight (Task 51)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 51-QA-001 | To Ref creates highlight | In Reader, select text and choose To Ref | Highlight is created and visible; Writer reference is created | Pending | Ensure highlight persists after reload. |

## 2026-01-16 - Reference tag UX polish (Task 52)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 52-QA-001 | System tag display | Writer → References: expand a card with system tags | System tags show as `title/author/year` (no prefix/colon), each on its own line, truncated when long | Pending | - |
| 52-QA-002 | Tag filter toggle | Writer → References: select user tags; toggle Include system; select a system tag | Reference list filters by selected tags; system tags only appear when Include system is on | Pending | - |
| 52-QA-003 | To Ref tag prompt | Reader: select text → To Ref; open highlight popover → To Ref | Tag prompt appears both times; Skip saves without user tags; Save adds user tags | Pending | - |

## 2026-01-16 - Writer Context clear prompt

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| WTR-QA-CTX-001 | Clear context choices | Writer → Context → Clear | Prompt offers “Clear context only” and “Clear context + chat”; Cancel closes | Pending | - |
| WTR-QA-CTX-002 | Clear context only | Writer → Context → Clear → “Clear context only” | Context clears; Writer chat history remains | Pending | - |
| WTR-QA-CTX-003 | Clear context + chat | Writer → Context → Clear → “Clear context + chat” | Context clears and Writer chat history clears | Pending | - |

## 2026-01-16 - GPT-5 Responses API settings (Task 53)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 53-QA-001 | Settings persistence | Settings → Chat → update Responses controls → Save → restart | Values persist across reload | Pass (2026-01-16) | - |
| 53-QA-002 | GPT-5 gating | Set model to non-GPT-5 → open Chat settings | Controls are disabled and show a hint | Pass (2026-01-16) | - |
| 53-QA-003 | Responses API call | Set model to GPT-5 → enable Responses API → send chat | Response returns; usage/latency recorded | Pass (2026-01-16) | Text-only output. |

## 2026-01-16 - Explicit tags + Flomo defaults + full export (Task 54)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 54-QA-001 | Project tags default | Writer → Project settings → set tags; open Writer selection Flomo | Composer pre-fills `#ai_reader/<tag>` + `#写作/<project>` | Pending | Save defaults unchecked by default. |
| 54-QA-002 | Book tags default | Library side panel → set book tags; open Reader selection/highlight Flomo | Composer pre-fills `#ai_reader/<tag>` + `#books/<book>` | Pending | - |
| 54-QA-003 | Save defaults | In Flomo composer, edit tags → check “Save as default tags” → Send | Project/book tags update only when checked | Pending | - |
| 54-QA-004 | Writer full export | Writer action bar → Flomo | Flomo note includes Content + Context + Tags sections | Pending | - |
| 54-QA-005 | Tag popover edit (Project) | Writer → Project tags → Edit → Save/Cancel | Chips render; Save updates tags; Cancel does not change tags | Pending | Popover only, no inline textarea. |
| 54-QA-006 | Tag popover edit (Book) | Library → Book tags → Edit → Save/Cancel | Chips render; Save updates tags; Cancel does not change tags | Pending | Popover only, no inline textarea. |
| 54-QA-007 | Reference include toggle | Writer → References → toggle checkbox | Included count updates; toggle persists across refresh | Pending | Guard against null projectId. |

## 2026-01-17 - Project ↔ Library scope alignment (Task 56)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 56-QA-001 | Project assignment | Library → assign a book to two projects | Book appears in both project lists | Pending | Multi-project membership. |
| 56-QA-002 | Remove from project | Project view → remove book from project | Book disappears from that project but remains in Library | Pending | Must not delete the book. |
| 56-QA-003 | Project scope sync | Switch active project while in Reader/Writer | Reader list and Writer scope update together | Pending | Scope indicator shown. |
| 56-QA-004 | Search scope | Library search vs Project search | Library search is global; project search is scoped | Pending | Show scope hint in UI. |
| 56-QA-005 | Reader position | Read a book in project A, switch to project B, return to A | Reading position remains per book | Pending | Not per-project. |

## 2026-01-17 - Active project selector + scope indicator (Task 57)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 57-QA-001 | Scope selector | Header: switch Scope between Global and a Project while in Reader/Writer | Scope label updates; Reader list reflects scope; Writer shows correct project title | Pending | - |
| 57-QA-002 | Persist scope | Select Global; restart app | Scope remains Global after restart | Pending | Requires `ACTIVE_PROJECT_NONE` persistence. |

## 2026-01-17 - Library hub (Task 61)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 61-QA-001 | Library tab | Top nav: open Library tab | Library opens; Reader/Writer unchanged | Pending | - |
| 61-QA-002 | Page tabs | Library: switch Books/Projects/Tags | Each page renders; state persists | Pending | - |
| 61-QA-003 | Remove global mgmt from Reader | Reader sidebar | No global Library management controls present | Pending | - |

## 2026-01-17 - Library Projects page (Task 62)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 62-QA-001 | Create/edit/delete | Library > Projects: create/rename/delete | Project list updates; persists | Pending | - |
| 62-QA-002 | Membership | Assign books to project; remove | Membership changes reflect in scoped lists | Pending | - |

## 2026-01-17 - Library Tags page (Task 63)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 63-QA-001 | Tag CRUD | Create/rename/delete/merge tags | Tags update; no crashes | Pending | - |
| 63-QA-002 | Multi-filter | Apply include/exclude with AND/OR | Filtered list matches rules | Pending | - |
| 63-QA-003 | Saved views | Save a filter; reload | Saved view persists and applies | Pending | - |

## 2026-01-17 - Reader sidebar scope-only (Task 64)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 64-QA-001 | Project-only sidebar | Reader: switch to a project | Sidebar shows only project books + reader nav | Pending | - |
| 64-QA-002 | Empty project state | Project with zero books | Empty state references project (not global import) | Pending | - |

## 2026-01-17 - Project book assignment UX (Task 58)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 58-QA-001 | Assign projects | Library (or Reader sidebar): select a book -> Project membership -> Edit -> choose 2 projects -> Save | Chips update; book appears in both projects' scoped lists | Pending | - |
| 58-QA-002 | Remove vs delete | In a project scope, open Project membership and remove the project; then use Delete/Trash actions | Removal only affects membership; book remains in Library; delete/trash still works | Pending | - |
| 58-QA-003 | Empty project list | Scope to a project with no books | Library panel shows "No books assigned" hint | Pending | - |

## 2026-01-17 - Reader restore + tag popover layout + references stability (Task 55)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 55-QA-001 | Reader restore | Open PDF → scroll to mid-page → switch to Writer tab → return to Reader | Restores to last page/scroll position (not page 1) | Pending | Continuous mode should restore scrollY. |
| 55-QA-002 | Tag popover bounds | Open Project/Book tags popover near the left edge | Popover stays within viewport; no off-screen overflow | Pending | Edit panel clamps horizontally. |
| 55-QA-003 | References persistence | Writer → References list visible → switch to Reader tab and back | Reference list remains loaded (no unexpected empty list) | Pending | No hydrate-null clearing. |
