import { create } from 'zustand'

type State = {
  pendingScroll: { needle: string; title: string; level: number } | null
  requestScrollToOutline: (args: { needle: string; title: string; level: number }) => void
  consumeScrollRequest: () => { needle: string; title: string; level: number } | null
}

const useWriterEditorCommandStore = create<State>((set, get) => ({
  pendingScroll: null,
  requestScrollToOutline: ({ needle, title, level }) => {
    const trimmedNeedle = needle.trim()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return
    const safeLevel = Number.isFinite(level) ? Math.min(Math.max(level, 1), 6) : 1
    set({ pendingScroll: { needle: trimmedNeedle, title: trimmedTitle, level: safeLevel } })
  },
  consumeScrollRequest: () => {
    const req = get().pendingScroll
    if (!req) return null
    set({ pendingScroll: null })
    return req
  },
}))

export default useWriterEditorCommandStore
