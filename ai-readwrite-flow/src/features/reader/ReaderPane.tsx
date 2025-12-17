import { useEffect, useMemo, useRef, useState } from 'react'
import { Document, pdfjs } from 'react-pdf'
import Card from '../../shared/components/Card'
import useLibraryStore from '../../stores/libraryStore'
import FloatingMenu from './FloatingMenu'
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import useReaderStore from '../../stores/readerStore'
import useHighlightStore from '../../stores/highlightStore'
import PdfPageWithHighlights from './components/PdfPageWithHighlights'
import { usePdfFileSource } from './hooks/usePdfFileSource'
import SelectedHighlightPopover from './components/SelectedHighlightPopover'
import ReaderEmptyState from './components/ReaderEmptyState'
import { useHighlightPopover } from './hooks/useHighlightPopover'
import { useSelectionMenu } from './hooks/useSelectionMenu'
import { isNearBottom, nextRenderCount } from './services/continuousRender'
import { useZoomShortcuts } from './hooks/useZoomShortcuts'
import { getPageRenderSize } from './services/fitMode'
import { useFindHighlight } from './hooks/useFindHighlight'
import { usePagedWheelFlip } from './hooks/usePagedWheelFlip'
import { useSelectionOverlay } from './hooks/useSelectionOverlay'
import { usePdfDocumentMeta } from './hooks/usePdfDocumentMeta'
import { useWriterHighlightActions } from './hooks/useWriterHighlightActions'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc
type Props = { onAction: (action: 'summarize' | 'explain' | 'chat' | 'questions', text: string) => void }
const ReaderPane = ({ onAction }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [pageWidth, setPageWidth] = useState(720)
  const [docError, setDocError] = useState<{ src: string; message: string } | null>(null)
  const { currentPage, setPage, setPageCount, pageCount, scrollMode, zoom, fitMode, setFitMode, setZoomValue, findQuery, findToken, findActiveHit, resetOutline, setOutline, setOutlineLoading, setOutlineError, setPageLabels } = useReaderStore()
  const { items, activeId, setLastPosition } = useLibraryStore()
  const { byBookId, hydrate: hydrateHighlights, add: addHighlight, remove: removeHighlight, setColor: setHighlightColor, setNote: setHighlightNote } = useHighlightStore()
  const [scrollY, setScrollY] = useState(0)
  const scrollYRef = useRef(0)
  const [renderedPages, setRenderedPages] = useState(3)
  const [scrollViewportHeight, setScrollViewportHeight] = useState(0)
  const activeItem = useMemo(() => items.find((item) => item.id === activeId), [items, activeId])
  const { fileSrc, blockedReason } = usePdfFileSource(activeItem)
  const selectionOverlay = useSelectionOverlay({ container: containerRef })
  const { onLoadError, onLoadSuccess, onSourceError } = usePdfDocumentMeta({
    fileSrc: fileSrc ?? null,
    activeItem,
    setPageCount,
    setRenderedPages,
    setDocError,
    setOutlineLoading,
    setOutline,
    setOutlineError,
    setPageLabels,
  })
  useEffect(() => { const resize = () => { const width = containerRef.current?.clientWidth; if (width) setPageWidth(Math.min(1400, width - 32)) }; resize(); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize) }, [])
  useEffect(() => { const el = scrollRef.current; if (!el) return; const ro = new ResizeObserver((e) => setScrollViewportHeight(e[0]?.contentRect.height ?? 0)); ro.observe(el); return () => ro.disconnect() }, [])
  const { menu, handleAction, dismissMenu } = useSelectionMenu({ container: containerRef, activeBookId: activeId, addHighlight, onAction })
  useZoomShortcuts()
  useFindHighlight({ query: findQuery, page: currentPage, token: findToken, activeHitPage: findActiveHit?.page ?? null, activeHitOrdinal: findActiveHit?.ordinal ?? null, zoomKey: zoom, fitModeKey: fitMode })
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
    resetOutline()
  }, [activeItem?.id, resetOutline])
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

  const menuSelectionOverlay = useMemo(() => {
    if (!menu.visible) return null
    if (!menu.page || !menu.rects?.length) return null
    return { page: menu.page, rects: menu.rects }
  }, [menu.page, menu.rects, menu.visible])

  const effectiveSelectionOverlay = selectionOverlay ?? menuSelectionOverlay
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
  const { Toast: WriterToast, addAsWritingReference, addToWritingContext } = useWriterHighlightActions({
    highlight: selectedHighlight,
    onClosePopover: closeHighlightPopover,
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

  usePagedWheelFlip({
    scrollRef,
    enabled: scrollMode === 'paged',
    currentPage,
    pageCount,
    setPage,
  })

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
        <WriterToast />
        <SelectedHighlightPopover
          activeId={activeId}
          selectedHighlight={selectedHighlight}
          popover={highlightPopover}
          onClose={closeHighlightPopover}
          onAskAi={askAi}
          onSummarize={summarize}
          onExplain={explain}
          onGenerateQuestions={generateQuestions}
          onAddToWritingContext={() => void addToWritingContext()}
          onAddAsWritingReference={() => void addAsWritingReference()}
          onDelete={remove}
          onSetColor={setColor}
          onSetNote={setNote}
        />
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
              onLoadError={onLoadError}
              onSourceError={onSourceError}
              onLoadSuccess={onLoadSuccess}
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
                      selectionRects={
                        effectiveSelectionOverlay?.page === idx + 1 ? effectiveSelectionOverlay.rects : undefined
                      }
                      onHitHighlight={handleHighlightHit}
                    />
                  </div>
                ))
              ) : (
                <PdfPageWithHighlights
                  pageNumber={currentPage}
                  {...pageSizeProps}
                  highlights={highlightsForPage(currentPage)}
                  selectionRects={
                    effectiveSelectionOverlay?.page === currentPage ? effectiveSelectionOverlay.rects : undefined
                  }
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
          <ReaderEmptyState />
        )}

        {menu.visible && <FloatingMenu x={menu.x} y={menu.y} text={menu.text} page={menu.page} rects={menu.rects} activeBookId={activeId} copyStatus={menu.copyStatus} onAction={handleAction} onDismiss={dismissMenu} />}
      </div>
    </Card>
  )
}

export default ReaderPane
