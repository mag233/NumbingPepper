# QA / Manual Test Log

## 2025-12-14 — Reader Highlights (Task 12)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 12-QA-001 | Multi-line highlight geometry | Select a multi-line paragraph → click Highlight | Each line highlighted; no spill into margins; minimal overlap | Pass (new highlights) | Legacy highlights created before geometry update may appear misaligned; acceptable for now. |
| 12-QA-002 | Re-highlighting does not stack | Highlight the same text again | No darker stacking; highlights merge | Pass (new highlights) | Same note re: legacy highlights. |
| 12-QA-003 | Persistence after restart/refresh | Create highlight → restart app / refresh web | Highlight reappears on same page | Pass |  |
| 12-QA-004 | Popover + Ask AI focus | Click highlight → popover → click Ask AI | Chat input contains `Context:` + `Instruction:`; cursor focused in textarea | Pass |  |
| 12-QA-005 | Delete confirmation | Click highlight → Delete once → button becomes Confirm → click again | Highlight deleted and stays deleted after restart/refresh | Pass |  |
| 12-QA-006 | Note save feedback | Type note → Save | Shows “Saving…” then “Saved”; persists after restart/refresh | Pass |  |
| 12-QA-007 | Layout toggle stability | With persisted highlights on a page, toggle desktop navigation (Show/Hide navigation) | Highlights stay anchored to the same text (no horizontal shift) | Pass | Verified after anchoring overlays to a page-sized host. |
| 12-QA-008 | Continuous scroll performance | Open a large PDF (>= 50 pages) with highlights; enable continuous scroll; scroll from top to bottom | Scrolling remains responsive; pages load progressively without long UI freezes | Pass | Scrolled ~20+ pages without obvious issues. |
| 12-QA-009 | Multi-column highlight | On a 2-column PDF page, select text spanning both columns → Highlight | Highlight should not fill the column gutter; rects stay in their columns | Fail | Still highlights the gutter in some cases; defer as non-blocker. |

## 2025-12-14 — Reader Selection UX (Task 10)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 10-QA-001 | Selection ghosting / double shading | In Reader, drag-select across lines (before clicking Highlight) | Selection highlight is single and stable; no obvious “double shadow” or adjacent-line overlap | Partial | Ghosting improved; adjacent-line overlap still present in some PDFs. |

## 2025-12-14 — Reader PDF Ergonomics (Task 28)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 28-QA-001 | Zoom buttons | Click Zoom + / − / Reset in left nav | PDF scales; highlights stay aligned | Pass | Verified. |
| 28-QA-002 | Zoom shortcuts | Ctrl/⌘ + `+` / `-` / `0` while focus is not in an input | Zoom changes; does not interfere with typing in Chat/inputs | Pass | Shortcuts work; ignored while typing in inputs (expected). |
| 28-QA-003 | Fit width | Switch to paged scroll → click Fit width | Page fits container width; no highlight drift | Pass | Verified. |
| 28-QA-004 | Fit page | In paged scroll, click Fit page | Page fits available viewport height; no highlight drift | Pass | Verified. |
| 28-QA-005 | Copy selection | Select text in PDF → click Copy in floating menu | Clipboard contains selected text; button shows “Copied” briefly | Pass | Verified. |
| 28-QA-006 | Copy newline cleanup | Select text spanning a wrapped line → Copy | Clipboard does not contain a hard line break mid-sentence | Pass | Verified. |
| 28-QA-007 | Find-in-document | In ReaderNav, search for a unique word → Next/Prev | Jumps to pages with matches; highlights matches; “active” match stays stable | In Progress | Known issues observed previously: missing highlight on first jump; active highlight jumped. Fix shipped (active hit tracking + longer retry); re-test needed. |

## 2025-12-16 — Reader Find-in-document follow-ups (Task 28.4)

| ID | Scenario | Steps | Expected | Result | Notes |
| -- | -------- | ----- | -------- | ------ | ----- |
| 28-QA-008 | Find should not scroll window | Search → Next/Prev several times | App header/top controls do not “disappear”; only the PDF viewport scrolls | Pending | Fix: stop using `scrollIntoView` (which can scroll the window); scroll the PDF container only. |
| 28-QA-009 | Find highlight stability | On pages with multiple matches, Next/Prev repeatedly | “Active” (blue) highlight stays on the correct match; no drifting | Partial | Some pages still show minor misalignment on first match; needs further investigation (likely layout settling / font metrics). |
| 28-QA-010 | Find intermittent missing highlight | Click Find, then Next/Prev across multiple pages | Hit page should render yellow highlight reliably without extra clicks | Partial | Still occasionally missing until another click; treat as non-blocker and keep tracking. |
