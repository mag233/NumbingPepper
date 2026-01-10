import { LayoutPanelTop, Smartphone } from 'lucide-react'

type Props = {
  model: string
  lastModel?: string | null
  lastTokens?: number | null
  lastLatencyMs?: number | null
}

const AppFooter = ({ model, lastModel, lastTokens, lastLatencyMs }: Props) => (
  <footer className="border-t border-chrome-border/70 bg-surface-base/70">
    <div className="mx-auto flex max-w-6xl items-center gap-2 px-[var(--app-footer-px,1rem)] py-[var(--app-footer-py,0.75rem)] text-xs text-ink-muted">
      <LayoutPanelTop className="size-4" />
      Desktop: Split View (Reader | Writer/Chat), Mobile: Tabs (Library/Reader/Writer) + Chat overlay
      <span className="ml-auto inline-flex items-center gap-1">
        <Smartphone className="size-4" />
        Mobile-first layout enabled
      </span>
      <span className="ml-4 inline-flex items-center gap-2 text-[11px] text-ink-muted">
        <span>Last request:</span>
        <span>{lastModel ?? model}</span>
        <span>|</span>
        <span>{lastTokens ? `${lastTokens} tokens` : 'tokens n/a'}</span>
        <span>|</span>
        <span>{lastLatencyMs ? `${lastLatencyMs} ms` : 'latency n/a'}</span>
      </span>
    </div>
  </footer>
)

export default AppFooter
