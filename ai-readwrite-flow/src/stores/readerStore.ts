import { create } from 'zustand'

type ReaderState = {
  currentPage: number
  pageCount: number
  setPage: (page: number) => void
  setPageCount: (count: number) => void
  scrollMode: 'paged' | 'continuous'
  toggleScrollMode: () => void
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const useReaderStore = create<ReaderState>((set, get) => ({
  currentPage: 1,
  pageCount: 1,
  scrollMode: 'continuous',
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
}))

export default useReaderStore
