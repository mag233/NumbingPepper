import { type HighlightRect } from '../types'

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

export const clampRect = (rect: HighlightRect): HighlightRect => {
  const x = clamp01(rect.x)
  const y = clamp01(rect.y)
  const width = clamp01(rect.width)
  const height = clamp01(rect.height)
  return {
    x,
    y,
    width: clamp01(Math.min(width, 1 - x)),
    height: clamp01(Math.min(height, 1 - y)),
    normalized: true,
  }
}

const rectRight = (r: HighlightRect) => r.x + r.width
const rectBottom = (r: HighlightRect) => r.y + r.height

export const rectsOverlap = (a: HighlightRect, b: HighlightRect, epsilon = 0.0005) => {
  const left = Math.max(a.x, b.x)
  const top = Math.max(a.y, b.y)
  const right = Math.min(rectRight(a), rectRight(b))
  const bottom = Math.min(rectBottom(a), rectBottom(b))
  return right - left > epsilon && bottom - top > epsilon
}

export const unionRects = (rects: HighlightRect[]): HighlightRect[] => {
  const next = rects.map(clampRect).filter((r) => r.width > 0 && r.height > 0)
  next.sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y))
  return next
}

const groupByLine = (rects: HighlightRect[], yThreshold = 0.012): HighlightRect[][] => {
  const groups: HighlightRect[][] = []
  for (const rect of rects) {
    const group = groups.find((g) => Math.abs(g[0].y - rect.y) <= yThreshold)
    if (group) {
      group.push(rect)
    } else {
      groups.push([rect])
    }
  }
  return groups
}

const mergeLineGroup = (rects: HighlightRect[]): HighlightRect => {
  const minX = Math.min(...rects.map((r) => r.x))
  const maxRight = Math.max(...rects.map(rectRight))
  const minY = Math.min(...rects.map((r) => r.y))
  const maxBottom = Math.max(...rects.map(rectBottom))
  return clampRect({
    x: minX,
    y: minY,
    width: maxRight - minX,
    height: maxBottom - minY,
    normalized: true,
  })
}

const splitByHorizontalGap = (rects: HighlightRect[], gapThreshold = 0.06): HighlightRect[][] => {
  const sorted = [...rects].sort((a, b) => a.x - b.x)
  const groups: HighlightRect[][] = []
  for (const rect of sorted) {
    const lastGroup = groups[groups.length - 1]
    if (!lastGroup) {
      groups.push([rect])
      continue
    }
    const last = lastGroup[lastGroup.length - 1]
    const gap = rect.x - rectRight(last)
    if (gap > gapThreshold) {
      groups.push([rect])
      continue
    }
    lastGroup.push(rect)
  }
  return groups
}

export const mergeRectsByLine = (rects: HighlightRect[]) => {
  const sorted = unionRects(rects)
  const groups = groupByLine(sorted)
  const merged = groups.flatMap((g) => splitByHorizontalGap(g).map(mergeLineGroup))
  return merged.sort((a, b) => a.y - b.y)
}

export const shrinkForLegibility = (
  rect: HighlightRect,
  topPadRatio = 0.14,
  heightRatio = 0.72,
): HighlightRect => {
  const height = rect.height * heightRatio
  const y = rect.y + rect.height * topPadRatio
  return clampRect({ ...rect, y, height })
}

export const normalizeHighlightRects = (rects: HighlightRect[]) => {
  const merged = mergeRectsByLine(rects).map((r) => shrinkForLegibility(r))
  return merged.filter((r) => r.width > 0 && r.height > 0)
}

export const rectSetsOverlap = (a: HighlightRect[], b: HighlightRect[]) =>
  a.some((ra) => b.some((rb) => rectsOverlap(ra, rb)))
