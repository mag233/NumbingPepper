export type OutlineEntry = {
  title: string
  page: number | null
  depth: number
}

type PdfOutlineItemLike = {
  title?: unknown
  dest?: unknown
  items?: unknown
}

type PdfOutlineDocLike = {
  getOutline: () => Promise<unknown>
  getDestination: (dest: string) => Promise<unknown>
  getPageIndex: (ref: unknown) => Promise<unknown>
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isDocLike = (value: unknown): value is PdfOutlineDocLike =>
  isRecord(value) &&
  typeof value.getOutline === 'function' &&
  typeof value.getDestination === 'function' &&
  typeof value.getPageIndex === 'function'

const isOutlineItem = (value: unknown): value is PdfOutlineItemLike =>
  isRecord(value) && ('title' in value || 'dest' in value || 'items' in value)

const toArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

const normalizeTitle = (value: unknown) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

const normalizeDestArray = (value: unknown): unknown[] | null => {
  if (!Array.isArray(value)) return null
  if (value.length === 0) return null
  return value
}

const resolveDestToPage = async (doc: PdfOutlineDocLike, dest: unknown): Promise<number | null> => {
  const destArray = await (async () => {
    if (typeof dest === 'string') {
      try {
        return normalizeDestArray(await doc.getDestination(dest))
      } catch {
        return null
      }
    }
    return normalizeDestArray(dest)
  })()

  if (!destArray) return null
  const pageRef = destArray[0]
  try {
    const idx = await doc.getPageIndex(pageRef)
    return typeof idx === 'number' && Number.isFinite(idx) ? idx + 1 : null
  } catch {
    return null
  }
}

const walk = async (
  doc: PdfOutlineDocLike,
  nodes: unknown[],
  depth: number,
  out: OutlineEntry[],
  remaining: { count: number },
) => {
  if (remaining.count <= 0) return
  for (const node of nodes) {
    if (remaining.count <= 0) return
    if (!isOutlineItem(node)) continue
    const title = normalizeTitle(node.title)
    const page = node.dest ? await resolveDestToPage(doc, node.dest) : null
    if (title) {
      out.push({ title, page, depth })
      remaining.count -= 1
    }
    const children = toArray(node.items)
    if (children.length) await walk(doc, children, depth + 1, out, remaining)
  }
}

export const extractPdfOutline = async (docUnknown: unknown, maxEntries = 500): Promise<OutlineEntry[]> => {
  if (!isDocLike(docUnknown)) return []
  if (maxEntries <= 0) return []
  try {
    const outlineRaw = await docUnknown.getOutline()
    const nodes = toArray(outlineRaw)
    if (!nodes.length) return []
    const out: OutlineEntry[] = []
    await walk(docUnknown, nodes, 0, out, { count: maxEntries })
    return out
  } catch {
    return []
  }
}

