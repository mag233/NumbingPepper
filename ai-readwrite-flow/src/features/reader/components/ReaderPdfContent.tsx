import type { RefObject, UIEvent } from 'react'
import { Document } from 'react-pdf'
import PdfPageWithHighlights from './PdfPageWithHighlights'
import ReaderBottomToolbar from './ReaderBottomToolbar'
import type { Highlight, HighlightRect } from '../types'

type SelectionOverlay = { page: number; rects: HighlightRect[] } | null

type Props = {
  fileSrc: string | null
  scrollRef: RefObject<HTMLDivElement | null>
  scrollMode: 'paged' | 'continuous'
  currentPage: number
  pageCount: number
  renderedPages: number
  pageSizeProps: { width?: number; height?: number }
  highlightsForPage: (page: number) => Highlight[]
  selectionOverlay: SelectionOverlay
  onHitHighlight: (pageNumber: number, x: number, y: number, clientX: number, clientY: number) => void
  onLoadError: (error: Error) => void
  onSourceError: (error: Error) => void
  onLoadSuccess: (doc: { numPages: number }) => void
  onScroll: (event: UIEvent<HTMLDivElement>) => void
  showBottomToolbar: boolean
  onToggleScrollMode: () => void
  loadError: string | null
}

const ReaderPdfContent = ({
  fileSrc,
  scrollRef,
  scrollMode,
  currentPage,
  pageCount,
  renderedPages,
  pageSizeProps,
  highlightsForPage,
  selectionOverlay,
  onHitHighlight,
  onLoadError,
  onSourceError,
  onLoadSuccess,
  onScroll,
  showBottomToolbar,
  onToggleScrollMode,
  loadError,
}: Props) => (
  <div className="flex min-h-0 flex-1 flex-col">
    <div
      ref={scrollRef}
      data-arwf-reader-scroll="true"
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3"
      onScroll={onScroll}
    >
      <Document
        key={String(fileSrc ?? '')}
        file={fileSrc}
        onLoadError={onLoadError}
        onSourceError={onSourceError}
        onLoadSuccess={onLoadSuccess}
        loading={<p className="text-sm text-ink-muted">Loading PDF...</p>}
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
                selectionRects={selectionOverlay?.page === idx + 1 ? selectionOverlay.rects : undefined}
                onHitHighlight={onHitHighlight}
              />
            </div>
          ))
        ) : (
          <PdfPageWithHighlights
            pageNumber={currentPage}
            {...pageSizeProps}
            highlights={highlightsForPage(currentPage)}
            selectionRects={selectionOverlay?.page === currentPage ? selectionOverlay.rects : undefined}
            onHitHighlight={onHitHighlight}
          />
        )}
      </Document>
      <p className="text-xs text-ink-muted">
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
    {showBottomToolbar && <ReaderBottomToolbar scrollMode={scrollMode} onToggleScrollMode={onToggleScrollMode} />}
  </div>
)

export default ReaderPdfContent
