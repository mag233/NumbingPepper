import Database from '@tauri-apps/plugin-sql'
import { Store } from '@tauri-apps/plugin-store'
import { defaultBaseUrl, defaultModel } from './constants'
import { isTauri } from './isTauri'

export type StoredSettings = {
  apiKey: string
  baseUrl: string
  model: string
}

export type LastReadPosition = {
  page: number
  scroll_y?: number
  zoom?: number
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
  processedForSearch?: boolean
  addedAt: number
  lastReadPosition?: LastReadPosition
}

const LOCAL_STORAGE_KEY = 'ai-readwrite-flow-settings'
const LOCAL_LIBRARY_KEY = 'ai-readwrite-flow-library'
const DEFAULT_SETTINGS: StoredSettings = {
  apiKey: '',
  baseUrl: defaultBaseUrl,
  model: defaultModel,
}
const STORE_FILE = 'settings.store.dat'

let client: Database | null = null
let store: Store | null = null

const ensureClient = async () => {
  if (!isTauri()) return null
  if (client) return client
  client = await Database.load('sqlite:settings.db')
  return client
}

const ensureStore = async () => {
  if (!isTauri()) return null
  if (store) return store
  try {
    store = await Store.load(STORE_FILE)
    return store
  } catch (error) {
    console.warn('Tauri store load failed', error)
    return null
  }
}

export const loadSettingsFromStore = async (): Promise<StoredSettings> => {
  // 1) Tauri store file
  if (isTauri()) {
    try {
      const st = await ensureStore()
      if (st) {
        const raw = await st.get<StoredSettings>('settings')
        if (raw) return { ...DEFAULT_SETTINGS, ...raw }
      }
    } catch (error) {
      console.warn('Tauri store read failed', error)
    }
  }

  // 2) localStorage to survive DB/plugin issues (also for web dev)
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch (error) {
    console.warn('Local settings read failed', error)
  }

  const db = await ensureClient()
  if (db) {
    try {
      const rows =
        (await db.select<{ key: string; value: string }[]>(
          'SELECT key, value FROM settings',
        )) || []
      if (!rows.length) return DEFAULT_SETTINGS
      const record = rows.reduce<Record<string, string>>((acc, row) => {
        acc[row.key] = row.value
        return acc
      }, {})
      return {
        apiKey: record.apiKey ?? '',
        baseUrl: record.baseUrl ?? defaultBaseUrl,
        model: record.model ?? defaultModel,
      }
    } catch (error) {
      console.warn('SQLite settings read failed, using defaults', error)
    }
  }

  return DEFAULT_SETTINGS
}

export const persistSettings = async (settings: StoredSettings) => {
  try {
    const db = await ensureClient()
    if (db) {
      try {
        await db.execute(
          'INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2)',
          ['apiKey', settings.apiKey],
        )
        await db.execute(
          'INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2)',
          ['baseUrl', settings.baseUrl],
        )
        await db.execute(
          'INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2)',
          ['model', settings.model],
        )
      } catch (error) {
        console.warn('SQLite settings write failed, still persisting to store/localStorage', error)
      }
    }
  } catch (error) {
    console.warn('SQLite client init failed', error)
  }

  try {
    const st = await ensureStore()
    if (st) {
      try {
        await st.set('settings', settings)
        await st.save()
      } catch (error) {
        console.warn('Tauri store settings write failed', error)
      }
    }
  } catch (error) {
    console.warn('Tauri store init failed', error)
  }

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.warn('Local settings write failed', error)
  }
}

const parsePosition = (raw: unknown): LastReadPosition | undefined => {
  if (!raw) return undefined
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as { page?: unknown }).page === 'number'
    ) {
      const pos = parsed as Record<string, unknown>
      return {
        page: pos.page as number,
        scroll_y: typeof pos.scroll_y === 'number' ? pos.scroll_y : undefined,
        zoom: typeof pos.zoom === 'number' ? pos.zoom : undefined,
      }
    }
  } catch (error) {
    console.warn('Failed to parse last_read_position', error)
  }
  return undefined
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

export const loadBooks = async (): Promise<BookRecord[]> => {
  const db = await ensureClient()
  if (!db) return readLocalBooks()
  try {
    const rows =
      (await db.select<Record<string, unknown>[]>(
        'SELECT id, title, author, cover_path, file_path, format, file_hash, file_size, mtime, last_read_position, processed_for_search, added_at FROM books ORDER BY added_at DESC',
      )) || []
    return rows.map(mapRowToBook)
  } catch (error) {
    console.warn('SQLite books read failed, falling back to local', error)
    return readLocalBooks()
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
        last_read_position, processed_for_search, added_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
  if (!db) {
    return readLocalBooks().find((book) => book.fileHash === hash)
  }
  try {
    const row = await db.select<Record<string, unknown>[]>(
      'SELECT id, title, author, cover_path, file_path, format, file_hash, file_size, mtime, last_read_position, processed_for_search, added_at FROM books WHERE file_hash = ? LIMIT 1',
      [hash],
    )
    if (!row || row.length === 0) return undefined
    return mapRowToBook(row[0])
  } catch (error) {
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
