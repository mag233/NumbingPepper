import { useEffect, useMemo, useRef, useState } from 'react'
import { Document, pdfjs } from 'react-pdf'
import { FileWarning, MousePointerClick } from 'lucide-react'
import Card from '../../shared/components/Card'
import useLibraryStore from '../../stores/libraryStore'
import FloatingMenu from './FloatingMenu'
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import useReaderStore from '../../stores/readerStore'
import useHighlightStore from '../../stores/highlightStore'
import PdfPageWithHighlights from './components/PdfPageWithHighlights'
import { usePdfFileSource } from './hooks/usePdfFileSource'
import HighlightPopover from './components/HighlightPopover'
import { useHighlightPopover } from './hooks/useHighlightPopover'
import { useSelectionMenu } from './hooks/useSelectionMenu'
import { isNearBottom, nextRenderCount } from './services/continuousRender'
import { useZoomShortcuts } from './hooks/useZoomShortcuts'
import { getPageRenderSize } from './services/fitMode'
import { useFindHighlight } from './hooks/useFindHighlight'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc
type Props = {
  onAction: (action: 'summarize' | 'explain' | 'chat' | 'questions', text: string) => void
}
const ReaderPane = ({ onAction }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [pageWidth, setPageWidth] = useState(720)
  const [docError, setDocError] = useState<{ src: string; message: string } | null>(null)
  const { currentPage, setPage, setPageCount, pageCount, scrollMode, zoom, fitMode, setFitMode, setZoomValue, findQuery, findToken, findActiveHit } = useReaderStore()
  const { items, activeId, setLastPosition } = useLibraryStore()
  const { byBookId, hydrate: hydrateHighlights, add: addHighlight, remove: removeHighlight, setColor: setHighlightColor, setNote: setHighlightNote } = useHighlightStore()
  const [scrollY, setScrollY] = useState(0)
  const scrollYRef = useRef(0)
  const [renderedPages, setRenderedPages] = useState(3)
  const [scrollViewportHeight, setScrollViewportHeight] = useState(0)
  const activeItem = useMemo(() => items.find((item) => item.id === activeId), [items, activeId])
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
  useEffect(() => { const el = scrollRef.current; if (!el) return; const ro = new ResizeObserver((e) => setScrollViewportHeight(e[0]?.contentRect.height ?? 0)); ro.observe(el); return () => ro.disconnect() }, [])
  const { menu, handleAction } = useSelectionMenu({ container: containerRef, activeBookId: activeId, addHighlight, onAction })
  useZoomShortcuts()
  useFindHighlight({
    query: findQuery,
    page: currentPage,
    token: findToken,
    activeHitPage: findActiveHit?.page ?? null,
    activeHitOrdinal: findActiveHit?.ordinal ?? null,
    zoomKey: zoom,
    fitModeKey: fitMode,
  })
  useEffect(() => {
    if (activeItem?.lastReadPosition?.page) {
      const pos = activeItem.lastReadPosition
      setPage(pos.page)
      const storedScroll = pos.scroll_y
      if (typeof storedScroll === 'number' && scrollRef.current) {
        scrollRef.current.scrollTop = storedScroll
        scrollYRef.current = storedScroll
      }
      const restoredFit = pos.fit_mode
      if (restoredFit) setFitMode(restoredFit)
      if (typeof pos.zoom === 'number') setZoomValue(pos.zoom)
      if (!restoredFit) setFitMode(pos.zoom ? 'manual' : 'fitWidth')
    } else {
      setPage(1)
      setZoomValue(1)
      setFitMode('fitWidth')
    }
  }, [activeItem?.id, activeItem?.lastReadPosition, setFitMode, setPage, setZoomValue])
  useEffect(() => {
    if (!activeId) return
    void hydrateHighlights(activeId)
  }, [activeId, hydrateHighlights])

  const highlights = useMemo(() => (activeId ? (byBookId[activeId] ?? []) : []), [activeId, byBookId])
  const highlightsByPage = useMemo(() => {
    const map: Record<number, typeof highlights> = {}
    for (const h of highlights) {
      const page = h.contextRange.page
      if (!map[page]) map[page] = []
      map[page].push(h)
    }
    return map
  }, [highlights])
  const highlightsForPage = (page: number) => highlightsByPage[page] ?? []
  const {
    popover: highlightPopover,
    selectedHighlight,
    handleHit: handleHighlightHit,
    close: closeHighlightPopover,
    askAi,
    summarize,
    explain,
    generateQuestions,
    setColor,
    setNote,
    remove,
  } = useHighlightPopover({
    activeId,
    highlights,
    highlightsForPage,
    container: containerRef,
    onAction,
    removeHighlight,
    setHighlightColor,
    setHighlightNote,
  })

  const hasPdf = Boolean(fileSrc) && !blockedReason
  const loadError = blockedReason ?? (docError?.src === String(fileSrc ?? '') ? docError.message : null)

  useEffect(() => {
    if (!activeId) return
    const handle = window.setTimeout(() => {
      void setLastPosition(activeId, { page: currentPage, scroll_y: scrollYRef.current, zoom, fit_mode: fitMode })
    }, 300)
    return () => window.clearTimeout(handle)
  }, [activeId, currentPage, fitMode, scrollY, setLastPosition, zoom])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (scrollMode === 'continuous') return
    if (!pageCount) return

    const onWheel = (event: WheelEvent) => {
      const canScroll = el.scrollHeight > el.clientHeight + 2
      if (canScroll) return
      const direction = event.deltaY > 0 ? 1 : -1
      const next = currentPage + direction
      if (next < 1 || next > pageCount) return
      event.preventDefault()
      event.stopPropagation()
      setPage(next)
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel as EventListener)
  }, [currentPage, pageCount, scrollMode, setPage])

  const effectiveFitMode = scrollMode === 'continuous' && fitMode === 'fitPage' ? 'fitWidth' : fitMode
  const availableHeight = scrollMode === 'paged' && effectiveFitMode === 'fitPage' ? scrollViewportHeight - 160 : undefined
  const renderSize = getPageRenderSize({ fitMode: effectiveFitMode, baseWidth: pageWidth, zoom, availableHeight })
  const pageSizeProps = renderSize.mode === 'width' ? { width: renderSize.width } : { height: renderSize.height }

  return (
    <Card title="Reader / PDF">
      <div
        ref={containerRef}
        className="relative rounded-xl border border-slate-800/70 bg-slate-900/50"
      >
        {selectedHighlight && highlightPopover && activeId && (
          <HighlightPopover
            key={selectedHighlight.id}
            highlight={selectedHighlight}
            x={highlightPopover.x}
            y={highlightPopover.y}
            onClose={closeHighlightPopover}
            onAskAi={askAi}
            onSummarize={summarize}
            onExplain={explain}
            onGenerateQuestions={generateQuestions}
            onDelete={remove}
            onSetColor={setColor}
            onSetNote={setNote}
          />
        )}
        {hasPdf ? (
          <div
            ref={scrollRef}
            data-arwf-reader-scroll="true"
            className="flex max-h-[calc(100vh-200px)] flex-col gap-3 overflow-auto p-4"
            onScroll={(event) => {
              const el = event.currentTarget
              scrollYRef.current = el.scrollTop
              setScrollY(el.scrollTop)
              if (scrollMode !== 'continuous') return
              if (!pageCount) return
              if (!isNearBottom({ scrollTop: el.scrollTop, clientHeight: el.clientHeight, scrollHeight: el.scrollHeight })) return
              setRenderedPages((cur) => nextRenderCount(cur, pageCount, 3))
            }}
          >
            <Document
              key={String(fileSrc ?? '')}
              file={fileSrc}
              onLoadError={(error) => {
                console.error('[ReaderPane] onLoadError', { error, fileSrc, activeItem })
                setDocError({ src: String(fileSrc ?? ''), message: `${error.message} | source: ${String(fileSrc ?? 'none')}` })
              }}
              onSourceError={(error) => {
                console.error('[ReaderPane] onSourceError', { error, fileSrc, activeItem })
                setDocError({ src: String(fileSrc ?? ''), message: `${error.message} | source: ${String(fileSrc ?? 'none')}` })
              }}
              onLoadSuccess={(data) => {
                setPageCount(data.numPages)
                setRenderedPages(Math.min(3, data.numPages))
                setDocError(null)
              }}
              loading={<p className="text-sm text-slate-400">Loading PDF...</p>}
              error={
                <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-100">
                  Failed to load PDF file.
                </div>
              }
            >
              {scrollMode === 'continuous' && pageCount > 0 ? (
                Array.from({ length: Math.min(pageCount, renderedPages) }).map((_, idx) => (
                  <div key={idx} className="mb-6">
                    <PdfPageWithHighlights
                      pageNumber={idx + 1}
                      {...pageSizeProps}
                      highlights={highlightsForPage(idx + 1)}
                      onHitHighlight={handleHighlightHit}
                    />
                  </div>
                ))
              ) : (
                <PdfPageWithHighlights
                  pageNumber={currentPage}
                  {...pageSizeProps}
                  highlights={highlightsForPage(currentPage)}
                  onHitHighlight={handleHighlightHit}
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

        {menu.visible && <FloatingMenu x={menu.x} y={menu.y} text={menu.text} copyStatus={menu.copyStatus} onAction={handleAction} />}
      </div>
    </Card>
  )
}

export default ReaderPane
