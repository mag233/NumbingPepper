import { describe, expect, it } from 'vitest'
import { highlightSchema } from './types'

describe('highlightSchema', () => {
  it('accepts a valid highlight payload', () => {
    const parsed = highlightSchema.safeParse({
      id: 'h1',
      bookId: 'b1',
      content: 'hello',
      color: 'yellow',
      note: null,
      contextRange: {
        page: 1,
        rects: [{ x: 0.1, y: 0.2, width: 0.3, height: 0.1, normalized: true }],
        zoom: null,
      },
      createdAt: 1,
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects missing rects', () => {
    const parsed = highlightSchema.safeParse({
      id: 'h1',
      bookId: 'b1',
      content: 'hello',
      color: 'yellow',
      contextRange: { page: 1, rects: [], zoom: null },
      createdAt: 1,
    })
    expect(parsed.success).toBe(false)
  })
})

