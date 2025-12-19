import { FileWarning, MousePointerClick } from 'lucide-react'

const ReaderEmptyState = () => (
  <div className="space-y-3 text-sm text-ink-primary">
    <div className="flex items-center gap-2 rounded-lg border border-chrome-border/70 bg-surface-raised/70 p-3">
      <FileWarning className="size-5 text-amber-400" />
      <p>No PDF selected. Import from Library and click a file to open.</p>
    </div>
    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-muted">
      <MousePointerClick className="size-4" />
      Try selecting text below; the floating menu will appear.
    </div>
    <p className="rounded-lg bg-surface-raised/70 p-3 leading-relaxed text-ink-primary">
      AI-ReadWrite-Flow keeps reading and writing side by side: Reader on the left, Writer and Chat
      on the right. Select any text to invoke the floating menu, quickly summarize, explain, or
      start a chat while keeping context in sync.
    </p>
  </div>
)

export default ReaderEmptyState
