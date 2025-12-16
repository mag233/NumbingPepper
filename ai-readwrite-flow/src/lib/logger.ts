import { z } from 'zod'
import { getSqlite } from './sqlite'

export type LogLevel = 'info' | 'warn' | 'error'

export type LogEvent = {
  id: string
  level: LogLevel
  message: string
  context: Record<string, unknown> | null
  createdAt: number
}

const LOG_KEY = 'ai-readwrite-flow-log'
const MAX_EVENTS = 500
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000

const logEventSchema = z.object({
  id: z.string().min(1),
  level: z.union([z.literal('info'), z.literal('warn'), z.literal('error')]),
  message: z.string(),
  context: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.number().int().nonnegative(),
})

const createId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)

const nowMs = () => Date.now()

const omitSecretKeys = (context: Record<string, unknown>) => {
  const forbidden = new Set(['apiKey', 'authorization', 'Authorization'])
  return Object.fromEntries(Object.entries(context).filter(([k]) => !forbidden.has(k)))
}

const safeContext = (context: Record<string, unknown> | undefined) => {
  if (!context) return null
  return omitSecretKeys(context)
}

const readLocal = () => {
  try {
    const raw = localStorage.getItem(LOG_KEY)
    if (!raw) return []
    const json: unknown = JSON.parse(raw)
    const parsed = z.array(logEventSchema).safeParse(json)
    return parsed.success ? parsed.data : []
  } catch {
    return []
  }
}

const writeLocal = (events: LogEvent[]) => {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(events))
  } catch {
    // ignore
  }
}

const prune = (events: LogEvent[]) => {
  const cutoff = nowMs() - RETENTION_MS
  return events.filter((e) => e.createdAt >= cutoff).slice(-MAX_EVENTS)
}

const ensureLogsTable = async () => {
  const db = await getSqlite()
  if (!db) return null
  await db.execute(
    'CREATE TABLE IF NOT EXISTS app_logs (id TEXT PRIMARY KEY, level TEXT NOT NULL, message TEXT NOT NULL, context TEXT, created_at INTEGER NOT NULL)',
  )
  return db
}

const writeConsole = (event: LogEvent) => {
  const ctx = event.context ?? {}
  if (event.level === 'error') console.error(event.message, ctx)
  if (event.level === 'warn') console.warn(event.message, ctx)
  if (event.level === 'info') console.info(event.message, ctx)
}

const persistLocal = (event: LogEvent) => {
  const nextLocal = prune([...readLocal(), event])
  writeLocal(nextLocal)
}

const persistDb = async (event: LogEvent) => {
  const db = await ensureLogsTable()
  if (!db) return
  await db.execute(
    'INSERT OR REPLACE INTO app_logs (id, level, message, context, created_at) VALUES (?, ?, ?, ?, ?)',
    [event.id, event.level, event.message, event.context ? JSON.stringify(event.context) : null, event.createdAt],
  )
}

export const logEvent = async (level: LogLevel, message: string, context?: Record<string, unknown>) => {
  const event: LogEvent = { id: createId(), level, message, context: safeContext(context), createdAt: nowMs() }
  const parsed = logEventSchema.safeParse(event)
  if (!parsed.success) return
  writeConsole(parsed.data)
  persistLocal(parsed.data)
  try {
    await persistDb(parsed.data)
  } catch {
    // ignore
  }
}
