import { pdfjs } from 'react-pdf'

type PdfTextItemLike = { str: string }
type PdfTextContentLike = { items: unknown[] }
type PdfPageProxyLike = { getTextContent: () => Promise<PdfTextContentLike> }
export type PdfDocumentProxyLike = { numPages: number; getPage: (page: number) => Promise<PdfPageProxyLike> }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isPdfDocumentProxyLike = (value: unknown): value is PdfDocumentProxyLike =>
  isRecord(value) && typeof value.numPages === 'number' && typeof value.getPage === 'function'

export const loadPdfDocument = async (src: string): Promise<PdfDocumentProxyLike> => {
  const task = pdfjs.getDocument(src)
  const doc = await task.promise
  if (!isPdfDocumentProxyLike(doc)) throw new Error('Unexpected PDF document shape')
  return doc
}

const coerceTextItem = (value: unknown): PdfTextItemLike | undefined => {
  if (!isRecord(value)) return undefined
  return typeof value.str === 'string' ? { str: value.str } : undefined
}

const collapseSpaces = (value: string) => value.replace(/[ \t]+/g, ' ').replace(/\s+\n/g, '\n').trim()

export const extractPageText = async (doc: PdfDocumentProxyLike, pageNumber: number) => {
  const page = await doc.getPage(pageNumber)
  const content = await page.getTextContent()
  const parts = content.items.map(coerceTextItem).filter((v): v is PdfTextItemLike => Boolean(v)).map((v) => v.str)
  return collapseSpaces(parts.join(' '))
}

