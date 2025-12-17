import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('../../ai/services/chatRepo', () => {
  const store: Record<string, unknown[]> = {}
  return {
    loadChatSession: vi.fn(async (sessionId: string) => (store[sessionId] as unknown[]) ?? []),
    appendChatMessage: vi.fn(async (input: { sessionId: string; role: string; content: string; createdAt: number; referenceHighlightId: string | null; id?: string }) => {
      const id = input.id ?? 'm1'
      const msg = { ...input, id }
      store[input.sessionId] = [...((store[input.sessionId] as unknown[]) ?? []), msg]
      return msg
    }),
    clearChatSession: vi.fn(async (sessionId: string) => { store[sessionId] = [] }),
  }
})

import useWriterChatStore from './writerChatStore'

describe('writerChatStore', () => {
  beforeEach(() => {
    useWriterChatStore.setState({ sessionId: 'project:global', hydratedSessionId: null, messages: [] })
    vi.clearAllMocks()
  })

  it('hydrates and isolates by session', async () => {
    await useWriterChatStore.getState().hydrate('project:a')
    await useWriterChatStore.getState().addMessage({
      role: 'user',
      content: 'A1',
      createdAt: 1,
      referenceHighlightId: null,
    })
    await useWriterChatStore.getState().hydrate('project:b')
    expect(useWriterChatStore.getState().messages.length).toBe(0)
    await useWriterChatStore.getState().addMessage({
      role: 'user',
      content: 'B1',
      createdAt: 2,
      referenceHighlightId: null,
    })
    await useWriterChatStore.getState().hydrate('project:a')
    expect(useWriterChatStore.getState().messages.map((m) => m.content)).toEqual(['A1'])
  })
})

