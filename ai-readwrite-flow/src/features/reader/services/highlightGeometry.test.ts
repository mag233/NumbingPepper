import { describe, expect, it } from 'vitest'
import { mergeRectsByLine, normalizeHighlightRects, rectSetsOverlap } from './highlightGeometry'

describe('highlightGeometry', () => {
  it('merges multi-rect fragments into fewer line rects', () => {
    const rects = normalizeHighlightRects([
      { x: 0.1, y: 0.2, width: 0.1, height: 0.05, normalized: true },
      { x: 0.21, y: 0.2005, width: 0.1, height: 0.05, normalized: true },
      { x: 0.1, y: 0.27, width: 0.12, height: 0.05, normalized: true },
    ])
    expect(rects.length).toBe(2)
  })

  it('detects overlap between rect sets', () => {
    const a = [{ x: 0.1, y: 0.2, width: 0.3, height: 0.1, normalized: true as const }]
    const b = [{ x: 0.2, y: 0.25, width: 0.3, height: 0.1, normalized: true as const }]
    expect(rectSetsOverlap(a, b)).toBe(true)
  })

  it('does not bridge large horizontal gaps (multi-column)', () => {
    const rects = [
      { x: 0.08, y: 0.1, width: 0.3, height: 0.03, normalized: true as const },
      { x: 0.62, y: 0.102, width: 0.3, height: 0.03, normalized: true as const },
    ]
    const merged = mergeRectsByLine(rects)
    expect(merged).toHaveLength(2)
    expect(merged[0]!.x).toBeCloseTo(0.08, 3)
    expect(merged[1]!.x).toBeCloseTo(0.62, 3)
  })
})
