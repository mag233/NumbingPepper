import { describe, expect, it } from 'vitest'
import { buildWriterUserPrompt, stripWriterPromptToInstruction } from './writerChatPrompt'
import type { WritingReference } from './writingTypes'

describe('writerChatPrompt', () => {
  it('returns empty for empty input', () => {
    expect(buildWriterUserPrompt('   ', 'ctx', true, [], false)).toBe('')
  })

  it('omits context when includeContext=false', () => {
    expect(buildWriterUserPrompt('Hello', 'CTX', false, [], false)).toBe('Hello')
  })

  it('includes context when present', () => {
    expect(buildWriterUserPrompt('Do X', 'Some context', true, [], false)).toBe('Context:\nSome context\n\nInstruction:\nDo X')
  })

  it('skips context block when context is empty', () => {
    expect(buildWriterUserPrompt('Do X', '   ', true, [], false)).toBe('Do X')
  })

  it('includes references when enabled', () => {
    const refs: WritingReference[] = [
      {
        id: 'r1',
        projectId: 'p1',
        sourceType: 'manual',
        snippetText: 'Snippet',
        createdAt: 1,
        sourceTitle: 'Paper A',
        sourceAuthor: 'Author One',
        sourceYear: 2024,
        pageLabel: 'ii',
      },
    ]
    const prompt = buildWriterUserPrompt('Ask', '', false, refs, true)
    expect(prompt).toContain('References:')
    expect(prompt).toContain('Paper A')
  })

  it('strips prior context from instruction', () => {
    const content = [
      'Context:',
      'Old context',
      '',
      'References:',
      '[1] Ref',
      '',
      'Instruction:',
      'Summarize',
    ].join('\n')
    expect(stripWriterPromptToInstruction(content)).toBe('Summarize')
  })
})
