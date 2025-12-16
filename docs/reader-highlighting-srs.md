# SRS — Reader Highlighting

## 1. Goals
- Kindle-like highlights that users trust: aligned to text, stable across zoom/window size, persisted and restorable.
- Support highlight creation from selection, selection clearing, and overlay rendering without visual artifacts.
- Provide interactions: click-to-select, edit color, edit note, delete (confirm), and context-aware actions (Ask AI / Summarize / Explain / Generate Questions).

## 2. Non-goals (for Alpha)
- OCR-based selectable text for scanned PDFs.
- Cross-device sync.
- Perfect glyph-accurate highlighting (PDF text layer limitations); we target “close enough” per line.

## 3. Data Contracts
### 3.1 Highlight
- `id: string` (UUID)
- `bookId: string`
- `content: string` (selected text)
- `color: 'yellow'|'red'|'blue'`
- `note?: string | null`
- `contextRange`:
  - `page: number` (1-based)
  - `rects: Array<{ x:number; y:number; width:number; height:number; normalized:true }>` (normalized 0–1 relative to a stable page host)
  - `zoom?: number | null` (optional)
- `createdAt: number` (ms epoch)

### 3.2 Storage
- Desktop: SQLite `highlights` table.
- Web fallback: localStorage key `ai-readwrite-flow-highlights`.

## 4. Geometry & Rendering
### 4.1 Normalization host
- Rect normalization MUST use a stable host per page, not the `.react-pdf__Page` element itself.
- The host is an element with attribute `data-arwf-page-host`.

### 4.2 Rect generation
- Use `range.getClientRects()` to capture per-line fragments.
- Filter out zero-area rects.
- Clamp each rect to `[0,1]` bounds.

### 4.3 Overlap control
- Vertical clamp: prevent a rect from overlapping the rect above/below on adjacent lines by enforcing a minimum gap (or trimming).
- Horizontal clamp: rects must not exceed page width.

### 4.4 Repeated highlights
- If the new highlight overlaps an existing highlight on the same page:
  - Preferred: merge into a single highlight (union of rects) and keep content concatenated or preserve earliest content.
  - Alternative: keep separate highlights but cap alpha so stacking does not darken.

### 4.5 Layering
- Overlays must render above the PDF canvas/text layers (z-index above).
- Use blend mode (`mix-blend-multiply`) to keep text legible.
- Default overlays must be non-interactive (pointer-events none) except when selecting an existing highlight.

## 5. User Interactions
### 5.1 Create
- Select text → click `Highlight` → highlight is persisted; selection clears; overlay appears immediately.

### 5.2 Select existing highlight
- Clicking an overlay selects it (single selection).
- Selected state shows outline and popover.

### 5.3 Edit
- Popover allows:
  - Change color.
  - Add/edit note.
  - Ask AI (opens Chat with `Context:` + `Instruction:` and focuses input for additional typing).
  - Summarize / Explain (shortcut prompts; may auto-send).
  - Generate Questions (shortcut prompt; may auto-send).

### 5.4 Delete
- Delete action removes highlight; requires a confirm step (2-click) to prevent accidental deletion.

## 6. Acceptance Tests (Manual)
1. Create highlight on a single line: overlay fits the line and does not overflow into margins.
2. Create highlight across multiple lines: overlays appear per line, no overlap between lines.
3. Create highlight twice on same text: overlays do not create darker stacked blocks beyond expectations (merge or alpha cap).
4. Restart app / refresh web: highlights reappear on correct pages.
5. Resize window: highlights remain aligned to text.
6. Click existing highlight: popover appears; Ask AI opens Chat and focuses the textarea for extra instructions.
7. Save note: show “Saving…” then “Saved”; persists after restart/refresh.
8. Delete: requires confirm; persists after restart/refresh.

## 7. Risks & Mitigations
- PDF text layer transforms differ across platforms → rely on `getClientRects()` and stable host normalization; add clamps/merge.
- Continuous scroll mounting/unmounting pages → render highlights only for mounted pages; hydrate per book on open.
