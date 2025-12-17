import { create } from 'zustand'
import { loadWritingContext, upsertWritingContext } from '../services/writingRepo'

type Status = 'idle' | 'loading' | 'ready' | 'error'

type UndoState = { previousText: string } | null

type State = {
  status: Status
  error: string | null
  projectId: string | null
  contextText: string
  lastAppendUndo: UndoState
  hydrate: (projectId: string | null) => Promise<void>
  setContextText: (text: string) => void
  appendToContext: (snippet: string) => void
  undoLastAppend: () => void
  clearContext: () => void
  flush: () => Promise<void>
}

const DEBOUNCE_MS = 500

let saveTimer: number | null = null
let pending: { projectId: string; text: string } | null = null

const clearTimer = () => {
  if (saveTimer === null) return
  window.clearTimeout(saveTimer)
  saveTimer = null
}

const scheduleSave = (projectId: string, text: string) => {
  pending = { projectId, text }
  clearTimer()
  saveTimer = window.setTimeout(() => {
    const p = pending
    pending = null
    if (!p) return
    void upsertWritingContext({ projectId: p.projectId, contextText: p.text, updatedAt: Date.now() })
  }, DEBOUNCE_MS)
}

const appendWithSeparator = (base: string, snippet: string) => {
  const trimmed = snippet.trim()
  if (!trimmed) return base
  if (!base.trim()) return trimmed
  return `${base.trimEnd()}\n\n${trimmed}`
}

const useWriterContextStore = create<State>((set, get) => ({
  status: 'idle',
  error: null,
  projectId: null,
  contextText: '',
  lastAppendUndo: null,
  hydrate: async (projectId) => {
    await get().flush()
    clearTimer()
    pending = null
    set({ status: 'loading', error: null, projectId, contextText: '', lastAppendUndo: null })
    if (!projectId) {
      set({ status: 'ready' })
      return
    }
    try {
      const row = await loadWritingContext(projectId)
      set({
        status: 'ready',
        projectId,
        contextText: row?.contextText ?? '',
        lastAppendUndo: null,
        error: null,
      })
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : 'Failed to load context' })
    }
  },
  setContextText: (text) => {
    const projectId = get().projectId
    set({ contextText: text })
    if (!projectId) return
    scheduleSave(projectId, text)
  },
  appendToContext: (snippet) => {
    const projectId = get().projectId
    if (!projectId) return
    const prev = get().contextText
    const next = appendWithSeparator(prev, snippet)
    if (next === prev) return
    set({ contextText: next, lastAppendUndo: { previousText: prev } })
    scheduleSave(projectId, next)
  },
  undoLastAppend: () => {
    const projectId = get().projectId
    const undo = get().lastAppendUndo
    if (!projectId) return
    if (!undo) return
    set({ contextText: undo.previousText, lastAppendUndo: null })
    scheduleSave(projectId, undo.previousText)
  },
  clearContext: () => {
    const projectId = get().projectId
    if (!projectId) return
    const prev = get().contextText
    if (!prev) return
    set({ contextText: '', lastAppendUndo: null })
    scheduleSave(projectId, '')
  },
  flush: async () => {
    const p = pending
    clearTimer()
    pending = null
    if (!p) return
    await upsertWritingContext({ projectId: p.projectId, contextText: p.text, updatedAt: Date.now() })
  },
}))

export default useWriterContextStore

