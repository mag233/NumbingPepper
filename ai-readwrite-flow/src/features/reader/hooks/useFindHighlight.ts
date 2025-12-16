import { useEffect } from 'react'
import { locateTextOffset } from '../services/textOffsets'

const OVERLAY_ATTR = 'data-arwf-find-overlay'
const ORIG_ATTR = 'data-arwf-find-orig'
const MAX_RECTS = 140
const MAX_ATTEMPTS = 180
const STABLE_FRAMES = 2

const normalize = (value: string) => value.toLowerCase()

const restoreLegacySpan = (span: HTMLElement) => {
  const orig = span.getAttribute(ORIG_ATTR)
  if (typeof orig === 'string') span.textContent = orig
  span.removeAttribute(ORIG_ATTR)
}

const clearFindArtifacts = () => {
  document.querySelectorAll(`[${OVERLAY_ATTR}]`).forEach((el) => el.remove())
  document.querySelectorAll<HTMLElement>(`[${ORIG_ATTR}]`).forEach(restoreLegacySpan)
}

const ensureOverlay = (host: HTMLElement) => {
  let overlay = host.querySelector<HTMLElement>(`[${OVERLAY_ATTR}]`)
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.setAttribute(OVERLAY_ATTR, 'true')
    overlay.className = 'pointer-events-none absolute inset-0 z-30'
    host.appendChild(overlay)
  }
  overlay.textContent = ''
  return overlay
}

const addRect = (overlay: HTMLElement, rect: DOMRect, hostRect: DOMRect, active: boolean) => {
  const left = rect.left - hostRect.left
  const top = rect.top - hostRect.top
  if (hostRect.width <= 0 || hostRect.height <= 0) return null
  if (rect.width <= 0 || rect.height <= 0) return null

  const el = document.createElement('div')
  el.className = active ? 'arwf-find-rect arwf-find-rect-active' : 'arwf-find-rect'
  el.style.left = `${left}px`
  el.style.top = `${top}px`
  el.style.width = `${rect.width}px`
  el.style.height = `${rect.height}px`
  overlay.appendChild(el)
  return el
}

const rectKey = (el: HTMLElement) => {
  const r = el.getBoundingClientRect()
  const parts = [r.left, r.top, r.width, r.height].map((v) => Math.round(v))
  return parts.join(',')
}

const clampScrollTop = (el: HTMLElement, nextTop: number) => {
  const max = Math.max(0, el.scrollHeight - el.clientHeight)
  return Math.min(Math.max(0, nextTop), max)
}

const scrollToRect = (scrollEl: HTMLElement, rect: DOMRect) => {
  const containerRect = scrollEl.getBoundingClientRect()
  const desiredTop = rect.top - containerRect.top - containerRect.height * 0.25
  const nextTop = clampScrollTop(scrollEl, scrollEl.scrollTop + desiredTop)
  scrollEl.scrollTop = nextTop
}

const getScrollContainer = (host: HTMLElement) =>
  host.closest<HTMLElement>('[data-arwf-reader-scroll="true"]')

const getTextNodes = (element: HTMLElement) => {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  for (;;) {
    const next = walker.nextNode()
    if (!next) break
    const text = next as Text
    const value = text.nodeValue ?? ''
    if (value.length === 0) continue
    nodes.push(text)
  }
  return nodes
}

const findAllIndices = (text: string, query: string) => {
  const t = normalize(text)
  const q = normalize(query).trim()
  if (!q) return []
  const out: number[] = []
  let from = 0
  while (from < t.length) {
    const idx = t.indexOf(q, from)
    if (idx === -1) break
    out.push(idx)
    from = idx + q.length
  }
  return out
}

const clampOrdinal = (
  activeHitPage: number | null,
  activeHitOrdinal: number | null,
  page: number,
  max: number,
) => {
  const desired = activeHitPage === page ? (activeHitOrdinal ?? 0) : 0
  if (max <= 1) return 0
  return Math.min(Math.max(0, desired), max - 1)
}

