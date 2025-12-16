import { type Highlight, type HighlightRect } from '../types'

const rectContains = (rect: HighlightRect, x: number, y: number) =>
  x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height

export const pickHighlightAtPoint = (
  highlights: Highlight[],
  x: number,
  y: number,
): Highlight | undefined => {
  if (!highlights.length) return undefined
  // Prefer newest highlight visually on top.
  const sorted = [...highlights].sort((a, b) => b.createdAt - a.createdAt)
  return sorted.find((h) => h.contextRange.rects.some((r) => rectContains(r, x, y)))
}

