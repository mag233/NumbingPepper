# Risk Register

This file tracks cross-cutting risks (not tied to a single feature doc). Each feature SRS should also include a local “Risks & Mitigations” section.

| ID | Area | Risk | Impact | Likelihood | Mitigation | Status |
| -- | ---- | ---- | ------ | ---------- | ---------- | ------ |
| R-001 | Reader/Highlights | PDF text layer geometry causes selection rect overlap and highlight drift (incl. layout toggle shifts) | High | High | Store multi-rect (client rects), normalize to stable page host sized to the page, clamp/clip, add merge rules; accept native selection overlap limits | Open |
| R-002 | Reader/Highlights | Repeated highlights stack darker and exceed glyph bounds | Medium | High | Merge overlapping rects or cap alpha; vertical clamp between lines | Open |
| R-003 | Persistence | Schema drift between PRD/TASKS/implementation | High | Medium | Keep TASKS status in sync; add decision log for schema changes | Open |
| R-004 | Web vs Desktop | Desktop-imported native paths cannot be loaded on web | Medium | High | Keep explicit separation: web stores data URLs; hide desktop-only items on web | Mitigated |
| R-005 | Performance | Large PDFs/highlight counts cause scroll jank | High | Medium | Only render highlights for mounted pages; virtualization when >100 items | Open |
| R-006 | Tooling | PowerShell execution policy blocks `npm.ps1` | Medium | Medium | Use `cmd /c npm ...` or adjust policy; document in instructions | Mitigated |
| R-007 | Library Management | Destructive deletion can remove user files unexpectedly (wrong bookId, confusion between remove vs delete) | High | Medium | Separate actions: remove DB-only by default; destructive delete is desktop-only with double-confirm + clear warning; add undo window if feasible | Open |
| R-008 | Layout / UX | User-adjustable Writer split or density can create an unusable layout (too small Chat/Editor, confusing locked state) | Medium | Medium | Enforce minimum widths, provide Reset to defaults, and keep adjustments in an explicit `Layout` mode | Open |
| R-009 | Layout / UX | User-adjustable sidebar widths can create unusable layouts or hide key controls | Medium | Medium | Enforce min/max, provide Reset to defaults, and keep changes discoverable with a clear handle; avoid mobile impact | Open |
