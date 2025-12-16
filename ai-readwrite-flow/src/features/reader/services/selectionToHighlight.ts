import { type HighlightRect, type SelectionInfo } from '../types'
import { normalizeHighlightRects } from './highlightGeometry'

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const parsePageNumber = (node: Element | null): number | undefined => {
  if (!node) return undefined
  const raw = node.getAttribute('data-page-number')
  if (!raw) return undefined
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

const closestPageNode = (node: Node | null): Element | null => {
  if (!node) return null
  const element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement
  return element?.closest('.react-pdf__Page') ?? null
}

const closestPageHost = (node: Element | null): Element | null =>
  node?.closest('[data-arwf-page-host]') ?? null

const normalizeRect = (rect: DOMRect, hostRect: DOMRect): HighlightRect => {
  const width = hostRect.width || 1
  const height = hostRect.height || 1
  return {
    x: clamp01((rect.left - hostRect.left) / width),
    y: clamp01((rect.top - hostRect.top) / height),
    width: clamp01(rect.width / width),
    height: clamp01(rect.height / height),
    normalized: true,
  }
}

export const selectionToHighlight = (): SelectionInfo | undefined => {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed) return undefined
  const text = selection.toString().trim()
  if (!text) return undefined

  const range = selection.getRangeAt(0)
  const pageNode = closestPageNode(range.commonAncestorContainer)
  const page = parsePageNumber(pageNode) ?? 1
  const hostNode = closestPageHost(pageNode) ?? pageNode ?? document.documentElement
  const hostRect = hostNode.getBoundingClientRect()
  if (!hostRect.width || !hostRect.height) return undefined

  const rects = Array.from(range.getClientRects())
    .filter((r) => r.width > 0 && r.height > 0)
    .map((r) => normalizeRect(r, hostRect))
  if (!rects.length) return undefined

  return {
    text,
    page,
    rects: normalizeHighlightRects(rects),
  }
}
