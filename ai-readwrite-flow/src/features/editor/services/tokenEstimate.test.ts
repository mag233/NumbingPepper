import { describe, expect, it } from 'vitest'
import { estimateTokens } from './tokenEstimate'

describe('estimateTokens', () => {
  it('returns 0 for empty', () => {
    expect(estimateTokens('')).toBe(0)
    expect(estimateTokens('   ')).toBe(0)
  })

  it('estimates english-ish tokens roughly by chars', () => {
    expect(estimateTokens('hello')).toBeGreaterThan(0)
    expect(estimateTokens('hello world')).toBeGreaterThanOrEqual(2)
  })

  it('counts CJK heavier than latin', () => {
    const latin = estimateTokens('abcdefghijabcdefghijabcdefghij') // 30 chars
    const cjk = estimateTokens('中文中文中文中文中文中文中文中文中文中文') // 20 chars
    expect(cjk).toBeGreaterThanOrEqual(latin)
  })
})

