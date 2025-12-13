import { create } from 'zustand'
import {
  deleteHighlight,
  loadHighlights,
  persistHighlight,
  updateHighlightNote,
} from '../lib/db'
import { type Highlight, type HighlightColor } from '../features/reader/types'

type HighlightState = {
  byBookId: Record<string, Highlight[]>
  hydrate: (bookId: string) => Promise<void>
  add: (highlight: Highlight) => Promise<void>
  remove: (id: string, bookId: string) => Promise<void>
  setNote: (id: string, bookId: string, note: string | null) => Promise<void>
  setColor: (id: string, bookId: string, color: HighlightColor) => Promise<void>
}

const updateMap = (
  map: Record<string, Highlight[]>,
  bookId: string,
  next: Highlight[],
) => ({ ...map, [bookId]: next })

const useHighlightStore = create<HighlightState>((set, get) => ({
  byBookId: {},
  hydrate: async (bookId) => {
    if (!bookId) return
    const highlights = await loadHighlights(bookId)
    set((state) => ({ byBookId: updateMap(state.byBookId, bookId, highlights) }))
  },
  add: async (highlight) => {
    await persistHighlight(highlight)
    set((state) => {
      const current = state.byBookId[highlight.bookId] ?? []
      const next = [...current.filter((h) => h.id !== highlight.id), highlight].sort(
        (a, b) => a.createdAt - b.createdAt,
      )
      return { byBookId: updateMap(state.byBookId, highlight.bookId, next) }
    })
  },
  remove: async (id, bookId) => {
    if (!id || !bookId) return
    await deleteHighlight(id)
    set((state) => {
      const current = state.byBookId[bookId] ?? []
      return { byBookId: updateMap(state.byBookId, bookId, current.filter((h) => h.id !== id)) }
    })
  },
  setNote: async (id, bookId, note) => {
    if (!id || !bookId) return
    await updateHighlightNote(id, note)
    set((state) => {
      const current = state.byBookId[bookId] ?? []
      const next = current.map((h) => (h.id === id ? { ...h, note } : h))
      return { byBookId: updateMap(state.byBookId, bookId, next) }
    })
  },
  setColor: async (id, bookId, color) => {
    if (!id || !bookId) return
    const current = get().byBookId[bookId] ?? []
    const target = current.find((h) => h.id === id)
    if (!target) return
    await persistHighlight({ ...target, color })
    set((state) => {
      const next = (state.byBookId[bookId] ?? []).map((h) =>
        h.id === id ? { ...h, color } : h,
      )
      return { byBookId: updateMap(state.byBookId, bookId, next) }
    })
  },
}))

export default useHighlightStore

