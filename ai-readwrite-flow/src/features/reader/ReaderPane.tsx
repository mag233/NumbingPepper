import { useEffect, useMemo, useRef, useState } from 'react'
import { Document, pdfjs } from 'react-pdf'
import { FileWarning, MousePointerClick } from 'lucide-react'
import Card from '../../shared/components/Card'
import useLibraryStore from '../../stores/libraryStore'
import FloatingMenu from './FloatingMenu'
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import useReaderStore from '../../stores/readerStore'
import useHighlightStore from '../../stores/highlightStore'
import { selectionToHighlight } from './services/selectionToHighlight'
import { type Highlight, type HighlightRect } from './types'
import PdfPageWithHighlights from './components/PdfPageWithHighlights'
import { usePdfFileSource } from './hooks/usePdfFileSource'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc

type Props = {
  onAction: (action: 'summarize' | 'explain' | 'chat', text: string) => void
}

type MenuState = {
  visible: boolean
  x: number
  y: number
  text: string
  page?: number
  rect?: HighlightRect
}

const ReaderPane = ({ onAction }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pageWidth, setPageWidth] = useState(720)
  const [loadError, setLoadError] = useState<string | null>(null)
  const { currentPage, setPage, setPageCount, pageCount, scrollMode } = useReaderStore()
  const [menu, setMenu] = useState<MenuState>({
    visible: false,
    x: 0,
    y: 0,
    text: '',
  })
  const { items, activeId, setLastPosition } = useLibraryStore()
  const { byBookId, hydrate: hydrateHighlights, add: addHighlight } = useHighlightStore()
  const [scrollY, setScrollY] = useState(0)

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeId),
    [items, activeId],
  )
  const { fileSrc, blockedReason } = usePdfFileSource(activeItem)

  useEffect(() => {
    const resize = () => {
      const width = containerRef.current?.clientWidth
      if (width) setPageWidth(Math.min(1400, width - 32))
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const handleSelection = () => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        setMenu((state) => ({ ...state, visible: false }))
        return
      }

      const text = selection.toString().trim()
      if (!text) {
        setMenu((state) => ({ ...state, visible: false }))
        return
      }

      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      const hostRect = node.getBoundingClientRect()
      const info = selectionToHighlight()
      setMenu({
        visible: true,
        text,
        x: rect.left - hostRect.left,
        y: rect.top - hostRect.top,
        page: info?.page,
        rect: info?.rect,
      })
    }

    node.addEventListener('mouseup', handleSelection)
    return () => node.removeEventListener('mouseup', handleSelection)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadError(null)
    if (activeItem?.lastReadPosition?.page) {
      setPage(activeItem.lastReadPosition.page)
      const storedScroll = activeItem.lastReadPosition.scroll_y
      if (typeof storedScroll === 'number' && containerRef.current) {
        containerRef.current.scrollTop = storedScroll
        setScrollY(storedScroll)
      }
    } else {
      setPage(1)
    }
  }, [activeItem?.id, activeItem?.lastReadPosition, setPage])

  useEffect(() => {
    if (!activeId) return
    void hydrateHighlights(activeId)
  }, [activeId, hydrateHighlights])

  const clearSelection = () => {
    const selection = window.getSelection()
    selection?.removeAllRanges()
  }

  const handleAction = async (action: 'summarize' | 'explain' | 'chat' | 'highlight') => {
    if (!menu.text) return
    if (action === 'highlight') {
      if (!activeId || !menu.page || !menu.rect) return
      const highlight: Highlight = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        bookId: activeId,
        content: menu.text,
        color: 'yellow',
        note: null,
        contextRange: { page: menu.page, rects: [menu.rect], zoom: null },
        createdAt: Date.now(),
      }
      await addHighlight(highlight)
      clearSelection()
      setMenu((state) => ({ ...state, visible: false }))
      return
    }
    onAction(action, menu.text)
    setMenu((state) => ({ ...state, visible: false }))
  }

  const highlights = activeId ? (byBookId[activeId] ?? []) : []
  const highlightsForPage = (page: number) =>
    highlights.filter((h) => h.contextRange.page === page)

  const hasPdf = Boolean(fileSrc) && !blockedReason

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadError(blockedReason ?? null)
  }, [blockedReason])

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (scrollMode === 'continuous') return
    if (!pageCount) return
    const direction = event.deltaY > 0 ? 1 : -1
    const next = currentPage + direction
    if (next >= 1 && next <= pageCount) {
      event.preventDefault()
      event.stopPropagation()
      setPage(next)
    }
  }

  useEffect(() => {
    if (!activeId) return
    const handle = window.setTimeout(() => {
      void setLastPosition(activeId, { page: currentPage, scroll_y: scrollY })
    }, 300)
    return () => window.clearTimeout(handle)
  }, [activeId, currentPage, scrollY, setLastPosition])

  return (
    <Card title="Reader / PDF">
      <div
        ref={containerRef}
        className="relative rounded-xl border border-slate-800/70 bg-slate-900/50"
      >
        {hasPdf ? (
          <div
            className="flex max-h-[calc(100vh-200px)] flex-col gap-3 overflow-auto p-4"
            onWheel={handleWheel}
            onScroll={(event) => setScrollY(event.currentTarget.scrollTop)}
          >
            <Document
              file={fileSrc}
              onLoadError={(error) => {
                console.error('[ReaderPane] onLoadError', { error, fileSrc, activeItem })
                setLoadError(`${error.message} | source: ${String(fileSrc ?? 'none')}`)
              }}
              onSourceError={(error) => {
                console.error('[ReaderPane] onSourceError', { error, fileSrc, activeItem })
                setLoadError(`${error.message} | source: ${String(fileSrc ?? 'none')}`)
              }}
              onLoadSuccess={(data) => setPageCount(data.numPages)}
              loading={<p className="text-sm text-slate-400">Loading PDF...</p>}
              error={
                <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-100">
                  Failed to load PDF file.
                </div>
              }
            >
              {scrollMode === 'continuous' && pageCount > 0 ? (
                Array.from({ length: pageCount }).map((_, idx) => (
                  <div key={idx} className="mb-6">
                    <PdfPageWithHighlights
                      pageNumber={idx + 1}
                      width={pageWidth}
                      highlights={highlightsForPage(idx + 1)}
                    />
                  </div>
                ))
              ) : (
                <PdfPageWithHighlights
                  pageNumber={currentPage}
                  width={pageWidth}
                  highlights={highlightsForPage(currentPage)}
                />
              )}
            </Document>
            <p className="text-xs text-slate-400">
              {scrollMode === 'continuous'
                ? 'Continuous scroll: use mouse wheel to browse pages.'
                : 'Paged mode: mouse wheel flips pages; select text to open the floating menu.'}
            </p>
            {loadError && (
              <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-100">
                {loadError}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex items-center gap-2 rounded-lg border border-slate-800/70 bg-slate-900/70 p-3">
              <FileWarning className="size-5 text-amber-400" />
              <p>No PDF selected. Import from Library and click a file to open.</p>
            </div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
              <MousePointerClick className="size-4" />
              Try selecting text below; the floating menu will appear.
            </div>
            <p className="rounded-lg bg-slate-900/70 p-3 leading-relaxed text-slate-200">
              AI-ReadWrite-Flow keeps reading and writing side by side: Reader on the left, Writer and
              Chat on the right. Select any text to invoke the floating menu, quickly summarize, explain,
              or start a chat while keeping context in sync.
            </p>
          </div>
        )}

        {menu.visible && (
          <FloatingMenu
            x={menu.x}
            y={menu.y}
            text={menu.text}
            onAction={handleAction}
          />
        )}
      </div>
    </Card>
  )
}

export default ReaderPane
