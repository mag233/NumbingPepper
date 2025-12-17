import { describe, expect, it } from 'vitest'
import { draftIdForBook, draftIdForProject } from './draftIds'

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

describe('draftIdForProject', () => {
  it('returns project global when no project', () => {
    expect(draftIdForProject(undefined)).toBe('project:global')
    expect(draftIdForProject(null)).toBe('project:global')
    expect(draftIdForProject('')).toBe('project:global')
  })

  it('returns project-scoped id when project present', () => {
    expect(draftIdForProject('p1')).toBe('project:p1')
  })
})
