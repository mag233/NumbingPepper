import { describe, expect, it } from 'vitest'
import { defaultThemePreset, normalizeThemePreset } from './theme'

describe('normalizeThemePreset', () => {
  it('defaults for unknown values', () => {
    expect(normalizeThemePreset(undefined)).toBe(defaultThemePreset)
    expect(normalizeThemePreset('unknown')).toBe(defaultThemePreset)
    expect(normalizeThemePreset(123)).toBe(defaultThemePreset)
  })

  it('accepts known values', () => {
    expect(normalizeThemePreset('soft-dark')).toBe('soft-dark')
    expect(normalizeThemePreset('light')).toBe('light')
    expect(normalizeThemePreset('ocean')).toBe('ocean')
    expect(normalizeThemePreset('forest')).toBe('forest')
    expect(normalizeThemePreset('sand')).toBe('sand')
  })
})

