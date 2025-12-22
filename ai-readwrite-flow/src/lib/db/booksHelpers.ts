import type { BookRecord, LastReadPosition } from './books'
import { lastReadPositionSchema } from './booksSchemas'

export const hasNoColumn = (error: unknown, column: string) =>
  error instanceof Error && error.message.includes(`no such column: ${column}`)

export const parsePosition = (raw: unknown): LastReadPosition | undefined => {
  try {
    const json: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw
    const parsed = lastReadPositionSchema.safeParse(json)
    return parsed.success ? parsed.data : undefined
  } catch (error) {
    console.warn('Failed to parse last_read_position', error)
    return undefined
  }
}

export const mapRowToBook = (row: Record<string, unknown>): BookRecord => ({
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

export const sortByRecency = (books: BookRecord[]) =>
  [...books].sort((a, b) => (b.lastOpenedAt ?? b.addedAt) - (a.lastOpenedAt ?? a.addedAt))