const rectsForNodeMatch = (nodes: Text[], queryLen: number, matchIndex: number) => {
  const lengths = nodes.map((n) => (n.nodeValue ?? '').length)
  const start = locateTextOffset(lengths, matchIndex)
  const end = locateTextOffset(lengths, matchIndex + queryLen)
  if (!start || !end) return []
  const startNode = nodes[start.nodeIndex]
  const endNode = nodes[end.nodeIndex]
  if (!startNode || !endNode) return []
  try {
    const range = document.createRange()
    range.setStart(startNode, start.offset)
    range.setEnd(endNode, end.offset)
    return Array.from(range.getClientRects())
  } catch {
    return []
  }
}

type Args = {
  query: string
  page: number
  token: number
  activeHitPage: number | null
  activeHitOrdinal: number | null
  zoomKey: number
  fitModeKey: 'manual' | 'fitWidth' | 'fitPage'
}

export const useFindHighlight = (args: Args) => {
  const { activeHitOrdinal, activeHitPage, fitModeKey, page, query, token, zoomKey } = args

  useEffect(() => {
    const q = query.trim()
    clearFindArtifacts()
    if (!q) return

    let disposed = false
    let raf: number | null = null
    let attempts = 0
    let didScroll = false
    let stable = 0
    let lastKey = ''

    const apply = () => {
      if (disposed) return
      const pageNode = document.querySelector<HTMLElement>(`.react-pdf__Page[data-page-number="${page}"]`)
      const textLayer = pageNode?.querySelector<HTMLElement>('.textLayer')
      const host = pageNode?.closest<HTMLElement>('[data-arwf-page-host]') ?? null
      if (!pageNode || !textLayer || !host) {
        attempts += 1
        if (attempts < MAX_ATTEMPTS) raf = window.requestAnimationFrame(apply)
        return
      }

      const nodes = getTextNodes(textLayer)
      if (!nodes.length) {
        attempts += 1
        if (attempts < MAX_ATTEMPTS) raf = window.requestAnimationFrame(apply)
        return
      }

      const fullText = nodes.map((n) => n.nodeValue ?? '').join('')
      const indices = findAllIndices(fullText, q)
      if (!indices.length) {
        attempts += 1
        if (attempts < MAX_ATTEMPTS) raf = window.requestAnimationFrame(apply)
        return
      }

      const overlay = ensureOverlay(host)
      const hostRect = host.getBoundingClientRect()
      const activeOrdinal = clampOrdinal(activeHitPage, activeHitOrdinal, page, indices.length)
      const queryLen = q.length

      let rectCount = 0
      let activeEl: HTMLElement | null = null
      for (let ordinal = 0; ordinal < indices.length; ordinal += 1) {
        const idx = indices[ordinal]!
        const rects = rectsForNodeMatch(nodes, queryLen, idx)
        const isActive = ordinal === activeOrdinal
        for (const r of rects) {
          const el = addRect(overlay, r, hostRect, isActive)
          if (isActive && !activeEl && el) activeEl = el
          rectCount += 1
          if (rectCount >= MAX_RECTS) break
        }
        if (rectCount >= MAX_RECTS) break
      }

      if (!activeEl) {
        attempts += 1
        if (attempts < MAX_ATTEMPTS) raf = window.requestAnimationFrame(apply)
        return
      }

      const currentKey = rectKey(activeEl)
      if (currentKey !== lastKey) {
        lastKey = currentKey
        stable = 0
      } else {
        stable += 1
      }

      if (stable < STABLE_FRAMES) {
        attempts += 1
        if (attempts < MAX_ATTEMPTS) raf = window.requestAnimationFrame(apply)
        return
      }

      if (!didScroll) {
        didScroll = true
        const scrollEl = getScrollContainer(host)
        if (scrollEl) scrollToRect(scrollEl, activeEl.getBoundingClientRect())
      }
    }

    raf = window.requestAnimationFrame(apply)
    return () => {
      disposed = true
      if (raf !== null) window.cancelAnimationFrame(raf)
    }
  }, [activeHitOrdinal, activeHitPage, fitModeKey, page, query, token, zoomKey])
}
