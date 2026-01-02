import { create } from 'zustand'
import { z } from 'zod'

export type ReaderLayoutDensity = 'comfortable' | 'compact'

type State = {
  readerSidebarWidthPx: number
  writerSidebarWidthPx: number
  readerMainSplitRatio: number
  readerDensity: ReaderLayoutDensity
  setReaderSidebarWidthPx: (nextPx: number) => void
  setWriterSidebarWidthPx: (nextPx: number) => void
  setReaderMainSplitRatio: (nextRatio: number) => void
  setReaderDensity: (density: ReaderLayoutDensity) => void
  resetReaderLayout: () => void
  resetWriterLayout: () => void
}

const STORAGE_KEY = 'ai-readwrite-flow-shell-layout-v1'

const persistedSchema = z.object({
  readerSidebarWidthPx: z.number().finite().optional(),
  writerSidebarWidthPx: z.number().finite().optional(),
  readerMainSplitRatio: z.number().finite().optional(),
  readerDensity: z.union([z.literal('comfortable'), z.literal('compact')]).catch('comfortable'),
})

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const SIDEBAR_MIN_PX = 240
const SIDEBAR_MAX_PX = 420

const DEFAULTS: Pick<State, 'readerSidebarWidthPx' | 'writerSidebarWidthPx' | 'readerMainSplitRatio'> = {
  readerSidebarWidthPx: 320,
  writerSidebarWidthPx: 280,
  readerMainSplitRatio: 0.76,
}

const normalizePersisted = (
  persisted: Partial<Pick<State, 'readerSidebarWidthPx' | 'writerSidebarWidthPx' | 'readerMainSplitRatio' | 'readerDensity'>>,
): Pick<State, 'readerSidebarWidthPx' | 'writerSidebarWidthPx' | 'readerMainSplitRatio' | 'readerDensity'> => {
  const readerSidebarWidthPx = clamp(
    persisted.readerSidebarWidthPx ?? DEFAULTS.readerSidebarWidthPx,
    SIDEBAR_MIN_PX,
    SIDEBAR_MAX_PX,
  )
  const writerSidebarWidthPx = clamp(
    persisted.writerSidebarWidthPx ?? DEFAULTS.writerSidebarWidthPx,
    SIDEBAR_MIN_PX,
    SIDEBAR_MAX_PX,
  )

  const clampedRatio = clamp01(persisted.readerMainSplitRatio ?? DEFAULTS.readerMainSplitRatio)
  const readerDensity = persisted.readerDensity ?? 'comfortable'

  return { readerSidebarWidthPx, writerSidebarWidthPx, readerMainSplitRatio: clampedRatio, readerDensity }
}

const loadPersisted = (): Pick<State, 'readerSidebarWidthPx' | 'writerSidebarWidthPx' | 'readerMainSplitRatio' | 'readerDensity'> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS, readerDensity: 'comfortable' }
    const json: unknown = JSON.parse(raw)
    const parsed = persistedSchema.safeParse(json)
    if (!parsed.success) return { ...DEFAULTS, readerDensity: 'comfortable' }
    return normalizePersisted(parsed.data)
  } catch {
    return { ...DEFAULTS, readerDensity: 'comfortable' }
  }
}

const persist = (state: Pick<State, 'readerSidebarWidthPx' | 'writerSidebarWidthPx' | 'readerMainSplitRatio' | 'readerDensity'>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizePersisted(state)))
  } catch {
    // ignore
  }
}

const initial = loadPersisted()

const useShellLayoutStore = create<State>((set) => ({
  ...initial,
  setReaderSidebarWidthPx: (nextPx) =>
    set((state) => {
      const normalized = normalizePersisted({ ...state, readerSidebarWidthPx: nextPx })
      persist(normalized)
      return { readerSidebarWidthPx: normalized.readerSidebarWidthPx }
    }),
  setWriterSidebarWidthPx: (nextPx) =>
    set((state) => {
      const normalized = normalizePersisted({ ...state, writerSidebarWidthPx: nextPx })
      persist(normalized)
      return { writerSidebarWidthPx: normalized.writerSidebarWidthPx }
    }),
  setReaderMainSplitRatio: (nextRatio) =>
    set((state) => {
      const normalized = normalizePersisted({ ...state, readerMainSplitRatio: nextRatio })
      persist(normalized)
      return { readerMainSplitRatio: normalized.readerMainSplitRatio }
    }),
  setReaderDensity: (density) =>
    set((state) => {
      const normalized = normalizePersisted({ ...state, readerDensity: density })
      persist(normalized)
      return { readerDensity: normalized.readerDensity }
    }),
  resetReaderLayout: () =>
    set((state) => {
      const next = normalizePersisted({
        ...state,
        readerSidebarWidthPx: DEFAULTS.readerSidebarWidthPx,
        readerMainSplitRatio: DEFAULTS.readerMainSplitRatio,
        readerDensity: 'comfortable',
      })
      persist(next)
      return {
        readerSidebarWidthPx: next.readerSidebarWidthPx,
        readerMainSplitRatio: next.readerMainSplitRatio,
        readerDensity: next.readerDensity,
      }
    }),
  resetWriterLayout: () =>
    set((state) => {
      const next = normalizePersisted({ ...state, writerSidebarWidthPx: DEFAULTS.writerSidebarWidthPx })
      persist(next)
      return { writerSidebarWidthPx: next.writerSidebarWidthPx }
    }),
}))

export default useShellLayoutStore
export {
  DEFAULTS as SHELL_LAYOUT_DEFAULTS,
  SIDEBAR_MAX_PX,
  SIDEBAR_MIN_PX,
}
