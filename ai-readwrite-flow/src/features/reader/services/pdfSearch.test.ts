import { describe, expect, it } from 'vitest'
import { findAllIndices, makeSnippet, searchPageText } from './pdfSearch'

describe('pdfSearch', () => {
  it('findAllIndices is case-insensitive and non-overlapping', () => {
    expect(findAllIndices('AaAaa', 'aa')).toEqual([0, 2])
  })

  it('makeSnippet clamps to bounds', () => {
    expect(makeSnippet('hello world', 0, 5, 3)).toBe('hello wo…')
    expect(makeSnippet('hello world', 6, 5, 3)).toBe('…lo world')
  })

  it('searchPageText returns snippets with ordinals', () => {
    const hits = searchPageText('educational institutions and academic societies', 'academic', 2, 10)
    expect(hits).toHaveLength(1)
    expect(hits[0]?.page).toBe(2)
    expect(hits[0]?.snippet.toLowerCase()).toContain('academic')
    expect(hits[0]?.ordinal).toBe(0)
  })
})
