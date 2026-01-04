import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getFlomoLastSentAt,
  makeReaderHighlightSendKey,
  makeReaderSelectionSendKey,
  makeWriterSelectionSendKey,
  markFlomoSentAt,
} from './flomoSendHistory'

const makeStorage = () => {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
  }
}

describe('flomoSendHistory', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeStorage())
  })

  it('builds stable keys', () => {
    expect(makeReaderHighlightSendKey('b1', 'h1')).toBe('reader:hl:b1:h1')
    expect(makeWriterSelectionSendKey('p1', ' hello ')).toMatch(/^writer:sel:p1:/)
    expect(
      makeReaderSelectionSendKey({
        bookId: 'b1',
        page: 2,
        rects: [{ x: 0.1, y: 0.2, width: 0.3, height: 0.01 }],
      }),
    ).toMatch(/^reader:sel:b1:2:/)
  })

  it('persists and reads timestamps', () => {
    const key = makeWriterSelectionSendKey('p1', 'sel')
    expect(getFlomoLastSentAt(key)).toBeNull()
    markFlomoSentAt(key, 1234)
    expect(getFlomoLastSentAt(key)).toBe(1234)
  })
})

