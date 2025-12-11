import { create } from 'zustand'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
}

type ChatState = {
  messages: ChatMessage[]
  addMessage: (message: ChatMessage) => void
  reset: () => void
}

const createId = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)

const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, { ...message, id: message.id || createId() }],
    })),
  reset: () => set({ messages: [] }),
}))

export default useChatStore
