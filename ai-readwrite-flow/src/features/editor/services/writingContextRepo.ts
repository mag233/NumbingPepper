import { getSqlite } from '../../../lib/sqlite'
import { writingContextSchema, type WritingContext } from './writingTypes'
import { LOCAL_CONTEXT_KEY, parseJson, writeLocalObject } from './writingRepoLocal'
import { type ContextRow, mapContextRow } from './writingRepoMappers'

export const loadWritingContext = async (projectId: string): Promise<WritingContext | null> => {
  if (!projectId) return null
  const db = await getSqlite()
  if (!db) {
    const parsed = writingContextSchema.safeParse(parseJson(localStorage.getItem(LOCAL_CONTEXT_KEY(projectId)) ?? 'null'))
    return parsed.success ? parsed.data : null
  }
  try {
    const rows =
      (await db.select<ContextRow[]>(
        'SELECT project_id, context_text, updated_at FROM writing_contexts WHERE project_id = ? LIMIT 1',
        [projectId],
      )) ?? []
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

