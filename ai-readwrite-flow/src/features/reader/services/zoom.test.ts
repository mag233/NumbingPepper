import { describe, expect, it } from 'vitest'
import { clampZoom, zoomIn, zoomOut } from './zoom'

describe('zoom', () => {
  it('clamps and rounds zoom', () => {
    expect(clampZoom(0.1)).toBe(0.5)
    expect(clampZoom(10)).toBe(3)
    expect(clampZoom(1.234)).toBe(1.23)
  })

  it('zooms in/out by step', () => {
    expect(zoomIn(1)).toBe(1.1)
    expect(zoomOut(1)).toBe(0.9)
  })
})

