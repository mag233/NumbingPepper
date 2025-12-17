import { describe, expect, it } from 'vitest'
import { normalizePageLabels, resolveJumpTarget } from './pageLabels'

describe('pageLabels', () => {
  it('normalizes labels and pads to pageCount', () => {
    expect(normalizePageLabels(['i', 'ii'], 4)).toEqual(['i', 'ii', null, null])
  })

  it('returns null when no meaningful labels exist', () => {
    expect(normalizePageLabels([null, null], 2)).toBeNull()
    expect(normalizePageLabels(['  ', null], 2)).toBeNull()
  })

  it('resolves jump targets by label first when available', () => {
    const pageLabels = normalizePageLabels(['i', 'ii', '1', '2'], 4)
    expect(resolveJumpTarget({ input: ' 1 ', pageCount: 4, pageLabels })).toBe(3)
    expect(resolveJumpTarget({ input: 'II', pageCount: 4, pageLabels })).toBe(2)
  })

  it('supports forcing physical page numbers via pdf: prefix', () => {
    const pageLabels = normalizePageLabels(['1', '2', '3'], 3)
    expect(resolveJumpTarget({ input: 'pdf:2', pageCount: 3, pageLabels })).toBe(2)
  })

  it('falls back to physical page numbers when label missing', () => {
    const pageLabels = normalizePageLabels(['i', 'ii', null], 3)
    expect(resolveJumpTarget({ input: '3', pageCount: 3, pageLabels })).toBe(3)
  })
})

