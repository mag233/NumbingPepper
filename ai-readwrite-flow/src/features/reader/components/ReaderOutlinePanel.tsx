import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, List } from 'lucide-react'
import useReaderStore from '../../../stores/readerStore'
import useLibraryStore from '../../../stores/libraryStore'
import ReaderBookmarksPanel from './ReaderBookmarksPanel'
import { formatPageForDisplay } from '../services/pageLabels'

type Props = {
  onJump?: (page: number) => void
}

const ReaderOutlinePanel = ({ onJump }: Props) => {
  const { outline, outlineStatus, outlineError, pageLabels, requestJump, currentPage } = useReaderStore()
  const activeBookId = useLibraryStore((s) => s.activeId)
  const tocLines = useMemo(() => outline.slice(0, 400), [outline])
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    const next = new Set<string>()
    for (let i = 0; i < tocLines.length; i += 1) {
      const item = tocLines[i]
      if (!item) continue
      const child = tocLines[i + 1]
      if (!child || child.depth <= item.depth) continue
      const key = `${i}:${item.depth}:${item.page ?? 'x'}:${item.title}`
      next.add(key)
    }
    return next
  })

  const rows = useMemo(() => {
    const stack: Array<{ depth: number }> = []
    const out: Array<{ key: string; item: (typeof tocLines)[number]; collapsible: boolean; isCollapsed: boolean }> = []
    for (let i = 0; i < tocLines.length; i += 1) {
      const item = tocLines[i]
      if (!item) continue
      while (stack.length && item.depth <= stack[stack.length - 1]!.depth) stack.pop()
      if (stack.length) continue

      const next = tocLines[i + 1]
      const collapsible = Boolean(next && next.depth > item.depth)
      const key = `${i}:${item.depth}:${item.page ?? 'x'}:${item.title}`
      const isCollapsed = collapsible && collapsed.has(key)
      out.push({ key, item, collapsible, isCollapsed })
      if (isCollapsed) stack.push({ depth: item.depth })
    }
    return out
  }, [collapsed, tocLines])

  const collapseAll = () =>
    setCollapsed(() => {
      const next = new Set<string>()
      for (let i = 0; i < tocLines.length; i += 1) {
        const item = tocLines[i]
        if (!item) continue
        const child = tocLines[i + 1]
        if (!child || child.depth <= item.depth) continue
        const key = `${i}:${item.depth}:${item.page ?? 'x'}:${item.title}`
        next.add(key)
      }
      return next
    })

  const expandAll = () => setCollapsed(new Set())

  const jumpFromToc = (page: number | null) => {
    if (!page) return
    requestJump(page)
    onJump?.(page)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <List className="size-4" />
        <span>TOC / Bookmarks</span>
        {rows.length > 12 && (
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={collapseAll}
              className="rounded border border-chrome-border/70 bg-surface-raised/60 px-2 py-1 text-[11px] text-ink-muted hover:border-accent hover:text-ink-primary"
            >
              Collapse all
            </button>
            <button
              type="button"
              onClick={expandAll}
              className="rounded border border-chrome-border/70 bg-surface-raised/60 px-2 py-1 text-[11px] text-ink-muted hover:border-accent hover:text-ink-primary"
            >
              Expand all
            </button>
          </div>
        )}
      </div>

      {outlineStatus === 'loading' ? (
        <p className="rounded-lg border border-chrome-border/70 bg-surface-raised/60 p-2 text-xs text-ink-muted">
          Loading outline...
        </p>
      ) : outlineStatus === 'error' ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-100">
          Outline error: {outlineError || 'unknown'}
        </p>
      ) : tocLines.length ? (
        <div className="max-h-[52vh] overflow-auto rounded-lg border border-chrome-border/70 bg-surface-raised/60 p-2 text-xs text-ink-primary">
          {rows.map(({ key, item, collapsible, isCollapsed }) => (
            <div
              key={key}
              className="flex w-full items-center gap-1 rounded px-2 py-1 hover:bg-surface-raised/70"
              style={{ paddingLeft: 6 + item.depth * 10 }}
            >
              {collapsible ? (
                <button
                  type="button"
                  className="rounded p-1 text-ink-muted hover:text-ink-primary"
                  aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
                  title={isCollapsed ? 'Expand' : 'Collapse'}
                  onClick={() =>
                    setCollapsed((cur) => {
                      const next = new Set(cur)
                      if (next.has(key)) next.delete(key)
                      else next.add(key)
                      return next
                    })
                  }
                >
                  {isCollapsed ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />}
                </button>
              ) : (
                <span className="w-5" />
              )}

              <button
                type="button"
                onClick={() => jumpFromToc(item.page)}
                disabled={!item.page}
                className="flex min-w-0 flex-1 items-center gap-2 rounded text-left disabled:cursor-not-allowed disabled:opacity-50"
                title={item.page ? `Go to page ${item.page}` : 'No page destination'}
              >
                <span className="truncate">{item.title}</span>
                {item.page && (
                  <span className="ml-auto text-[11px] text-ink-muted">
                    {formatPageForDisplay(item.page, pageLabels)}
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1 rounded-lg border border-chrome-border/70 bg-surface-raised/60 p-3 text-xs text-ink-primary">
          <p>No outline available for this PDF.</p>
          <p className="text-ink-muted">Use Find or Jump in the bottom toolbar.</p>
        </div>
      )}

      <ReaderBookmarksPanel activeBookId={activeBookId ?? null} currentPage={currentPage} pageLabels={pageLabels} />
    </div>
  )
}

export default ReaderOutlinePanel
