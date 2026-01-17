import { ChevronDown, ChevronUp, Plus, RefreshCcw, Send, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import useWriterReferencesStore from '../stores/writerReferencesStore'
import {
  buildReferenceFlomoTagLines,
  buildAiReaderTagLines,
  formatSystemTagLabel,
  formatTagsInput,
  isSystemReferenceTag,
  splitReferenceTags,
  splitTagsInput,
} from '../../../lib/referenceTags'
import WriterReferenceTagFilter from './WriterReferenceTagFilter'
import WriterReferenceTagsSection from './WriterReferenceTagsSection'
import useFlomoComposerStore from '../../integrations/flomo/flomoComposerStore'
import useLibraryStore from '../../../stores/libraryStore'
import useWriterProjectStore from '../stores/writerProjectStore'
const EMPTY_TAGS: string[] = []

const btn =
  'inline-flex items-center justify-center rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-3 py-1 text-xs text-ink-primary hover:border-accent'
const inputCls =
  'w-full rounded-lg border border-chrome-border/70 bg-surface-base/30 px-2 py-1 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none'
type Props = {
  noTopMargin?: boolean
  listClassName?: string
}
const WriterReferencesPanel = ({ noTopMargin, listClassName }: Props) => {
  const { projectId, references, membership, addManual, toggleIncluded, removeReference, updateReferenceTags, refreshReferenceMetadata } =
    useWriterReferencesStore()
  const hydrateReferences = useWriterReferencesStore((s) => s.hydrate)
  const activeProjectId = useWriterProjectStore((s) => s.activeProjectId)
  const openFlomoComposer = useFlomoComposerStore((s) => s.open)
  const projectTags = useWriterProjectStore((s) => {
    const project = s.projects.find((p) => p.id === (projectId ?? s.activeProjectId))
    return project?.tags ?? EMPTY_TAGS
  })
  const books = useLibraryStore((s) => s.items)
  const [openAdd, setOpenAdd] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [snippet, setSnippet] = useState('')
  const [tags, setTags] = useState('')
  const [tagDrafts, setTagDrafts] = useState<Record<string, string>>({})
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [includeSystemTags, setIncludeSystemTags] = useState(false)
  const effectiveProjectId = projectId ?? activeProjectId
  const includedCount = useMemo(
    () => membership.filter((m) => m.included).length,
    [membership],
  )
  const isIncluded = (id: string) => membership.find((m) => m.referenceId === id)?.included ?? false

  const filterOptions = useMemo(() => {
    const systemSet = new Set<string>()
    const userSet = new Set<string>()
    for (const ref of references) {
      const { systemTags, userTags } = splitReferenceTags(ref.tags ?? [])
      userTags.forEach((tag) => userSet.add(tag))
      systemTags.forEach((tag) => systemSet.add(tag))
    }
    const options = [
      ...Array.from(userSet).sort().map((tag) => ({ tag, label: `#${tag}`, isSystem: false })),
    ]
    if (includeSystemTags) {
      options.push(
        ...Array.from(systemSet)
          .sort()
          .map((tag) => ({
            tag,
            label: formatSystemTagLabel(tag),
            isSystem: true,
          })),
      )
    }
    return options
  }, [includeSystemTags, references])
  const filteredReferences = useMemo(() => {
    if (tagFilter.length === 0) return references
    return references.filter((ref) => {
      const { systemTags, userTags } = splitReferenceTags(ref.tags ?? [])
      const candidates = includeSystemTags ? [...userTags, ...systemTags] : userTags
      return tagFilter.some((tag) => candidates.includes(tag))
    })
  }, [includeSystemTags, references, tagFilter])
  const handleIncludeSystemTags = (checked: boolean) => {
    setIncludeSystemTags(checked)
    if (checked) return
    setTagFilter((prev) => prev.filter((tag) => !isSystemReferenceTag(tag)))
  }
  useEffect(() => {
    if (activeProjectId && activeProjectId !== projectId) {
      void hydrateReferences(activeProjectId)
    }
  }, [activeProjectId, hydrateReferences, projectId])

  const handleFlomoExport = (referenceId: string) => {
    const ref = references.find((item) => item.id === referenceId)
    if (!ref || !effectiveProjectId) return
    const bookTags = ref.bookId ? books.find((book) => book.id === ref.bookId)?.tags ?? [] : []
    openFlomoComposer({
      mode: 'reference',
      snippet: ref.snippetText,
      title: ref.sourceTitle ?? ref.title,
      author: ref.sourceAuthor ?? ref.author,
      year: ref.sourceYear,
      tags: [
        ...buildReferenceFlomoTagLines(ref.tags ?? []),
        ...buildAiReaderTagLines(projectTags),
        ...buildAiReaderTagLines(bookTags),
      ],
      source: { type: 'writer-reference', projectId: effectiveProjectId, referenceId: ref.id, bookId: ref.bookId },
    })
  }
  return (
    <div
      className={`rounded-xl border border-chrome-border/70 bg-surface-raised/40 p-3 ${noTopMargin ? '' : 'mt-3'}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs text-ink-primary">
          References <span className="text-ink-muted">({includedCount} in context)</span>
        </div>
        <button className={btn} onClick={() => setOpenAdd((v) => !v)} disabled={!effectiveProjectId}>
          <Plus className="mr-1 size-4" />
          Add
        </button>
      </div>

      {openAdd && (
        <form
          className="mb-3 grid gap-2 rounded-lg border border-chrome-border/70 bg-surface-base/30 p-2"
          onSubmit={(e) => {
            e.preventDefault()
            void addManual({ title, author, snippetText: snippet, tags: splitTagsInput(tags) }).then((ok) => {
              if (!ok) return
              setTitle('')
              setAuthor('')
              setSnippet('')
              setTags('')
              setOpenAdd(false)
            })
          }}
        >
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" />
          <input className={inputCls} value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author (optional)" />
          <textarea
            className={`${inputCls} min-h-16 resize-y`}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (comma/newline-separated)"
          />
          <textarea
            className={`${inputCls} min-h-20 resize-y`}
            value={snippet}
            onChange={(e) => setSnippet(e.target.value)}
            placeholder="Snippet (required)"
          />
          <div className="flex items-center justify-end gap-2">
            <button type="button" className={btn} onClick={() => setOpenAdd(false)}>
              Cancel
            </button>
            <button type="submit" className={btn} disabled={!snippet.trim()}>
              Save
            </button>
          </div>
        </form>
      )}

      {references.length ? (
        <>
          <WriterReferenceTagFilter
            options={filterOptions}
            selected={tagFilter}
            onSelectedChange={setTagFilter}
            includeSystemTags={includeSystemTags}
            onIncludeSystemTagsChange={handleIncludeSystemTags}
          />
          <div className={`rounded-lg border border-chrome-border/60 ${listClassName ?? 'max-h-64 overflow-auto'}`}>
            {filteredReferences.map((r) => {
            const included = isIncluded(r.id)
            const confirm = confirmDeleteId === r.id
            const expanded = expandedId === r.id
            const { userTags } = splitReferenceTags(r.tags ?? [])
            const tagDraftValue = tagDrafts[r.id] ?? formatTagsInput(userTags)
            return (
              <div
                key={r.id}
                id={`writer-reference-${r.id}`}
                className="flex items-start gap-2 border-b border-chrome-border/60 p-2 last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={included}
                  onChange={(e) => void toggleIncluded(r.id, e.target.checked)}
                  className="mt-1 size-4 accent-accent"
                  disabled={!effectiveProjectId}
                  aria-label="Include in context"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm text-ink-primary" title={r.title ?? undefined}>
                        {r.title ?? 'Untitled reference'}
                      </div>
                      <div className="truncate text-xs text-ink-muted">
                        {r.author ? `by ${r.author}` : r.sourceType}
                        {typeof r.pageIndex === 'number' ? ` · p.${r.pageLabel ?? r.pageIndex}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className={btn}
                        type="button"
                        onClick={() => setExpandedId((cur) => (cur === r.id ? null : r.id))}
                        title={expanded ? 'Collapse preview' : 'Preview'}
                        aria-label={expanded ? 'Collapse reference preview' : 'Preview reference'}
                      >
                        {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </button>
                      <button
                        className={`${btn} ${confirm ? 'border-status-warning/60 text-status-warning hover:border-status-warning/80' : ''}`}
                        onClick={() => {
                          if (!confirm) {
                            setConfirmDeleteId(r.id)
                            return
                          }
                          void removeReference(r.id).then(() => setConfirmDeleteId(null))
                        }}
                        type="button"
                        title={confirm ? 'Click again to confirm delete' : 'Delete'}
                        aria-label={confirm ? 'Confirm delete reference' : 'Delete reference'}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className={`mt-1 whitespace-pre-wrap text-xs text-ink-primary ${expanded ? '' : 'line-clamp-3'}`}>
                    {r.snippetText}
                  </div>
                  {expanded && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-ink-muted">Source Info</div>
                        <div className="mt-1 text-xs text-ink-primary">
                          {r.sourceTitle ?? r.title ?? 'Untitled'}
                        </div>
                        <div className="text-[11px] text-ink-muted">
                          {r.sourceAuthor ?? r.author ?? 'Unknown author'}
                          {typeof r.sourceYear === 'number' ? ` · ${r.sourceYear}` : ''}
                        </div>
                      </div>
                      <WriterReferenceTagsSection
                        tags={r.tags}
                        tagDraftValue={tagDraftValue}
                        onTagDraftChange={(value) => setTagDrafts((prev) => ({ ...prev, [r.id]: value }))}
                        onSave={() => void updateReferenceTags(r.id, splitTagsInput(tagDraftValue))}
                        inputClass={inputCls}
                        buttonClass={btn}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className={btn}
                          onClick={() => void refreshReferenceMetadata(r.id)}
                          disabled={!r.bookId}
                          title={r.bookId ? 'Refresh from book metadata' : 'No book metadata available'}
                        >
                          <RefreshCcw className="size-4" />
                          Update metadata
                        </button>
                        <button
                          type="button"
                          className={btn}
                          onClick={() => handleFlomoExport(r.id)}
                          disabled={!effectiveProjectId}
                        >
                          <Send className="size-4" />
                          Flomo
                        </button>
                        {!r.bookId && <span className="text-[11px] text-ink-muted">Manual references cannot refresh metadata.</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
            })}
          </div>
        </>
      ) : (
        <p className="text-xs text-ink-muted">No references yet. Add a manual reference to start.</p>
      )}
    </div>
  )
}

export default WriterReferencesPanel
