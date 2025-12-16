import { highlightSchema, type Highlight } from '../../features/reader/types'
import { ensureClient } from './client'

const LOCAL_HIGHLIGHTS_KEY = 'ai-readwrite-flow-highlights'

type HighlightRow = {
  id: string
  book_id: string
  content: string
  context_range: string
  color: string
  note?: string | null
  created_at: number
}

const readLocalHighlights = (): Highlight[] => {
  try {
    const raw = localStorage.getItem(LOCAL_HIGHLIGHTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const result: Highlight[] = []
    for (const entry of parsed) {
      const converted = highlightSchema.safeParse(entry)
      if (converted.success) result.push(converted.data)
    }
    return result
  } catch (error) {
    console.warn('Local highlights read failed', error)
    return []
  }
}

const writeLocalHighlights = (highlights: Highlight[]) => {
  try {
    localStorage.setItem(LOCAL_HIGHLIGHTS_KEY, JSON.stringify(highlights))
  } catch (error) {
    console.warn('Local highlights write failed', error)
  }
}

const mapRowToHighlight = (row: HighlightRow): Highlight | undefined => {
  const parsedContext = (() => {
    try {
      return JSON.parse(row.context_range)
    } catch {
      return undefined
    }
  })()
  const candidate = {
    id: row.id,
    bookId: row.book_id,
    content: row.content,
    color: row.color,
    note: row.note ?? null,
    contextRange: parsedContext,
    createdAt: row.created_at,
  }
  const validated = highlightSchema.safeParse(candidate)
  return validated.success ? validated.data : undefined
}

export const loadHighlights = async (bookId: string): Promise<Highlight[]> => {
  if (!bookId) return []
  const db = await ensureClient()
  if (!db) return readLocalHighlights().filter((h) => h.bookId === bookId)
  try {
    const rows =
      (await db.select<HighlightRow[]>(
        'SELECT id, book_id, content, context_range, color, note, created_at FROM highlights WHERE book_id = ? ORDER BY created_at ASC',
        [bookId],
      )) || []
    return rows.map(mapRowToHighlight).filter((h): h is Highlight => Boolean(h))
  } catch (error) {
    console.warn('SQLite highlights read failed, falling back to local', error)
    return readLocalHighlights().filter((h) => h.bookId === bookId)
  }
}

export const persistHighlight = async (highlight: Highlight) => {
  const db = await ensureClient()
  if (!db) {
    const existing = readLocalHighlights().filter((h) => h.id !== highlight.id)
    writeLocalHighlights([...existing, highlight])
    return
  }
  try {
    await db.execute(
      `
      INSERT OR REPLACE INTO highlights (
        id, book_id, content, context_range, color, note, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        highlight.id,
        highlight.bookId,
        highlight.content,
        JSON.stringify(highlight.contextRange),
        highlight.color,
        highlight.note ?? null,
        highlight.createdAt,
      ],
    )
  } catch (error) {
    console.warn('SQLite highlight write failed, falling back to local', error)
    const existing = readLocalHighlights().filter((h) => h.id !== highlight.id)
    writeLocalHighlights([...existing, highlight])
  }
}

export const deleteHighlight = async (id: string) => {
  if (!id) return
  const db = await ensureClient()
  if (!db) {
    writeLocalHighlights(readLocalHighlights().filter((h) => h.id !== id))
    return
  }
  try {
    await db.execute('DELETE FROM highlights WHERE id = ?', [id])
  } catch (error) {
    console.warn('SQLite highlight delete failed', error)
  }
}

export const updateHighlightNote = async (id: string, note: string | null) => {
  if (!id) return
  const db = await ensureClient()
  if (!db) {
    const updated = readLocalHighlights().map((h) => (h.id === id ? { ...h, note } : h))
    writeLocalHighlights(updated)
    return
  }
  try {
    await db.execute('UPDATE highlights SET note = ? WHERE id = ?', [note, id])
  } catch (error) {
    console.warn('SQLite highlight note update failed', error)
  }
}

