# Milestone: Alpha Reader Core Complete
**Date:** January 7, 2026  
**Status:** Reader foundation locked; Writer functional but ongoing

## Summary
This milestone marks the completion of the Reader core feature set and establishes a stable foundation for the local-first PDF reading and writing workspace. The Reader pipeline (PDF rendering, highlights, bookmarks, TOC, navigation, AI shortcuts) is production-ready with known non-blockers tracked. Writer drafting and project management are functional with persistence guarantees, though UX polish and advanced features remain in progress.

---

## Completed Features (Locked In)

### Reader Core (Task 29 — Completed Dec 2025)
**Status:** Production-ready with tracked non-blockers

#### PDF Rendering & Navigation
- ✅ React-pdf integration with paged and continuous scroll modes (Dec 14, 2025)
- ✅ Zoom controls (in/out/reset) with keyboard shortcuts (Ctrl/⌘ +/-/0) (Dec 16, 2025)
- ✅ Fit modes (manual, fit width, fit page) with persistence per book (Dec 16, 2025)
- ✅ Page labels support (printed page numbers + physical page numbers) (Dec 22, 2025)
- ✅ Mode switching preserves reading position (no jump to page 1) (Dec 22, 2025)
- ✅ Paged mode: arrow key navigation and wheel-to-next-page at edges (Dec 22, 2025)
- ✅ Continuous mode: page controls scroll to anchors (Dec 22, 2025)
- ✅ TOC/outline parsing and quick jump navigation (Dec 16, 2025)
- ✅ Bookmarks: add, list, edit title, remove with persistence (Dec 22, 2025)
- ✅ Last-read position restore (page + scroll + zoom + fit mode) (Dec 14, 2025)

**QA Reference:** 28-QA-001..015, 29-QA-001..002

#### Highlights & Annotations
- ✅ Multi-line highlight geometry with normalized rects (Dec 14, 2025)
- ✅ Highlight persistence (SQLite + localStorage fallback) (Dec 14, 2025)
- ✅ Color palette (yellow/red/blue) with recolor support (Dec 14, 2025)
- ✅ Notes: add, edit, persist, show save feedback (Dec 14, 2025)
- ✅ Click-to-select highlight with popover actions (Dec 14, 2025)
- ✅ Highlight stability across zoom and layout toggles (Dec 16, 2025)
- ✅ Overlap handling (vertical clamp to prevent line-to-line bleed) (Dec 16, 2025)
- ✅ Multi-column PDF support with gutter detection (Dec 16, 2025)
- ✅ Delete with double-confirm (Dec 14, 2025)

**QA Reference:** 12-QA-001..009, 29-QA-002

**Known Non-Blockers:**
- 10-QA-001: Native selection adjacent-line overlap in some PDFs (tracked, not blocking Alpha)
- 12-QA-009: Some multi-column PDFs may bridge gutter (edge case, tracked)

#### Selection & Copy
- ✅ Custom selection overlay (per-line blue rects) to reduce overlap artifacts (Dec 16, 2025)
- ✅ Copy selected text with soft line break cleanup (Dec 16, 2025)
- ✅ Floating menu clamps to avoid sidebar coverage (Dec 16, 2025)

**QA Reference:** 10-QA-002..003, 28-QA-005..006

#### Find-in-Document (Deferred)
- ⚠️ Basic find with next/prev implemented but has stability issues (Dec 16, 2025)
- ⚠️ Known issues: occasional missing highlight, minor misalignment on first match
- **Decision:** Moved to backlog (Task 28.4); non-blocking for Alpha

**QA Reference:** 28-QA-007..010 (Partial pass, tracked)

#### AI Shortcuts & Templates
- ✅ Reader selection menu: Summarize, Explain, Ask AI, Questions (Dec 22, 2025)
- ✅ Highlight popover actions: same shortcuts + To Context + To Ref (Dec 22, 2025)
- ✅ Centralized template registry with end-user editing (Dec 22, 2025)
- ✅ Settings UI for Reader templates with Use defaults + Reset controls (Dec 22, 2025)
- ✅ Questions shortcut: auto-send, generates 3-5 Q/A pairs (Dec 22, 2025)

**QA Reference:** 33-QA-001..004

