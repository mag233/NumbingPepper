import { describe, expect, it } from 'vitest'
import { buildReaderFlomoContent, buildWriterFlomoContent, defaultBookTag, defaultProjectTag } from './flomoNoteBuilder'

describe('flomoNoteBuilder', () => {
  it('buildReaderFlomoContent uses English headings', () => {
    const content = buildReaderFlomoContent({
      quote: 'hello',
      note: 'world',
      bookTitle: 'Demo Book',
      tags: [],
    })
    expect(content).toContain('Quote:')
    expect(content).toContain('Note:')
    expect(content).toContain('Tags:')
  })

  it('buildWriterFlomoContent uses English headings', () => {
    const content = buildWriterFlomoContent({
      selection: 'sel',
      context: 'ctx',
      projectTitle: 'Demo Project',
      tags: [],
    })
    expect(content).toContain('Selection:')
    expect(content).toContain('Context:')
    expect(content).toContain('Tags:')
  })

  it('dedupes tags while preserving order', () => {
    const content = buildReaderFlomoContent({
      quote: 'q',
      note: 'n',
      bookTitle: 'Demo Book',
      tags: ['#books/Demo-Book', '#a', '##a', '#b', '#a'],
    })
    const tagSection = content.split('Tags:')[1] ?? ''
    const lines = tagSection
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    expect(lines).toEqual(['#books/Demo-Book', '#a', '#b'])
  })

  it('builds default tags', () => {
    expect(defaultBookTag('Demo Book')).toBe('#books/Demo-Book')
    expect(defaultProjectTag('Demo Project')).toBe('#写作/Demo-Project')
  })
})
