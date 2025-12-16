import { describe, expect, it } from 'vitest'
import { getPageRenderSize } from './fitMode'

describe('getPageRenderSize', () => {
  it('returns fitWidth size', () => {
    expect(getPageRenderSize({ fitMode: 'fitWidth', baseWidth: 600, zoom: 2 }).mode).toBe('width')
    expect(getPageRenderSize({ fitMode: 'fitWidth', baseWidth: 600, zoom: 2 })).toEqual({
      mode: 'width',
      width: 600,
    })
  })

  it('returns manual zoomed width', () => {
    expect(getPageRenderSize({ fitMode: 'manual', baseWidth: 500, zoom: 1.5 })).toEqual({
      mode: 'width',
      width: 750,
    })
  })

  it('returns fitPage height when available', () => {
    expect(getPageRenderSize({ fitMode: 'fitPage', baseWidth: 500, zoom: 1.5, availableHeight: 720 })).toEqual({
      mode: 'height',
      height: 720,
    })
  })

  it('falls back to fitWidth when fitPage height missing', () => {
    expect(getPageRenderSize({ fitMode: 'fitPage', baseWidth: 500, zoom: 1.5 })).toEqual({
      mode: 'width',
      width: 750,
    })
  })
})

