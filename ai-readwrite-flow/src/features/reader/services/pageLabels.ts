export type PageLabels = Array<string | null>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const normalizeLabel = (value: string) => value.trim().toLowerCase()

export const normalizePageLabels = (value: unknown, pageCount: number): PageLabels | null => {
  if (!Array.isArray(value)) return null
  const labels: PageLabels = value.slice(0, pageCount).map((item) => {
    if (typeof item === 'string') return item
    if (item === null) return null
    return null
  })
  if (!labels.some((l) => typeof l === 'string' && l.trim().length)) return null
  while (labels.length < pageCount) labels.push(null)
  return labels
}

export const tryGetPageLabels = async (doc: unknown, pageCount: number): Promise<PageLabels | null> => {
  if (!isRecord(doc)) return null
  const fn = doc.getPageLabels
  if (typeof fn !== 'function') return null
  try {
    const result = await fn.call(doc)
    return normalizePageLabels(result, pageCount)
  } catch {
    return null
  }
}

type ResolveArgs = {
  input: string
  pageCount: number
  pageLabels: PageLabels | null
}

const parsePositiveInt = (text: string) => {
  if (!/^\d+$/.test(text)) return null
  const num = Number(text)
  if (!Number.isFinite(num)) return null
  if (num < 1) return null
  return num
}

export const resolveJumpTarget = ({ input, pageCount, pageLabels }: ResolveArgs): number | null => {
  const raw = input.trim()
  if (!raw) return null

  const pdfPrefix = /^pdf\s*:\s*/i
  const physicalOnly = raw.match(pdfPrefix)
  const query = raw.replace(pdfPrefix, '').trim()

  if (!physicalOnly && pageLabels?.length) {
    const normalized = normalizeLabel(query)
    if (normalized) {
      const idx = pageLabels.findIndex((label) => (label ? normalizeLabel(label) === normalized : false))
      if (idx >= 0) return idx + 1
    }
  }

  const num = parsePositiveInt(query)
  if (num === null) return null
  if (num > pageCount) return null
  return num
}

export const formatPageForDisplay = (page: number, pageLabels: PageLabels | null) => {
  const label = pageLabels?.[page - 1]
  if (typeof label === 'string' && label.trim()) return label.trim()
  return String(page)
}
