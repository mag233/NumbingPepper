import { create } from 'zustand'
import useWriterProjectStore from './writerProjectStore'

type Toast = {
  message: string
  undo?: () => void
}

type Pending = {
  kind: 'context' | 'reference'
  run: () => Promise<void>
}

type State = {
  toast: Toast | null
  pending: Pending | null
  show: (message: string, undo?: () => void) => void
  requestProject: (kind: Pending['kind'], run: Pending['run']) => void
  clear: () => void
  cancelPending: () => void
  confirmCreate: () => Promise<void>
}

const clearToastSoon = (clear: () => void) => {
  window.setTimeout(clear, 2500)
}

const useWriterToastStore = create<State>((set, get) => ({
  toast: null,
  pending: null,
  show: (message, undo) => {
    set({ toast: { message, undo }, pending: null })
    clearToastSoon(() => get().clear())
  },
  requestProject: (kind, run) => {
    set({ toast: { message: 'No writing project selected. Create one?' }, pending: { kind, run } })
  },
  clear: () => set({ toast: null, pending: null }),
  cancelPending: () => set({ toast: null, pending: null }),
  confirmCreate: async () => {
    const pending = get().pending
    if (!pending) return
    set({ pending: null, toast: null })
    const project = await useWriterProjectStore.getState().createProject()
    if (!project) {
      get().show('Failed to create project.')
      return
    }
    await pending.run()
  },
}))

export default useWriterToastStore

