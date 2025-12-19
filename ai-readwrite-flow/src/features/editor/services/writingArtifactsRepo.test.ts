import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WritingArtifact } from './writingTypes'
import { deleteWritingArtifact, loadWritingArtifacts, upsertWritingArtifact } from './writingArtifactsRepo'

vi.mock('../../../lib/sqlite', () => ({
  getSqlite: async () => null,
}))

describe('writingArtifactsRepo (localStorage fallback)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('roundtrips artifacts by project', async () => {
    const artifact: WritingArtifact = {
      id: 'a1',
      projectId: 'p1',
      type: 'kickoff',
      title: 'Kickoff',
      contentText: 'Hello world.',
      scope: { includeContext: true, includeIncludedReferences: true },
      inputSnapshot: { prompt: '', contextText: '', references: [] },
      createdAt: 1,
      updatedAt: 1,
    }

    expect(await upsertWritingArtifact(artifact)).toBe(true)
    const loaded = await loadWritingArtifacts('p1')
    expect(loaded).toHaveLength(1)
    expect(loaded[0]?.id).toBe('a1')

    expect(await deleteWritingArtifact('p1', 'a1')).toBe(true)
    expect(await loadWritingArtifacts('p1')).toHaveLength(0)
  })
})

