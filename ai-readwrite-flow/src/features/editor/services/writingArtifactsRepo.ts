import { z } from 'zod'
import { getSqlite } from '../../../lib/sqlite'
import {
  writingArtifactSchema,
  writingArtifactTypeSchema,
  writingArtifactScopeSchema,
  writingArtifactInputSnapshotSchema,
  type WritingArtifact,
} from './writingTypes'

type ArtifactRow = {
  id: string
  project_id: string
  artifact_type: string
  title: string
  content_text: string
  scope_json: string
  input_snapshot_json: string
  created_at: number
  updated_at: number
}

const LOCAL_ARTIFACTS_KEY = (projectId: string) => `ai-readwrite-flow-writing-artifacts:${projectId}`

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

const mapArtifactRow = (row: ArtifactRow): WritingArtifact | null => {
  const typeParsed = writingArtifactTypeSchema.safeParse(row.artifact_type)
  if (!typeParsed.success) return null
  const scopeParsed = writingArtifactScopeSchema.safeParse(parseJson(row.scope_json))
  if (!scopeParsed.success) return null
  const inputParsed = writingArtifactInputSnapshotSchema.safeParse(parseJson(row.input_snapshot_json))
  if (!inputParsed.success) return null

  const candidate: WritingArtifact = {
    id: row.id,
    projectId: row.project_id,
    type: typeParsed.data,
    title: row.title,
    contentText: row.content_text,
    scope: scopeParsed.data,
    inputSnapshot: inputParsed.data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
  const parsed = writingArtifactSchema.safeParse(candidate)
  return parsed.success ? parsed.data : null
}

export const loadWritingArtifacts = async (projectId: string): Promise<WritingArtifact[]> => {
  if (!projectId) return []
  const db = await getSqlite()
  if (!db) return readLocalArray(LOCAL_ARTIFACTS_KEY(projectId), writingArtifactSchema)
  try {
    const rows =
      (await db.select<ArtifactRow[]>(
        'SELECT id, project_id, artifact_type, title, content_text, scope_json, input_snapshot_json, created_at, updated_at FROM writing_artifacts WHERE project_id = ? ORDER BY updated_at DESC',
        [projectId],
      )) ?? []
    return rows.map(mapArtifactRow).filter((v): v is WritingArtifact => Boolean(v))
  } catch {
    return readLocalArray(LOCAL_ARTIFACTS_KEY(projectId), writingArtifactSchema)
  }
}

export const upsertWritingArtifact = async (artifact: WritingArtifact) => {
  const parsed = writingArtifactSchema.safeParse(artifact)
  if (!parsed.success) return false
  const db = await getSqlite()
  if (!db) {
    const key = LOCAL_ARTIFACTS_KEY(parsed.data.projectId)
    const existing = readLocalArray(key, writingArtifactSchema).filter((a) => a.id !== parsed.data.id)
    writeLocalArray(key, [parsed.data, ...existing].sort((a, b) => b.updatedAt - a.updatedAt))
    return true
  }
  try {
    await db.execute(
      `
      INSERT OR REPLACE INTO writing_artifacts (
        id, project_id, artifact_type, title, content_text, scope_json, input_snapshot_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        parsed.data.id,
        parsed.data.projectId,
        parsed.data.type,
        parsed.data.title,
        parsed.data.contentText,
        JSON.stringify(parsed.data.scope),
        JSON.stringify(parsed.data.inputSnapshot),
        parsed.data.createdAt,
        parsed.data.updatedAt,
      ],
    )
    return true
  } catch {
    return false
  }
}

export const deleteWritingArtifact = async (projectId: string, artifactId: string) => {
  if (!projectId) return false
  if (!artifactId) return false
  const db = await getSqlite()
  if (!db) {
    const key = LOCAL_ARTIFACTS_KEY(projectId)
    const next = readLocalArray(key, writingArtifactSchema).filter((a) => a.id !== artifactId)
    writeLocalArray(key, next)
    return true
  }
  try {
    await db.execute('DELETE FROM writing_artifacts WHERE id = ? AND project_id = ?', [artifactId, projectId])
    return true
  } catch {
    return false
  }
}

