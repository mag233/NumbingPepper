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

const median = (values: number[]) => {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)] ?? 0
}

const filterOutlierRects = (rects: HighlightRect[]) => {
  if (rects.length < 3) return rects
  const med = median(rects.map((r) => r.height))
  const maxHeight = Math.min(0.16, med > 0 ? med * 4.5 : 0.08)
  const maxArea = 0.42
  return rects.filter((r) => {
    const area = r.width * r.height
    if (r.height > 0.24) return false
    if (area > maxArea) return false
    if (r.height > maxHeight && r.width > 0.82) return false
    return true
  })
}

export const mergeRectsByLine = (rects: HighlightRect[]) => {
  const sorted = filterOutlierRects(unionRects(rects))
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

const xOverlap = (a: HighlightRect, b: HighlightRect) =>
  Math.max(0, Math.min(rectRight(a), rectRight(b)) - Math.max(a.x, b.x))

const enforceVerticalGap = (rects: HighlightRect[], minGap = 0.002) => {
  const next = rects.map((r) => ({ ...r }))
  type Track = { lastIdx: number; last: HighlightRect }
  const tracks: Track[] = []

  const findTrack = (rect: HighlightRect): Track | undefined => {
    let best: { track: Track; score: number } | undefined
    for (const track of tracks) {
      const overlap = xOverlap(track.last, rect)
      if (overlap <= 0) continue
      const ratio = overlap / Math.min(track.last.width || 1, rect.width || 1)
      if (ratio < 0.25) continue
      if (!best || ratio > best.score) best = { track, score: ratio }
    }
    return best?.track
  }

  for (let idx = 0; idx < next.length; idx += 1) {
    const rect = next[idx]!
    const track = findTrack(rect)
    if (!track) {
      tracks.push({ lastIdx: idx, last: rect })
      continue
    }

    const prev = track.last
    const maxBottom = rect.y - minGap
    if (rectBottom(prev) > maxBottom && maxBottom > prev.y) {
      const trimmed = clampRect({ ...prev, height: maxBottom - prev.y })
      next[track.lastIdx] = trimmed
      track.last = trimmed
    }

    track.lastIdx = idx
    track.last = rect
  }

  return next.filter((r) => r.width > 0 && r.height > 0)
}

export const normalizeHighlightRects = (rects: HighlightRect[]) => {
  const merged = mergeRectsByLine(rects).map((r) => shrinkForLegibility(r))
  return enforceVerticalGap(merged)
}

export const rectSetsOverlap = (a: HighlightRect[], b: HighlightRect[]) =>
  a.some((ra) => b.some((rb) => rectsOverlap(ra, rb)))
