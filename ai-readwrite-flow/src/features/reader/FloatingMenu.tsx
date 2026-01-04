import { CircleHelp, Copy, FolderPlus, Highlighter, MessageSquare, NotebookPen, Sparkles, StickyNote } from 'lucide-react'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useWriterHighlightActions } from './hooks/useWriterHighlightActions'
import type { Highlight, HighlightRect } from './types'

type FloatingMenuProps = {
  x: number
  y: number
  text: string
  page?: number
  rects?: HighlightRect[]
  activeBookId?: string
  copyStatus?: 'idle' | 'copied' | 'error'
  onAction: (action: 'summarize' | 'explain' | 'chat' | 'questions' | 'highlight' | 'copy' | 'note') => void
  onDismiss: () => void
}

const clearSelection = () => window.getSelection()?.removeAllRanges()

const FloatingMenu = ({ x, y, text, page, rects, activeBookId, copyStatus = 'idle', onAction, onDismiss }: FloatingMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const [left, setLeft] = useState(x)

  useLayoutEffect(() => {
    const el = menuRef.current
    const parent = el?.offsetParent instanceof HTMLElement ? el.offsetParent : null
    if (!el || !parent) return
    const padding = 12
    const update = () => {
      const maxLeft = Math.max(padding, parent.clientWidth - el.offsetWidth - padding)
      setLeft(Math.min(Math.max(x, padding), maxLeft))
    }
    const raf = window.requestAnimationFrame(update)
    const ro = new ResizeObserver(update)
    ro.observe(parent)
    ro.observe(el)
    return () => {
      window.cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [x, text])

  const tempHighlight = useMemo<Highlight | undefined>(() => {
    if (!activeBookId) return undefined
    if (!page || !rects?.length) return undefined
    return {
      id: `${activeBookId}:${page}:${rects.map((r) => `${r.x},${r.y},${r.width},${r.height}`).join(';')}`,
      bookId: activeBookId,
      content: text,
      color: 'yellow',
      note: null,
      contextRange: { page, rects, zoom: null },
      createdAt: 0,
    }
  }, [activeBookId, page, rects, text])

  const dismiss = () => {
    clearSelection()
    onDismiss()
  }

  const { addToWritingContext, addAsWritingReference } = useWriterHighlightActions({
    highlight: tempHighlight,
    onClosePopover: dismiss,
  })

  return (
    <div
      ref={menuRef}
      className="absolute z-20 flex max-w-full -translate-y-full items-center gap-2 overflow-x-auto rounded-full border border-chrome-border/80 bg-surface-base/90 px-3 py-2 text-xs text-ink-primary shadow-lg"
      style={{ top: y, left }}
    >
      <span className="line-clamp-1 max-w-[180px] text-ink-muted">"{text}"</span>
      <button
        onClick={() => onAction('copy')}
        className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-surface-raised/80 px-2 py-1 hover:bg-accent/20"
      >
        <Copy className="size-4" />
        {copyStatus === 'copied' ? 'Copied' : 'Copy'}
      </button>
      <button
        onClick={() => onAction('summarize')}
        className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-surface-raised/80 px-2 py-1 hover:bg-accent/20"
      >
        <Sparkles className="size-4" />
        Summarize
      </button>
      <button
        onClick={() => onAction('explain')}
        className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-surface-raised/80 px-2 py-1 hover:bg-accent/20"
      >
        <StickyNote className="size-4" />
        Explain
      </button>
      <button
        onClick={() => onAction('chat')}
        className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-surface-raised/80 px-2 py-1 hover:bg-accent/20"
      >
        <MessageSquare className="size-4" />
        Chat
      </button>
      <button
        onClick={() => onAction('questions')}
        className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-surface-raised/80 px-2 py-1 hover:bg-accent/20"
        title="Generate Questions"
      >
        <CircleHelp className="size-4" />
        Questions
      </button>
      <button
        onClick={() => onAction('highlight')}
        className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-surface-raised/80 px-2 py-1 hover:bg-amber-500/20"
      >
        <Highlighter className="size-4" />
        Highlight
      </button>
      <button
        onClick={() => onAction('note')}
        className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-surface-raised/80 px-2 py-1 hover:bg-amber-500/20"
      >
        <NotebookPen className="size-4" />
        Note
      </button>
      <button
        onClick={() => void addToWritingContext()}
        className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-surface-raised/80 px-2 py-1 hover:bg-emerald-500/20"
        disabled={!tempHighlight}
        title="Append to active writing project context"
      >
        <FolderPlus className="size-4" />
        To Context
      </button>
      <button
        onClick={() => void addAsWritingReference()}
        className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-surface-raised/80 px-2 py-1 hover:bg-emerald-500/20"
        disabled={!tempHighlight}
        title="Save as writing project reference"
      >
        <FolderPlus className="size-4" />
        To Ref
      </button>
    </div>
  )
}

export default FloatingMenu
