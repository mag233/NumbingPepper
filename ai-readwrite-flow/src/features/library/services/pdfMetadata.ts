type PdfMetadata = {
  title?: string
  author?: string
  year?: number
  keywords?: string[]
}

type PdfjsModule = typeof import('react-pdf')
type Pdfjs = PdfjsModule['pdfjs']

let cachedPdfjs: Pdfjs | null = null

const loadPdfjs = async (): Promise<Pdfjs> => {
  if (cachedPdfjs) return cachedPdfjs
  const mod = await import('react-pdf')
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  if (!mod.pdfjs.GlobalWorkerOptions.workerSrc) {
    mod.pdfjs.GlobalWorkerOptions.workerSrc = worker
  }
  cachedPdfjs = mod.pdfjs
  return cachedPdfjs
}

const normalizeText = (value: string) => value.trim().replace(/\s+/g, ' ')

export const parsePdfYear = (raw: string | undefined): number | undefined => {
  if (!raw) return undefined
  const match = raw.match(/(19|20)\d{2}/)
  if (!match) return undefined
  const year = Number(match[0])
  return Number.isFinite(year) ? year : undefined
}

export const parsePdfKeywords = (raw: string | undefined): string[] | undefined => {
  if (!raw) return undefined
  const parts = raw
    .split(/[;,]/)
    .map((part) => normalizeText(part))
    .filter(Boolean)
  return parts.length ? parts : undefined
}

const normalizeMetadata = (input: PdfMetadata): PdfMetadata => ({
  title: input.title ? normalizeText(input.title) : undefined,
  author: input.author ? normalizeText(input.author) : undefined,
  year: input.year,
  keywords: input.keywords,
})

const base64ToBytes = (raw: string): Uint8Array => {
  const binary = atob(raw)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

const metadataFromDoc = async (doc: { getMetadata: () => Promise<{ info?: object }> }) => {
  const meta = await doc.getMetadata()
  const infoRaw = meta?.info
  const info =
    infoRaw && typeof infoRaw === 'object'
      ? (infoRaw as Record<string, unknown>)
      : {}
  const title = typeof info.Title === 'string' ? info.Title : undefined
  const author = typeof info.Author === 'string' ? info.Author : undefined
  const creation = typeof info.CreationDate === 'string' ? info.CreationDate : undefined
  const modified = typeof info.ModDate === 'string' ? info.ModDate : undefined
  const keywords = typeof info.Keywords === 'string' ? info.Keywords : undefined
  return normalizeMetadata({
    title,
    author,
    year: parsePdfYear(creation ?? modified),
    keywords: parsePdfKeywords(keywords),
  })
}

export const extractPdfMetadataFromBytes = async (bytes: Uint8Array): Promise<PdfMetadata> => {
  if (typeof DOMMatrix === 'undefined') return {}
  const pdfjs = await loadPdfjs()
  const task = pdfjs.getDocument({ data: bytes })
  try {
    const doc = await task.promise
    try {
      return await metadataFromDoc(doc)
    } finally {
      await doc.destroy()
    }
  } catch {
    return {}
  }
}

export const extractPdfMetadataFromArrayBuffer = async (buffer: ArrayBuffer): Promise<PdfMetadata> =>
  extractPdfMetadataFromBytes(new Uint8Array(buffer))

export const extractPdfMetadataFromDataUrl = async (dataUrl: string): Promise<PdfMetadata> => {
  const comma = dataUrl.indexOf(',')
  if (comma < 0) return {}
  const base64 = dataUrl.slice(comma + 1)
  return extractPdfMetadataFromBytes(base64ToBytes(base64))
}
