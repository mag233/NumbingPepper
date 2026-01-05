import { create } from 'zustand'
import { deleteBookmark, loadBookmarks, persistBookmark, updateBookmarkTitle } from '../lib/db'
import type { Bookmark } from '../features/reader/types'

type BookmarkState = {
  byBookId: Record<string, Bookmark[]>
  hydrate: (bookId: string) => Promise<void>
  add: (bookmark: Bookmark) => Promise<void>
  remove: (id: string, bookId: string) => Promise<void>
  rename: (id: string, bookId: string, title: string | null) => Promise<void>
}

const sortBookmarks = (items: Bookmark[]) =>
  [...items].sort((a, b) => (a.page === b.page ? a.createdAt - b.createdAt : a.page - b.page))

const updateMap = (map: Record<string, Bookmark[]>, bookId: string, next: Bookmark[]) => ({
  ...map,
  [bookId]: next,
})

const useBookmarkStore = create<BookmarkState>((set) => ({
  byBookId: {},
  hydrate: async (bookId) => {
    if (!bookId) return
    const bookmarks = await loadBookmarks(bookId)
    set((state) => ({ byBookId: updateMap(state.byBookId, bookId, sortBookmarks(bookmarks)) }))
  },
  add: async (bookmark) => {
    await persistBookmark(bookmark)
    set((state) => {
      const current = state.byBookId[bookmark.bookId] ?? []
      const next = sortBookmarks([...current.filter((b) => b.id !== bookmark.id), bookmark])
      return { byBookId: updateMap(state.byBookId, bookmark.bookId, next) }
    })
  },
  remove: async (id, bookId) => {
    if (!id || !bookId) return
    await deleteBookmark(id)
    set((state) => {
      const current = state.byBookId[bookId] ?? []
      return { byBookId: updateMap(state.byBookId, bookId, current.filter((b) => b.id !== id)) }
    })
  },
  rename: async (id, bookId, title) => {
    if (!id || !bookId) return
    const trimmed = title?.trim() ?? ''
    const nextTitle = trimmed.length ? trimmed : null
    const updatedAt = Date.now()
    await updateBookmarkTitle(id, nextTitle, updatedAt)
    set((state) => {
      const current = state.byBookId[bookId] ?? []
      const next = current.map((b) => (b.id === id ? { ...b, title: nextTitle, updatedAt } : b))
      return { byBookId: updateMap(state.byBookId, bookId, sortBookmarks(next)) }
    })
  },
}))

export default useBookmarkStore
