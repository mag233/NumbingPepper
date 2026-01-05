import { ChevronDown } from 'lucide-react'
import type { WriterRewriteTone, WriterSelectionAction } from '../../../stores/writerSelectionTemplateStore'

type ToneItem = { id: WriterRewriteTone; label: string }

type Props = {
  rewriteOpen: boolean
  onToggleRewrite: () => void
  onRunAction: (action: WriterSelectionAction, options?: { rewriteTone?: WriterRewriteTone }) => void
  onExportFlomo: () => void
  toneItems: ToneItem[]
}

const prevent = (event: { preventDefault: () => void; stopPropagation: () => void }) => {
  event.preventDefault()
  event.stopPropagation()
}

const buttonClass = 'rounded-lg px-2 py-1 text-xs text-ink-primary hover:bg-surface-raised/60'

const WriterSelectionBubbleMenuView = ({
  rewriteOpen,
  onToggleRewrite,
  onRunAction,
  onExportFlomo,
  toneItems,
}: Props) => (
  <div className="relative flex items-center gap-1 rounded-xl border border-chrome-border/70 bg-surface-base/95 p-1 shadow-xl backdrop-blur">
    <button
      type="button"
      className={buttonClass}
      onMouseDown={(e) => {
        prevent(e)
        onRunAction('simplify')
      }}
      onTouchStart={(e) => {
        prevent(e)
        onRunAction('simplify')
      }}
    >
      Simplify
    </button>
    <button
      type="button"
      className={buttonClass}
      onMouseDown={(e) => {
        prevent(e)
        onRunAction('concise')
      }}
      onTouchStart={(e) => {
        prevent(e)
        onRunAction('concise')
      }}
    >
      Concise
    </button>

    <button
      type="button"
      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-ink-primary hover:bg-surface-raised/60"
      aria-haspopup="menu"
      aria-expanded={rewriteOpen}
      onMouseDown={(e) => {
        prevent(e)
        onToggleRewrite()
      }}
      onTouchStart={(e) => {
        prevent(e)
        onToggleRewrite()
      }}
    >
      Rewrite
      <ChevronDown className="size-3 text-ink-muted" />
    </button>

    <button
      type="button"
      className={buttonClass}
      onMouseDown={(e) => {
        prevent(e)
        onRunAction('translate')
      }}
      onTouchStart={(e) => {
        prevent(e)
        onRunAction('translate')
      }}
    >
      Translate
    </button>
    <button
      type="button"
      className={buttonClass}
      onMouseDown={(e) => {
        prevent(e)
        onRunAction('explain')
      }}
      onTouchStart={(e) => {
        prevent(e)
        onRunAction('explain')
      }}
    >
      Explain
    </button>
    <button
      type="button"
      className={buttonClass}
      onMouseDown={(e) => {
        prevent(e)
        onRunAction('ask-ai')
      }}
      onTouchStart={(e) => {
        prevent(e)
        onRunAction('ask-ai')
      }}
    >
      Ask AI
    </button>
    <button
      type="button"
      className={buttonClass}
      onMouseDown={(e) => {
        prevent(e)
        onExportFlomo()
      }}
      onTouchStart={(e) => {
        prevent(e)
        onExportFlomo()
      }}
    >
      Flomo
    </button>

    {rewriteOpen && (
      <div
        role="menu"
        className="absolute left-0 top-full mt-1 w-44 rounded-xl border border-chrome-border/70 bg-surface-base/95 p-1 shadow-xl"
      >
        {toneItems.map((item) => (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            className="w-full rounded-lg px-2 py-2 text-left text-xs text-ink-primary hover:bg-surface-raised/60"
            onMouseDown={(e) => {
              prevent(e)
              onRunAction('rewrite', { rewriteTone: item.id })
            }}
            onTouchStart={(e) => {
              prevent(e)
              onRunAction('rewrite', { rewriteTone: item.id })
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    )}
  </div>
)

export default WriterSelectionBubbleMenuView
