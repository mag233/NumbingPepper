import { z } from 'zod'

export type FlomoOutboxKind = 'selection'

export type FlomoOutboxEntry = {
  id: string
  projectId: string
  kind: FlomoOutboxKind
  selectionText: string
  selectionHash: string
  tags: string[]
  sentAt: number
}

const STORAGE_KEY = 'ai-readwrite-flow-flomo-outbox-v1'

const entrySchema: z.ZodType<FlomoOutboxEntry> = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  kind: z.literal('selection'),
  selectionText: z.string(),
  selectionHash: z.string().min(1),
  tags: z.array(z.string()).default([]),
  sentAt: z.number().int().nonnegative(),
})

const outboxSchema = z.object({
  version: z.literal(1),
  entries: z.array(entrySchema),
})

type OutboxState = z.infer<typeof outboxSchema>

const emptyOutbox: OutboxState = { version: 1, entries: [] }

const loadOutbox = (): OutboxState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyOutbox
    const json: unknown = JSON.parse(raw)
    const parsed = outboxSchema.safeParse(json)
    return parsed.success ? parsed.data : emptyOutbox
  } catch {
    return emptyOutbox
  }
}

const persistOutbox = (outbox: OutboxState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(outbox))
  } catch {
    // ignore
  }
}

const fnv1a = (input: string) => {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16)
}

const normalizeText = (raw: string) => raw.trim().replace(/\s+/g, ' ')

export const hashWriterSelection = (selectionText: string) => fnv1a(normalizeText(selectionText))

export const buildSelectionPreview = (selectionText: string, maxChars = 140) => {
  const compact = normalizeText(selectionText)
  return compact.length > maxChars ? `${compact.slice(0, maxChars - 1)}…` : compact
}

const capText = (text: string, maxChars = 4000) => {
  const trimmed = text.trim()
  return trimmed.length > maxChars ? `${trimmed.slice(0, maxChars)}…` : trimmed
}

export const appendWriterSelectionOutbox = (args: {
  projectId: string
  selectionText: string
  tags: string[]
  sentAt: number
  maxEntriesPerProject?: number
}) => {
  const selectionText = capText(args.selectionText)
  const entry: FlomoOutboxEntry = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    projectId: args.projectId,
    kind: 'selection',
    selectionText,
    selectionHash: hashWriterSelection(selectionText),
    tags: args.tags,
    sentAt: Math.trunc(args.sentAt),
  }

  const maxEntries = args.maxEntriesPerProject ?? 100
  const outbox = loadOutbox()
  const nextEntries = [entry, ...outbox.entries].filter((e) => e.projectId !== args.projectId)
  const sameProject = [entry, ...outbox.entries.filter((e) => e.projectId === args.projectId)]
    .sort((a, b) => b.sentAt - a.sentAt)
    .slice(0, maxEntries)
  persistOutbox({ version: 1, entries: [...sameProject, ...nextEntries] })
  return entry
}

export const listProjectOutbox = (projectId: string, limit = 50): FlomoOutboxEntry[] => {
  if (!projectId) return []
  const outbox = loadOutbox()
  return outbox.entries
    .filter((e) => e.projectId === projectId)
    .sort((a, b) => b.sentAt - a.sentAt)
    .slice(0, limit)
}

