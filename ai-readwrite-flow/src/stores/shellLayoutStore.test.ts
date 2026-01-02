import { beforeEach, describe, expect, it, vi } from 'vitest'

const STORAGE_KEY = 'ai-readwrite-flow-shell-layout-v1'

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

describe('shellLayoutStore', () => {
  beforeEach(() => {
    const storage = makeStorage()
    vi.stubGlobal('localStorage', storage)
    vi.resetModules()
  })

  it('uses defaults when empty', async () => {
    const { default: useShellLayoutStore } = await import('./shellLayoutStore')
    const state = useShellLayoutStore.getState()

    expect(state.readerSidebarWidthPx).toBe(320)
    expect(state.writerSidebarWidthPx).toBe(280)
    expect(state.readerMainSplitRatio).toBe(0.76)
    expect(state.readerDensity).toBe('comfortable')
  })

  it('clamps persisted values', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ readerSidebarWidthPx: 999, writerSidebarWidthPx: 1, readerMainSplitRatio: 999, readerDensity: 'dense' }),
    )

    const { default: useShellLayoutStore } = await import('./shellLayoutStore')
    const state = useShellLayoutStore.getState()

    expect(state.readerSidebarWidthPx).toBe(420)
    expect(state.writerSidebarWidthPx).toBe(240)
    expect(state.readerMainSplitRatio).toBeLessThanOrEqual(1)
    expect(state.readerDensity).toBe('comfortable')
  })

  it('persists and resets', async () => {
    const { default: useShellLayoutStore } = await import('./shellLayoutStore')
    useShellLayoutStore.getState().setWriterSidebarWidthPx(400)
    useShellLayoutStore.getState().setReaderSidebarWidthPx(300)
    useShellLayoutStore.getState().setReaderMainSplitRatio(0.5)
    useShellLayoutStore.getState().setReaderDensity('compact')

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as unknown
    expect(persisted).toMatchObject({ readerSidebarWidthPx: 300, writerSidebarWidthPx: 400, readerDensity: 'compact' })

    useShellLayoutStore.getState().resetReaderLayout()
    expect(useShellLayoutStore.getState().readerSidebarWidthPx).toBe(320)
    expect(useShellLayoutStore.getState().writerSidebarWidthPx).toBe(400)
    expect(useShellLayoutStore.getState().readerMainSplitRatio).toBe(0.76)
    expect(useShellLayoutStore.getState().readerDensity).toBe('comfortable')

    useShellLayoutStore.getState().resetWriterLayout()
    expect(useShellLayoutStore.getState().readerSidebarWidthPx).toBe(320)
    expect(useShellLayoutStore.getState().writerSidebarWidthPx).toBe(280)
  })
})
