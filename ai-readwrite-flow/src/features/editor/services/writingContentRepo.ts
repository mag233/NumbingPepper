import { z } from 'zod'
import { getSqlite } from '../../../lib/sqlite'
import { LOCAL_CONTENT_KEY, parseJson, writeLocalObject } from './writingRepoLocal'
import { type ContentRow, mapContentRow } from './writingRepoMappers'

const contentRowSchema = z.object({
  projectId: z.string().min(1),
  contentText: z.string(),
  updatedAt: z.number().int().nonnegative(),
})

export const loadWritingContent = async (projectId: string) => {
  if (!projectId) return null
  const db = await getSqlite()
  if (!db) {
    const parsed = contentRowSchema.safeParse(parseJson(localStorage.getItem(LOCAL_CONTENT_KEY(projectId)) ?? 'null'))
    return parsed.success ? parsed.data : null
  }
  try {
    const rows =
      (await db.select<ContentRow[]>(
        'SELECT project_id, content_text, updated_at FROM writing_contents WHERE project_id = ? LIMIT 1',
        [projectId],
      )) ?? []
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
    await db.execute('INSERT OR REPLACE INTO writing_contents (project_id, content_text, updated_at) VALUES (?, ?, ?)', [
      projectId,
      contentText,
      updatedAt,
    ])
    return true
  } catch {
    return false
  }
}

