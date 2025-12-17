import { create } from 'zustand'
import { appendChatMessage, clearChatSession, loadChatSession, type ChatRole } from '../../ai/services/chatRepo'

export type WriterChatMessage = {
  id: string
  role: ChatRole
  content: string
  createdAt: number
  referenceHighlightId: string | null
}

type State = {
  sessionId: string
  hydratedSessionId: string | null
  messages: WriterChatMessage[]
  hydrate: (sessionId: string) => Promise<void>
  addMessage: (input: Omit<WriterChatMessage, 'id'> & { id?: string }) => Promise<WriterChatMessage | null>
  clear: () => Promise<void>
}

const createId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)
const normalizeSessionId = (sessionId: string) => (sessionId.trim().length ? sessionId.trim() : 'project:global')

const useWriterChatStore = create<State>((set, get) => ({
  sessionId: 'project:global',
  hydratedSessionId: null,
  messages: [],

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
    if (!record) return null
    const msg: WriterChatMessage = {
      id: record.id,
      role: record.role,
      content: record.content,
      createdAt: record.createdAt,
      referenceHighlightId: record.referenceHighlightId,
    }
    set((state) => ({ messages: [...state.messages, msg] }))
    return msg
  },

  clear: async () => {
    const sid = normalizeSessionId(get().sessionId)
    await clearChatSession(sid)
    set({ messages: [] })
  },
}))

export default useWriterChatStore

