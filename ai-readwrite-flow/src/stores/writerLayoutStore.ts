import { create } from 'zustand'
import { z } from 'zod'

export type WriterLayoutDensity = 'comfortable' | 'compact'

type State = {
  splitRatio: number
  density: WriterLayoutDensity
  setSplitRatio: (ratio: number) => void
  setDensity: (density: WriterLayoutDensity) => void
  reset: () => void
}

const STORAGE_KEY = 'ai-readwrite-flow-writer-layout-v1'

const persistedSchema = z.object({
  splitRatio: z.number().finite().optional(),
  density: z.union([z.literal('comfortable'), z.literal('compact')]).optional(),
})

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const DEFAULTS: Pick<State, 'splitRatio' | 'density'> = {
  splitRatio: 0.65,
  density: 'comfortable',
}

const loadPersisted = (): Pick<State, 'splitRatio' | 'density'> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const json: unknown = JSON.parse(raw)
    const parsed = persistedSchema.safeParse(json)
    if (!parsed.success) return DEFAULTS
    return {
      splitRatio: clamp01(parsed.data.splitRatio ?? DEFAULTS.splitRatio),
      density: parsed.data.density ?? DEFAULTS.density,
    }
  } catch {
    return DEFAULTS
  }
}

const persist = (state: Pick<State, 'splitRatio' | 'density'>) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        splitRatio: clamp01(state.splitRatio),
        density: state.density,
      }),
    )
  } catch {
    // ignore
  }
}

const initial = loadPersisted()

const useWriterLayoutStore = create<State>((set) => ({
  ...initial,
  setSplitRatio: (ratio) =>
    set((state) => {
      const next = { ...state, splitRatio: clamp01(ratio) }
      persist(next)
      return { splitRatio: next.splitRatio }
    }),
  setDensity: (density) =>
    set((state) => {
      const next = { ...state, density }
      persist(next)
      return { density }
    }),
  reset: () =>
    set(() => {
      persist(DEFAULTS)
      return { ...DEFAULTS }
    }),
}))

export default useWriterLayoutStore
