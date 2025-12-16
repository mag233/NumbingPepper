import { create } from 'zustand'
import { appendChatMessage, clearChatSession, loadChatSession, type ChatRole } from '../features/ai/services/chatRepo'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  createdAt: number
  referenceHighlightId: string | null
}

type ChatState = {
  sessionId: string
  messages: ChatMessage[]
  hydratedSessionId: string | null
  setSessionId: (sessionId: string) => void
  hydrate: (sessionId: string) => Promise<void>
  addMessage: (input: Omit<ChatMessage, 'id'> & { id?: string }) => Promise<ChatMessage | null>
  clear: () => Promise<void>
}

const createId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)

const normalizeSessionId = (sessionId: string) => (sessionId.trim().length ? sessionId.trim() : 'global')

const mapRecordToMessage = (record: Awaited<ReturnType<typeof appendChatMessage>>) => {
  if (!record) return null
  return {
    id: record.id,
    role: record.role,
    content: record.content,
    createdAt: record.createdAt,
    referenceHighlightId: record.referenceHighlightId,
  } satisfies ChatMessage
}

const useChatStore = create<ChatState>((set, get) => ({
  sessionId: 'global',
  hydratedSessionId: null,
  messages: [],

  setSessionId: (sessionId) => set({ sessionId: normalizeSessionId(sessionId) }),

  hydrate: async (sessionId) => {
    const sid = normalizeSessionId(sessionId)
    const records = await loadChatSession(sid)
    set({
      sessionId: sid,
      hydratedSessionId: sid,
      messages: records.map((r) => ({
        id: r.id,
        role: r.role,
        content: r.content,
        createdAt: r.createdAt,
        referenceHighlightId: r.referenceHighlightId,
      })),
    })
  },

  addMessage: async (input) => {
    const sid = normalizeSessionId(get().sessionId)
    const record = await appendChatMessage({
      id: input.id && input.id.length ? input.id : createId(),
      sessionId: sid,
      role: input.role,
      content: input.content,
      referenceHighlightId: input.referenceHighlightId,
      createdAt: input.createdAt,
    })
    const msg = mapRecordToMessage(record)
    if (!msg) return null
    set((state) => ({ messages: [...state.messages, msg] }))
    return msg
  },

  clear: async () => {
    const sid = normalizeSessionId(get().sessionId)
    await clearChatSession(sid)
    set({ messages: [] })
  },
}))

export default useChatStore
