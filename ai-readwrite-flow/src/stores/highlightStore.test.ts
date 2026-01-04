import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/db', () => ({
  deleteHighlight: vi.fn(),
  loadHighlights: vi.fn(async () => []),
  persistHighlight: vi.fn(async () => undefined),
  updateHighlightNote: vi.fn(async () => undefined),
}))

describe('highlightStore', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('keeps the incoming note when merging into a note-less highlight', async () => {
    const { default: useHighlightStore } = await import('./highlightStore')
    const state = useHighlightStore.getState()

    const bookId = 'b1'
    state.byBookId[bookId] = [
      {
        id: 'h1',
        bookId,
        content: 'A',
        color: 'yellow',
        note: null,
        contextRange: { page: 1, rects: [{ x: 0.1, y: 0.1, width: 0.2, height: 0.02, normalized: true }], zoom: null },
        createdAt: 1,
      },
    ]

    await state.add({
      id: 'h2',
      bookId,
      content: 'A',
      color: 'yellow',
      note: 'my note',
      contextRange: { page: 1, rects: [{ x: 0.1, y: 0.1, width: 0.2, height: 0.02, normalized: true }], zoom: null },
      createdAt: 2,
    })

    const next = useHighlightStore.getState().byBookId[bookId] ?? []
    expect(next).toHaveLength(1)
    expect(next[0]?.id).toBe('h1')
    expect(next[0]?.note).toBe('my note')
  })
})

