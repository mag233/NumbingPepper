import { describe, expect, it } from 'vitest'
import { extractPdfOutline } from './pdfOutline'

describe('pdfOutline', () => {
  it('returns empty list when doc shape is unexpected', async () => {
    expect(await extractPdfOutline(null)).toEqual([])
    expect(await extractPdfOutline({})).toEqual([])
  })

  it('flattens outline items with depth and resolves dest page', async () => {
    const doc = {
      getOutline: async () => [
        { title: 'Intro', dest: ['p1'] },
        { title: 'Chapter', dest: ['p2'], items: [{ title: 'Section', dest: ['p3'] }] },
      ],
      getDestination: async () => null,
      getPageIndex: async (ref: unknown) => {
        if (ref === 'p1') return 0
        if (ref === 'p2') return 4
        if (ref === 'p3') return 9
        return null
      },
    }

    const outline = await extractPdfOutline(doc)
    expect(outline).toEqual([
      { title: 'Intro', page: 1, depth: 0 },
      { title: 'Chapter', page: 5, depth: 0 },
      { title: 'Section', page: 10, depth: 1 },
    ])
  })

  it('handles named destinations via getDestination', async () => {
    const doc = {
      getOutline: async () => [{ title: 'Named', dest: 'namedDest' }],
      getDestination: async (name: string) => (name === 'namedDest' ? ['p10'] : null),
      getPageIndex: async (ref: unknown) => (ref === 'p10' ? 9 : null),
    }

    const outline = await extractPdfOutline(doc)
    expect(outline[0]?.page).toBe(10)
  })
})

