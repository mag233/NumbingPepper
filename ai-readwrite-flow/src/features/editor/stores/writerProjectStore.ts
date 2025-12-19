import { create } from 'zustand'
import type { WritingProject } from '../services/writingTypes'
import { deleteWritingProject, loadWritingProjects, upsertWritingProject } from '../services/writingRepo'
import { generateProjectId, readActiveProjectId, writeActiveProjectId } from '../services/writingProjectIds'
import { loadDraft } from '../services/draftRepo'
import { draftIdForProject } from '../services/draftIds'
import { extractTagPathsFromTipTapDoc } from '../services/writerTags'

export type WriterProjectsStatus = 'idle' | 'loading' | 'ready' | 'error'

type State = {
  status: WriterProjectsStatus
  error: string | null
  projects: WritingProject[]
  activeProjectId: string | null
  tagFilter: string | null
  allTags: string[]
  tagsByProjectId: Record<string, string[]>
  hydrate: () => Promise<void>
  selectProject: (id: string) => void
  createProject: (title?: string) => Promise<WritingProject | null>
  renameProject: (id: string, title: string) => Promise<boolean>
  deleteProject: (id: string) => Promise<boolean>
  setTagFilter: (tag: string | null) => void
  setProjectTags: (projectId: string, tags: string[]) => void
}

const pickDefaultActive = (projects: WritingProject[]) => {
  const sorted = [...projects].sort((a, b) => b.updatedAt - a.updatedAt)
  return sorted[0]?.id ?? null
}

const updateProjectTitle = (projects: WritingProject[], id: string, title: string, updatedAt: number) =>
  projects.map((p) => (p.id === id ? { ...p, title, updatedAt } : p)).sort((a, b) => b.updatedAt - a.updatedAt)

const removeProject = (projects: WritingProject[], id: string) => projects.filter((p) => p.id !== id)

const uniqueSorted = (values: string[]) => Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))

const hydrateTags = async (projects: WritingProject[]) => {
  const entries = await Promise.all(
    projects.map(async (p) => {
      const draft = await loadDraft(draftIdForProject(p.id))
      const tags = draft?.editorDoc ? extractTagPathsFromTipTapDoc(draft.editorDoc) : []
      return [p.id, tags] as const
    }),
  )
  const tagsByProjectId: Record<string, string[]> = Object.fromEntries(entries)
  const allTags = uniqueSorted(Object.values(tagsByProjectId).flat())
  return { tagsByProjectId, allTags }
}

const useWriterProjectStore = create<State>((set, get) => ({
  status: 'idle',
  error: null,
  projects: [],
  activeProjectId: null,
  tagFilter: null,
  allTags: [],
  tagsByProjectId: {},
  hydrate: async () => {
    set({ status: 'loading', error: null })
    try {
      const projects = await loadWritingProjects()
      const stored = readActiveProjectId()
      const activeFromStorage = stored && projects.some((p) => p.id === stored) ? stored : null
      const activeProjectId = activeFromStorage ?? pickDefaultActive(projects)
      const { tagsByProjectId, allTags } = await hydrateTags(projects)
      set({ projects, activeProjectId, status: 'ready', error: null, tagsByProjectId, allTags })
      writeActiveProjectId(activeProjectId)
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : 'Failed to load projects' })
    }
  },
  selectProject: (id) => {
    if (!id) return
    if (!get().projects.some((p) => p.id === id)) return
    set({ activeProjectId: id })
    writeActiveProjectId(id)
  },
  createProject: async (title) => {
    const now = Date.now()
    const normalized = title?.trim() ?? ''
    const projectTitle = normalized.length ? normalized : 'Untitled'
    const project: WritingProject = { id: generateProjectId(), title: projectTitle, createdAt: now, updatedAt: now }
    const ok = await upsertWritingProject(project)
    if (!ok) return null
    set((state) => ({
      projects: [project, ...state.projects],
      activeProjectId: project.id,
      tagsByProjectId: { ...state.tagsByProjectId, [project.id]: [] },
    }))
    writeActiveProjectId(project.id)
    return project
  },
  renameProject: async (id, title) => {
    const trimmed = title.trim()
    if (!id || !trimmed) return false
    const existing = get().projects.find((p) => p.id === id)
    if (!existing) return false
    const now = Date.now()
    const ok = await upsertWritingProject({ ...existing, title: trimmed, updatedAt: now })
    if (!ok) return false
    set((state) => ({ projects: updateProjectTitle(state.projects, id, trimmed, now) }))
    return true
  },
  deleteProject: async (id) => {
    if (!id) return false
    const has = get().projects.some((p) => p.id === id)
    if (!has) return false
    const ok = await deleteWritingProject(id)
    if (!ok) return false
    set((state) => {
      const projects = removeProject(state.projects, id)
      const activeProjectId =
        state.activeProjectId === id ? pickDefaultActive(projects) : state.activeProjectId
      writeActiveProjectId(activeProjectId)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: __removed, ...rest } = state.tagsByProjectId
      const allTags = uniqueSorted(Object.values(rest).flat())
      const tagFilter = state.tagFilter && allTags.includes(state.tagFilter) ? state.tagFilter : null
      return { projects, activeProjectId, tagsByProjectId: rest, allTags, tagFilter }
    })
    return true
  },
  setTagFilter: (tag) => {
    const normalized = tag?.trim().toLowerCase() ?? ''
    set({ tagFilter: normalized.length ? normalized : null })
  },
  setProjectTags: (projectId, tags) => {
    if (!projectId) return
    const nextTags = uniqueSorted(tags.map((t) => t.trim().toLowerCase()).filter(Boolean))
    set((state) => {
      const tagsByProjectId = { ...state.tagsByProjectId, [projectId]: nextTags }
      const allTags = uniqueSorted(Object.values(tagsByProjectId).flat())
      const tagFilter = state.tagFilter && allTags.includes(state.tagFilter) ? state.tagFilter : null
      return { tagsByProjectId, allTags, tagFilter }
    })
  },
}))

export default useWriterProjectStore
