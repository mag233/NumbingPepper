import { describe, expect, it } from 'vitest'
import { parsePdfKeywords, parsePdfYear } from './pdfMetadata'

describe('pdfMetadata helpers', () => {
  it('parses year from PDF date strings', () => {
    expect(parsePdfYear('D:20240101000000Z')).toBe(2024)
    expect(parsePdfYear('2020-05-01')).toBe(2020)
    expect(parsePdfYear('unknown')).toBeUndefined()
  })

  it('parses keywords from metadata', () => {
    expect(parsePdfKeywords('alpha, beta; gamma')).toEqual(['alpha', 'beta', 'gamma'])
    expect(parsePdfKeywords('')).toBeUndefined()
  })
})
