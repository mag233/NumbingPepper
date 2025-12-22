import { describe, expect, it } from 'vitest'
import { buildWriterOutlineFromMarkdown } from './writerOutline'

describe('buildWriterOutlineFromMarkdown', () => {
  it('extracts headings with levels and needles', () => {
    const md = ['# Title', '', '## Chapter 1', 'text', '### Sub', ''].join('\n')
    const items = buildWriterOutlineFromMarkdown(md)
    expect(items.map((i) => [i.level, i.needle])).toEqual([
      [1, '# Title'],
      [2, '## Chapter 1'],
      [3, '### Sub'],
    ])
  })

  it('ignores invalid headings', () => {
    const md = ['#NoSpace', '####### too deep', '# ', ''].join('\n')
    expect(buildWriterOutlineFromMarkdown(md)).toEqual([])
  })

  it('handles spaced hash prefixes', () => {
    const md = ['# Title', '# # Chapter', '#  #  # Sub'].join('\n')
    const items = buildWriterOutlineFromMarkdown(md)
    expect(items.map((i) => [i.level, i.needle])).toEqual([
      [1, '# Title'],
      [2, '## Chapter'],
      [3, '### Sub'],
    ])
  })

  it('disambiguates duplicate headings', () => {
    const md = ['# A', '# A'].join('\n')
    const items = buildWriterOutlineFromMarkdown(md)
    expect(items).toHaveLength(2)
    expect(items[0]?.id).not.toBe(items[1]?.id)
  })
})
