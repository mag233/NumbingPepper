import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('./writerProjectStore', () => {
  return {
    default: {
      getState: () => ({
        createProject: vi.fn(async () => ({
          id: 'p1',
          title: 'Untitled',
          createdAt: 1,
          updatedAt: 1,
        })),
      }),
    },
  }
})

import useWriterToastStore from './writerToastStore'

describe('writerToastStore', () => {
  beforeEach(() => {
    useWriterToastStore.getState().clear()
    vi.clearAllMocks()
  })

  it('requestProject sets pending and shows create prompt', () => {
    useWriterToastStore.getState().requestProject('context', async () => {})
    expect(useWriterToastStore.getState().pending?.kind).toBe('context')
    expect(useWriterToastStore.getState().toast?.message).toContain('Create one')
  })

  it('confirmCreate creates project then runs pending action', async () => {
    const run = vi.fn(async () => {})
    useWriterToastStore.getState().requestProject('reference', run)
    await useWriterToastStore.getState().confirmCreate()
    expect(run).toHaveBeenCalledTimes(1)
  })
})

