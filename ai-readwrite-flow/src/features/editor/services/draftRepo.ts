import { z } from 'zod'
import { getSqlite } from '../../../lib/sqlite'
import type { JSONContent } from '@tiptap/core'

export type DraftRecord = {
  id: string
  editorDoc: JSONContent
  updatedAt: number
}

type DraftRow = {
  id: string
  editor_doc: string
  updated_at: number
}

const LOCAL_KEY_PREFIX = 'ai-readwrite-flow-draft:'

const isTipTapDoc = (value: unknown): value is JSONContent => {
  if (typeof value !== 'object' || value === null) return false
  const rec = value as Record<string, unknown>
  return rec.type === 'doc'
}

const draftSchema = z.object({
  id: z.string().min(1),
  editorDoc: z.custom<JSONContent>(isTipTapDoc),
  updatedAt: z.number().int().nonnegative(),
})

const localKey = (id: string) => `${LOCAL_KEY_PREFIX}${id}`

const readLocal = (id: string): DraftRecord | null => {
  try {
    const raw = localStorage.getItem(localKey(id))
    if (!raw) return null
    const json: unknown = JSON.parse(raw)
    const parsed = draftSchema.safeParse(json)
    if (!parsed.success) return null
    return parsed.data
  } catch {
    return null
  }
}

const writeLocal = (draft: DraftRecord) => {
  try {
    localStorage.setItem(localKey(draft.id), JSON.stringify(draft))
  } catch {
    // ignore
  }
}

const mapRow = (row: DraftRow): DraftRecord | null => {
  try {
    const doc: unknown = JSON.parse(row.editor_doc)
    if (!isTipTapDoc(doc)) return null
    const candidate: DraftRecord = { id: row.id, editorDoc: doc, updatedAt: row.updated_at }
    const parsed = draftSchema.safeParse(candidate)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export const loadDraft = async (id: string): Promise<DraftRecord | null> => {
  if (!id) return null
  const local = readLocal(id)
  const db = await getSqlite()
  if (!db) return local
  try {
    const rows = (await db.select<DraftRow[]>('SELECT id, editor_doc, updated_at FROM drafts WHERE id = ? LIMIT 1', [
      id,
    ])) ?? []
    const row = rows[0]
    const fromDb = row ? mapRow(row) : null
    if (!fromDb) return local
    if (!local) return fromDb
    return local.updatedAt >= fromDb.updatedAt ? local : fromDb
  } catch {
    return local
  }
}

export const saveDraft = async (draft: DraftRecord) => {
  const parsed = draftSchema.safeParse(draft)
  if (!parsed.success) return false

  writeLocal(parsed.data)

  const db = await getSqlite()
  if (!db) return true

  try {
    await db.execute('INSERT OR REPLACE INTO drafts (id, editor_doc, updated_at) VALUES (?, ?, ?)', [
      parsed.data.id,
      JSON.stringify(parsed.data.editorDoc),
      parsed.data.updatedAt,
    ])
    return true
  } catch {
    return true
  }
}
