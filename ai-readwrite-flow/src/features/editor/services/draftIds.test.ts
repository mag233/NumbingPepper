import { describe, expect, it } from 'vitest'
import { draftIdForBook } from './draftIds'

describe('draftIdForBook', () => {
  it('returns global when no book', () => {
    expect(draftIdForBook(undefined)).toBe('global')
    expect(draftIdForBook(null)).toBe('global')
    expect(draftIdForBook('')).toBe('global')
  })

  it('returns book-scoped id when book present', () => {
    expect(draftIdForBook('abc')).toBe('book:abc')
  })
})

