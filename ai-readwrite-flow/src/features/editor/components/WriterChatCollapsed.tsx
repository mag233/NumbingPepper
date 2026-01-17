import { ChevronLeft, MessageCircle } from 'lucide-react'

type Props = {
  onExpand: () => void
}

const WriterChatCollapsed = ({ onExpand }: Props) => (
  <div className="flex h-full items-start justify-end overflow-hidden">
    <button
      onClick={onExpand}
      className="inline-flex w-full max-w-full items-center justify-center rounded-lg border border-chrome-border/70 bg-surface-raised/60 px-2 py-2 text-xs text-ink-primary hover:border-accent"
      title="Show Writer AI"
      aria-label="Show Writer AI"
    >
      <ChevronLeft className="size-4 shrink-0" />
      <MessageCircle className="size-4 shrink-0" />
    </button>
  </div>
)

export default WriterChatCollapsed
