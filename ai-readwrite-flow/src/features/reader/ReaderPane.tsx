import { useEffect, useMemo, useRef, useState } from 'react'
import { pdfjs } from 'react-pdf'
import Card from '../../shared/components/Card'
import useLibraryStore from '../../stores/libraryStore'
import { useScopedLibrary } from '../../stores/useScopedLibrary'
import FloatingMenu from './FloatingMenu'
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import useReaderStore from '../../stores/readerStore'
import type { LastReadPosition } from '../../lib/db'
import useHighlightStore from '../../stores/highlightStore'
import { usePdfFileSource } from './hooks/usePdfFileSource'
import SelectedHighlightPopover from './components/SelectedHighlightPopover'
import ReaderEmptyState from './components/ReaderEmptyState'
import ReaderPdfContent from './components/ReaderPdfContent'
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
import { useReaderScrollState } from './hooks/useReaderScrollState'
import { usePagedKeyNav } from './hooks/usePagedKeyNav'
import WriterReferenceTagPrompt from './components/WriterReferenceTagPrompt'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc

type Props = {
  onAction: (action: 'summarize' | 'explain' | 'chat' | 'questions', text: string) => void
  showBottomToolbar?: boolean
}

const ReaderPane = ({ onAction, showBottomToolbar = false }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [pageWidth, setPageWidth] = useState(720)
  const [docError, setDocError] = useState<{ src: string; message: string } | null>(null)
  const { currentPage, setPage, requestJump, jumpPage, jumpToken, setPageCount, pageCount, scrollMode, toggleScrollMode, zoom, fitMode, setFitMode, setZoomValue, findQuery, findToken, findActiveHit, resetOutline, setOutline, setOutlineLoading, setOutlineError, setPageLabels } = useReaderStore()
  const { activeId, activeItem } = useScopedLibrary('project')
  const setLastPosition = useLibraryStore((s) => s.setLastPosition)
  const { byBookId, hydrate: hydrateHighlights, add: addHighlight, remove: removeHighlight, setColor: setHighlightColor, setNote: setHighlightNote } =
    useHighlightStore()
  const [renderedPages, setRenderedPages] = useState(3)
  const [scrollViewportHeight, setScrollViewportHeight] = useState(0)
  const { fileSrc, blockedReason } = usePdfFileSource(activeItem ?? undefined)
  const selectionOverlay = useSelectionOverlay({ container: containerRef })
  const { onLoadError, onLoadSuccess, onSourceError } = usePdfDocumentMeta({
    fileSrc: fileSrc ?? null,
    activeItem: activeItem ?? undefined,
    setPageCount,
    setRenderedPages,
    setDocError,
    setOutlineLoading,
    setOutline,
    setOutlineError,
    setPageLabels,
  })
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
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver((e) => setScrollViewportHeight(e[0]?.contentRect.height ?? 0))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const { menu, handleAction, dismissMenu } = useSelectionMenu({
    container: containerRef,
    activeBookId: activeId ?? undefined,
    addHighlight,
    onAction,
  })
  useZoomShortcuts()
  useFindHighlight({ query: findQuery, page: currentPage, token: findToken, activeHitPage: findActiveHit?.page ?? null, activeHitOrdinal: findActiveHit?.ordinal ?? null, zoomKey: zoom, fitModeKey: fitMode })
  const pendingRestoreRef = useRef<LastReadPosition | null>(null)
  useEffect(() => {
    const pos = activeItem?.lastReadPosition
    if (pos?.page) {
      pendingRestoreRef.current = pos
      const restoredFit = pos.fit_mode
      if (restoredFit) setFitMode(restoredFit)
      if (typeof pos.zoom === 'number') setZoomValue(pos.zoom)
      if (!restoredFit) setFitMode(pos.zoom ? 'manual' : 'fitWidth')
      requestJump(pos.page)
      return
    }
    pendingRestoreRef.current = null
    setPage(1)
    setZoomValue(1)
    setFitMode('fitWidth')
  }, [activeItem?.id, activeItem?.lastReadPosition, requestJump, scrollMode, setFitMode, setPage, setRenderedPages, setZoomValue])

  useEffect(() => {
    const pending = pendingRestoreRef.current
    if (!pending) return
    if (!activeItem?.id) return
    if (scrollMode !== 'continuous') {
      pendingRestoreRef.current = null
      return
    }
    if (renderedPages < pending.page) return
    const raf = window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => {
        const el = scrollRef.current
        if (!el) return
        if (typeof pending.scroll_y === 'number' && pending.scroll_y > 0) {
          el.scrollTo({ top: pending.scroll_y, behavior: 'auto' })
        }
        pendingRestoreRef.current = null
      }),
    )
    return () => window.cancelAnimationFrame(raf)
  }, [activeItem?.id, pageCount, renderedPages, scrollMode])
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
    activeId: activeId ?? undefined,
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
  const { scrollY, scrollYRef, onScroll } = useReaderScrollState({
    scrollRef,
    scrollMode,
    currentPage,
    pageCount,
    jumpPage,
    jumpToken,
    setRenderedPages,
    setPage,
  })
  useEffect(() => {
    if (!activeId) return
    const handle = window.setTimeout(() => {
      void setLastPosition(activeId, { page: currentPage, scroll_y: scrollYRef.current, zoom, fit_mode: fitMode })
    }, 300)
    return () => window.clearTimeout(handle)
  }, [activeId, currentPage, fitMode, scrollY, scrollYRef, setLastPosition, zoom])
  usePagedWheelFlip({ scrollRef, enabled: scrollMode === 'paged', currentPage, pageCount, setPage: requestJump })
  usePagedKeyNav({ enabled: scrollMode === 'paged', currentPage, pageCount, setPage: requestJump })
  const effectiveFitMode = scrollMode === 'continuous' && fitMode === 'fitPage' ? 'fitWidth' : fitMode
  const availableHeight = scrollMode === 'paged' && effectiveFitMode === 'fitPage' ? scrollViewportHeight - 160 : undefined
  const renderSize = getPageRenderSize({ fitMode: effectiveFitMode, baseWidth: pageWidth, zoom, availableHeight })
  const pageSizeProps = renderSize.mode === 'width' ? { width: renderSize.width } : { height: renderSize.height }
  return (
    <Card className="flex h-full min-h-0 flex-col p-0">
      <header className="flex items-center justify-between gap-2 border-b border-chrome-border/70 px-4 py-3">
        <h2 className="text-sm font-semibold text-ink-primary">Reader / PDF</h2>
      </header>
      <div ref={containerRef} className="relative flex min-h-0 flex-1 flex-col bg-surface-raised/30">
        <WriterToast />
        <WriterReferenceTagPrompt />
        <SelectedHighlightPopover
          activeId={activeId ?? undefined}
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
          <ReaderPdfContent
            fileSrc={fileSrc ?? null}
            scrollRef={scrollRef}
            scrollMode={scrollMode}
            currentPage={currentPage}
            pageCount={pageCount}
            renderedPages={renderedPages}
            pageSizeProps={pageSizeProps}
            highlightsForPage={highlightsForPage}
            selectionOverlay={effectiveSelectionOverlay}
            onHitHighlight={handleHighlightHit}
            onLoadError={onLoadError}
            onSourceError={onSourceError}
            onLoadSuccess={onLoadSuccess}
            onScroll={(event) => {
              onScroll(event)
              if (scrollMode !== 'continuous') return
              if (!pageCount) return
              const el = event.currentTarget
              if (!isNearBottom({ scrollTop: el.scrollTop, clientHeight: el.clientHeight, scrollHeight: el.scrollHeight })) return
              setRenderedPages((cur) => nextRenderCount(cur, pageCount, 3))
            }}
            showBottomToolbar={showBottomToolbar}
            onToggleScrollMode={toggleScrollMode}
            loadError={loadError}
          />
        ) : (
          <ReaderEmptyState />
        )}
        {menu.visible && (
          <FloatingMenu
            x={menu.x}
            y={menu.y}
            text={menu.text}
            page={menu.page}
            rects={menu.rects}
            activeBookId={activeId ?? undefined}
            copyStatus={menu.copyStatus}
            onAction={handleAction}
            onDismiss={dismissMenu}
          />
        )}
      </div>
    </Card>
  )
}

export default ReaderPane
