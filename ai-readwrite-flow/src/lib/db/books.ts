import { ensureClient } from './client'
import { hasNoColumn, mapRowToBook, sortByRecency } from './booksHelpers'
import { readLocalBooks, writeLocalBooks } from './booksLocalStore'

export type LastReadPosition = {
  page: number
  scroll_y?: number
  zoom?: number
  fit_mode?: 'manual' | 'fitWidth' | 'fitPage'
}

export type BookRecord = {
  id: string
  title: string
  author?: string
  coverPath?: string
  filePath: string
  format: string
  fileHash?: string
  fileSize: number
  mtime?: number
  lastOpenedAt?: number
  deletedAt?: number
  processedForSearch?: boolean
  addedAt: number
  lastReadPosition?: LastReadPosition
}

export const loadBooks = async (): Promise<BookRecord[]> => {
  const db = await ensureClient()
  if (!db) return sortByRecency(readLocalBooks().filter((b) => !b.deletedAt))
  try {
    const rows =
      (await db.select<Record<string, unknown>[]>(
        'SELECT id, title, author, cover_path, file_path, format, file_hash, file_size, mtime, last_opened_at, deleted_at, last_read_position, processed_for_search, added_at FROM books WHERE deleted_at IS NULL ORDER BY COALESCE(last_opened_at, added_at) DESC',
      )) || []
    return rows.map(mapRowToBook)
  } catch (error) {
    if (hasNoColumn(error, 'last_opened_at')) {
      try {
        const rows =
          (await db.select<Record<string, unknown>[]>(
            'SELECT id, title, author, cover_path, file_path, format, file_hash, file_size, mtime, deleted_at, last_read_position, processed_for_search, added_at FROM books WHERE deleted_at IS NULL ORDER BY added_at DESC',
          )) || []
        return sortByRecency(rows.map(mapRowToBook))
      } catch (fallbackError) {
        console.warn('SQLite books read failed (no last_opened_at), falling back to local', fallbackError)
        return sortByRecency(readLocalBooks().filter((b) => !b.deletedAt))
      }
    }
    console.warn('SQLite books read failed, falling back to local', error)
    return readLocalBooks().filter((b) => !b.deletedAt)
  }
}

export const loadDeletedBooks = async (): Promise<BookRecord[]> => {
  const db = await ensureClient()
  if (!db) return sortByRecency(readLocalBooks().filter((b) => Boolean(b.deletedAt)))
  try {
    const rows =
      (await db.select<Record<string, unknown>[]>(
        'SELECT id, title, author, cover_path, file_path, format, file_hash, file_size, mtime, last_opened_at, deleted_at, last_read_position, processed_for_search, added_at FROM books WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC',
      )) || []
    return rows.map(mapRowToBook)
  } catch (error) {
    console.warn('SQLite deleted books read failed, falling back to local', error)
    return sortByRecency(readLocalBooks().filter((b) => Boolean(b.deletedAt)))
  }
}

