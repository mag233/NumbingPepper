import { useMemo, useState } from 'react'
import { BookCopy, ChevronLeft, ChevronRight, List, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react'
import Card from '../../shared/components/Card'
import useReaderStore from '../../stores/readerStore'
import FindInDocument from './components/FindInDocument'

type Props = {
  onJump?: (page: number) => void
  onRefresh?: () => void
  scrollMode: 'paged' | 'continuous'
  onToggleScrollMode: () => void
  onToggleNav?: () => void
  navVisible?: boolean
}

const navButton =
  'inline-flex items-center justify-center rounded-lg border border-slate-800/60 bg-slate-900/60 px-2 py-1 text-xs text-slate-100 hover:border-sky-500 hover:text-sky-100'

const ReaderNav = ({
  onJump,
  onRefresh,
  scrollMode,
  onToggleScrollMode,
  onToggleNav,
  navVisible,
}: Props) => {
  const { currentPage, pageCount, setPage, zoom, zoomIn, zoomOut, resetZoom, fitMode, setFitMode, outline, outlineStatus, outlineError } =
    useReaderStore()
  const [inputPage, setInputPage] = useState<number | ''>('')

  const tocLines = useMemo(() => outline.slice(0, 400), [outline])

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
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button
            className="inline-flex items-center gap-1 rounded-lg border border-slate-800/70 px-2 py-1 hover:border-sky-500 hover:text-sky-100"
            onClick={onToggleScrollMode}
          >
            {scrollMode === 'continuous' ? 'Continuous scroll' : 'Paged scroll'}
          </button>
          {onToggleNav && (
            <button
              className="rounded-lg border border-slate-800/70 px-2 py-1 text-slate-400 hover:border-sky-500 hover:text-sky-100"
              onClick={onToggleNav}
              aria-label="Toggle navigation"
            >
              {navVisible ? 'Hide' : 'Show'}
            </button>
          )}
        </div>
      }
      className="h-full"
    >
      <div className="space-y-4 text-sm text-slate-200">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Page</span>
            <button
              className="inline-flex items-center gap-1 text-slate-400 hover:text-sky-200"
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
            <span className="rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-1 text-sm">
              {currentPage} / {pageCount}
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
              type="number"
              min={1}
              max={pageCount}
              value={inputPage}
              onChange={(e) => setInputPage(e.target.value ? Number(e.target.value) : '')}
              placeholder="Jump to"
              className="w-24 rounded-lg border border-slate-800/70 bg-slate-900/70 px-2 py-1 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
            />
            <button
              className={navButton}
              onClick={() => {
                if (typeof inputPage === 'number' && inputPage >= 1 && inputPage <= pageCount) {
                  jumpTo(inputPage)
                }
              }}
            >
              Go
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Zoom</span>
            <button
              className="text-slate-400 hover:text-sky-200"
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
            <span className="rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-1 text-sm">
              {Math.round(zoom * 100)}%
            </span>
            <button className={navButton} onClick={zoomIn} aria-label="Zoom in">
              <ZoomIn className="size-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500">Shortcut: Ctrl/⌘ + (+ / − / 0)</p>
          <div className="flex items-center gap-2">
            <button
              className={`${navButton} ${fitMode === 'manual' ? 'border-sky-500 text-sky-100' : ''}`}
              onClick={() => setFitMode('manual')}
            >
              Manual
            </button>
            <button
              className={`${navButton} ${fitMode === 'fitWidth' ? 'border-sky-500 text-sky-100' : ''}`}
              onClick={() => setFitMode('fitWidth')}
            >
              Fit width
            </button>
            <button
              className={`${navButton} ${fitMode === 'fitPage' ? 'border-sky-500 text-sky-100' : ''}`}
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
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <List className="size-4" />
            <span>TOC / Bookmarks</span>
          </div>
          {outlineStatus === 'loading' ? (
            <p className="rounded-lg border border-slate-800/70 bg-slate-900/70 p-2 text-xs text-slate-400">
              Loading outline…
            </p>
          ) : outlineStatus === 'error' ? (
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-100">
              Outline error: {outlineError || 'unknown'}
            </p>
          ) : tocLines.length ? (
            <div className="max-h-64 overflow-auto rounded-lg border border-slate-800/70 bg-slate-900/70 p-2 text-xs text-slate-200">
              {tocLines.map((item, idx) => (
                <button
                  key={`${idx}-${item.title}`}
                  onClick={() => jumpFromToc(item.page)}
                  disabled={!item.page}
                  className="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-slate-800/60 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ paddingLeft: 8 + item.depth * 10 }}
                  title={item.page ? `Go to page ${item.page}` : 'No page destination'}
                >
                  <span className="truncate">{item.title}</span>
                  {item.page && <span className="ml-auto text-[11px] text-slate-400">{item.page}</span>}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-1 rounded-lg border border-slate-800/70 bg-slate-900/70 p-3 text-xs text-slate-300">
              <p>No outline available for this PDF.</p>
              <p className="text-slate-500">Use Find or Page jump instead.</p>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <BookCopy className="size-4" />
            <span>Saved marks</span>
          </div>
          <p className="rounded-lg border border-slate-800/70 bg-slate-900/70 p-2 text-xs text-slate-400">
            Future: support bookmarks and cross-device sync. Use page jump for now.
          </p>
        </div>
      </div>
    </Card>
  )
}

export default ReaderNav