#### Error Handling
- ✅ Per-panel error boundaries (Reader, Chat) with "Reload panel" recovery (Dec 16, 2025)

**QA Reference:** 29-QA-001

---

### Library Management (Task 19 — Completed Dec 2025)
- ✅ Import via drag/drop or picker (web + desktop) (Dec 14, 2025)
- ✅ File copy to app data with hash/mtime/size metadata (Dec 14, 2025)
- ✅ Hash-based duplicate detection ("Already imported" message) (Dec 16, 2025)
- ✅ Recent-open tracking and sort (Dec 16, 2025)
- ✅ Trash + Restore (soft delete) (Dec 16, 2025)
- ✅ Delete app copy (desktop-only, destructive, double-confirm) (Dec 16, 2025)
- ✅ Library list scroll area with selection-for-actions (Dec 16, 2025)

**QA Reference:** 19-QA-001..007

**Planned Enhancements (Task 43, 44, 31):**
- Library pop-out drawer + Recent reads summary
- Tags/folders/status ("To Read", "Finished")
- Metadata extraction (auto-title from PDF)
- Mark as Done action in Reader

---

### Desktop Layout & Density (Tasks 34-37 — Completed Dec 2025)
- ✅ Settings drawer (Global/Reader/Writer tabs) replacing always-visible panels (Dec 22, 2025)
- ✅ Bottom PDF toolbar (Jump/Find/Zoom/Fit controls) (Dec 22, 2025)
- ✅ Left sidebar: Library (top) + TOC/Bookmarks/Highlights (bottom) with independent scroll (Dec 22, 2025)
- ✅ Desktop sidebar width resizing (gated by Layout mode) with min/max + persist + reset (Dec 30, 2025)
- ✅ Global Layout/Done toggle (Reader + Writer) with scope hint (Jan 1, 2026)
- ✅ Reader main split (Reader↔Chat) adjustable with persist + reset (Jan 1, 2026)
- ✅ Reader density (Comfortable/Compact) desktop-only, persisted (Jan 1, 2026)
- ✅ Writer Editor↔Chat split adjustable (default 65/35) with min widths + reset (Dec 26, 2025)
- ✅ Writer density (Comfortable/Compact) with card/gutter spacing reduction (Dec 26, 2025)
- ✅ Writer middle column: Content + Context as sibling cards (Dec 26, 2025)
- ✅ Writer right column: Studio + Chat as sibling cards (Dec 26, 2025)
- ✅ Hide chat: reclaims space with discoverable Show handle (Dec 26, 2025)
- ✅ Nav toggle icon (compact, consistent placement) (Dec 30, 2025)

**QA Reference:** 34-QA-001..005, 35-QA-001..010, 36-QA-001..004, 37-QA-001..006

---

### Writer Core (Task 18 — Functional, In Progress)
**Status:** Drafting and project management stable; advanced features ongoing

#### Projects & Persistence
- ✅ Projects: create, select, rename, delete with double-confirm (Dec 22, 2025)
- ✅ Active project persistence and restore (Dec 22, 2025)
- ✅ Content persistence (TipTap JSON + markdown fallback) (Dec 22, 2025)
- ✅ Draft hydration gate (prevents empty overwrites during mount/switch) (Dec 30, 2025)
- ✅ Flush-on-exit and write-through local fallback (Dec 30, 2025)
- ✅ Explicit Save button + status (Saved/Saving/Failed) (Dec 30, 2025)

**QA Reference:** 18-QA-001, 18-QA-003, 18-QA-021..022

#### Context & References
- ✅ Context panel: editable plain text, chars + ~tokens display (Dec 22, 2025)
- ✅ Context: Clear + Undo last append (Dec 22, 2025)
- ✅ References: manual add, include/exclude toggle, delete with confirm (Dec 22, 2025)
- ✅ Reader → Writer: "To Context" and "To Ref" from selection/highlight (Dec 22, 2025)

**QA Reference:** 18-QA-002..006

