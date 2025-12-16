import { describe, expect, it } from 'vitest'
import { isNearBottom, nextRenderCount } from './continuousRender'

describe('continuousRender', () => {
  it('detects near bottom based on threshold', () => {
    expect(
      isNearBottom({ scrollTop: 0, clientHeight: 100, scrollHeight: 1000 }, 200),
    ).toBe(false)
    expect(
      isNearBottom({ scrollTop: 700, clientHeight: 100, scrollHeight: 1000 }, 200),
    ).toBe(true)
  })

  it('increments render count with clamp', () => {
    expect(nextRenderCount(0, 10, 3)).toBe(3)
    expect(nextRenderCount(3, 10, 3)).toBe(6)
    expect(nextRenderCount(9, 10, 3)).toBe(10)
    expect(nextRenderCount(10, 10, 3)).toBe(10)
  })
})

