import { Settings, Sparkles } from 'lucide-react'
import LayoutControls from './LayoutControls'
import { appTitle } from '../../../lib/constants'
import type { LayoutDensity } from '../appDensity'
import ProjectScopeSelector from './ProjectScopeSelector'

type Props = {
  isMobile: boolean
  model: string
  desktopView: 'reader' | 'writer'
  layoutAdjusting: boolean
  currentDensity: LayoutDensity
  onToggleAdjusting: () => void
  onSetDensity: (density: LayoutDensity) => void
  onResetCurrentView: () => void
  onOpenSettings: () => void
}

const AppHeader = ({
  isMobile,
  model,
  desktopView,
  layoutAdjusting,
  currentDensity,
  onToggleAdjusting,
  onSetDensity,
  onResetCurrentView,
  onOpenSettings,
}: Props) => (
  <header className="border-b border-chrome-border/70 bg-surface-base/70 backdrop-blur">
    <div className="mx-auto flex w-full max-w-screen-3xl items-center justify-between px-[var(--app-pad-x,1.5rem)] py-[var(--app-header-py,0.75rem)]">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink-primary">
        <img
          src="/icon.png"
          alt=""
          className="size-6 rounded"
          aria-hidden
        />
        <span>{appTitle}</span>
        <span className="rounded-full bg-surface-raised/80 px-2 py-1 text-[11px] font-medium text-ink-muted">
          Tauri v2 / React / Tailwind
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-ink-muted">
        <Sparkles className="size-4 text-status-warning" />
        <ProjectScopeSelector compact={isMobile} />
        <span>Default model: {model}</span>
        {!isMobile && (
          <span className="rounded-full border border-chrome-border/70 bg-surface-raised/50 px-2 py-1 text-[11px] text-ink-primary">
            {desktopView === 'reader' ? 'Reader' : 'Writer'}
          </span>
        )}
        {!isMobile && (
          <LayoutControls
            desktopView={desktopView}
            adjusting={layoutAdjusting}
            density={currentDensity}
            onToggleAdjusting={onToggleAdjusting}
            onSetDensity={onSetDensity}
            onResetCurrentView={onResetCurrentView}
          />
        )}
        {isMobile ? (
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center justify-center rounded-full border border-chrome-border/70 bg-surface-raised/70 p-2 text-ink-primary hover:border-accent"
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="size-5 text-accent" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-2 rounded-lg border border-chrome-border/70 bg-surface-raised/50 px-3 py-1 text-xs text-ink-primary hover:border-accent"
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="size-4" />
            <span className="hidden md:inline">Settings</span>
          </button>
        )}
      </div>
    </div>
  </header>
)

export default AppHeader
