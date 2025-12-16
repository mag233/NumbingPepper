import { beforeEach, describe, expect, it, vi } from 'vitest'
import useLibraryStore from './libraryStore'

type State = ReturnType<typeof useLibraryStore.getState>

const resetStore = (partial: Partial<State>) => {
  useLibraryStore.setState({
    items: [],
    trashItems: [],
    activeId: undefined,
    ...partial,
  })
}

describe('libraryStore', () => {
  beforeEach(() => {
    localStorage.clear()
    resetStore({})
  })

  it('sorts by last opened (A -> B -> A)', () => {
    resetStore({
      items: [
        {
          id: 'A',
          title: 'A',
          filePath: 'data:application/pdf;base64,A',
          format: 'pdf',
          fileSize: 1,
          addedAt: 1,
          lastOpenedAt: 1,
        },
        {
          id: 'B',
          title: 'B',
          filePath: 'data:application/pdf;base64,B',
          format: 'pdf',
          fileSize: 1,
          addedAt: 2,
          lastOpenedAt: 2,
        },
      ],
      activeId: 'A',
    })

    const { setActive } = useLibraryStore.getState()
    vi.useFakeTimers()
    vi.setSystemTime(new Date(1000))
    setActive('A')
    vi.setSystemTime(new Date(2000))
    setActive('B')
    vi.setSystemTime(new Date(3000))
    setActive('A')
    vi.useRealTimers()

    const state = useLibraryStore.getState()
    expect(state.items[0]?.id).toBe('A')
    expect(state.items[1]?.id).toBe('B')
  })
})
