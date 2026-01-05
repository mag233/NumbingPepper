import { bookmarkSchema, type Bookmark } from '../../features/reader/types'
import { ensureClient } from './client'

const LOCAL_BOOKMARKS_KEY = 'ai-readwrite-flow-bookmarks'

type BookmarkRow = {
  id: string
  book_id: string
  page: number
  page_label: string | null
  title: string | null
  created_at: number
  updated_at: number
}

const readLocalBookmarks = (): Bookmark[] => {
  try {
    const raw = localStorage.getItem(LOCAL_BOOKMARKS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const result: Bookmark[] = []
    for (const entry of parsed) {
      const converted = bookmarkSchema.safeParse(entry)
      if (converted.success) result.push(converted.data)
    }
    return result
  } catch (error) {
    console.warn('Local bookmarks read failed', error)
    return []
  }
}

const writeLocalBookmarks = (bookmarks: Bookmark[]) => {
  try {
    localStorage.setItem(LOCAL_BOOKMARKS_KEY, JSON.stringify(bookmarks))
  } catch (error) {
    console.warn('Local bookmarks write failed', error)
  }
}

const mapRowToBookmark = (row: BookmarkRow): Bookmark | undefined => {
  const candidate = {
    id: row.id,
    bookId: row.book_id,
    page: row.page,
    pageLabel: row.page_label ?? null,
    title: row.title ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
  const validated = bookmarkSchema.safeParse(candidate)
  return validated.success ? validated.data : undefined
}

export const loadBookmarks = async (bookId: string): Promise<Bookmark[]> => {
  if (!bookId) return []
  const db = await ensureClient()
  if (!db) return readLocalBookmarks().filter((b) => b.bookId === bookId)
  try {
    const rows =
      (await db.select<BookmarkRow[]>(
        'SELECT id, book_id, page, page_label, title, created_at, updated_at FROM bookmarks WHERE book_id = ? ORDER BY created_at ASC',
        [bookId],
      )) || []
    return rows.map(mapRowToBookmark).filter((b): b is Bookmark => Boolean(b))
  } catch (error) {
    console.warn('SQLite bookmarks read failed, falling back to local', error)
    return readLocalBookmarks().filter((b) => b.bookId === bookId)
  }
}

export const persistBookmark = async (bookmark: Bookmark) => {
  const db = await ensureClient()
  if (!db) {
    const existing = readLocalBookmarks().filter((b) => b.id !== bookmark.id)
    writeLocalBookmarks([...existing, bookmark])
    return
  }
  try {
    await db.execute(
      `
      INSERT OR REPLACE INTO bookmarks (
        id, book_id, page, page_label, title, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        bookmark.id,
        bookmark.bookId,
        bookmark.page,
        bookmark.pageLabel ?? null,
        bookmark.title ?? null,
        bookmark.createdAt,
        bookmark.updatedAt,
      ],
    )
  } catch (error) {
    console.warn('SQLite bookmark write failed, falling back to local', error)
    const existing = readLocalBookmarks().filter((b) => b.id !== bookmark.id)
    writeLocalBookmarks([...existing, bookmark])
  }
}

export const deleteBookmark = async (id: string) => {
  if (!id) return
  const db = await ensureClient()
  if (!db) {
    writeLocalBookmarks(readLocalBookmarks().filter((b) => b.id !== id))
    return
  }
  try {
    await db.execute('DELETE FROM bookmarks WHERE id = ?', [id])
  } catch (error) {
    console.warn('SQLite bookmark delete failed', error)
  }
}

export const updateBookmarkTitle = async (id: string, title: string | null, updatedAt: number) => {
  if (!id) return
  const db = await ensureClient()
  if (!db) {
    const updated = readLocalBookmarks().map((b) => (b.id === id ? { ...b, title, updatedAt } : b))
    writeLocalBookmarks(updated)
    return
  }
  try {
    await db.execute('UPDATE bookmarks SET title = ?, updated_at = ? WHERE id = ?', [title ?? null, updatedAt, id])
  } catch (error) {
    console.warn('SQLite bookmark update failed', error)
  }
}
