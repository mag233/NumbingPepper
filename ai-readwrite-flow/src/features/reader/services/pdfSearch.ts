const normalize = (value: string) => value.toLowerCase()

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export type PdfSearchHit = {
  page: number
  snippet: string
  ordinal: number
}

export const findAllIndices = (haystack: string, needle: string): number[] => {
  const h = normalize(haystack)
  const n = normalize(needle).trim()
  if (!n) return []
  const out: number[] = []
  let from = 0
  while (from < h.length) {
    const idx = h.indexOf(n, from)
    if (idx === -1) break
    out.push(idx)
    from = idx + n.length
  }
  return out
}

export const makeSnippet = (text: string, index: number, length: number, radius = 36) => {
  const start = clamp(index - radius, 0, text.length)
  const end = clamp(index + length + radius, 0, text.length)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < text.length ? '…' : ''
  return `${prefix}${text.slice(start, end).trim()}${suffix}`
}

export const searchPageText = (
  pageText: string,
  query: string,
  page: number,
  maxHits: number,
): PdfSearchHit[] => {
  const indices = findAllIndices(pageText, query)
  const q = query.trim()
  if (!indices.length || !q) return []
  const hits: PdfSearchHit[] = []
  for (let ordinal = 0; ordinal < indices.length; ordinal += 1) {
    if (hits.length >= maxHits) break
    const idx = indices[ordinal]!
    hits.push({ page, snippet: makeSnippet(pageText, idx, q.length), ordinal })
  }
  return hits
}
