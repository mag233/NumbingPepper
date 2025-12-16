import { ensureClient } from './client'

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

const LOCAL_LIBRARY_KEY = 'ai-readwrite-flow-library'

const hasNoColumn = (error: unknown, column: string) =>
  error instanceof Error && error.message.includes(`no such column: ${column}`)

const parsePosition = (raw: unknown): LastReadPosition | undefined => {
  if (!raw) return undefined
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (typeof parsed !== 'object' || parsed === null) return undefined
    const pos = parsed as Record<string, unknown>
    if (typeof pos.page !== 'number') return undefined
    return {
      page: pos.page,
      scroll_y: typeof pos.scroll_y === 'number' ? pos.scroll_y : undefined,
      zoom: typeof pos.zoom === 'number' ? pos.zoom : undefined,
      fit_mode:
        pos.fit_mode === 'manual' || pos.fit_mode === 'fitWidth' || pos.fit_mode === 'fitPage'
          ? pos.fit_mode
          : undefined,
    }
  } catch (error) {
    console.warn('Failed to parse last_read_position', error)
    return undefined
  }
}

const mapRowToBook = (row: Record<string, unknown>): BookRecord => ({
  id: String(row.id),
  title: String(row.title ?? row.file_name ?? 'Untitled'),
  author: typeof row.author === 'string' ? row.author : undefined,
  coverPath: typeof row.cover_path === 'string' ? row.cover_path : undefined,
  filePath: String(row.file_path),
  format: typeof row.format === 'string' ? row.format : 'pdf',
  fileHash: typeof row.file_hash === 'string' ? row.file_hash : undefined,
  fileSize: typeof row.file_size === 'number' ? row.file_size : Number(row.file_size ?? 0),
  mtime: typeof row.mtime === 'number' ? row.mtime : undefined,
  lastOpenedAt: typeof row.last_opened_at === 'number' ? row.last_opened_at : undefined,
  deletedAt: typeof row.deleted_at === 'number' ? row.deleted_at : undefined,
  processedForSearch:
    typeof row.processed_for_search === 'number'
      ? row.processed_for_search === 1
      : Boolean(row.processed_for_search),
  addedAt: typeof row.added_at === 'number' ? row.added_at : Number(row.added_at ?? Date.now()),
  lastReadPosition: parsePosition(row.last_read_position),
})

const readLocalBooks = (): BookRecord[] => {
  try {
    const raw = localStorage.getItem(LOCAL_LIBRARY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as BookRecord[]
  } catch (error) {
    console.warn('Local library read failed', error)
    return []
  }
}

const writeLocalBooks = (books: BookRecord[]) => {
  try {
    localStorage.setItem(LOCAL_LIBRARY_KEY, JSON.stringify(books))
  } catch (error) {
    console.warn('Local library write failed', error)
  }
}

const sortByRecency = (books: BookRecord[]) =>
  [...books].sort((a, b) => (b.lastOpenedAt ?? b.addedAt) - (a.lastOpenedAt ?? a.addedAt))

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
