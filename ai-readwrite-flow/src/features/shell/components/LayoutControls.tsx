import { Columns2, RotateCcw } from 'lucide-react'

type LayoutDensity = 'comfortable' | 'compact'

type Props = {
  desktopView: 'reader' | 'writer'
  adjusting: boolean
  density: LayoutDensity
  onToggleAdjusting: () => void
  onSetDensity: (density: LayoutDensity) => void
  onResetCurrentView: () => void
}

const LayoutControls = ({ desktopView, adjusting, density, onToggleAdjusting, onSetDensity, onResetCurrentView }: Props) => {
  return (
    <div className="flex items-center gap-2">
      {adjusting && (
        <>
          <div className="inline-flex overflow-hidden rounded-lg border border-chrome-border/70 bg-surface-raised/50 text-xs">
            <button
              type="button"
              onClick={() => onSetDensity('comfortable')}
              className={`px-2 py-1 ${
                density === 'comfortable' ? 'bg-accent/15 text-ink-primary' : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              Comfortable
            </button>
            <button
              type="button"
              onClick={() => onSetDensity('compact')}
              className={`px-2 py-1 ${
                density === 'compact' ? 'bg-accent/15 text-ink-primary' : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              Compact
            </button>
          </div>
          <button
            type="button"
            onClick={onResetCurrentView}
            className="inline-flex items-center gap-2 rounded-lg border border-chrome-border/70 bg-surface-raised/50 px-3 py-1 text-xs text-ink-primary hover:border-accent"
            title={`Reset ${desktopView} layout to defaults`}
          >
            <RotateCcw className="size-4" />
            <span className="hidden md:inline">Reset</span>
          </button>
          <span className="hidden lg:inline text-xs text-ink-muted">Adjusting: {desktopView === 'reader' ? 'Reader' : 'Writer'}</span>
        </>
      )}
      <button
        type="button"
        onClick={onToggleAdjusting}
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs ${
          !adjusting
            ? 'border-chrome-border/70 bg-surface-raised/50 text-ink-primary hover:border-accent'
            : 'border-accent bg-accent/15 text-ink-primary'
        }`}
        title={!adjusting ? 'Unlock layout adjustment' : 'Finish layout adjustment'}
        aria-pressed={adjusting}
      >
        <Columns2 className="size-4" />
        <span className="hidden md:inline">{!adjusting ? 'Layout' : 'Done'}</span>
      </button>
    </div>
  )
}

export default LayoutControls
