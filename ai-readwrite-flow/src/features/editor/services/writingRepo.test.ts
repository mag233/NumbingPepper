import { describe, expect, it } from 'vitest'
import {
  deleteWritingProject,
  deleteWritingReference,
  loadWritingContext,
  loadWritingContextMembership,
  loadWritingProjects,
  loadWritingReferences,
  setWritingReferenceIncluded,
  upsertWritingReference,
  upsertWritingContext,
  upsertWritingProject,
} from './writingRepo'
import { generateReferenceId } from './writingReferenceIds'

describe('writingRepo (localStorage fallback)', () => {
  it('loads valid projects and ignores invalid rows', async () => {
    localStorage.setItem(
      'ai-readwrite-flow-writing-projects',
      JSON.stringify([
        { id: 'p1', title: 'Project 1', createdAt: 1, updatedAt: 2 },
        { id: '', title: 'bad', createdAt: 1, updatedAt: 1 },
      ]),
    )
    const projects = await loadWritingProjects()
    expect(projects).toHaveLength(1)
    expect(projects[0]?.id).toBe('p1')
  })

  it('upserts and deletes projects', async () => {
    localStorage.removeItem('ai-readwrite-flow-writing-projects')
    const ok = await upsertWritingProject({ id: 'p1', title: 'A', createdAt: 1, updatedAt: 1 })
    expect(ok).toBe(true)
    const ok2 = await upsertWritingProject({ id: 'p1', title: 'B', createdAt: 1, updatedAt: 2 })
    expect(ok2).toBe(true)
    expect((await loadWritingProjects())[0]?.title).toBe('B')
    const deleted = await deleteWritingProject('p1')
    expect(deleted).toBe(true)
    expect(await loadWritingProjects()).toHaveLength(0)
  })

  it('loads references for a project and ignores invalid entries', async () => {
    localStorage.setItem(
      'ai-readwrite-flow-writing-references:p1',
      JSON.stringify([
        {
          id: 'r1',
          projectId: 'p1',
          sourceType: 'manual',
          snippetText: 'hello',
          createdAt: 1,
        },
        { id: 'r2', projectId: 'p1', sourceType: 'unknown', snippetText: 'bad', createdAt: 1 },
      ]),
    )
    const refs = await loadWritingReferences('p1')
    expect(refs).toHaveLength(1)
    expect(refs[0]?.id).toBe('r1')
  })

  it('persists and loads context per project', async () => {
    localStorage.removeItem('ai-readwrite-flow-writing-context:p1')
    const ok = await upsertWritingContext({ projectId: 'p1', contextText: 'hello', updatedAt: 1 })
    expect(ok).toBe(true)
    const ctx = await loadWritingContext('p1')
    expect(ctx?.contextText).toBe('hello')
  })

  it('creates references and toggles membership', async () => {
    const projectId = 'p1'
    localStorage.removeItem(`ai-readwrite-flow-writing-references:${projectId}`)
    localStorage.removeItem(`ai-readwrite-flow-writing-membership:${projectId}`)
    const referenceId = generateReferenceId()
    const ok = await upsertWritingReference({
      id: referenceId,
      projectId,
      sourceType: 'manual',
      snippetText: 'Snippet',
      createdAt: 1,
    })
    expect(ok).toBe(true)
    const refs = await loadWritingReferences(projectId)
    expect(refs.some((r) => r.id === referenceId)).toBe(true)

    const includedOk = await setWritingReferenceIncluded(projectId, referenceId, true, 10)
    expect(includedOk).toBe(true)
    const membership = await loadWritingContextMembership(projectId)
    expect(membership.find((m) => m.referenceId === referenceId)?.included).toBe(true)

    const del = await deleteWritingReference(projectId, referenceId)
    expect(del).toBe(true)
    expect((await loadWritingReferences(projectId)).some((r) => r.id === referenceId)).toBe(false)
  })
})
