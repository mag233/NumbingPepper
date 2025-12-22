import { getSqlite } from '../../../lib/sqlite'
import { writingContextMembershipSchema, writingReferenceSchema, type WritingReference } from './writingTypes'
import { LOCAL_MEMBERSHIP_KEY, LOCAL_REFS_KEY, readLocalArray, writeLocalArray } from './writingRepoLocal'
import { type ReferenceRow, mapReferenceRow } from './writingRepoMappers'

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

