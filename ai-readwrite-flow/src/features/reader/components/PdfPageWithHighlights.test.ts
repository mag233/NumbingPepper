import { describe, expect, it } from 'vitest'
import { type HighlightRect } from '../types'

const isBogusSelectionRect = (rect: HighlightRect) => {
  const area = rect.width * rect.height
  if (rect.height > 0.14) return true
  if (area > 0.22) return true
  if (rect.width > 0.92 && rect.height > 0.05) return true
  if (rect.width > 0.98 && rect.height > 0.02) return true
  return false
}

describe('PdfPageWithHighlights selection overlay', () => {
  it('filters giant selection rects while keeping normal line rects', () => {
    const ok: HighlightRect = { x: 0.1, y: 0.2, width: 0.6, height: 0.03, normalized: true }
    const giant: HighlightRect = { x: 0, y: 0, width: 1, height: 0.12, normalized: true }
    const tall: HighlightRect = { x: 0, y: 0, width: 0.9, height: 0.2, normalized: true }
    expect(isBogusSelectionRect(ok)).toBe(false)
    expect(isBogusSelectionRect(giant)).toBe(true)
    expect(isBogusSelectionRect(tall)).toBe(true)
  })
})

