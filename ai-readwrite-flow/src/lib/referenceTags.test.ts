import { describe, expect, it } from 'vitest'
import {
  buildReferenceFlomoTagLines,
  buildAiReaderTagLines,
  buildSystemReferenceTags,
  defaultReferenceDefaultTags,
  formatSystemTagLabel,
  prefixReferenceUserTag,
  normalizeExplicitTags,
  mergeTags,
  splitReferenceTags,
  splitTagsInput,
} from './referenceTags'

describe('referenceTags', () => {
  it('builds system tags based on defaults', () => {
    const tags = buildSystemReferenceTags({
      title: 'Deep Work: Rules for Focused Success in a Distracted World',
      author: 'Cal Newport',
      year: 2016,
      defaults: defaultReferenceDefaultTags,
    })
    expect(tags).toEqual([
      'ai_reader/title/Deep-Work:-Rules-for-Focused-Success-in-a-Dis...',
      'ai_reader/author/Newport',
      'ai_reader/year/2016',
    ])
  })

  it('merges and dedupes tags', () => {
    const merged = mergeTags(['ai_reader/title/book'], ['custom', 'custom'])
    expect(merged).toEqual(['ai_reader/title/book', 'custom'])
  })

  it('splits tag input by comma or newline', () => {
    const tags = splitTagsInput('one, two\nthree')
    expect(tags).toEqual(['one', 'two', 'three'])
  })

  it('separates system and user tags', () => {
    const tags = splitReferenceTags(['book:Title', 'author:Smith', 'health', '#ai_reader/year/2024'])
    expect(tags.systemTags).toEqual([
      'ai_reader/title/Title',
      'ai_reader/author/Smith',
      'ai_reader/year/2024',
    ])
    expect(tags.userTags).toEqual(['health'])
  })

  it('formats system tag labels without prefixes', () => {
    expect(formatSystemTagLabel('ai_reader/title/Deep-Work')).toBe('title Deep Work')
  })

  it('prefixes user tags for reference namespace', () => {
    expect(prefixReferenceUserTag('#health')).toBe('ai_reader/health')
    expect(prefixReferenceUserTag('ai_reader/custom')).toBe('ai_reader/custom')
  })

  it('builds flomo tag lines with ai_reader prefix', () => {
    const lines = buildReferenceFlomoTagLines(['ai_reader/title/book', 'health'])
    expect(lines).toEqual(['#ai_reader/title/book', '#ai_reader/health'])
  })

  it('normalizes explicit tags and strips ai_reader prefix', () => {
    const tags = normalizeExplicitTags(['#ai_reader/Health', 'health', 'ai_reader/title/book'])
    expect(tags).toEqual(['health'])
  })

  it('builds ai_reader tag lines for explicit tags', () => {
    expect(buildAiReaderTagLines(['Health', 'intervention'])).toEqual([
      '#ai_reader/health',
      '#ai_reader/intervention',
    ])
  })
})
