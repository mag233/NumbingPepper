import { create } from 'zustand'
import {
  addBookToProject,
  loadAllProjectBooks,
  removeBookFromProject,
  replaceBookProjects,
  type ProjectBookMembership,
} from '../lib/db'

type Status = 'idle' | 'loading' | 'ready' | 'error'

type State = {
  status: Status
  error: string | null
  memberships: ProjectBookMembership[]
  booksByProjectId: Record<string, string[]>
  projectsByBookId: Record<string, string[]>
  hydrate: () => Promise<void>
  getBooksForProject: (projectId: string | null) => string[]
  getProjectsForBook: (bookId: string | null) => string[]
  setBookProjects: (bookId: string, projectIds: string[]) => Promise<boolean>
  addBookToProject: (projectId: string, bookId: string) => Promise<boolean>
  removeBookFromProject: (projectId: string, bookId: string) => Promise<boolean>
}

const buildIndexes = (memberships: ProjectBookMembership[]) => {
  const booksByProjectId: Record<string, string[]> = {}
  const projectsByBookId: Record<string, string[]> = {}
  for (const row of memberships) {
    if (!booksByProjectId[row.projectId]) booksByProjectId[row.projectId] = []
    if (!projectsByBookId[row.bookId]) projectsByBookId[row.bookId] = []
    if (!booksByProjectId[row.projectId].includes(row.bookId)) booksByProjectId[row.projectId].push(row.bookId)
    if (!projectsByBookId[row.bookId].includes(row.projectId)) projectsByBookId[row.bookId].push(row.projectId)
  }
  for (const projectId of Object.keys(booksByProjectId)) {
    booksByProjectId[projectId] = booksByProjectId[projectId].slice().sort()
  }
  for (const bookId of Object.keys(projectsByBookId)) {
    projectsByBookId[bookId] = projectsByBookId[bookId].slice().sort()
  }
  return { booksByProjectId, projectsByBookId }
}

const useProjectBooksStore = create<State>((set, get) => ({
  status: 'idle',
  error: null,
  memberships: [],
  booksByProjectId: {},
  projectsByBookId: {},
  hydrate: async () => {
    set({ status: 'loading', error: null })
    try {
      const memberships = await loadAllProjectBooks()
      const { booksByProjectId, projectsByBookId } = buildIndexes(memberships)
      set({ status: 'ready', error: null, memberships, booksByProjectId, projectsByBookId })
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : 'Failed to load project books' })
    }
  },
  getBooksForProject: (projectId) => {
    if (!projectId) return []
    return get().booksByProjectId[projectId] ?? []
  },
  getProjectsForBook: (bookId) => {
    if (!bookId) return []
    return get().projectsByBookId[bookId] ?? []
  },
  setBookProjects: async (bookId, projectIds) => {
    if (!bookId) return false
    const ok = await replaceBookProjects(bookId, projectIds)
    if (!ok) return false
    await get().hydrate()
    return true
  },
  addBookToProject: async (projectId, bookId) => {
    if (!projectId || !bookId) return false
    const ok = await addBookToProject(projectId, bookId)
    if (!ok) return false
    await get().hydrate()
    return true
  },
  removeBookFromProject: async (projectId, bookId) => {
    if (!projectId || !bookId) return false
    const ok = await removeBookFromProject(projectId, bookId)
    if (!ok) return false
    await get().hydrate()
    return true
  },
}))

export default useProjectBooksStore
