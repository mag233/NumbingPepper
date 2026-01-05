import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject, type UIEvent } from 'react'

type Params = {
  scrollRef: React.RefObject<HTMLDivElement | null>
  scrollMode: 'paged' | 'continuous'
  currentPage: number
  pageCount: number
  jumpPage: number | null
  jumpToken: number
  setRenderedPages: (next: number | ((prev: number) => number)) => void
  setPage: (page: number) => void
}

type Result = {
  scrollY: number
  scrollYRef: MutableRefObject<number>
  onScroll: (event: UIEvent<HTMLDivElement>) => void
}

const resolvePageNumber = (node: HTMLElement | null) => {
  if (!node) return null
  const raw = node.getAttribute('data-page-number')
  const parsed = raw ? Number(raw) : NaN
  return Number.isFinite(parsed) ? parsed : null
}

const findAnchorPage = (scrollEl: HTMLDivElement, pageCount: number) => {
  const containerTop = scrollEl.getBoundingClientRect().top
  const nodes = scrollEl.querySelectorAll<HTMLElement>('[data-page-number]')
  let lastSeen = 1
  for (const node of nodes) {
    const rect = node.getBoundingClientRect()
    if (rect.bottom < containerTop + 8) {
      const parsed = resolvePageNumber(node)
      if (parsed) lastSeen = parsed
      continue
    }
    const parsed = resolvePageNumber(node)
    if (parsed) return parsed
    break
  }
  return Math.min(Math.max(lastSeen, 1), Math.max(pageCount, 1))
}

const scrollToPage = (scrollEl: HTMLDivElement, page: number) => {
  const node =
    scrollEl.querySelector<HTMLElement>(`.react-pdf__Page[data-page-number="${page}"]`) ??
    scrollEl.querySelector<HTMLElement>(`[data-page-number="${page}"]`)
  if (!node) return
  const containerTop = scrollEl.getBoundingClientRect().top
  const targetTop = node.getBoundingClientRect().top - containerTop + scrollEl.scrollTop
  scrollEl.scrollTo({ top: Math.max(0, targetTop - 8), behavior: 'auto' })
}

export const useReaderScrollState = ({
  scrollRef,
  scrollMode,
  currentPage,
  pageCount,
  jumpPage,
  jumpToken,
  setRenderedPages,
  setPage,
}: Params): Result => {
  const scrollYRef = useRef(0)
  const [scrollY, setScrollY] = useState(0)
  const rafRef = useRef<number | null>(null)
  const lastJumpToken = useRef(0)
  const lastMode = useRef(scrollMode)

  const ensureRendered = useMemo(
    () => (page: number) => setRenderedPages((prev) => Math.max(prev, page)),
    [setRenderedPages],
  )

  const updatePageFromScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const page = findAnchorPage(el, pageCount)
    if (page !== currentPage) setPage(page)
  }, [currentPage, pageCount, scrollRef, setPage])

  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget
    scrollYRef.current = el.scrollTop
    setScrollY(el.scrollTop)
    if (scrollMode !== 'continuous') return
    if (rafRef.current !== null) return
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null
      updatePageFromScroll()
    })
  }

  useEffect(() => {
    if (scrollMode !== 'continuous') return
    if (!jumpPage) return
    if (jumpToken <= lastJumpToken.current) return
    lastJumpToken.current = jumpToken
    const el = scrollRef.current
    if (!el) return
    ensureRendered(jumpPage)
    window.requestAnimationFrame(() => scrollToPage(el, jumpPage))
  }, [ensureRendered, jumpPage, jumpToken, scrollMode, scrollRef])

  useEffect(() => {
    const prev = lastMode.current
    if (prev === scrollMode) return
    lastMode.current = scrollMode
    const el = scrollRef.current
    if (!el) return
    if (scrollMode === 'continuous') {
      ensureRendered(currentPage)
      window.requestAnimationFrame(() => scrollToPage(el, currentPage))
      return
    }
    if (prev === 'continuous') updatePageFromScroll()
  }, [currentPage, ensureRendered, scrollMode, scrollRef, updatePageFromScroll])

  useEffect(
    () => () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    },
    [],
  )

  return { scrollY, scrollYRef, onScroll }
}
