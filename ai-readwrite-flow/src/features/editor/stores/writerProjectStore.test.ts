import { describe, expect, it } from 'vitest'
import useWriterProjectStore from './writerProjectStore'

const resetStore = () => {
  useWriterProjectStore.setState({ status: 'idle', error: null, projects: [], activeProjectId: null })
}

describe('writerProjectStore', () => {
  it('hydrates and selects stored active project when valid', async () => {
    resetStore()
    localStorage.setItem(
      'ai-readwrite-flow-writing-projects',
      JSON.stringify([
        { id: 'p1', title: 'A', createdAt: 1, updatedAt: 10 },
        { id: 'p2', title: 'B', createdAt: 1, updatedAt: 20 },
      ]),
    )
    localStorage.setItem('ai-readwrite-flow-writing-active-project', 'p1')
    await useWriterProjectStore.getState().hydrate()
    expect(useWriterProjectStore.getState().activeProjectId).toBe('p1')
  })

  it('falls back to most recently updated project', async () => {
    resetStore()
    localStorage.setItem(
      'ai-readwrite-flow-writing-projects',
      JSON.stringify([
        { id: 'p1', title: 'A', createdAt: 1, updatedAt: 10 },
        { id: 'p2', title: 'B', createdAt: 1, updatedAt: 20 },
      ]),
    )
    localStorage.removeItem('ai-readwrite-flow-writing-active-project')
    await useWriterProjectStore.getState().hydrate()
    expect(useWriterProjectStore.getState().activeProjectId).toBe('p2')
  })

  it('creates, renames, deletes projects', async () => {
    resetStore()
    localStorage.removeItem('ai-readwrite-flow-writing-projects')
    localStorage.removeItem('ai-readwrite-flow-writing-active-project')
    const created = await useWriterProjectStore.getState().createProject()
    expect(created?.id).toBeTruthy()
    expect(useWriterProjectStore.getState().activeProjectId).toBe(created?.id ?? null)
    const ok = await useWriterProjectStore.getState().renameProject(created?.id ?? '', 'Hello')
    expect(ok).toBe(true)
    expect(useWriterProjectStore.getState().projects[0]?.title).toBe('Hello')
    const del = await useWriterProjectStore.getState().deleteProject(created?.id ?? '')
    expect(del).toBe(true)
    expect(useWriterProjectStore.getState().projects).toHaveLength(0)
  })
})

