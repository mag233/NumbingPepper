import { z } from 'zod'
import { getSqlite } from '../../../lib/sqlite'

export type ChatRole = 'user' | 'assistant'

export type ChatMessageRecord = {
  id: string
  sessionId: string
  role: ChatRole
  content: string
  referenceHighlightId: string | null
  createdAt: number
}

const chatMessageSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  role: z.union([z.literal('user'), z.literal('assistant')]),
  content: z.string(),
  referenceHighlightId: z.string().min(1).nullable(),
  createdAt: z.number().int().nonnegative(),
})

type ChatRow = {
  id: string
  session_id: string
  role: string
  content: string
  reference_highlight_id: string | null
  created_at: number
}

const LOCAL_KEY_PREFIX = 'ai-readwrite-flow-chat:'
const MAX_MESSAGES = 200

const createId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)

const localKey = (sessionId: string) => `${LOCAL_KEY_PREFIX}${sessionId}`

const parseMessages = (value: unknown) => {
  const parsed = z.array(chatMessageSchema).safeParse(value)
  return parsed.success ? parsed.data : []
}

const readLocal = (sessionId: string) => {
  try {
    const raw = localStorage.getItem(localKey(sessionId))
    if (!raw) return []
    const json: unknown = JSON.parse(raw)
    return parseMessages(json)
  } catch {
    return []
  }
}

const writeLocal = (sessionId: string, messages: ChatMessageRecord[]) => {
  try {
    localStorage.setItem(localKey(sessionId), JSON.stringify(messages.slice(-MAX_MESSAGES)))
  } catch {
    // ignore
  }
}

const mapRow = (row: ChatRow): ChatMessageRecord | null => {
  const candidate: ChatMessageRecord = {
    id: row.id,
    sessionId: row.session_id,
    role: row.role === 'user' || row.role === 'assistant' ? row.role : 'user',
    content: row.content,
    referenceHighlightId: row.reference_highlight_id,
    createdAt: row.created_at,
  }
  const parsed = chatMessageSchema.safeParse(candidate)
  return parsed.success ? parsed.data : null
}

export const loadChatSession = async (sessionId: string): Promise<ChatMessageRecord[]> => {
  if (!sessionId) return []
  const db = await getSqlite()
  if (!db) return readLocal(sessionId)
  try {
    const rows =
      (await db.select<ChatRow[]>(
        'SELECT id, session_id, role, content, reference_highlight_id, created_at FROM chats WHERE session_id = ? ORDER BY created_at ASC',
        [sessionId],
      )) ?? []
    return rows.map(mapRow).filter((v): v is ChatMessageRecord => Boolean(v)).slice(-MAX_MESSAGES)
  } catch {
    return readLocal(sessionId)
  }
}

export const appendChatMessage = async (input: Omit<ChatMessageRecord, 'id'> & { id?: string }) => {
  const msg: ChatMessageRecord = {
    ...input,
    id: input.id && input.id.length > 0 ? input.id : createId(),
  }
  const parsed = chatMessageSchema.safeParse(msg)
  if (!parsed.success) return null

  const db = await getSqlite()
  if (!db) {
    const existing = readLocal(msg.sessionId).filter((m) => m.id !== msg.id)
    writeLocal(msg.sessionId, [...existing, msg].sort((a, b) => a.createdAt - b.createdAt))
    return msg
  }

  try {
    await db.execute(
      `
      INSERT OR REPLACE INTO chats (
        id, session_id, role, content, reference_highlight_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `,
      [msg.id, msg.sessionId, msg.role, msg.content, msg.referenceHighlightId, msg.createdAt],
    )
    return msg
  } catch {
    const existing = readLocal(msg.sessionId).filter((m) => m.id !== msg.id)
    writeLocal(msg.sessionId, [...existing, msg].sort((a, b) => a.createdAt - b.createdAt))
    return msg
  }
}

export const clearChatSession = async (sessionId: string) => {
  if (!sessionId) return
  const db = await getSqlite()
  if (!db) {
    try {
      localStorage.removeItem(localKey(sessionId))
    } catch {
      // ignore
    }
    return
  }
  try {
    await db.execute('DELETE FROM chats WHERE session_id = ?', [sessionId])
  } catch {
    // ignore
  }
}

