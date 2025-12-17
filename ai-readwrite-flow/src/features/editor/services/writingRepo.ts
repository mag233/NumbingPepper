import { z } from 'zod'
import { getSqlite } from '../../../lib/sqlite'
import {
  rectSchema,
  writingContextSchema,
  writingProjectSchema,
  writingReferenceSchema,
  writingSourceTypeSchema,
  writingContextMembershipSchema,
  type WritingContext,
  type WritingContextMembership,
  type WritingProject,
  type WritingReference,
} from './writingTypes'

type ProjectRow = { id: string; title: string; created_at: number; updated_at: number }
type ContentRow = { project_id: string; content_text: string; updated_at: number }
type ContextRow = { project_id: string; context_text: string; updated_at: number }
type ReferenceRow = {
  id: string
  project_id: string
  source_type: string
  book_id: string | null
  page_index: number | null
  rects_json: string | null
  title: string | null
  author: string | null
  snippet_text: string
  created_at: number
}
type MembershipRow = { project_id: string; reference_id: string; included: number; order_index: number }

const LOCAL_PROJECTS_KEY = 'ai-readwrite-flow-writing-projects'
const LOCAL_CONTENT_KEY = (projectId: string) => `ai-readwrite-flow-writing-content:${projectId}`
const LOCAL_CONTEXT_KEY = (projectId: string) => `ai-readwrite-flow-writing-context:${projectId}`
const LOCAL_REFS_KEY = (projectId: string) => `ai-readwrite-flow-writing-references:${projectId}`
const LOCAL_MEMBERSHIP_KEY = (projectId: string) => `ai-readwrite-flow-writing-membership:${projectId}`

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const readLocalArray = <T>(key: string, schema: z.ZodType<T>) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = parseJson(raw)
    if (!Array.isArray(parsed)) return []
    const out: T[] = []
    for (const item of parsed) {
      const result = schema.safeParse(item)
      if (result.success) out.push(result.data)
    }
    return out
  } catch {
    return []
  }
}

const writeLocalArray = (key: string, items: unknown[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(items))
  } catch {
    // ignore
  }
}

const writeLocalObject = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

