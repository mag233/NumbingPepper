import { describe, expect, it } from 'vitest'
import { chatSessionIdForProject } from './writerChatSession'

describe('writerChatSession', () => {
  it('returns project global when missing', () => {
    expect(chatSessionIdForProject(undefined)).toBe('project:global')
    expect(chatSessionIdForProject(null)).toBe('project:global')
    expect(chatSessionIdForProject('')).toBe('project:global')
  })

  it('returns project session when present', () => {
    expect(chatSessionIdForProject('p1')).toBe('project:p1')
  })
})

