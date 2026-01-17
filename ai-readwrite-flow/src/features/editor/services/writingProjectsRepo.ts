import { getSqlite } from '../../../lib/sqlite'
import { removeProjectBooksForProject } from '../../../lib/db'
import { writingProjectSchema, type WritingProject } from './writingTypes'
import {
  LOCAL_CONTENT_KEY,
  LOCAL_CONTEXT_KEY,
  LOCAL_PROJECTS_KEY,
  LOCAL_REFS_KEY,
  readLocalArray,
  removeLocalKey,
  writeLocalArray,
} from './writingRepoLocal'
import { type ProjectRow, mapProjectRow } from './writingRepoMappers'

const hasNoColumn = (error: unknown, column: string) =>
  error instanceof Error && error.message.includes(`no such column: ${column}`)

export const loadWritingProjects = async () => {
  const db = await getSqlite()
  if (!db) return readLocalArray(LOCAL_PROJECTS_KEY, writingProjectSchema)
  try {
    const rows =
      (await db.select<ProjectRow[]>(
        'SELECT id, title, tags_json, created_at, updated_at FROM writing_projects ORDER BY updated_at DESC',
      )) ?? []
    return rows.map(mapProjectRow).filter((v): v is WritingProject => Boolean(v))
  } catch (error) {
    if (hasNoColumn(error, 'tags_json')) {
      try {
        const rows =
          (await db.select<ProjectRow[]>(
            'SELECT id, title, created_at, updated_at FROM writing_projects ORDER BY updated_at DESC',
          )) ?? []
        return rows.map(mapProjectRow).filter((v): v is WritingProject => Boolean(v))
      } catch {
        return readLocalArray(LOCAL_PROJECTS_KEY, writingProjectSchema)
      }
    }
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
    await db.execute(
      'INSERT OR REPLACE INTO writing_projects (id, title, tags_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [
        parsed.data.id,
        parsed.data.title,
        parsed.data.tags ? JSON.stringify(parsed.data.tags) : null,
        parsed.data.createdAt,
        parsed.data.updatedAt,
      ],
    )
    return true
  } catch (error) {
    if (hasNoColumn(error, 'tags_json')) {
      try {
        await db.execute(
          'INSERT OR REPLACE INTO writing_projects (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)',
          [parsed.data.id, parsed.data.title, parsed.data.createdAt, parsed.data.updatedAt],
        )
        return true
      } catch {
        return false
      }
    }
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
    void removeProjectBooksForProject(projectId)
    return true
  }
  try {
    await db.execute('DELETE FROM writing_projects WHERE id = ?', [projectId])
    return true
  } catch {
    return false
  }
}
