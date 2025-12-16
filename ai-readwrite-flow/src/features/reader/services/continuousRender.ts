export type ScrollMetrics = {
  scrollTop: number
  clientHeight: number
  scrollHeight: number
}

export const isNearBottom = (m: ScrollMetrics, thresholdPx = 800) =>
  m.scrollTop + m.clientHeight >= m.scrollHeight - thresholdPx

export const nextRenderCount = (current: number, total: number, step = 3) =>
  Math.min(total, Math.max(current, 0) + step)

