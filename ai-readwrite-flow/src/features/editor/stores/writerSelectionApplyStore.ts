import { create } from 'zustand'

export type WriterSelectionApplyRequest = {
  messageId: string
  mode: 'replace' | 'insert'
  selection: { from: number; to: number }
  text: string
  insertLeadingBlankLine?: boolean
}

export type WriterSelectionApplyNotice = {
  mode: WriterSelectionApplyRequest['mode']
}

type State = {
  pending: WriterSelectionApplyRequest | null
  notice: WriterSelectionApplyNotice | null
  requestApply: (req: WriterSelectionApplyRequest) => void
  consume: () => WriterSelectionApplyRequest | null
  clearNotice: () => void
}

let clearTimer: number | null = null

const useWriterSelectionApplyStore = create<State>((set, get) => {
  const clearNotice = () => {
    if (clearTimer !== null) {
      window.clearTimeout(clearTimer)
      clearTimer = null
    }
    set({ notice: null })
  }

  const scheduleClear = () => {
    if (clearTimer !== null) window.clearTimeout(clearTimer)
    clearTimer = window.setTimeout(() => clearNotice(), 7000)
  }

  return {
    pending: null,
    notice: null,
    requestApply: (req) => set({ pending: req }),
    consume: () => {
      const value = get().pending
      set({ pending: null, notice: value ? { mode: value.mode } : null })
      if (value) scheduleClear()
      return value
    },
    clearNotice,
  }
})

export default useWriterSelectionApplyStore
