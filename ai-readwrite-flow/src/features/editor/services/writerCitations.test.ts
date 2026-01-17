import { describe, expect, it } from 'vitest'
import { formatApaInTextCitation, formatApaReferenceEntry, formatApaReferenceList } from './writerCitations'
import type { WritingReference } from './writingTypes'

const baseRef: WritingReference = {
  id: 'r1',
  projectId: 'p1',
  sourceType: 'manual',
  snippetText: 'Snippet',
  createdAt: 1,
}

describe('writerCitations', () => {
  it('formats in-text citations with page labels', () => {
    const ref: WritingReference = {
      ...baseRef,
      sourceAuthor: 'Ada Lovelace',
      sourceYear: 1843,
      pageLabel: 'iv',
    }
    expect(formatApaInTextCitation(ref)).toBe('(Ada Lovelace, 1843, p. iv)')
  })

  it('falls back to title and n.d. when author/year missing', () => {
    const ref: WritingReference = { ...baseRef, sourceTitle: 'Untitled Work' }
    expect(formatApaReferenceEntry(ref)).toContain('Untitled Work. (n.d.).')
  })

  it('sorts and dedupes reference list', () => {
    const refs: WritingReference[] = [
      { ...baseRef, id: 'a', sourceTitle: 'B Title' },
      { ...baseRef, id: 'b', sourceTitle: 'A Title' },
      { ...baseRef, id: 'a', sourceTitle: 'B Title' },
    ]
    const list = formatApaReferenceList(refs)
    expect(list.length).toBe(2)
    expect(list[0]).toContain('A Title')
  })
})
