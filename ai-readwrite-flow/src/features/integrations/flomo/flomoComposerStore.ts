import { create } from 'zustand'
import type { HighlightRect } from '../../reader/types'

type ReaderDraft = {
  mode: 'reader'
  quote: string
  note: string
  bookTitle: string
  tags: string[]
  source?: { type: 'selection'; bookId: string; page: number; rects: HighlightRect[] } | { type: 'highlight'; bookId: string; highlightId: string }
}

type WriterDraft = {
  mode: 'writer'
  selection: string
  context: string
  projectTitle: string
  tags: string[]
  source?: { type: 'writer-selection'; projectId: string }
}

export type FlomoComposerDraft = ReaderDraft | WriterDraft

type State = {
  draft: FlomoComposerDraft | null
  open: (draft: FlomoComposerDraft) => void
  close: () => void
}

const useFlomoComposerStore = create<State>((set) => ({
  draft: null,
  open: (draft) => set({ draft }),
  close: () => set({ draft: null }),
}))

export default useFlomoComposerStore
