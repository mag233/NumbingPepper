import { describe, expect, it } from 'vitest'
import { appendChatMessage, clearChatSession, loadChatSession } from './chatRepo'

describe('chatRepo (localStorage fallback)', () => {
  it('persists and loads messages per session', async () => {
    const sessionId = 'book:test'
    await clearChatSession(sessionId)

    const saved = await appendChatMessage({
      sessionId,
      role: 'user',
      content: 'hello',
      referenceHighlightId: null,
      createdAt: Date.now(),
    })
    expect(saved?.sessionId).toBe(sessionId)

    const loaded = await loadChatSession(sessionId)
    expect(loaded.length).toBe(1)
    expect(loaded[0]?.content).toBe('hello')
  })
})

