import { BookOpen, Trash2, Undo2 } from 'lucide-react'
import type { LibraryItem } from '../services/libraryImport'
import { formatSize } from '../lib/formatSize'

export type PendingDelete = null | { kind: 'remove' | 'delete'; id: string }

type Props = {
  view: 'library' | 'trash'
  selectedItem: LibraryItem
  openItemTitle?: string
  canOpenSelected: boolean
  isDesktop: boolean
  pendingDelete: PendingDelete
  setPendingDelete: (next: PendingDelete) => void
  onOpenSelected: () => void
  onMoveToTrash: (id: string) => void
  onRestore: (id: string) => void
  onDeleteAppCopy: (id: string) => void
}

const LibrarySelectionPanel = ({
  view,
  selectedItem,
  openItemTitle,
  canOpenSelected,
  isDesktop,
  pendingDelete,
  setPendingDelete,
  onOpenSelected,
  onMoveToTrash,
  onRestore,
  onDeleteAppCopy,
}: Props) => {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-chrome-border/70 bg-surface-raised/40 p-3 text-xs text-ink-primary">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate">Selected: {selectedItem.title}</span>
        <span className="text-ink-muted">{formatSize(selectedItem.fileSize)}</span>
      </div>

      {view === 'library' && openItemTitle && canOpenSelected && (
        <p className="text-[11px] text-ink-muted">Preview is currently showing: {openItemTitle}</p>
      )}

      <p className="text-[11px] text-ink-muted">
        {view === 'trash'
          ? 'This book is in Trash. Restore to show it in the Library again.'
          : 'Added PDFs are copied into app storage for offline use.'}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {view === 'library' && canOpenSelected && (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-chrome-border/80 px-3 py-1 text-ink-primary hover:border-accent"
            onClick={onOpenSelected}
          >
            <BookOpen className="size-3" />
            Open
          </button>
        )}

        {view === 'trash' ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-chrome-border/80 px-3 py-1 text-ink-primary hover:border-accent"
            onClick={() => onRestore(selectedItem.id)}
          >
            <Undo2 className="size-3" />
            Restore
          </button>
        ) : (
          <button
            type="button"
            className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 ${
              pendingDelete?.kind === 'remove' && pendingDelete.id === selectedItem.id
                ? 'border-red-500 bg-red-500/10 text-red-300'
                : 'border-chrome-border/80 text-ink-primary hover:border-red-500 hover:text-red-300'
            }`}
            onClick={() => {
              if (pendingDelete?.kind === 'remove' && pendingDelete.id === selectedItem.id) {
                onMoveToTrash(selectedItem.id)
                return
              }
              setPendingDelete({ kind: 'remove', id: selectedItem.id })
            }}
          >
            <Trash2 className="size-3" />
            {pendingDelete?.kind === 'remove' && pendingDelete.id === selectedItem.id ? 'Confirm move to Trash' : 'Move to Trash'}
          </button>
        )}

        {isDesktop && (
          <button
            type="button"
            className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 ${
              pendingDelete?.kind === 'delete' && pendingDelete.id === selectedItem.id
                ? 'border-red-500 bg-red-500/10 text-red-300'
                : 'border-chrome-border/80 text-ink-primary hover:border-red-500 hover:text-red-300'
            }`}
            onClick={() => {
              if (pendingDelete?.kind === 'delete' && pendingDelete.id === selectedItem.id) {
                onDeleteAppCopy(selectedItem.id)
                return
              }
              setPendingDelete({ kind: 'delete', id: selectedItem.id })
            }}
          >
            <Trash2 className="size-3" />
            {pendingDelete?.kind === 'delete' && pendingDelete.id === selectedItem.id ? 'Confirm delete file' : 'Delete app copy'}
          </button>
        )}

        {pendingDelete?.id === selectedItem.id && (
          <span className="text-ink-muted">
            {pendingDelete.kind === 'delete' ? 'Desktop-only. Permanently deletes app storage.' : 'Safe: can be restored from Trash.'}
          </span>
        )}
      </div>
    </div>
  )
}

export default LibrarySelectionPanel
