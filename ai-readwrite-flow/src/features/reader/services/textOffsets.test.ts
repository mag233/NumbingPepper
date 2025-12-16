import { describe, expect, it } from 'vitest'
import { locateTextOffset } from './textOffsets'

describe('locateTextOffset', () => {
  it('maps offsets into node indices', () => {
    expect(locateTextOffset([3, 4], 0)).toEqual({ nodeIndex: 0, offset: 0 })
    expect(locateTextOffset([3, 4], 2)).toEqual({ nodeIndex: 0, offset: 2 })
    expect(locateTextOffset([3, 4], 3)).toEqual({ nodeIndex: 0, offset: 3 })
    expect(locateTextOffset([3, 4], 4)).toEqual({ nodeIndex: 1, offset: 1 })
  })

  it('clamps past end to last node', () => {
    expect(locateTextOffset([2], 99)).toEqual({ nodeIndex: 0, offset: 2 })
  })

  it('returns null for invalid inputs', () => {
    expect(locateTextOffset([], 1)).toBeNull()
    expect(locateTextOffset([1], -1)).toBeNull()
  })
})