export const persistBook = async (book: BookRecord) => {
  const db = await ensureClient()
  if (!db) {
    const existing = readLocalBooks().filter((item) => item.id !== book.id)
    writeLocalBooks([book, ...existing])
    return
  }
  try {
    await db.execute(
      `
      INSERT OR REPLACE INTO books (
        id, title, author, cover_path, file_path, format, file_hash, file_size, mtime,
        last_opened_at, deleted_at, last_read_position, processed_for_search, added_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        book.id,
        book.title,
        book.author ?? null,
        book.coverPath ?? null,
        book.filePath,
        book.format,
        book.fileHash ?? null,
        book.fileSize,
        book.mtime ?? null,
        book.lastOpenedAt ?? null,
        book.deletedAt ?? null,
        book.lastReadPosition ? JSON.stringify(book.lastReadPosition) : null,
        book.processedForSearch ? 1 : 0,
        book.addedAt,
      ],
    )
  } catch (error) {
    console.warn('SQLite books write failed, falling back to local', error)
    const existing = readLocalBooks().filter((item) => item.id !== book.id)
    writeLocalBooks([book, ...existing])
  }
}

export const findBookByHash = async (hash: string): Promise<BookRecord | undefined> => {
  if (!hash) return undefined
  const db = await ensureClient()
  if (!db) return readLocalBooks().find((book) => book.fileHash === hash)
  try {
    const row = await db.select<Record<string, unknown>[]>(
      'SELECT id, title, author, cover_path, file_path, format, file_hash, file_size, mtime, last_opened_at, deleted_at, last_read_position, processed_for_search, added_at FROM books WHERE file_hash = ? LIMIT 1',
      [hash],
    )
    if (!row || row.length === 0) return undefined
    return mapRowToBook(row[0])
  } catch (error) {
    if (hasNoColumn(error, 'last_opened_at')) {
      try {
        const row = await db.select<Record<string, unknown>[]>(
          'SELECT id, title, author, cover_path, file_path, format, file_hash, file_size, mtime, deleted_at, last_read_position, processed_for_search, added_at FROM books WHERE file_hash = ? LIMIT 1',
          [hash],
        )
        if (!row || row.length === 0) return undefined
        return mapRowToBook(row[0])
      } catch (fallbackError) {
        console.warn('SQLite books hash lookup failed (no last_opened_at)', fallbackError)
        return undefined
      }
    }
    console.warn('SQLite books hash lookup failed', error)
    return undefined
  }
}

export const updateLastReadPosition = async (bookId: string, position: LastReadPosition) => {
  if (!bookId) return
  const db = await ensureClient()
  const payload = JSON.stringify(position)
  if (!db) {
    const books = readLocalBooks()
    const updated = books.map((book) =>
      book.id === bookId ? { ...book, lastReadPosition: position } : book,
    )
    writeLocalBooks(updated)
    return
  }
  try {
    await db.execute('UPDATE books SET last_read_position = ? WHERE id = ?', [payload, bookId])
  } catch (error) {
    console.warn('SQLite last_read_position update failed', error)
  }
}

export const updateLastOpenedAt = async (bookId: string, openedAt: number) => {
  if (!bookId) return
  const db = await ensureClient()
  if (!db) {
    const books = readLocalBooks()
    const updated = books.map((book) => (book.id === bookId ? { ...book, lastOpenedAt: openedAt } : book))
    writeLocalBooks(updated)
    return
  }
  try {
    await db.execute('UPDATE books SET last_opened_at = ? WHERE id = ?', [openedAt, bookId])
  } catch (error) {
    console.warn('SQLite last_opened_at update failed', error)
  }
}

export const softDeleteBook = async (bookId: string, deletedAt: number) => {
  if (!bookId) return
  const db = await ensureClient()
  if (!db) {
    const updated = readLocalBooks().map((book) => (book.id === bookId ? { ...book, deletedAt } : book))
    writeLocalBooks(updated)
    return
  }
  try {
    await db.execute('UPDATE books SET deleted_at = ? WHERE id = ?', [deletedAt, bookId])
  } catch (error) {
    console.warn('SQLite book soft delete failed', error)
  }
}

export const restoreBook = async (bookId: string) => {
  if (!bookId) return
  const db = await ensureClient()
  if (!db) {
    const updated = readLocalBooks().map((book) => (book.id === bookId ? { ...book, deletedAt: undefined } : book))
    writeLocalBooks(updated)
    return
  }
  try {
    await db.execute('UPDATE books SET deleted_at = NULL WHERE id = ?', [bookId])
  } catch (error) {
    console.warn('SQLite book restore failed', error)
  }
}

export const removeBook = async (bookId: string) => {
  if (!bookId) return
  const db = await ensureClient()
  if (!db) {
    writeLocalBooks(readLocalBooks().filter((book) => book.id !== bookId))
    return
  }
  try {
    await db.execute('DELETE FROM books WHERE id = ?', [bookId])
    await db.execute('DELETE FROM chats WHERE session_id = ?', [`book:${bookId}`])
    await db.execute('DELETE FROM drafts WHERE id = ?', [`book:${bookId}`])
  } catch (error) {
    console.warn('SQLite remove book failed', error)
  }
}
