import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { Editor as TipTapEditor } from '@tiptap/core'
import { Search, X } from 'lucide-react'
import useWriterContextStore from '../stores/writerContextStore'
import useWriterReferencesStore from '../stores/writerReferencesStore'
import useWriterChatStore from '../stores/writerChatStore'
import { scrollEditorToRange } from '../services/editorCommands'
import {
  findDocMatches,
  findTextMatches,
  normalizeSearchQuery,
  type WriterSearchArea,
  type WriterSearchMatch,
} from '../services/writerSearch'

type Props = {
  open: boolean
  onClose: () => void
  editor: TipTapEditor | null
}

const FILTER_AREAS = ['content', 'context', 'references', 'chat'] as const
type FilterArea = (typeof FILTER_AREAS)[number]
type Filters = Record<FilterArea, boolean>

const inputClass =
  'w-full rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-3 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none'

const chipClass = (active: boolean) =>
  `rounded-lg border px-2 py-1 text-xs ${
    active ? 'border-accent bg-accent/15 text-ink-primary' : 'border-chrome-border/70 text-ink-muted hover:border-accent'
  }`

const areaLabel = (area: WriterSearchArea) => {
  if (area === 'content') return 'Content'
  if (area === 'context') return 'Context'
  if (area === 'references') return 'References'
  return 'Chat'
}

const initialFilters: Filters = { content: true, context: true, references: true, chat: true }

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const getPanelWidth = () => {
  if (typeof window === 'undefined') return 720
  return Math.min(720, window.innerWidth - 32)
}

const getPanelHeight = () => {
  if (typeof window === 'undefined') return 520
  return Math.min(520, window.innerHeight - 32)
}

const defaultPosition = { x: 16, y: 64 }
const POSITION_STORAGE_KEY = 'writer-search-position'

const clampPositionToViewport = (coords: { x: number; y: number }) => {
  if (typeof window === 'undefined') return coords
  const width = getPanelWidth()
  const height = getPanelHeight()
  const maxX = Math.max(16, window.innerWidth - width - 16)
  const maxY = Math.max(16, window.innerHeight - height - 16)
  return {
    x: clamp(coords.x, 16, maxX),
    y: clamp(coords.y, 16, maxY),
  }
}

const getInitialPosition = () => {
  if (typeof window === 'undefined') return defaultPosition
  const width = getPanelWidth()
  const height = getPanelHeight()
  const centerX = Math.round((window.innerWidth - width) / 2)
  const centerY = Math.round((window.innerHeight - height) / 2)
  return clampPositionToViewport({ x: centerX, y: Math.max(48, centerY) })
}

const loadStoredPosition = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(POSITION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { x?: number; y?: number }
    if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number') return null
    return clampPositionToViewport({ x: parsed.x, y: parsed.y })
  } catch {
    return null
  }
}

const persistPosition = (coords: { x: number; y: number }) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(coords))
}

