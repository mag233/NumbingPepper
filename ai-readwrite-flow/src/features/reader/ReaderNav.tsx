import { useMemo, useState } from 'react'
import { BookCopy, ChevronLeft, ChevronRight, List, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react'
import Card from '../../shared/components/Card'
import useReaderStore from '../../stores/readerStore'
import FindInDocument from './components/FindInDocument'
import { formatPageForDisplay, resolveJumpTarget } from './services/pageLabels'

type Props = {
  onJump?: (page: number) => void
  onRefresh?: () => void
  scrollMode: 'paged' | 'continuous'
  onToggleScrollMode: () => void
  onToggleNav?: () => void
  navVisible?: boolean
}

const navButton =
  'inline-flex items-center justify-center rounded-lg border border-chrome-border/60 bg-surface-raised/60 px-2 py-1 text-xs text-ink-primary hover:border-accent'

const ReaderNav = ({
  onJump,
  onRefresh,
  scrollMode,
  onToggleScrollMode,
  onToggleNav,
  navVisible,
}: Props) => {
  const { currentPage, pageCount, pageLabels, setPage, zoom, zoomIn, zoomOut, resetZoom, fitMode, setFitMode, outline, outlineStatus, outlineError } =
    useReaderStore()
  const [inputPage, setInputPage] = useState('')

  const tocLines = useMemo(() => outline.slice(0, 400), [outline])
  const currentLabel = useMemo(() => formatPageForDisplay(currentPage, pageLabels), [currentPage, pageLabels])
  const currentLabelHint =
    pageLabels?.[currentPage - 1] && currentLabel !== String(currentPage) ? `${currentLabel} (PDF ${currentPage})` : `${currentPage}`

  const jumpTo = (page: number) => {
    setPage(page)
    onJump?.(page)
  }

  const jumpFromToc = (page: number | null) => {
    if (!page) return
    if (scrollMode === 'continuous') onToggleScrollMode()
    jumpTo(page)
  }

  return (
    <Card
      title="Nav / Quick Jump"
      action={
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <button
            className="inline-flex items-center gap-1 rounded-lg border border-chrome-border/70 px-2 py-1 hover:border-accent hover:text-ink-primary"
            onClick={onToggleScrollMode}
          >
            {scrollMode === 'continuous' ? 'Continuous scroll' : 'Paged scroll'}
          </button>
          {onToggleNav && (
            <button
              className="rounded-lg border border-chrome-border/70 px-2 py-1 text-ink-muted hover:border-accent hover:text-ink-primary"
              onClick={onToggleNav}
              aria-label="Toggle navigation"
            >
              {navVisible ? 'Hide' : 'Show'}
            </button>
          )}
        </div>
      }
      className="flex h-full flex-col"
    >
      <div className="min-h-0 flex-1 space-y-4 overflow-auto text-sm text-ink-primary">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>Page</span>
            <button
              className="inline-flex items-center gap-1 text-ink-muted hover:text-accent"
              onClick={onRefresh}
            >
              <RefreshCw className="size-3" />
              Refresh
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={navButton}
              onClick={() => jumpTo(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-3 py-1 text-sm">
              {currentLabelHint} / {pageCount}
            </span>
            <button
              className={navButton}
              onClick={() => jumpTo(currentPage + 1)}
              disabled={currentPage >= pageCount}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
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
              placeholder={pageLabels ? 'Jump (label or page)' : 'Jump to page'}
              className="w-24 rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-2 py-1 text-sm text-ink-primary focus:border-accent focus:outline-none"
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
          </div>
          {pageLabels && (
            <p className="text-xs text-ink-muted">
              Tip: type printed page labels (e.g., <span className="font-mono">iv</span> or <span className="font-mono">1</span>). Use <span className="font-mono">pdf:15</span> for physical pages.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>Zoom</span>
            <button
              className="text-ink-muted hover:text-accent"
              onClick={resetZoom}
              aria-label="Reset zoom"
            >
              Reset
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className={navButton} onClick={zoomOut} aria-label="Zoom out">
              <ZoomOut className="size-4" />
            </button>
            <span className="rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-3 py-1 text-sm">
              {Math.round(zoom * 100)}%
            </span>
            <button className={navButton} onClick={zoomIn} aria-label="Zoom in">
              <ZoomIn className="size-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500">Shortcut: Ctrl/⌘ + (+ / − / 0)</p>
          <div className="flex items-center gap-2">
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
              title={scrollMode === 'continuous' ? 'Will switch to paged scroll for Fit page.' : undefined}
            >
              Fit page
            </button>
          </div>
        </div>

        <FindInDocument scrollMode={scrollMode} onToggleScrollMode={onToggleScrollMode} onJump={onJump} />

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <List className="size-4" />
            <span>TOC / Bookmarks</span>
          </div>
          {outlineStatus === 'loading' ? (
            <p className="rounded-lg border border-chrome-border/70 bg-surface-raised/70 p-2 text-xs text-ink-muted">
              Loading outline…
            </p>
          ) : outlineStatus === 'error' ? (
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-100">
              Outline error: {outlineError || 'unknown'}
            </p>
          ) : tocLines.length ? (
            <div className="max-h-64 overflow-auto rounded-lg border border-chrome-border/70 bg-surface-raised/70 p-2 text-xs text-ink-primary">
              {tocLines.map((item, idx) => (
                <button
                  key={`${idx}-${item.title}`}
                  onClick={() => jumpFromToc(item.page)}
                  disabled={!item.page}
                  className="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-surface-raised/70 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ paddingLeft: 8 + item.depth * 10 }}
                  title={item.page ? `Go to page ${item.page}` : 'No page destination'}
                >
                  <span className="truncate">{item.title}</span>
                  {item.page && (
                    <span className="ml-auto text-[11px] text-ink-muted">
                      {formatPageForDisplay(item.page, pageLabels)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-1 rounded-lg border border-chrome-border/70 bg-surface-raised/70 p-3 text-xs text-ink-primary">
              <p>No outline available for this PDF.</p>
              <p className="text-ink-muted">Use Find or Page jump instead.</p>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <BookCopy className="size-4" />
            <span>Saved marks</span>
          </div>
          <p className="rounded-lg border border-chrome-border/70 bg-surface-raised/70 p-2 text-xs text-ink-muted">
            Future: support bookmarks and cross-device sync. Use page jump for now.
          </p>
        </div>
      </div>
    </Card>
  )
}

export default ReaderNav
