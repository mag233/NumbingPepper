import { create } from 'zustand'
import { clampZoom, resetZoom, zoomIn, zoomOut } from '../features/reader/services/zoom'

export type FitMode = 'manual' | 'fitWidth' | 'fitPage'
export type FindActiveHit = { page: number; ordinal: number }
export type OutlineEntry = { title: string; page: number | null; depth: number }
export type OutlineStatus = 'idle' | 'loading' | 'ready' | 'error'

type ReaderState = {
  currentPage: number
  pageCount: number
  setPage: (page: number) => void
  setPageCount: (count: number) => void
  scrollMode: 'paged' | 'continuous'
  toggleScrollMode: () => void
  zoom: number
  setZoomValue: (zoom: number) => void
  setZoom: (zoom: number) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  fitMode: FitMode
  setFitMode: (mode: FitMode) => void
  findQuery: string
  setFindQuery: (query: string) => void
  findToken: number
  bumpFindToken: () => void
  findActiveHit: FindActiveHit | null
  setFindActiveHit: (hit: FindActiveHit | null) => void
  outline: OutlineEntry[]
  outlineStatus: OutlineStatus
  outlineError: string | null
  setOutlineLoading: () => void
  resetOutline: () => void
  setOutline: (outline: OutlineEntry[]) => void
  setOutlineError: (message: string) => void
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const useReaderStore = create<ReaderState>((set, get) => ({
  currentPage: 1,
  pageCount: 1,
  scrollMode: 'continuous',
  zoom: 1,
  fitMode: 'fitWidth',
  setPage: (page) =>
    set((state) => ({
      currentPage: clamp(page, 1, state.pageCount || 1),
    })),
  setPageCount: (count) => {
    const current = get().currentPage
    set({
      pageCount: Math.max(1, count),
      currentPage: clamp(current, 1, Math.max(1, count)),
    })
  },
  toggleScrollMode: () =>
    set((state) => ({
      scrollMode: state.scrollMode === 'continuous' ? 'paged' : 'continuous',
    })),
  setZoomValue: (zoom) => set({ zoom: clampZoom(zoom) }),
  setZoom: (zoom) => set({ zoom: clampZoom(zoom), fitMode: 'manual' }),
  zoomIn: () => set((state) => ({ zoom: zoomIn(state.zoom), fitMode: 'manual' })),
  zoomOut: () => set((state) => ({ zoom: zoomOut(state.zoom), fitMode: 'manual' })),
  resetZoom: () => set({ zoom: resetZoom(), fitMode: 'manual' }),
  setFitMode: (mode) => set({ fitMode: mode }),
  findQuery: '',
  findToken: 0,
  setFindQuery: (query) => set({ findQuery: query }),
  bumpFindToken: () => set((state) => ({ findToken: state.findToken + 1 })),
  findActiveHit: null,
  setFindActiveHit: (hit) => set({ findActiveHit: hit }),
  outline: [],
  outlineStatus: 'idle',
  outlineError: null,
  setOutlineLoading: () => set({ outlineStatus: 'loading', outlineError: null }),
  resetOutline: () => set({ outline: [], outlineStatus: 'idle', outlineError: null }),
  setOutline: (outline) => set({ outline, outlineStatus: 'ready', outlineError: null }),
  setOutlineError: (message) => set({ outline: [], outlineStatus: 'error', outlineError: message }),
}))

export default useReaderStore