#### Writer AI & Selection Actions
- ✅ Selection bubble menu: Simplify, Concise, Rewrite (tone submenu), Translate, Explain, Ask AI (Dec 26, 2025)
- ✅ Auto-send actions (all except Ask AI) (Dec 26, 2025)
- ✅ Apply controls: Replace selection, Insert below, Copy, To Context (Dec 26, 2025)
- ✅ Single-step Undo for apply actions (Dec 26, 2025)
- ✅ Flash-highlight inserted text (theme-aware, clears on input or after 7s) (Dec 26, 2025)
- ✅ Writer AI templates manager (Use defaults + Reset/Reset all) (Dec 26, 2025)
- ✅ Rewrite tone profiles (directive/description/examples with validation) (Dec 26, 2025)

**QA Reference:** 18-QA-023..032

#### Writer Studio (Artifacts)
- ✅ Studio actions: Kickoff, Definition, Explanation, Rewrite, Polish (Dec 30, 2025)
- ✅ Artifacts persist per project (SQLite + localStorage fallback) (Dec 30, 2025)
- ✅ Artifact list: Recent 3 + All… to preserve chat usability (Dec 30, 2025)
- ✅ Insert to Content, To Context, To Ref artifact actions (Dec 30, 2025)
- ✅ Citation constraint (On by default when refs available) (Dec 30, 2025)

**QA Reference:** 18-QA-017..018

#### Writer Chat
- ✅ Per-project multi-round chat (independent from Reader) (Dec 22, 2025)
- ✅ Chat persistence (Dec 22, 2025)
- ✅ Template dropdown with Insert (no auto-send) (Dec 22, 2025)
- ✅ Collapsible chat panel (Dec 22, 2025)
- ✅ Visual distinction (user/assistant bubbles) (Dec 26, 2025)

**QA Reference:** 18-QA-007..008

