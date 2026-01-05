import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import useWriterReferencesStore from '../stores/writerReferencesStore'

const btn =
  'inline-flex items-center justify-center rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-3 py-1 text-xs text-ink-primary hover:border-accent'

const inputCls =
  'w-full rounded-lg border border-chrome-border/70 bg-surface-base/30 px-2 py-1 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none'

type Props = {
  noTopMargin?: boolean
  listClassName?: string
}

const WriterReferencesPanel = ({ noTopMargin, listClassName }: Props) => {
  const { projectId, references, membership, addManual, toggleIncluded, removeReference } =
    useWriterReferencesStore()
  const [openAdd, setOpenAdd] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [snippet, setSnippet] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const includedCount = useMemo(
    () => membership.filter((m) => m.included).length,
    [membership],
  )

  const isIncluded = (id: string) => membership.find((m) => m.referenceId === id)?.included ?? false

  return (
    <div
      className={`rounded-xl border border-chrome-border/70 bg-surface-raised/40 p-3 ${noTopMargin ? '' : 'mt-3'}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs text-ink-primary">
          References <span className="text-ink-muted">({includedCount} in context)</span>
        </div>
        <button className={btn} onClick={() => setOpenAdd((v) => !v)} disabled={!projectId}>
          <Plus className="mr-1 size-4" />
          Add
        </button>
      </div>

      {openAdd && (
        <form
          className="mb-3 grid gap-2 rounded-lg border border-chrome-border/70 bg-surface-base/30 p-2"
          onSubmit={(e) => {
            e.preventDefault()
            void addManual({ title, author, snippetText: snippet }).then((ok) => {
              if (!ok) return
              setTitle('')
              setAuthor('')
              setSnippet('')
              setOpenAdd(false)
            })
          }}
        >
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" />
          <input className={inputCls} value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author (optional)" />
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
        <div
          className={`rounded-lg border border-chrome-border/60 ${listClassName ?? 'max-h-64 overflow-auto'}`}
        >
          {references.map((r) => {
            const included = isIncluded(r.id)
            const confirm = confirmDeleteId === r.id
            const expanded = expandedId === r.id
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
                  disabled={!projectId}
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
                        className={`${btn} ${confirm ? 'border-amber-500/60 text-amber-100 hover:border-amber-400' : ''}`}
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
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-xs text-ink-muted">No references yet. Add a manual reference to start.</p>
      )}
    </div>
  )
}

export default WriterReferencesPanel
