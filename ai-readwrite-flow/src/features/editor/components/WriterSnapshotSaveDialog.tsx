import { useState } from 'react'
import { X } from 'lucide-react'

type Props = {
  onSave: (title: string, note?: string) => void
  onCancel: () => void
}

const inputClass =
  'w-full rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-3 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none'

const WriterSnapshotSaveDialog = ({ onSave, onCancel }: Props) => {
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')

  const handleSave = () => {
    onSave(title, note || undefined)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-chrome-border/70 bg-surface-base/95 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-primary">Save Snapshot</h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-chrome-border/70 p-2 text-ink-muted hover:border-accent hover:text-ink-primary"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs uppercase tracking-wide text-ink-muted mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Snapshot at ${new Date().toLocaleString()}`}
              className={inputClass}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-ink-muted mb-1">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why you saved this snapshot..."
              className={`${inputClass} resize-none`}
              rows={3}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-chrome-border/70 px-3 py-2 text-xs text-ink-primary hover:border-accent"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent/90"
          >
            Save Snapshot
          </button>
        </div>
      </div>
    </div>
  )
}

export default WriterSnapshotSaveDialog
