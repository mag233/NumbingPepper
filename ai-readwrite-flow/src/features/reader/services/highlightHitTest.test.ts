import { describe, expect, it } from 'vitest'
import { pickHighlightAtPoint } from './highlightHitTest'
import { type Highlight } from '../types'

describe('pickHighlightAtPoint', () => {
  it('returns newest highlight when overlapping', () => {
    const a: Highlight = {
      id: 'a',
      bookId: 'b',
      content: 'a',
      color: 'yellow',
      note: null,
      contextRange: {
        page: 1,
        rects: [{ x: 0.1, y: 0.1, width: 0.4, height: 0.2, normalized: true }],
        zoom: null,
      },
      createdAt: 1,
    }
    const b: Highlight = { ...a, id: 'b', content: 'b', createdAt: 2 }
    const picked = pickHighlightAtPoint([a, b], 0.2, 0.15)
    expect(picked?.id).toBe('b')
  })

  it('returns undefined when no hit', () => {
    const a: Highlight = {
      id: 'a',
      bookId: 'b',
      content: 'a',
      color: 'yellow',
      note: null,
      contextRange: {
        page: 1,
        rects: [{ x: 0.1, y: 0.1, width: 0.2, height: 0.2, normalized: true }],
        zoom: null,
      },
      createdAt: 1,
    }
    const picked = pickHighlightAtPoint([a], 0.9, 0.9)
    expect(picked).toBeUndefined()
  })
})
