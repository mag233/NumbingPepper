import { z } from 'zod'
import { ensureClient } from './client'

export type ProjectBookMembership = {
  projectId: string
  bookId: string
  createdAt: number
}

const membershipSchema = z.object({
  projectId: z.string().min(1),
  bookId: z.string().min(1),
  createdAt: z.number().int().nonnegative(),
})

const LOCAL_PROJECT_BOOKS_KEY = 'ai-readwrite-flow-project-books'

const hasNoTable = (error: unknown, table: string) =>
  error instanceof Error && error.message.includes(`no such table: ${table}`)

const readLocalMemberships = (): ProjectBookMembership[] => {
  try {
    const raw = localStorage.getItem(LOCAL_PROJECT_BOOKS_KEY)
    if (!raw) return []
    const json: unknown = JSON.parse(raw)
    if (!Array.isArray(json)) return []
    const out: ProjectBookMembership[] = []
    for (const entry of json) {
      const parsed = membershipSchema.safeParse(entry)
      if (parsed.success) out.push(parsed.data)
    }
    return out
  } catch {
    return []
  }
}

const writeLocalMemberships = (rows: ProjectBookMembership[]) => {
  try {
    localStorage.setItem(LOCAL_PROJECT_BOOKS_KEY, JSON.stringify(rows))
  } catch {
    // ignore
  }
}

const normalizeMemberships = (rows: ProjectBookMembership[]) => {
  const map = new Map<string, ProjectBookMembership>()
  for (const row of rows) {
    map.set(`${row.projectId}:${row.bookId}`, row)
  }
  return Array.from(map.values())
}

export const loadAllProjectBooks = async (): Promise<ProjectBookMembership[]> => {
  const db = await ensureClient()
  if (!db) return readLocalMemberships()
  try {
    const rows =
      (await db.select<Record<string, unknown>[]>(
        'SELECT project_id, book_id, created_at FROM project_books ORDER BY created_at ASC',
      )) ?? []
    const mapped = rows.map((row) => ({
      projectId: String(row.project_id ?? ''),
      bookId: String(row.book_id ?? ''),
      createdAt: typeof row.created_at === 'number' ? row.created_at : 0,
    }))
    return mapped
      .map((item) => membershipSchema.safeParse(item))
      .filter((r) => r.success)
      .map((r) => r.data)
  } catch (error) {
    if (hasNoTable(error, 'project_books')) return readLocalMemberships()
    return readLocalMemberships()
  }
}

export const loadProjectBooks = async (projectId: string): Promise<ProjectBookMembership[]> => {
  if (!projectId) return []
  const db = await ensureClient()
  if (!db) return readLocalMemberships().filter((row) => row.projectId === projectId)
  try {
    const rows =
      (await db.select<Record<string, unknown>[]>(
        'SELECT project_id, book_id, created_at FROM project_books WHERE project_id = ? ORDER BY created_at ASC',
        [projectId],
      )) ?? []
    const mapped = rows.map((row) => ({
      projectId: String(row.project_id ?? ''),
      bookId: String(row.book_id ?? ''),
      createdAt: typeof row.created_at === 'number' ? row.created_at : 0,
    }))
    return mapped
      .map((item) => membershipSchema.safeParse(item))
      .filter((r) => r.success)
      .map((r) => r.data)
  } catch (error) {
    if (hasNoTable(error, 'project_books')) {
      return readLocalMemberships().filter((row) => row.projectId === projectId)
    }
    return []
  }
}

