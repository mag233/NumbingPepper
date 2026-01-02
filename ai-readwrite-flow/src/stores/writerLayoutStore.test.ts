import { beforeEach, describe, expect, it, vi } from 'vitest'

const STORAGE_KEY = 'ai-readwrite-flow-writer-layout-v1'

const createLocalStorageMock = () => {
  let data: Record<string, string> = {}
  const storage: Storage = {
    get length() {
      return Object.keys(data).length
    },
    clear: () => {
      data = {}
    },
    getItem: (key) => data[key] ?? null,
    key: (index) => Object.keys(data)[index] ?? null,
    removeItem: (key) => {
      delete data[key]
    },
    setItem: (key, value) => {
      data[key] = value
    },
  }
  return storage
}

describe('writerLayoutStore', () => {
  beforeEach(() => {
    const storage = createLocalStorageMock()
    vi.stubGlobal('localStorage', storage)
    vi.resetModules()
  })

  it('uses defaults when empty', async () => {
    const store = (await import('./writerLayoutStore')).default
    expect(store.getState().splitRatio).toBe(0.65)
    expect(store.getState().density).toBe('comfortable')
  })

  it('clamps persisted ratio', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ splitRatio: 2, density: 'compact', locked: false }))
    const store = (await import('./writerLayoutStore')).default
    expect(store.getState().splitRatio).toBe(1)
    expect(store.getState().density).toBe('compact')
  })

  it('persists updates and reset', async () => {
    const store = (await import('./writerLayoutStore')).default
    store.getState().setSplitRatio(0.2)
    store.getState().setDensity('compact')

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as unknown
    expect(persisted).toMatchObject({ splitRatio: 0.2, density: 'compact' })

    store.getState().reset()
    const persistedAfter = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as unknown
    expect(persistedAfter).toMatchObject({ splitRatio: 0.65, density: 'comfortable' })
  })
})
