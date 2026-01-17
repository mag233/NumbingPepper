import { describe, expect, it } from 'vitest'
import {
  defaultChatResponseSettings,
  isGpt5Model,
  normalizeChatResponseSettings,
} from './chatResponseSettings'

describe('chatResponseSettings', () => {
  it('normalizes missing values to defaults', () => {
    expect(normalizeChatResponseSettings(undefined)).toEqual(defaultChatResponseSettings)
  })

  it('clamps maxOutputTokens to positive ints', () => {
    const normalized = normalizeChatResponseSettings({ maxOutputTokens: -3 })
    expect(normalized.maxOutputTokens).toBeNull()
  })

  it('detects gpt-5 model names', () => {
    expect(isGpt5Model('gpt-5-mini')).toBe(true)
    expect(isGpt5Model('gpt-4o')).toBe(false)
  })
})
