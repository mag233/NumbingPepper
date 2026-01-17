import { describe, expect, it } from 'vitest'
import {
  addBookToProject,
  loadAllProjectBooks,
  loadBookProjects,
  loadProjectBooks,
  removeBookFromProject,
  replaceBookProjects,
} from './projectBooks'

const LOCAL_PROJECT_BOOKS_KEY = 'ai-readwrite-flow-project-books'

const reset = () => {
  localStorage.removeItem(LOCAL_PROJECT_BOOKS_KEY)
}

describe('projectBooks (localStorage fallback)', () => {
  it('loads valid memberships and ignores invalid rows', async () => {
    reset()
    localStorage.setItem(
      LOCAL_PROJECT_BOOKS_KEY,
      JSON.stringify([
        { projectId: 'p1', bookId: 'b1', createdAt: 1 },
        { projectId: '', bookId: 'b2', createdAt: 2 },
      ]),
    )
    const rows = await loadAllProjectBooks()
    expect(rows).toHaveLength(1)
    expect(rows[0]?.projectId).toBe('p1')
  })

  it('adds and removes a membership', async () => {
    reset()
    const added = await addBookToProject('p1', 'b1', 10)
    expect(added).toBe(true)
    expect(await loadProjectBooks('p1')).toHaveLength(1)
    const removed = await removeBookFromProject('p1', 'b1')
    expect(removed).toBe(true)
    expect(await loadProjectBooks('p1')).toHaveLength(0)
  })

  it('replaces book projects', async () => {
    reset()
    await addBookToProject('p1', 'b1', 1)
    await addBookToProject('p2', 'b1', 2)
    const ok = await replaceBookProjects('b1', ['p2', 'p3'])
    expect(ok).toBe(true)
    const rows = await loadBookProjects('b1')
    const projectIds = rows.map((r) => r.projectId).sort()
    expect(projectIds).toEqual(['p2', 'p3'])
  })
})
