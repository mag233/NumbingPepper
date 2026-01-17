import { describe, expect, it } from 'vitest'
import { dedupeFlomoTagLines, parseFlomoTags } from './flomoTagRules'

describe('flomoTagRules', () => {
  it('prefixes user tags with ai_reader and keeps system tags', () => {
    const parsed = parseFlomoTags('#books/Demo-Book\nhealth\n#ai_reader/rag')
    expect(parsed.tagLines).toEqual(['#books/Demo-Book', '#ai_reader/health', '#ai_reader/rag'])
  })

  it('extracts explicit tags without ai_reader prefix', () => {
    const parsed = parseFlomoTags('#ai_reader/rag\n#ai_reader/title/book\nmaternal')
    expect(parsed.explicitTags).toEqual(['rag', 'maternal'])
  })

  it('dedupes tag lines case-insensitively', () => {
    const lines = dedupeFlomoTagLines(['#ai_reader/RAG', '#ai_reader/rag', '#books/Book'])
    expect(lines).toEqual(['#ai_reader/RAG', '#books/Book'])
  })
})
