import { z } from 'zod'

type HistoryRecord = Record<string, number>

const STORAGE_KEY = 'ai-readwrite-flow-flomo-send-history-v1'

const historySchema = z.record(z.string(), z.number().int().nonnegative())

const loadHistory = (): HistoryRecord => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const json: unknown = JSON.parse(raw)
    const parsed = historySchema.safeParse(json)
    return parsed.success ? parsed.data : {}
  } catch {
    return {}
  }
}

const persistHistory = (history: HistoryRecord) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {
    // ignore
  }
}

export const getFlomoLastSentAt = (key: string): number | null => {
  if (!key) return null
  const history = loadHistory()
  const value = history[key]
  return typeof value === 'number' ? value : null
}

export const markFlomoSentNow = (key: string) => {
  if (!key) return
  const history = loadHistory()
  history[key] = Date.now()
  persistHistory(history)
}

export const markFlomoSentAt = (key: string, at: number) => {
  if (!key) return
  if (!Number.isFinite(at) || at <= 0) return
  const history = loadHistory()
  history[key] = Math.trunc(at)
  persistHistory(history)
}

const fnv1a = (input: string) => {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16)
}

const round4 = (value: number) => Math.round(value * 10_000) / 10_000

export const makeReaderSelectionSendKey = (args: {
  bookId: string
  page: number
  rects: { x: number; y: number; width: number; height: number }[]
}) => {
  const rectSig = args.rects
    .map((r) => `${round4(r.x)},${round4(r.y)},${round4(r.width)},${round4(r.height)}`)
    .join(';')
  return `reader:sel:${args.bookId}:${args.page}:${fnv1a(rectSig)}`
}

export const makeReaderHighlightSendKey = (bookId: string, highlightId: string) =>
  `reader:hl:${bookId}:${highlightId}`

export const makeWriterSelectionSendKey = (projectId: string, selection: string) =>
  `writer:sel:${projectId}:${fnv1a(selection.trim())}`

export const makeWriterReferenceSendKey = (projectId: string, referenceId: string) =>
  `writer:ref:${projectId}:${referenceId}`

export const makeWriterProjectSendKey = (projectId: string) => `writer:full:${projectId}`