#### Tags & Markdown
- ✅ Hashtag extraction (#tag, #tag/subtag) with filter (Dec 22, 2025)
- ✅ Markdown preview toggle (Edit/Preview) (Dec 22, 2025)

**QA Reference:** 18-QA-009..010

#### In Progress (Not Yet Complete)
- 🚧 Writer global search (Content/Context/References/Chat/Studio filters) (Task 18.20, 40)
- 🚧 Outline (from markdown headings) with click-to-jump (Task 18.16)
- 🚧 Reference preview expand/collapse (Task 18.16)
- 🚧 Manual snapshots / History (Task 18.18)

---

### Chat & Persistence (Task 13 — Completed Dec 2025)
- ✅ Chat history persistence per book (SQLite + localStorage) (Dec 16, 2025)
- ✅ Draft persistence per project (Dec 16, 2025)
- ✅ Session scoping (book:{bookId} for Reader, project:{projectId} for Writer) (Dec 16, 2025)

**QA Reference:** 13-QA-001..004, 18-QA-021..022

---

### Flomo Integration (Task 23 — Completed Jan 2026)
- ✅ Flomo webhook configuration + test (Jan 2, 2026)
- ✅ Shared composer modal (Reader/Writer) (Jan 2, 2026)
- ✅ Reader: Note composer (Save, Save & Close, Save & Send) (Jan 2, 2026)
- ✅ Writer: Flomo export (selection + context) (Jan 2, 2026)
- ✅ Send history (local-only, last sent timestamp) (Jan 2, 2026)
- ✅ Writer Flomo History (recent sends with resend) (Jan 2, 2026)

**QA Reference:** 23-QA-001..009

---

### Theme & Styling (Task 17 — Completed Dec 2025)
- ✅ Theme presets: Light, Soft Dark, Ocean, Forest, Sand (Dec 17, 2025)
- ✅ Theme persistence and OS-pref initial detect (Dec 17, 2025)
- ✅ Token-based styling (Reader/Writer/Chat/Library) (Dec 17, 2025)

**QA Reference:** 17-QA-001

---

## Known Gaps & Deferred Work

### High Priority (Should Address Before 1.0)
- **Writer global search** (Task 18.20, 40) — In progress; modal implemented, needs final QA
- **Writer outline** (Task 18.16) — Partially implemented; click-to-jump needs validation
- **Writer snapshots** (Task 18.18) — Deferred; manual snapshots for content history not yet implemented

### Medium Priority (Post-Alpha)
- **Library pop-out + Recent reads** (Task 43) — New requirement; changes sidebar IA
- **Library tags/folders/status** (Task 31) — Planned; requires schema + UI
- **Library metadata extraction** (Task 44) — Planned; auto-title from PDF metadata
- **Reader/Writer chat visual parity** (Task 45) — Polish; align bubble styling
- **Find-in-document stability** (Task 28.4) — Backlog; known issues with highlight positioning

### Low Priority / Backlog
- **Phone scope adjustments** (Task 42) — Deprioritized; mobile-first layout deferred
- **Mode toggle flicker** (Task 28.11) — Polish; non-blocking visual artifact
- **RAG / "Ask the book"** (Task 20, 21) — Backlog; FTS + chunking not Alpha-critical
- **Gestures (mobile)** (Task 22) — Backlog; swipe actions deferred
- **Streaming chat** (Task 24) — Backlog; buffered responses sufficient for Alpha
- **OCR for scanned PDFs** (Task 25) — Backlog; not Alpha-critical
- **EPUB support** (Task 26) — Backlog; PDF-only for Alpha

---

## Technical Metrics

### Code Quality (Task 32 — Completed Dec 2025)
- ✅ Zod validation for persisted JSON (settings, templates, drafts)
- ✅ File/function complexity limits enforced (<250 LOC, <30 LOC, ≤3 nesting)
- ✅ No `any` usage; strict type safety
- ✅ ESLint suppressions removed via refactoring

### Test Coverage
- ✅ Store tests: libraryStore, bookmarkStore, highlightStore, shellLayoutStore, writerLayoutStore, writerSelectionTemplateStore
- ✅ Service tests: libraryImport, clipboard
- ⚠️ Coverage gaps: Reader hooks, Writer AI actions (manual QA only)

### Platform Support
- ✅ Desktop (Windows/macOS) via Tauri v2
- ✅ Web dev mode (localStorage fallback for persistence)
- ⚠️ Mobile layout exists but deprioritized (Task 42 on hold)

---

## Risk Register Status

| Risk ID | Area | Status | Notes |
|---------|------|--------|-------|
| R-001 | Reader/Highlights | Mitigated | Multi-rect normalization + merge rules implemented; known edge cases tracked |
| R-002 | Reader/Highlights | Mitigated | Alpha cap or merge rules prevent stacking; acceptable for Alpha |
| R-003 | Persistence | Mitigated | Schema in sync with PRD; decision log in CHANGELOG |
| R-004 | Web vs Desktop | Mitigated | Explicit separation enforced; web uses data URLs |
| R-005 | Performance | Open | Highlight progressive rendering exists; large library not stress-tested |
| R-006 | Tooling | Mitigated | `cmd /c npm` convention documented |
| R-007 | Library Management | Open | Trash/restore exists; tags/status schema pending |
| R-008 | Layout / UX | Mitigated | Min/max widths + Reset enforced; density validated |
| R-009 | Layout / UX | Mitigated | Sidebar width clamping + Reset + gated adjustments |

---

## Next Phase Targets

### Immediate (Next Sprint)
1. Complete Writer global search (Task 18.20, 40) — finish QA validation
2. Writer outline click-to-jump validation (Task 18.16)
3. Decide: Writer snapshots (Task 18.18) vs. Library enhancements (Tasks 43, 44, 31)

### Short-Term (1-2 Sprints)
1. Library pop-out + Recent reads + Mark as Done (Task 43)
2. Library tags/folders/status (Task 31)
3. Reader/Writer chat visual parity (Task 45)

### Medium-Term (Post-1.0)
1. Library metadata extraction (Task 44)
2. Find-in-document stability fixes (Task 28.4)
3. Writer snapshots (Task 18.18)
4. Mobile scope revisit (Task 42)

---

## Changelog Integration
This milestone is reflected in `docs/CHANGELOG.md` (Unreleased section) and tracked in `docs/TASKS.md` (status updates). For detailed acceptance test results, see `docs/QA.md`.

---

## Sign-Off
**Reader Core:** ✅ Production-ready (with tracked non-blockers)  
**Writer Core:** ✅ Functional (drafting stable; advanced features ongoing)  
**Desktop Layout:** ✅ Complete (density + adjustable splits shipped)  
**Library Management:** ✅ Basic operations complete (enhancements planned)  
**Integrations:** ✅ Flomo shipped, LLM pipeline stable  

**Recommendation:** Proceed with Library enhancements (Tasks 43, 31, 44) or complete Writer polish (Tasks 18.20, 18.16, 18.18) based on user priorities.
