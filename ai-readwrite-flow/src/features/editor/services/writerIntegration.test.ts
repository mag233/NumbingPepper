import { describe, expect, it } from 'vitest'
import { appendContextText, buildReferenceFromHighlight, referenceTitleFromSnippet } from './writerIntegration'
import type { Highlight } from '../../reader/types'

describe('writerIntegration', () => {
  it('appends with separators', () => {
    expect(appendContextText('', ' hi ')).toBe('hi')
    expect(appendContextText('A', 'B')).toBe('A\n\nB')
    expect(appendContextText('A\n', ' B ')).toBe('A\n\nB')
  })

  it('creates a stable short title', () => {
    expect(referenceTitleFromSnippet('')).toBe('Highlight')
    expect(referenceTitleFromSnippet('  hello   world ')).toBe('hello world')
    expect(referenceTitleFromSnippet('x'.repeat(60)).endsWith('…')).toBe(true)
  })

  it('builds a writing reference from a highlight', () => {
    const highlight: Highlight = {
      id: 'h1',
      bookId: 'b1',
      content: 'Hello',
      color: 'yellow',
      note: null,
      contextRange: { page: 3, rects: [{ x: 0.1, y: 0.2, width: 0.3, height: 0.01, normalized: true }], zoom: null },
      createdAt: 1,
    }
    const ref = buildReferenceFromHighlight({ projectId: 'p1', highlight, now: 10, referenceId: 'r1' })
    expect(ref.projectId).toBe('p1')
    expect(ref.sourceType).toBe('highlight')
    expect(ref.bookId).toBe('b1')
    expect(ref.pageIndex).toBe(3)
    expect(ref.rects?.length).toBe(1)
  })
})
