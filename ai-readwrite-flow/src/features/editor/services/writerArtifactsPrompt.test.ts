import { describe, expect, it } from 'vitest'
import { buildWriterArtifactMessages } from './writerArtifactsPrompt'

describe('buildWriterArtifactMessages', () => {
  it('includes citation contract and reference labels', () => {
    const out = buildWriterArtifactMessages({
      artifactType: 'explanation',
      instruction: 'Be concise.',
      contentText: 'Draft text here.',
      contextText: 'Context text.',
      references: [
        {
          id: 'ref1',
          projectId: 'p1',
          sourceType: 'manual',
          snippetText: 'Snippet one.',
          createdAt: 1,
          title: 'Ref title',
        },
      ],
      citationRequired: true,
    })

    expect(out.system).toContain('APA 7')
    expect(out.user).toContain('Artifact: Explanation')
    expect(out.user).toContain('APA References')
    expect(out.user).toContain('Snippet one.')
  })
})
