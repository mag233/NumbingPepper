import { create } from 'zustand'
import { findBookById } from '../../../lib/db'
import {
  buildSystemReferenceTags,
  mergeTags,
  normalizeReferenceTags,
  splitReferenceTags,
  type ReferenceDefaultTags,
} from '../../../lib/referenceTags'
import type { WritingContextMembership, WritingReference } from '../services/writingTypes'
import {
  deleteWritingReference,
  loadWritingContextMembership,
  loadWritingReferences,
  setWritingReferenceIncluded,
  upsertWritingReference,
} from '../services/writingRepo'
import { generateReferenceId } from '../services/writingReferenceIds'
import useSettingsStore from '../../../stores/settingsStore'

type Status = 'idle' | 'loading' | 'ready' | 'error'

type State = {
  status: Status
  error: string | null
  projectId: string | null
  references: WritingReference[]
  membership: WritingContextMembership[]
  hydrate: (projectId: string | null) => Promise<void>
  addManual: (args: { title?: string; author?: string; snippetText: string; tags?: string[] }) => Promise<boolean>
  updateReferenceTags: (referenceId: string, tags: string[]) => Promise<boolean>
  refreshReferenceMetadata: (referenceId: string) => Promise<boolean>
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

const resolveSnapshotFromBook = (book: { title: string; author?: string; metadataTitle?: string; metadataAuthor?: string; metadataYear?: number; fileHash?: string }) => ({
  sourceTitle: book.metadataTitle ?? book.title,
  sourceAuthor: book.metadataAuthor ?? book.author,
  sourceYear: book.metadataYear,
  sourceFileHash: book.fileHash,
})

const resolveDefaultTags = (defaults: ReferenceDefaultTags, title?: string, author?: string, year?: number) =>
  buildSystemReferenceTags({ title, author, year, defaults })

const areTagsEqual = (a: string[] | undefined, b: string[] | undefined) => {
  if (!a && !b) return true
  if (!a || !b) return false
  if (a.length !== b.length) return false
  return a.every((tag, index) => tag === b[index])
}

const normalizeReferenceForStore = (ref: WritingReference) => {
  const normalizedTags = normalizeReferenceTags(ref.tags ?? [])
  if (!areTagsEqual(normalizedTags, ref.tags)) {
    void upsertWritingReference({ ...ref, tags: normalizedTags })
  }
  return { ...ref, tags: normalizedTags }
}

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
      const normalizedReferences = references.map((ref) => normalizeReferenceForStore(ref))
      set({ status: 'ready', error: null, projectId, references: normalizedReferences, membership })
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : 'Failed to load references' })
    }
  },
  addManual: async ({ title, author, snippetText, tags }) => {
    const projectId = get().projectId
    if (!projectId) return false
    const snippet = normalizeSnippet(snippetText)
    if (!snippet) return false
    const now = Date.now()
    const normalizedTitle = normalizeTitle(title)
    const normalizedAuthor = normalizeTitle(author)
    const defaults = useSettingsStore.getState().referenceDefaultTags
    const systemTags = resolveDefaultTags(defaults, normalizedTitle, normalizedAuthor, undefined)
    const { userTags } = splitReferenceTags(tags ?? [])
    const mergedTags = mergeTags(systemTags, userTags)
    const ref: WritingReference = {
      id: generateReferenceId(),
      projectId,
      sourceType: 'manual',
      title: normalizedTitle,
      author: normalizedAuthor,
      sourceTitle: normalizedTitle,
      sourceAuthor: normalizedAuthor,
      tags: mergedTags,
      snippetText: snippet,
      createdAt: now,
    }
    const ok = await upsertWritingReference(ref)
    if (!ok) return false
    set((state) => ({ references: [...state.references, ref] }))
    return true
  },
  updateReferenceTags: async (referenceId, tags) => {
    const ref = get().references.find((r) => r.id === referenceId)
    if (!ref) return false
    const projectId = get().projectId ?? ref.projectId
    if (!projectId) return false
    const { systemTags } = splitReferenceTags(ref.tags ?? [])
    const { userTags } = splitReferenceTags(tags)
    const next: WritingReference = { ...ref, tags: mergeTags(systemTags, userTags) }
    const ok = await upsertWritingReference(next)
    if (!ok) return false
    set((state) => ({
      references: state.references.map((r) => (r.id === referenceId ? next : r)),
    }))
    return true
  },
  refreshReferenceMetadata: async (referenceId) => {
    const ref = get().references.find((r) => r.id === referenceId)
    if (!ref?.bookId) return false
    const projectId = get().projectId ?? ref.projectId
    if (!projectId) return false
    const book = await findBookById(ref.bookId)
    if (!book) return false
    const snapshot = resolveSnapshotFromBook(book)
    const defaults = useSettingsStore.getState().referenceDefaultTags
    const { userTags } = splitReferenceTags(ref.tags ?? [])
    const systemTags = resolveDefaultTags(defaults, snapshot.sourceTitle, snapshot.sourceAuthor, snapshot.sourceYear)
    const next: WritingReference = { ...ref, ...snapshot, tags: mergeTags(systemTags, userTags) }
    const ok = await upsertWritingReference(next)
    if (!ok) return false
    set((state) => ({
      references: state.references.map((r) => (r.id === referenceId ? next : r)),
    }))
    return true
  },
  toggleIncluded: async (referenceId, included) => {
    const ref = get().references.find((r) => r.id === referenceId)
    if (!ref) return false
    const projectId = get().projectId ?? ref.projectId
    if (!projectId) return false
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
    const ref = get().references.find((r) => r.id === referenceId)
    if (!ref) return false
    const projectId = get().projectId ?? ref.projectId
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
