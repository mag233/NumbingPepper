import { describe, expect, it } from 'vitest'
import { buildWriterUserPrompt } from './writerChatPrompt'

describe('writerChatPrompt', () => {
  it('returns empty for empty input', () => {
    expect(buildWriterUserPrompt('   ', 'ctx', true)).toBe('')
  })

  it('omits context when includeContext=false', () => {
    expect(buildWriterUserPrompt('Hello', 'CTX', false)).toBe('Hello')
  })

  it('includes context when present', () => {
    expect(buildWriterUserPrompt('Do X', 'Some context', true)).toBe('Context:\nSome context\n\nInstruction:\nDo X')
  })

  it('skips context block when context is empty', () => {
    expect(buildWriterUserPrompt('Do X', '   ', true)).toBe('Do X')
  })
})

