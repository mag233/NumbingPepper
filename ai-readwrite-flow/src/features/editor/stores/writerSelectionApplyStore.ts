import { create } from 'zustand'

export type WriterSelectionApplyRequest = {
  messageId: string
  mode: 'replace' | 'insert'
  selection: { from: number; to: number }
  text: string
}

type State = {
  pending: WriterSelectionApplyRequest | null
  requestApply: (req: WriterSelectionApplyRequest) => void
  consume: () => WriterSelectionApplyRequest | null
}

const useWriterSelectionApplyStore = create<State>((set, get) => ({
  pending: null,
  requestApply: (req) => set({ pending: req }),
  consume: () => {
    const value = get().pending
    set({ pending: null })
    return value
  },
}))

export default useWriterSelectionApplyStore

