import { useEffect, useMemo, useState } from 'react'
import type { Editor as TipTapEditor } from '@tiptap/core'
import { Search, X } from 'lucide-react'
import useWriterContextStore from '../stores/writerContextStore'
import useWriterReferencesStore from '../stores/writerReferencesStore'
import useWriterChatStore from '../stores/writerChatStore'
import useWriterArtifactsStore from '../stores/writerArtifactsStore'
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

type Filters = Record<WriterSearchArea, boolean>

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
  if (area === 'studio') return 'Studio'
  return 'Chat'
}

const initialFilters: Filters = { content: true, context: true, references: true, chat: true, studio: true }

const WriterSearchModal = ({ open, onClose, editor }: Props) => {
  const contextText = useWriterContextStore((s) => s.contextText)
  const references = useWriterReferencesStore((s) => s.references)
  const messages = useWriterChatStore((s) => s.messages)
  const artifacts = useWriterArtifactsStore((s) => s.artifacts)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>(initialFilters)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

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
        const match = snippetMatches[0] ?? titleMatches[0] ?? authorMatches[0]
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

    if (filters.studio) {
      const limit = 12
      let added = 0
      for (const artifact of artifacts) {
        if (added >= limit) break
        const contentMatch = findTextMatches(artifact.contentText ?? '', trimmedQuery, 1)[0]
        const titleMatch = findTextMatches(artifact.title ?? '', trimmedQuery, 1)[0]
        const match = contentMatch ?? titleMatch
        if (!match) continue
        next.push({
          id: `studio-${artifact.id}`,
          area: 'studio',
          snippet: match.snippet || artifact.title || 'Match',
          start: match.start,
          end: match.end,
          artifactId: artifact.id,
        })
        added += 1
      }
    }

    return next
  }, [artifacts, contextText, editor, filters, messages, open, references, trimmedQuery])

  const counts = useMemo(() => {
    const summary: Record<WriterSearchArea, number> = {
      content: 0,
      context: 0,
      references: 0,
      chat: 0,
      studio: 0,
    }
    for (const match of matches) summary[match.area] += 1
    return summary
  }, [matches])

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
      document.getElementById(`writer-reference-${match.referenceId}`)?.scrollIntoView({ block: 'center' })
      return
    }
    if (match.area === 'chat' && match.messageId) {
      document.getElementById(`writer-chat-${match.messageId}`)?.scrollIntoView({ block: 'center' })
      return
    }
    if (match.area === 'studio' && match.artifactId) {
      document.getElementById(`writer-artifact-${match.artifactId}`)?.scrollIntoView({ block: 'center' })
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-3xl rounded-2xl border border-chrome-border/70 bg-surface-base/95 p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-primary">
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
            placeholder="Search Content, Context, References, Chat, Studio..."
          />
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
            <span>Filter:</span>
            {(['content', 'context', 'references', 'chat', 'studio'] as WriterSearchArea[]).map((area) => (
              <button
                key={area}
                type="button"
                className={chipClass(filters[area])}
                onClick={() => setFilters((prev) => ({ ...prev, [area]: !prev[area] }))}
              >
                {areaLabel(area)} ({counts[area]})
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 max-h-[50vh] overflow-y-auto rounded-xl border border-chrome-border/70 bg-surface-raised/40">
          {!trimmedQuery && <p className="p-3 text-xs text-ink-muted">Type to search across Writer cards.</p>}
          {trimmedQuery && matches.length === 0 && (
            <p className="p-3 text-xs text-ink-muted">No matches.</p>
          )}
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
            onClick={() => {
              setQuery('')
            }}
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
