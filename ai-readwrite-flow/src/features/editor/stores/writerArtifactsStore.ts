import { create } from 'zustand'
import { sendChatRequest } from '../../../lib/apiClient'
import useSettingsStore from '../../../stores/settingsStore'
import useMetricsStore from '../../../stores/metricsStore'
import { draftIdForProject } from '../services/draftIds'
import { loadDraft } from '../services/draftRepo'
import { tipTapDocToMarkdownSource } from '../services/tiptapMarkdown'
import { generateArtifactId } from '../services/writingArtifactIds'
import { deleteWritingArtifact, loadWritingArtifacts, upsertWritingArtifact } from '../services/writingArtifactsRepo'
import { buildWriterArtifactMessages } from '../services/writerArtifactsPrompt'
import type { WritingArtifact, WritingArtifactType } from '../services/writingTypes'
import useWriterContextStore from './writerContextStore'
import useWriterProjectStore from './writerProjectStore'
import useWriterReferencesStore from './writerReferencesStore'
import useWriterToastStore from './writerToastStore'

type Status = 'idle' | 'loading' | 'ready' | 'error'

type PendingInsert = { artifactId: string; contentText: string } | null

type State = {
  status: Status
  error: string | null
  projectId: string | null
  artifacts: WritingArtifact[]
  generating: boolean
  pendingInsert: PendingInsert
  hydrate: (projectId: string | null) => Promise<void>
  generate: (artifactType: WritingArtifactType, instruction?: string) => Promise<boolean>
  requestInsert: (artifactId: string) => void
  consumeInsert: () => void
  deleteArtifact: (artifactId: string) => Promise<boolean>
  appendArtifactToContext: (artifactId: string) => void
  saveArtifactAsReference: (artifactId: string) => Promise<boolean>
}

const sortByUpdatedDesc = (items: WritingArtifact[]) => [...items].sort((a, b) => b.updatedAt - a.updatedAt)

const defaultScope = { includeContext: true, includeIncludedReferences: true } as const

const pickIncludedReferences = () => {
  const { references, membership } = useWriterReferencesStore.getState()
  const included = new Set(membership.filter((m) => m.included).map((m) => m.referenceId))
  return references.filter((ref) => included.has(ref.id))
}

const loadContentMarkdown = async (projectId: string) => {
  const draft = await loadDraft(draftIdForProject(projectId))
  if (!draft?.editorDoc) return ''
  return tipTapDocToMarkdownSource(draft.editorDoc)
}

const normalizeInstruction = (value: string | undefined) => value?.trim() ?? ''

const useWriterArtifactsStore = create<State>((set, get) => ({
  status: 'idle',
  error: null,
  projectId: null,
  artifacts: [],
  generating: false,
  pendingInsert: null,

  hydrate: async (projectId) => {
    set({ status: 'loading', error: null, projectId, artifacts: [] })
    if (!projectId) {
      set({ status: 'ready', artifacts: [] })
      return
    }
    try {
      const artifacts = await loadWritingArtifacts(projectId)
      set({ status: 'ready', error: null, artifacts: sortByUpdatedDesc(artifacts) })
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : 'Failed to load artifacts' })
    }
  },

  generate: async (artifactType, instruction) => {
    const projectId = useWriterProjectStore.getState().activeProjectId
    const run = async () => {
      const pid = useWriterProjectStore.getState().activeProjectId
      if (!pid) return
      set({ generating: true, error: null })

      const contextText = useWriterContextStore.getState().contextText
      const references = pickIncludedReferences()
      const contentText = await loadContentMarkdown(pid)
      const normalizedInstruction = normalizeInstruction(instruction)
      const { system, user, defaultTitle } = buildWriterArtifactMessages({
        artifactType,
        instruction: normalizedInstruction,
        contentText,
        contextText,
        references,
        citationRequired: true,
      })

      const { model, apiKey, baseUrl, chatResponseSettings } = useSettingsStore.getState()
      const response = await sendChatRequest(baseUrl, apiKey, model, [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ], chatResponseSettings)

      useMetricsStore.getState().setMetrics({
        tokens: response.usage?.totalTokens,
        latencyMs: response.latencyMs,
        model,
      })

      if (!response.ok || !response.content) {
        set({ generating: false, error: response.error ?? 'Failed to generate artifact' })
        return
      }

      const now = Date.now()
      const artifact: WritingArtifact = {
        id: generateArtifactId(),
        projectId: pid,
        type: artifactType,
        title: defaultTitle,
        contentText: response.content.trim(),
        scope: defaultScope,
        inputSnapshot: {
          prompt: normalizedInstruction,
          contextText,
          references: references.map((r) => ({
            id: r.id,
            title: r.title,
            sourceTitle: r.sourceTitle,
            sourceAuthor: r.sourceAuthor,
            sourceYear: r.sourceYear,
            sourceFileHash: r.sourceFileHash,
            snippetText: r.snippetText,
            bookId: r.bookId,
            pageIndex: r.pageIndex,
            pageLabel: r.pageLabel,
            tags: r.tags,
          })),
        },
        createdAt: now,
        updatedAt: now,
      }

      const ok = await upsertWritingArtifact(artifact)
      if (!ok) {
        set({ generating: false, error: 'Failed to save artifact' })
        return
      }

      set((state) => ({ generating: false, artifacts: sortByUpdatedDesc([artifact, ...state.artifacts]) }))
    }

    if (!projectId) {
      useWriterToastStore.getState().requestProject('artifact', run)
      return false
    }
    await run()
    return true
  },

  requestInsert: (artifactId) => {
    const artifact = get().artifacts.find((a) => a.id === artifactId)
    if (!artifact) return
    set({ pendingInsert: { artifactId, contentText: artifact.contentText } })
  },

  consumeInsert: () => set({ pendingInsert: null }),

  deleteArtifact: async (artifactId) => {
    const projectId = get().projectId
    if (!projectId) return false
    const ok = await deleteWritingArtifact(projectId, artifactId)
    if (!ok) return false
    set((state) => ({ artifacts: state.artifacts.filter((a) => a.id !== artifactId) }))
    return true
  },

  appendArtifactToContext: (artifactId) => {
    const artifact = get().artifacts.find((a) => a.id === artifactId)
    if (!artifact) return
    useWriterContextStore.getState().appendToContext(artifact.contentText)
  },

  saveArtifactAsReference: async (artifactId) => {
    const artifact = get().artifacts.find((a) => a.id === artifactId)
    if (!artifact) return false
    return useWriterReferencesStore.getState().addManual({ title: artifact.title, snippetText: artifact.contentText })
  },
}))

export default useWriterArtifactsStore
