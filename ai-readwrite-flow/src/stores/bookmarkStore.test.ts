import { beforeEach, describe, expect, it, vi } from 'vitest'
import useBookmarkStore from './bookmarkStore'
import type { Bookmark } from '../features/reader/types'

const mockLoad = vi.fn<(...args: unknown[]) => Promise<Bookmark[]>>()
const mockPersist = vi.fn<(...args: unknown[]) => Promise<void>>()
const mockDelete = vi.fn<(...args: unknown[]) => Promise<void>>()
const mockUpdate = vi.fn<(...args: unknown[]) => Promise<void>>()

vi.mock('../lib/db', () => ({
  loadBookmarks: (...args: unknown[]) => mockLoad(...args),
  persistBookmark: (...args: unknown[]) => mockPersist(...args),
  deleteBookmark: (...args: unknown[]) => mockDelete(...args),
  updateBookmarkTitle: (...args: unknown[]) => mockUpdate(...args),
}))

const makeBookmark = (overrides: Partial<Bookmark> = {}): Bookmark => ({
  id: overrides.id ?? 'b1',
  bookId: overrides.bookId ?? 'book-1',
  page: overrides.page ?? 1,
  pageLabel: overrides.pageLabel ?? '1',
  title: overrides.title ?? null,
  createdAt: overrides.createdAt ?? 100,
  updatedAt: overrides.updatedAt ?? 100,
})

describe('bookmarkStore', () => {
  beforeEach(() => {
    useBookmarkStore.setState({ byBookId: {} })
    mockLoad.mockReset()
    mockPersist.mockReset()
    mockDelete.mockReset()
    mockUpdate.mockReset()
  })

  it('hydrates bookmarks by book id', async () => {
    const items = [makeBookmark({ id: 'a', page: 2 }), makeBookmark({ id: 'b', page: 1 })]
    mockLoad.mockResolvedValueOnce(items)
    await useBookmarkStore.getState().hydrate('book-1')
    const stored = useBookmarkStore.getState().byBookId['book-1'] ?? []
    expect(stored.map((b) => b.id)).toEqual(['b', 'a'])
  })

  it('adds and sorts bookmarks by page', async () => {
    const bookmark = makeBookmark({ id: 'c', page: 3 })
    await useBookmarkStore.getState().add(bookmark)
    const stored = useBookmarkStore.getState().byBookId['book-1'] ?? []
    expect(stored[0]?.id).toBe('c')
    expect(mockPersist).toHaveBeenCalledTimes(1)
  })

  it('renames bookmark and updates timestamp', async () => {
    const initial = makeBookmark({ id: 'd', title: null })
    useBookmarkStore.setState({ byBookId: { 'book-1': [initial] } })
    await useBookmarkStore.getState().rename('d', 'book-1', 'Chapter 1')
    const stored = useBookmarkStore.getState().byBookId['book-1'] ?? []
    expect(stored[0]?.title).toBe('Chapter 1')
    expect(mockUpdate).toHaveBeenCalledTimes(1)
  })
})
