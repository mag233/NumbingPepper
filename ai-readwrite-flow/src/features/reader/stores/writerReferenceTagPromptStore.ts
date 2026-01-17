import { create } from 'zustand'
import type { Highlight } from '../types'

type Pending = {
  projectId: string
  highlight: Highlight
  onClosePopover?: () => void
}

type State = {
  pending: Pending | null
  tagsText: string
  open: (pending: Pending) => void
  close: () => void
  setTagsText: (value: string) => void
}

const useWriterReferenceTagPromptStore = create<State>((set) => ({
  pending: null,
  tagsText: '',
  open: (pending) => set({ pending, tagsText: '' }),
  close: () => set({ pending: null, tagsText: '' }),
  setTagsText: (value) => set({ tagsText: value }),
}))

export default useWriterReferenceTagPromptStore
