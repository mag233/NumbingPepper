import { create } from 'zustand'
import { loadDraft } from '../services/draftRepo'
import { draftIdForProject } from '../services/draftIds'
import { tipTapDocToMarkdownSource } from '../services/tiptapMarkdown'
import { buildWriterOutlineFromMarkdown, type WriterOutlineItem } from '../services/writerOutline'

type Status = 'idle' | 'loading' | 'ready' | 'error'

type State = {
  status: Status
  error: string | null
  projectId: string | null
  items: WriterOutlineItem[]
  hydrate: (projectId: string | null) => Promise<void>
  setFromMarkdown: (projectId: string, markdown: string) => void
}

const useWriterOutlineStore = create<State>((set) => ({
  status: 'idle',
  error: null,
  projectId: null,
  items: [],
  hydrate: async (projectId) => {
    set({ status: 'loading', error: null, projectId, items: [] })
    if (!projectId) {
      set({ status: 'ready', items: [] })
      return
    }
    try {
      const draft = await loadDraft(draftIdForProject(projectId))
      const md = draft?.editorDoc ? tipTapDocToMarkdownSource(draft.editorDoc) : ''
      set({ status: 'ready', error: null, items: buildWriterOutlineFromMarkdown(md) })
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : 'Failed to load outline' })
    }
  },
  setFromMarkdown: (projectId, markdown) => {
    set({ projectId, items: buildWriterOutlineFromMarkdown(markdown), status: 'ready', error: null })
  },
}))

export default useWriterOutlineStore

