import { describe, expect, it } from 'vitest'
import { chatSessionIdForBook } from './chatSession'

describe('chatSessionIdForBook', () => {
  it('returns global when no book', () => {
    expect(chatSessionIdForBook(undefined)).toBe('global')
    expect(chatSessionIdForBook(null)).toBe('global')
    expect(chatSessionIdForBook('')).toBe('global')
  })

  it('returns book session when book present', () => {
    expect(chatSessionIdForBook('abc')).toBe('book:abc')
  })
})

