import { beforeEach, describe, expect, it, vi } from 'vitest'
import { appendWriterSelectionOutbox, buildSelectionPreview, listProjectOutbox } from './flomoOutbox'

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

describe('flomoOutbox', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeStorage())
  })

  it('stores per-project entries newest first', () => {
    appendWriterSelectionOutbox({ projectId: 'p1', selectionText: 'a', tags: ['#t'], sentAt: 10 })
    appendWriterSelectionOutbox({ projectId: 'p1', selectionText: 'b', tags: ['#t2'], sentAt: 20 })
    const list = listProjectOutbox('p1', 10)
    expect(list.map((e) => e.selectionText)).toEqual(['b', 'a'])
  })

  it('buildSelectionPreview compacts whitespace', () => {
    expect(buildSelectionPreview(' hello   world \n ok ')).toBe('hello world ok')
  })
})