const WriterSearchModal = ({ open, onClose, editor }: Props) => {
  const contextText = useWriterContextStore((s) => s.contextText)
  const references = useWriterReferencesStore((s) => s.references)
  const messages = useWriterChatStore((s) => s.messages)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const storedPosition = useMemo(() => (typeof window === 'undefined' ? null : loadStoredPosition()), [])
  const [position, setPosition] = useState(() => storedPosition ?? (typeof window === 'undefined' ? defaultPosition : getInitialPosition()))
  const hasCustomPosition = useRef(Boolean(storedPosition))
  const [dragging, setDragging] = useState(false)
  const dragOffsetRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  useEffect(() => {
    if (!open) return
    if (typeof window === 'undefined') return
    const handleResize = () => {
      setPosition((prev) => {
        const next = clampPositionToViewport(prev)
        if (hasCustomPosition.current) persistPosition(next)
        return next
      })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [open])

  useEffect(() => {
    if (!dragging) return
    const handleMove = (event: PointerEvent) => {
      event.preventDefault()
      setPosition(() => {
        const candidate = {
          x: event.clientX - dragOffsetRef.current.x,
          y: event.clientY - dragOffsetRef.current.y,
        }
        const next = clampPositionToViewport(candidate)
        hasCustomPosition.current = true
        persistPosition(next)
        return next
      })
    }
    const handleUp = () => setDragging(false)
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [dragging])

  const trimmedQuery = useMemo(() => normalizeSearchQuery(query), [query])

  const matches = useMemo<WriterSearchMatch[]>(() => {
    if (!open) return []
    if (!trimmedQuery) return []
    const next: WriterSearchMatch[] = []
    const maxPerArea = 20

    if (filters.content && editor) {
      const found = findDocMatches(editor.state.doc, trimmedQuery, maxPerArea)
      next.push(
        ...found.map((m, idx) => ({
          id: `content-${idx}`,
          area: 'content' as WriterSearchArea,
          snippet: m.snippet,
          start: m.start,
          end: m.end,
        })),
      )
    }

    if (filters.context) {
      const found = findTextMatches(contextText, trimmedQuery, maxPerArea)
      next.push(
        ...found.map((m, idx) => ({
          id: `context-${idx}`,
          area: 'context' as WriterSearchArea,
          snippet: m.snippet,
          start: m.start,
          end: m.end,
        })),
      )
    }

    if (filters.references) {
      const limit = 12
      let added = 0
      for (const ref of references) {
        if (added >= limit) break
        const snippetMatches = findTextMatches(ref.snippetText ?? '', trimmedQuery, 1)
        const titleMatches = findTextMatches(ref.title ?? '', trimmedQuery, 1)
        const authorMatches = findTextMatches(ref.author ?? '', trimmedQuery, 1)
        const sourceTitleMatches = findTextMatches(ref.sourceTitle ?? '', trimmedQuery, 1)
        const sourceAuthorMatches = findTextMatches(ref.sourceAuthor ?? '', trimmedQuery, 1)
        const tagsMatches = findTextMatches((ref.tags ?? []).join(' '), trimmedQuery, 1)
        const match =
          snippetMatches[0] ??
          titleMatches[0] ??
          authorMatches[0] ??
          sourceTitleMatches[0] ??
          sourceAuthorMatches[0] ??
          tagsMatches[0]
        if (!match) continue
        next.push({
          id: `reference-${ref.id}`,
          area: 'references',
          snippet: match.snippet || ref.snippetText || ref.title || 'Match',
          start: match.start,
          end: match.end,
          referenceId: ref.id,
        })
        added += 1
      }
    }

    if (filters.chat) {
      const limit = 12
      let added = 0
      for (const msg of messages) {
        if (added >= limit) break
        const found = findTextMatches(msg.content, trimmedQuery, 1)
        if (!found.length) continue
        next.push({
          id: `chat-${msg.id}`,
          area: 'chat',
          snippet: found[0].snippet,
          start: found[0].start,
          end: found[0].end,
          messageId: msg.id,
        })
        added += 1
      }
    }

    return next
  }, [contextText, editor, filters, messages, open, references, trimmedQuery])

  const allCounts = useMemo(() => {
    if (!open || !trimmedQuery) {
      return { content: 0, context: 0, references: 0, chat: 0 }
    }
    const summary: Record<FilterArea, number> = {
      content: 0,
      context: 0,
      references: 0,
      chat: 0,
    }

    if (editor) {
      summary.content = findDocMatches(editor.state.doc, trimmedQuery, 20).length
    }
    summary.context = findTextMatches(contextText, trimmedQuery, 20).length

    let refCount = 0
    for (const ref of references) {
      if (refCount >= 12) break
      const snippetMatches = findTextMatches(ref.snippetText ?? '', trimmedQuery, 1)
      const titleMatches = findTextMatches(ref.title ?? '', trimmedQuery, 1)
      const authorMatches = findTextMatches(ref.author ?? '', trimmedQuery, 1)
      const sourceTitleMatches = findTextMatches(ref.sourceTitle ?? '', trimmedQuery, 1)
      const sourceAuthorMatches = findTextMatches(ref.sourceAuthor ?? '', trimmedQuery, 1)
      const tagsMatches = findTextMatches((ref.tags ?? []).join(' '), trimmedQuery, 1)
      if (
        snippetMatches.length ||
        titleMatches.length ||
        authorMatches.length ||
        sourceTitleMatches.length ||
        sourceAuthorMatches.length ||
        tagsMatches.length
      ) refCount += 1
    }
    summary.references = refCount

    let chatCount = 0
    for (const msg of messages) {
      if (chatCount >= 12) break
      if (findTextMatches(msg.content, trimmedQuery, 1).length) chatCount += 1
    }
    summary.chat = chatCount

    return summary
  }, [contextText, editor, messages, open, references, trimmedQuery])

  const highlightElement = (element: HTMLElement | null) => {
    if (!element) return
    element.classList.add('search-highlight-flash')
    window.setTimeout(() => element.classList.remove('search-highlight-flash'), 2500)
  }

  const jumpToMatch = (match: WriterSearchMatch) => {
    if (match.area === 'content' && editor) {
      scrollEditorToRange(editor, { from: match.start, to: match.end })
      return
    }
    if (match.area === 'context') {
      const el = document.getElementById('writer-context-textarea')
      if (el instanceof HTMLTextAreaElement) {
        el.focus()
        el.setSelectionRange(match.start, match.end)
      }
      return
    }
    if (match.area === 'references' && match.referenceId) {
      const el = document.getElementById(`writer-reference-${match.referenceId}`)
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      highlightElement(el)
      return
    }
    if (match.area === 'chat' && match.messageId) {
      const el = document.getElementById(`writer-chat-${match.messageId}`)
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      highlightElement(el)
      return
    }
  }

  if (!open) return null

  const onDragPointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (event.button !== 0) return
    if (event.target instanceof HTMLElement && event.target.closest('button')) return
    if (typeof window === 'undefined') return
    event.preventDefault()
    event.stopPropagation()
    dragOffsetRef.current = { x: event.clientX - position.x, y: event.clientY - position.y }
    setDragging(true)
  }

  const panelStyle: CSSProperties = {
    width: 'min(720px, calc(100vw - 32px))',
    left: position.x,
    top: position.y,
  }

  const handleBackdropPointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60" onPointerDown={handleBackdropPointerDown}>
      <div
        className="absolute rounded-2xl border border-chrome-border/70 bg-surface-base/95 p-5 shadow-2xl"
        style={panelStyle}
        role="dialog"
        aria-modal="true"
        onPointerDown={(event) => event.stopPropagation()}
      >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div
              className="flex cursor-move items-center gap-2 text-sm font-semibold text-ink-primary"
              onPointerDown={onDragPointerDown}
            >
              <Search className="size-4" />
              Writer Search
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-chrome-border/70 p-2 text-ink-muted hover:border-accent hover:text-ink-primary"
              aria-label="Close search"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="grid gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={inputClass}
              placeholder="Search Content, Context, References, Chat..."
            />
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
              <span>Filter:</span>
              {FILTER_AREAS.map((area) => (
                <button
                  key={area}
                  type="button"
                  className={chipClass(filters[area])}
                  onClick={() => setFilters((prev) => ({ ...prev, [area]: !prev[area] }))}
                >
                  {areaLabel(area)} ({allCounts[area]})
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 max-h-[50vh] overflow-y-auto rounded-xl border border-chrome-border/70 bg-surface-raised/40">
            {!trimmedQuery && <p className="p-3 text-xs text-ink-muted">Type to search across Writer cards.</p>}
            {trimmedQuery && matches.length === 0 && <p className="p-3 text-xs text-ink-muted">No matches.</p>}
            {matches.map((match) => (
              <button
                key={match.id}
                type="button"
                onClick={() => jumpToMatch(match)}
                className="flex w-full items-start gap-3 border-b border-chrome-border/60 px-3 py-2 text-left text-xs text-ink-primary hover:bg-surface-raised/70"
              >
                <span className="min-w-[90px] text-[11px] uppercase tracking-wide text-ink-muted">
                  {areaLabel(match.area)}
                </span>
                <span className="line-clamp-2">{match.snippet}</span>
              </button>
            ))}
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => setQuery('')}
              className="rounded-lg border border-chrome-border/70 px-3 py-2 text-xs text-ink-primary hover:border-accent"
            >
              Clear
            </button>
          </div>
      </div>
    </div>
  )
}

export default WriterSearchModal
