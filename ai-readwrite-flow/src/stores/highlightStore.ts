import { create } from 'zustand'
import {
  deleteHighlight,
  loadHighlights,
  persistHighlight,
  updateHighlightNote,
} from '../lib/db'
import { type Highlight, type HighlightColor } from '../features/reader/types'
import { normalizeHighlightRects, rectSetsOverlap } from '../features/reader/services/highlightGeometry'

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
    const current = get().byBookId[highlight.bookId] ?? []
    const samePage = current.filter((h) => h.contextRange.page === highlight.contextRange.page)
    const overlaps = samePage.filter((h) =>
      rectSetsOverlap(h.contextRange.rects, highlight.contextRange.rects),
    )

    if (overlaps.length === 0) {
      const normalized = {
        ...highlight,
        contextRange: {
          ...highlight.contextRange,
          rects: normalizeHighlightRects(highlight.contextRange.rects),
        },
      }
      await persistHighlight(normalized)
      set((state) => {
        const next = [...(state.byBookId[highlight.bookId] ?? []).filter((h) => h.id !== highlight.id), normalized].sort(
          (a, b) => a.createdAt - b.createdAt,
        )
        return { byBookId: updateMap(state.byBookId, highlight.bookId, next) }
      })
      return
    }

    const primary = overlaps.reduce((min, h) => (h.createdAt < min.createdAt ? h : min), overlaps[0])
    const mergedRects = normalizeHighlightRects([
      ...primary.contextRange.rects,
      ...highlight.contextRange.rects,
      ...overlaps.flatMap((h) => h.contextRange.rects),
    ])
    const merged: Highlight = {
      ...primary,
      content: primary.content === highlight.content ? primary.content : `${primary.content}\n${highlight.content}`,
      contextRange: { ...primary.contextRange, rects: mergedRects },
    }

    // Remove the extra highlights that were merged into the primary.
    const toDelete = overlaps.filter((h) => h.id !== primary.id).map((h) => h.id)
    for (const id of toDelete) {
      await deleteHighlight(id)
    }
    await persistHighlight(merged)

    set((state) => {
      const filtered = (state.byBookId[highlight.bookId] ?? []).filter((h) => !toDelete.includes(h.id))
      const next = filtered.map((h) => (h.id === primary.id ? merged : h)).sort((a, b) => a.createdAt - b.createdAt)
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
