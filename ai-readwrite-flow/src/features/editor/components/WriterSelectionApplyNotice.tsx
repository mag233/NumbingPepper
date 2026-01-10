type Props = {
  mode: 'replace' | 'insert'
  onUndo: () => void
}

const WriterSelectionApplyNotice = ({ mode, onUndo }: Props) => {
  return (
    <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-xl border border-status-success/40 bg-status-success/10 px-3 py-2 text-xs text-ink-primary shadow-card">
      <span className="text-ink-muted">Applied suggestion ({mode === 'replace' ? 'Replace' : 'Insert'}).</span>
      <button
        type="button"
        onClick={onUndo}
        className="rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-3 py-2 text-xs text-ink-primary hover:border-accent"
      >
        Undo
      </button>
    </div>
  )
}

export default WriterSelectionApplyNotice
