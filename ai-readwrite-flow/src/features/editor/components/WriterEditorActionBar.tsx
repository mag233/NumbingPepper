import { Command, Eye, Pencil, Search, Send } from 'lucide-react'
import FlomoHistoryButton from '../../integrations/flomo/components/FlomoHistoryButton'

type Props = {
  activeTitle: string
  saveLabel: string
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  lastSavedAt: number | null
  justSaved: boolean
  isPreview: boolean
  onSave: () => void
  onTogglePreview: () => void
  onOpenSearch: () => void
  onExportFlomo: () => void
}

const WriterEditorActionBar = ({
  activeTitle,
  saveLabel,
  saveStatus,
  lastSavedAt,
  justSaved,
  isPreview,
  onSave,
  onTogglePreview,
  onOpenSearch,
  onExportFlomo,
}: Props) => (
  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
    <span className="max-w-[12rem] truncate text-xs text-ink-muted" title={activeTitle}>
      Active: {activeTitle}
    </span>
    <span
      className={`rounded-lg border px-2 py-1 ${
        saveStatus === 'error'
          ? 'border-status-danger/40 bg-status-danger/10 text-status-danger'
          : 'border-chrome-border/70 bg-surface-raised/40 text-ink-muted'
      }`}
      title={lastSavedAt ? new Date(lastSavedAt).toISOString() : undefined}
    >
      {saveLabel}
      {justSaved && (
        <span className="ml-2 text-status-success" aria-live="polite">
          Saved
        </span>
      )}
    </span>
    <button
      type="button"
      onClick={onSave}
      className="inline-flex items-center gap-2 rounded-lg border border-chrome-border/70 bg-surface-raised/60 px-3 py-2 text-ink-primary hover:border-accent"
    >
      Save
    </button>
    <button
      type="button"
      onClick={onTogglePreview}
      className="inline-flex items-center gap-2 rounded-lg border border-chrome-border/70 bg-surface-raised/60 px-3 py-2 text-ink-primary hover:border-accent"
      aria-pressed={isPreview}
    >
      {isPreview ? <Pencil className="size-4" /> : <Eye className="size-4" />}
      {isPreview ? 'Edit' : 'Preview'}
    </button>
    <button
      type="button"
      onClick={onOpenSearch}
      className="inline-flex items-center gap-2 rounded-lg border border-chrome-border/70 bg-surface-raised/60 px-3 py-2 text-ink-primary hover:border-accent"
    >
      <Search className="size-4" />
      Search
    </button>
    <button
      type="button"
      onClick={onExportFlomo}
      className="inline-flex items-center gap-2 rounded-lg border border-chrome-border/70 bg-surface-raised/60 px-3 py-2 text-ink-primary hover:border-accent"
    >
      <Send className="size-4" />
      Flomo
    </button>
    <span className="inline-flex items-center gap-2">
      <Command className="size-4" />
      Type "/" to open commands
    </span>
    <FlomoHistoryButton />
  </div>
)

export default WriterEditorActionBar