const removeLocalKey = (key: string) => {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

const mapProjectRow = (row: ProjectRow): WritingProject | null => {
  const candidate = { id: row.id, title: row.title, createdAt: row.created_at, updatedAt: row.updated_at }
  const parsed = writingProjectSchema.safeParse(candidate)
  return parsed.success ? parsed.data : null
}

const mapContentRow = (row: ContentRow) => {
  const candidate = { projectId: row.project_id, contentText: row.content_text, updatedAt: row.updated_at }
  const parsed = z.object({ projectId: z.string().min(1), contentText: z.string(), updatedAt: z.number().int().nonnegative() }).safeParse(candidate)
  return parsed.success ? parsed.data : null
}

const mapContextRow = (row: ContextRow): WritingContext | null => {
  const candidate = { projectId: row.project_id, contextText: row.context_text, updatedAt: row.updated_at }
  const parsed = writingContextSchema.safeParse(candidate)
  return parsed.success ? parsed.data : null
}

const parseRects = (raw: string | null) => {
  if (!raw) return undefined
  const parsed = parseJson(raw)
  const arr = z.array(rectSchema).safeParse(parsed)
  return arr.success ? arr.data : undefined
}

const mapReferenceRow = (row: ReferenceRow): WritingReference | null => {
  const sourceType = writingSourceTypeSchema.safeParse(row.source_type)
  if (!sourceType.success) return null
  const candidate: WritingReference = {
    id: row.id,
    projectId: row.project_id,
    sourceType: sourceType.data,
    bookId: row.book_id ?? undefined,
    pageIndex: typeof row.page_index === 'number' ? row.page_index : undefined,
    rects: parseRects(row.rects_json),
    title: row.title ?? undefined,
    author: row.author ?? undefined,
    snippetText: row.snippet_text,
    createdAt: row.created_at,
  }
  const parsed = writingReferenceSchema.safeParse(candidate)
  return parsed.success ? parsed.data : null
}

export const loadWritingProjects = async () => {
  const db = await getSqlite()
  if (!db) return readLocalArray(LOCAL_PROJECTS_KEY, writingProjectSchema)
  try {
    const rows =
      (await db.select<ProjectRow[]>('SELECT id, title, created_at, updated_at FROM writing_projects ORDER BY updated_at DESC')) ?? []
    return rows.map(mapProjectRow).filter((v): v is WritingProject => Boolean(v))
  } catch {
    return readLocalArray(LOCAL_PROJECTS_KEY, writingProjectSchema)
  }
}

export const upsertWritingProject = async (project: WritingProject) => {
  const parsed = writingProjectSchema.safeParse(project)
  if (!parsed.success) return false
  const db = await getSqlite()
  if (!db) {
    const existing = readLocalArray(LOCAL_PROJECTS_KEY, writingProjectSchema).filter((p) => p.id !== parsed.data.id)
    writeLocalArray(LOCAL_PROJECTS_KEY, [parsed.data, ...existing].sort((a, b) => b.updatedAt - a.updatedAt))
    return true
  }
  try {
    await db.execute('INSERT OR REPLACE INTO writing_projects (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)', [
      parsed.data.id,
      parsed.data.title,
      parsed.data.createdAt,
      parsed.data.updatedAt,
    ])
    return true
  } catch {
    return false
  }
}

export const deleteWritingProject = async (projectId: string) => {
  if (!projectId) return false
  const db = await getSqlite()
  if (!db) {
    const next = readLocalArray(LOCAL_PROJECTS_KEY, writingProjectSchema).filter((p) => p.id !== projectId)
    writeLocalArray(LOCAL_PROJECTS_KEY, next)
    removeLocalKey(LOCAL_CONTENT_KEY(projectId))
    removeLocalKey(LOCAL_CONTEXT_KEY(projectId))
    removeLocalKey(LOCAL_REFS_KEY(projectId))
    return true
  }
  try {
    await db.execute('DELETE FROM writing_projects WHERE id = ?', [projectId])
    return true
  } catch {
    return false
  }
}

export const loadWritingContent = async (projectId: string) => {
  if (!projectId) return null
  const db = await getSqlite()
  if (!db) {
    const parsed = z.object({ projectId: z.string().min(1), contentText: z.string(), updatedAt: z.number().int().nonnegative() }).safeParse(
      parseJson(localStorage.getItem(LOCAL_CONTENT_KEY(projectId)) ?? 'null'),
    )
    return parsed.success ? parsed.data : null
  }
  try {
    const rows =
      (await db.select<ContentRow[]>('SELECT project_id, content_text, updated_at FROM writing_contents WHERE project_id = ? LIMIT 1', [projectId])) ?? []
    return rows[0] ? mapContentRow(rows[0]) : null
  } catch {
    return null
  }
}

export const upsertWritingContent = async (projectId: string, contentText: string, updatedAt: number) => {
  if (!projectId) return false
  const db = await getSqlite()
  if (!db) {
    writeLocalObject(LOCAL_CONTENT_KEY(projectId), { projectId, contentText, updatedAt })
    return true
  }
  try {
    await db.execute(
      'INSERT OR REPLACE INTO writing_contents (project_id, content_text, updated_at) VALUES (?, ?, ?)',
      [projectId, contentText, updatedAt],
    )
    return true
  } catch {
    return false
  }
}

export const loadWritingContext = async (projectId: string): Promise<WritingContext | null> => {
  if (!projectId) return null
  const db = await getSqlite()
  if (!db) {
    const parsed = writingContextSchema.safeParse(parseJson(localStorage.getItem(LOCAL_CONTEXT_KEY(projectId)) ?? 'null'))
    return parsed.success ? parsed.data : null
  }
  try {
    const rows =
      (await db.select<ContextRow[]>('SELECT project_id, context_text, updated_at FROM writing_contexts WHERE project_id = ? LIMIT 1', [projectId])) ?? []
    return rows[0] ? mapContextRow(rows[0]) : null
  } catch {
    return null
  }
}

export const upsertWritingContext = async (context: WritingContext) => {
  const parsed = writingContextSchema.safeParse(context)
  if (!parsed.success) return false
  const db = await getSqlite()
  if (!db) {
    writeLocalObject(LOCAL_CONTEXT_KEY(parsed.data.projectId), parsed.data)
    return true
  }
  try {
    await db.execute(
      'INSERT OR REPLACE INTO writing_contexts (project_id, context_text, updated_at) VALUES (?, ?, ?)',
      [parsed.data.projectId, parsed.data.contextText, parsed.data.updatedAt],
    )
    return true
  } catch {
    return false
  }
}

export const loadWritingReferences = async (projectId: string): Promise<WritingReference[]> => {
  if (!projectId) return []
  const db = await getSqlite()
  if (!db) return readLocalArray(LOCAL_REFS_KEY(projectId), writingReferenceSchema)
  try {
    const rows =
      (await db.select<ReferenceRow[]>(
        'SELECT id, project_id, source_type, book_id, page_index, rects_json, title, author, snippet_text, created_at FROM writing_references WHERE project_id = ? ORDER BY created_at ASC',
        [projectId],
      )) ?? []
    return rows.map(mapReferenceRow).filter((v): v is WritingReference => Boolean(v))
  } catch {
    return []
  }
}

export const upsertWritingReference = async (reference: WritingReference) => {
  const parsed = writingReferenceSchema.safeParse(reference)
  if (!parsed.success) return false
  const db = await getSqlite()
  if (!db) {
    const existing = readLocalArray(LOCAL_REFS_KEY(parsed.data.projectId), writingReferenceSchema).filter((r) => r.id !== parsed.data.id)
    writeLocalArray(LOCAL_REFS_KEY(parsed.data.projectId), [...existing, parsed.data])
    return true
  }
  try {
    await db.execute(
      `
      INSERT OR REPLACE INTO writing_references (
        id, project_id, source_type, book_id, page_index, rects_json, title, author, snippet_text, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        parsed.data.id,
        parsed.data.projectId,
        parsed.data.sourceType,
        parsed.data.bookId ?? null,
        parsed.data.pageIndex ?? null,
        parsed.data.rects ? JSON.stringify(parsed.data.rects) : null,
        parsed.data.title ?? null,
        parsed.data.author ?? null,
        parsed.data.snippetText,
        parsed.data.createdAt,
      ],
    )
    return true
  } catch {
    return false
  }
}

export const deleteWritingReference = async (projectId: string, referenceId: string) => {
  if (!projectId) return false
  if (!referenceId) return false
  const db = await getSqlite()
  if (!db) {
    const next = readLocalArray(LOCAL_REFS_KEY(projectId), writingReferenceSchema).filter((r) => r.id !== referenceId)
    writeLocalArray(LOCAL_REFS_KEY(projectId), next)
    const membership = readLocalArray(LOCAL_MEMBERSHIP_KEY(projectId), writingContextMembershipSchema).filter(
      (m) => m.referenceId !== referenceId,
    )
    writeLocalArray(LOCAL_MEMBERSHIP_KEY(projectId), membership)
    return true
  }
  try {
    await db.execute('DELETE FROM writing_references WHERE id = ? AND project_id = ?', [referenceId, projectId])
    return true
  } catch {
    return false
  }
}

export const loadWritingContextMembership = async (projectId: string): Promise<WritingContextMembership[]> => {
  if (!projectId) return []
  const db = await getSqlite()
  if (!db) return readLocalArray(LOCAL_MEMBERSHIP_KEY(projectId), writingContextMembershipSchema)
  try {
    const rows =
      (await db.select<MembershipRow[]>(
        'SELECT project_id, reference_id, included, order_index FROM writing_context_membership WHERE project_id = ? ORDER BY order_index ASC',
        [projectId],
      )) ?? []
    const mapped = rows.map((row) => ({
      projectId: row.project_id,
      referenceId: row.reference_id,
      included: row.included === 1,
      orderIndex: typeof row.order_index === 'number' ? row.order_index : 0,
    }))
    return mapped
      .map((m) => writingContextMembershipSchema.safeParse(m))
      .filter((r) => r.success)
      .map((r) => r.data)
  } catch {
    return []
  }
}

export const setWritingReferenceIncluded = async (projectId: string, referenceId: string, included: boolean, orderIndex: number) => {
  if (!projectId) return false
  if (!referenceId) return false
  const candidate = { projectId, referenceId, included, orderIndex }
  const parsed = writingContextMembershipSchema.safeParse(candidate)
  if (!parsed.success) return false
  const db = await getSqlite()
  if (!db) {
    const existing = readLocalArray(LOCAL_MEMBERSHIP_KEY(projectId), writingContextMembershipSchema).filter(
      (m) => m.referenceId !== referenceId,
    )
    writeLocalArray(LOCAL_MEMBERSHIP_KEY(projectId), [...existing, parsed.data].sort((a, b) => a.orderIndex - b.orderIndex))
    return true
  }
  try {
    await db.execute(
      `
      INSERT OR REPLACE INTO writing_context_membership (
        project_id, reference_id, included, order_index
      ) VALUES (?, ?, ?, ?)
    `,
      [projectId, referenceId, included ? 1 : 0, orderIndex],
    )
    return true
  } catch {
    return false
  }
}
