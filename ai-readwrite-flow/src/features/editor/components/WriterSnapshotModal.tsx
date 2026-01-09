import { useState } from 'react'
import { Trash2, Copy, X } from 'lucide-react'
import type { WritingSnapshot } from '../services/writingTypes'

type Props = {
  open: boolean
  onClose: () => void
  snapshots: WritingSnapshot[]
  onRestore: (snapshot: WritingSnapshot) => void
  onDuplicate: (snapshot: WritingSnapshot, newTitle: string, newNote?: string) => void
  onDelete: (snapshotId: string) => void
}

const WriterSnapshotModal = ({ open, onClose, snapshots, onRestore, onDuplicate, onDelete }: Props) => {
  const [selected, setSelected] = useState<WritingSnapshot | null>(null)
  const [duplicateTitle, setDuplicateTitle] = useState('')
  const [duplicateNote, setDuplicateNote] = useState('')
  const [duplicating, setDuplicating] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'restore' | 'delete' | null>(null)

  if (!open) return null

  const handleClose = () => {
    setSelected(null)
    setDuplicating(false)
    setDuplicateTitle('')
    setDuplicateNote('')
    onClose()
  }

  const handleRestore = () => {
    if (!selected) return
    setConfirmAction('restore')
  }

  const handleDelete = () => {
    if (!selected) return
    setConfirmAction('delete')
  }

  const handleStartDuplicate = () => {
    if (!selected) return
    setDuplicateTitle(selected.title)
    setDuplicateNote(selected.note ?? '')
    setDuplicating(true)
  }

  const handleConfirmDuplicate = () => {
    if (!selected) return
    onDuplicate(selected, duplicateTitle, duplicateNote || undefined)
    setDuplicating(false)
    setDuplicateTitle('')
    setDuplicateNote('')
    setSelected(null)
  }

  const sortedSnapshots = [...snapshots].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="fixed inset-0 z-50 bg-black/60">
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl rounded-l-2xl border-l border-chrome-border/70 bg-surface-base/95 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-chrome-border/70 p-5">
          <h2 className="text-sm font-semibold text-ink-primary">Snapshot History</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-chrome-border/70 p-2 text-ink-muted hover:border-accent hover:text-ink-primary"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 flex">
          {/* List */}
          <div className="w-1/3 border-r border-chrome-border/70 overflow-y-auto">
            {sortedSnapshots.length === 0 ? (
              <div className="p-4 text-center text-xs text-ink-muted">No snapshots yet</div>
            ) : (
              <div className="space-y-1 p-2">
                {sortedSnapshots.map((snap) => (
                  <button
                    key={snap.id}
                    type="button"
                    onClick={() => setSelected(snap)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${
                      selected?.id === snap.id
                        ? 'border-accent bg-accent/10 text-ink-primary'
                        : 'border-transparent text-ink-muted hover:border-chrome-border/70'
                    }`}
                  >
                    <div className="font-medium line-clamp-1">{snap.title}</div>
                    <div className="text-[11px] text-ink-muted/70 mt-0.5">{new Date(snap.createdAt).toLocaleString()}</div>
                    {snap.note && <div className="text-[11px] line-clamp-1 mt-1 text-ink-muted">{snap.note}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preview & Actions */}
          {selected ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="border-b border-chrome-border/70 p-4 space-y-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-muted">Title</p>
                  <p className="text-sm font-medium text-ink-primary">{selected.title}</p>
                </div>
                {selected.note && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-ink-muted">Note</p>
                    <p className="text-sm text-ink-primary">{selected.note}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-muted">Created</p>
                  <p className="text-xs text-ink-muted">{new Date(selected.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Markdown Preview */}
              <div className="flex-1 overflow-y-auto p-4">
                <pre className="text-xs whitespace-pre-wrap break-words text-ink-secondary font-mono">{selected.contentMarkdown}</pre>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-chrome-border/70 p-4 space-y-2">
                {!duplicating ? (
                  <>
                    <button
                      type="button"
                      onClick={handleRestore}
                      className="w-full rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white hover:bg-accent/90"
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={handleStartDuplicate}
                      className="w-full rounded-lg border border-chrome-border/70 px-3 py-2 text-xs text-ink-primary hover:border-accent flex items-center justify-center gap-1"
                    >
                      <Copy className="size-3" />
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="w-full rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200 hover:border-red-500/60 flex items-center justify-center gap-1"
                    >
                      <Trash2 className="size-3" />
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={duplicateTitle}
                        onChange={(e) => setDuplicateTitle(e.target.value)}
                        placeholder="Snapshot title"
                        className="w-full rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-3 py-2 text-xs text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none"
                      />
                      <textarea
                        value={duplicateNote}
                        onChange={(e) => setDuplicateNote(e.target.value)}
                        placeholder="Optional note"
                        className="w-full rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-3 py-2 text-xs text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none resize-none"
                        rows={2}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleConfirmDuplicate}
                      className="w-full rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white hover:bg-accent/90"
                    >
                      Save Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuplicating(false)}
                      className="w-full rounded-lg border border-chrome-border/70 px-3 py-2 text-xs text-ink-primary hover:border-accent"
                    >
                      Cancel
                    </button>
                  </>
                )}

                {confirmAction && selected && (
                  <div className="rounded-lg border border-chrome-border/70 bg-surface-raised/80 p-3 text-xs text-ink-primary space-y-2">
                    <p className="font-semibold text-ink-primary">
                      {confirmAction === 'restore'
                        ? 'Restore snapshot? This will overwrite current content. You can undo with Ctrl+Z.'
                        : 'Delete this snapshot? This does not affect your current content.'}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirmAction === 'restore') {
                            onRestore(selected)
                            handleClose()
                          } else {
                            onDelete(selected.id)
                            setSelected(null)
                            setConfirmAction(null)
                          }
                        }}
                        className="flex-1 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white hover:bg-accent/90"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmAction(null)}
                        className="flex-1 rounded-lg border border-chrome-border/70 px-3 py-2 text-xs text-ink-primary hover:border-accent"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-ink-muted text-xs">Select a snapshot to preview</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WriterSnapshotModal
