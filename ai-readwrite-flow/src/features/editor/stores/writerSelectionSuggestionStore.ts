import { create } from 'zustand'

export type WriterSelectionSuggestion = {
  messageId: string
  action: string
  selection: { from: number; to: number }
  outputText: string
  createdAt: number
}

type State = {
  sessionId: string | null
  byMessageId: Record<string, WriterSelectionSuggestion>
  setSession: (sessionId: string) => void
  setSuggestion: (suggestion: WriterSelectionSuggestion) => void
  clearSuggestion: (messageId: string) => void
  clearAll: () => void
}

const useWriterSelectionSuggestionStore = create<State>((set) => ({
  sessionId: null,
  byMessageId: {},
  setSession: (sessionId) =>
    set((state) => {
      if (state.sessionId === sessionId) return state
      return { sessionId, byMessageId: {} }
    }),
  setSuggestion: (suggestion) =>
    set((state) => ({ byMessageId: { ...state.byMessageId, [suggestion.messageId]: suggestion } })),
  clearSuggestion: (messageId) =>
    set((state) => {
      const next = { ...state.byMessageId }
      delete next[messageId]
      return { byMessageId: next }
    }),
  clearAll: () => set({ byMessageId: {} }),
}))

export default useWriterSelectionSuggestionStore

