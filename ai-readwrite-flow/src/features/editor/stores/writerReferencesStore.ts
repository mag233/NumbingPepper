import { create } from 'zustand'
import type { WritingContextMembership, WritingReference } from '../services/writingTypes'
import {
  deleteWritingReference,
  loadWritingContextMembership,
  loadWritingReferences,
  setWritingReferenceIncluded,
  upsertWritingReference,
} from '../services/writingRepo'
import { generateReferenceId } from '../services/writingReferenceIds'

type Status = 'idle' | 'loading' | 'ready' | 'error'

type State = {
  status: Status
  error: string | null
  projectId: string | null
  references: WritingReference[]
  membership: WritingContextMembership[]
  hydrate: (projectId: string | null) => Promise<void>
  addManual: (args: { title?: string; author?: string; snippetText: string }) => Promise<boolean>
  toggleIncluded: (referenceId: string, included: boolean) => Promise<boolean>
  removeReference: (referenceId: string) => Promise<boolean>
}

const includedMap = (membership: WritingContextMembership[]) =>
  membership.reduce<Record<string, WritingContextMembership>>((acc, m) => {
    acc[m.referenceId] = m
    return acc
  }, {})

const normalizeTitle = (value: string | undefined) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

const normalizeSnippet = (value: string) => value.trim()

const useWriterReferencesStore = create<State>((set, get) => ({
  status: 'idle',
  error: null,
  projectId: null,
  references: [],
  membership: [],
  hydrate: async (projectId) => {
    set({ status: 'loading', error: null, projectId, references: [], membership: [] })
    if (!projectId) {
      set({ status: 'ready' })
      return
    }
    try {
      const [references, membership] = await Promise.all([
        loadWritingReferences(projectId),
        loadWritingContextMembership(projectId),
      ])
      set({ status: 'ready', error: null, projectId, references, membership })
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : 'Failed to load references' })
    }
  },
  addManual: async ({ title, author, snippetText }) => {
    const projectId = get().projectId
    if (!projectId) return false
    const snippet = normalizeSnippet(snippetText)
    if (!snippet) return false
    const now = Date.now()
    const ref: WritingReference = {
      id: generateReferenceId(),
      projectId,
      sourceType: 'manual',
      title: normalizeTitle(title),
      author: normalizeTitle(author),
      snippetText: snippet,
      createdAt: now,
    }
    const ok = await upsertWritingReference(ref)
    if (!ok) return false
    set((state) => ({ references: [...state.references, ref] }))
    return true
  },
  toggleIncluded: async (referenceId, included) => {
    const projectId = get().projectId
    if (!projectId) return false
    const ref = get().references.find((r) => r.id === referenceId)
    if (!ref) return false
    const current = includedMap(get().membership)[referenceId]
    const orderIndex = current?.orderIndex ?? ref.createdAt
    const ok = await setWritingReferenceIncluded(projectId, referenceId, included, orderIndex)
    if (!ok) return false
    set((state) => {
      const next = state.membership.filter((m) => m.referenceId !== referenceId)
      next.push({ projectId, referenceId, included, orderIndex })
      next.sort((a, b) => a.orderIndex - b.orderIndex)
      return { membership: next }
    })
    return true
  },
  removeReference: async (referenceId) => {
    const projectId = get().projectId
    if (!projectId) return false
    const ok = await deleteWritingReference(projectId, referenceId)
    if (!ok) return false
    set((state) => ({
      references: state.references.filter((r) => r.id !== referenceId),
      membership: state.membership.filter((m) => m.referenceId !== referenceId),
    }))
    return true
  },
}))

export default useWriterReferencesStore