export const loadBookProjects = async (bookId: string): Promise<ProjectBookMembership[]> => {
  if (!bookId) return []
  const db = await ensureClient()
  if (!db) return readLocalMemberships().filter((row) => row.bookId === bookId)
  try {
    const rows =
      (await db.select<Record<string, unknown>[]>(
        'SELECT project_id, book_id, created_at FROM project_books WHERE book_id = ? ORDER BY created_at ASC',
        [bookId],
      )) ?? []
    const mapped = rows.map((row) => ({
      projectId: String(row.project_id ?? ''),
      bookId: String(row.book_id ?? ''),
      createdAt: typeof row.created_at === 'number' ? row.created_at : 0,
    }))
    return mapped
      .map((item) => membershipSchema.safeParse(item))
      .filter((r) => r.success)
      .map((r) => r.data)
  } catch (error) {
    if (hasNoTable(error, 'project_books')) {
      return readLocalMemberships().filter((row) => row.bookId === bookId)
    }
    return []
  }
}

export const addBookToProject = async (projectId: string, bookId: string, createdAt?: number) => {
  if (!projectId || !bookId) return false
  const timestamp = typeof createdAt === 'number' ? createdAt : Date.now()
  const row: ProjectBookMembership = { projectId, bookId, createdAt: timestamp }
  const parsed = membershipSchema.safeParse(row)
  if (!parsed.success) return false

  const db = await ensureClient()
  if (!db) {
    const existing = readLocalMemberships().filter((m) => !(m.projectId === projectId && m.bookId === bookId))
    writeLocalMemberships(normalizeMemberships([...existing, parsed.data]))
    return true
  }
  try {
    await db.execute(
      'INSERT OR REPLACE INTO project_books (project_id, book_id, created_at) VALUES (?, ?, ?)',
      [projectId, bookId, timestamp],
    )
    return true
  } catch {
    return false
  }
}

export const removeBookFromProject = async (projectId: string, bookId: string) => {
  if (!projectId || !bookId) return false
  const db = await ensureClient()
  if (!db) {
    const next = readLocalMemberships().filter((m) => !(m.projectId === projectId && m.bookId === bookId))
    writeLocalMemberships(next)
    return true
  }
  try {
    await db.execute('DELETE FROM project_books WHERE project_id = ? AND book_id = ?', [projectId, bookId])
    return true
  } catch {
    return false
  }
}

export const replaceBookProjects = async (bookId: string, projectIds: string[]) => {
  if (!bookId) return false
  const uniqueProjects = Array.from(new Set(projectIds.filter(Boolean)))
  const now = Date.now()
  const db = await ensureClient()
  if (!db) {
    const existing = readLocalMemberships()
    const keep = existing.filter((m) => m.bookId !== bookId)
    const prevByProject = new Map(existing.filter((m) => m.bookId === bookId).map((m) => [m.projectId, m]))
    const next = uniqueProjects.map((projectId) => {
      const prior = prevByProject.get(projectId)
      return { projectId, bookId, createdAt: prior?.createdAt ?? now }
    })
    writeLocalMemberships(normalizeMemberships([...keep, ...next]))
    return true
  }
  try {
    await db.execute('DELETE FROM project_books WHERE book_id = ?', [bookId])
    for (const projectId of uniqueProjects) {
      await db.execute(
        'INSERT OR REPLACE INTO project_books (project_id, book_id, created_at) VALUES (?, ?, ?)',
        [projectId, bookId, now],
      )
    }
    return true
  } catch {
    return false
  }
}

export const removeProjectBooksForProject = async (projectId: string) => {
  if (!projectId) return false
  const db = await ensureClient()
  if (!db) {
    const next = readLocalMemberships().filter((m) => m.projectId !== projectId)
    writeLocalMemberships(next)
    return true
  }
  try {
    await db.execute('DELETE FROM project_books WHERE project_id = ?', [projectId])
    return true
  } catch {
    return false
  }
}

export const removeProjectBooksForBook = async (bookId: string) => {
  if (!bookId) return false
  const db = await ensureClient()
  if (!db) {
    const next = readLocalMemberships().filter((m) => m.bookId !== bookId)
    writeLocalMemberships(next)
    return true
  }
  try {
    await db.execute('DELETE FROM project_books WHERE book_id = ?', [bookId])
    return true
  } catch {
    return false
  }
}
