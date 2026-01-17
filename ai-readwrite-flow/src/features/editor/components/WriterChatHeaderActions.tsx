import { ChevronRight, Trash2 } from 'lucide-react'

type Props = {
  onCollapse: () => void
  onClear: () => void
}

const WriterChatHeaderActions = ({ onCollapse, onClear }: Props) => (
  <div className="flex items-center gap-2">
    <button
      onClick={onCollapse}
      className="inline-flex items-center gap-2 rounded-lg border border-chrome-border/70 px-2 py-1 text-xs text-ink-muted hover:border-accent hover:text-ink-primary"
    >
      <ChevronRight className="size-4" />
      Hide
    </button>
    <button
      onClick={onClear}
      className="inline-flex items-center gap-2 rounded-lg border border-chrome-border/70 px-2 py-1 text-xs text-ink-muted hover:border-status-danger/70 hover:text-status-danger"
    >
      <Trash2 className="size-4" />
      Clear
    </button>
  </div>
)

export default WriterChatHeaderActions
