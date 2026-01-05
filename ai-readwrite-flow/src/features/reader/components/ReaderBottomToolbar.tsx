import { useMemo, useState } from 'react'
import { BookmarkPlus, ChevronLeft, ChevronRight, RefreshCw, Search, ZoomIn, ZoomOut } from 'lucide-react'
import useReaderStore from '../../../stores/readerStore'
import useLibraryStore from '../../../stores/libraryStore'
import useBookmarkStore from '../../../stores/bookmarkStore'
import FindInDocument from './FindInDocument'
import { formatPageForDisplay, resolveJumpTarget } from '../services/pageLabels'
import { generateBookmarkId } from '../services/bookmarkIds'
import type { Bookmark } from '../types'

type Props = {
  scrollMode: 'paged' | 'continuous'
  onToggleScrollMode: () => void
  onRefresh?: () => void
  onJump?: (page: number) => void
}

const navButton =
  'inline-flex items-center justify-center rounded-lg border border-chrome-border/60 bg-surface-raised/60 px-2 py-1 text-xs text-ink-primary hover:border-accent disabled:cursor-not-allowed disabled:opacity-60'

const pill =
  'rounded-lg border border-chrome-border/70 bg-surface-raised/60 px-2 py-1 text-xs text-ink-primary'

const ReaderBottomToolbar = ({ scrollMode, onToggleScrollMode, onRefresh, onJump }: Props) => {
  const { currentPage, pageCount, pageLabels, requestJump, zoom, zoomIn, zoomOut, resetZoom, fitMode, setFitMode } =
    useReaderStore()
  const activeBookId = useLibraryStore((s) => s.activeId)
  const addBookmarkEntry = useBookmarkStore((s) => s.add)
  const [inputPage, setInputPage] = useState('')
  const [showFind, setShowFind] = useState(false)

  const currentLabel = useMemo(() => formatPageForDisplay(currentPage, pageLabels), [currentPage, pageLabels])
  const currentLabelHint =
    pageLabels?.[currentPage - 1] && currentLabel !== String(currentPage) ? `${currentLabel} (PDF ${currentPage})` : `${currentPage}`

  const jumpTo = (page: number) => {
    requestJump(page)
    onJump?.(page)
  }

  const addBookmark = () => {
    if (!activeBookId) return
    const now = Date.now()
    const pageLabel = formatPageForDisplay(currentPage, pageLabels)
    const bookmark: Bookmark = {
      id: generateBookmarkId(),
      bookId: activeBookId,
      page: currentPage,
      pageLabel,
      title: null,
      createdAt: now,
      updatedAt: now,
    }
    void addBookmarkEntry(bookmark)
  }

  return (
    <div className="border-t border-chrome-border/70 bg-surface-base/60">
      <div className="flex w-full flex-col gap-2 px-3 py-2">
        {showFind && (
          <div className="rounded-xl border border-chrome-border/70 bg-surface-raised/50 p-3">
            <FindInDocument scrollMode={scrollMode} onToggleScrollMode={onToggleScrollMode} onJump={onJump} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={navButton}
            onClick={onToggleScrollMode}
            title="Toggle scroll mode"
          >
            {scrollMode === 'continuous' ? 'Continuous' : 'Paged'}
          </button>

          <div className="mx-1 h-5 w-px bg-chrome-border/60" />

          <button className={navButton} onClick={() => jumpTo(currentPage - 1)} disabled={currentPage <= 1}>
            <ChevronLeft className="size-4" />
          </button>
          <span className={pill}>
            {currentLabelHint} / {pageCount}
          </span>
          <button className={navButton} onClick={() => jumpTo(currentPage + 1)} disabled={currentPage >= pageCount}>
            <ChevronRight className="size-4" />
          </button>
          <button
            type="button"
            className={navButton}
            onClick={addBookmark}
            title="Add bookmark"
            disabled={!activeBookId}
          >
            <BookmarkPlus className="size-4" />
          </button>
          <input
            type="text"
            inputMode="text"
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              const page = resolveJumpTarget({ input: inputPage, pageCount, pageLabels })
              if (page) jumpTo(page)
            }}
            placeholder={pageLabels ? 'Jump (label/page)' : 'Jump'}
            className="w-28 rounded-lg border border-chrome-border/70 bg-surface-raised/60 px-2 py-1 text-xs text-ink-primary focus:border-accent focus:outline-none"
          />
          <button
            className={navButton}
            onClick={() => {
              const page = resolveJumpTarget({ input: inputPage, pageCount, pageLabels })
              if (page) jumpTo(page)
            }}
          >
            Go
          </button>
          {onRefresh && (
            <button className={navButton} onClick={onRefresh} title="Refresh">
              <RefreshCw className="size-4" />
            </button>
          )}

          <div className="mx-1 h-5 w-px bg-chrome-border/60" />

          <button className={navButton} onClick={() => setShowFind((v) => !v)} title="Find in document">
            <Search className="size-4" />
            <span className="ml-1">{showFind ? 'Hide Find' : 'Find'}</span>
          </button>

          <div className="mx-1 h-5 w-px bg-chrome-border/60" />

          <button className={navButton} onClick={zoomOut} aria-label="Zoom out">
            <ZoomOut className="size-4" />
          </button>
          <span className={pill}>{Math.round(zoom * 100)}%</span>
          <button className={navButton} onClick={zoomIn} aria-label="Zoom in">
            <ZoomIn className="size-4" />
          </button>
          <button className={navButton} onClick={resetZoom} title="Reset zoom">
            Reset
          </button>

          <div className="mx-1 h-5 w-px bg-chrome-border/60" />

          <button
            className={`${navButton} ${fitMode === 'manual' ? 'border-accent' : ''}`}
            onClick={() => setFitMode('manual')}
          >
            Manual
          </button>
          <button
            className={`${navButton} ${fitMode === 'fitWidth' ? 'border-accent' : ''}`}
            onClick={() => setFitMode('fitWidth')}
          >
            Fit width
          </button>
          <button
            className={`${navButton} ${fitMode === 'fitPage' ? 'border-accent' : ''}`}
            onClick={() => {
              if (scrollMode === 'continuous') onToggleScrollMode()
              setFitMode('fitPage')
            }}
            title={scrollMode === 'continuous' ? 'Switches to paged scroll for Fit page.' : undefined}
          >
            Fit page
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReaderBottomToolbar
