import { useEffect, useMemo, useState } from 'react'
import { Settings, X } from 'lucide-react'
import GlobalSettingsSection from './GlobalSettingsSection'
import ReaderShortcutTemplatesSection from './ReaderShortcutTemplatesSection'
import ChatPromptTemplatesSection from './ChatPromptTemplatesSection'

export type SettingsTab = 'global' | 'reader' | 'chat'

type Props = {
  onClose: () => void
  initialTab?: SettingsTab
}

const tabButton = (active: boolean) =>
  `rounded-lg border px-3 py-2 text-xs font-semibold ${
    active ? 'border-accent bg-accent/15 text-ink-primary' : 'border-chrome-border/70 text-ink-muted hover:border-accent hover:text-ink-primary'
  }`

const SettingsDrawer = ({ onClose, initialTab = 'global' }: Props) => {
  const [tab, setTab] = useState<SettingsTab>(initialTab)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const body = useMemo(() => {
    if (tab === 'reader') return <ReaderShortcutTemplatesSection />
    if (tab === 'chat') return <ChatPromptTemplatesSection />
    return <GlobalSettingsSection />
  }, [tab])

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Close settings"
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-chrome-border/70 bg-surface-base/95 shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-chrome-border/70 p-4">
          <div className="inline-flex items-center gap-2">
            <Settings className="size-4 text-accent" />
            <span className="text-sm font-semibold text-ink-primary">Settings</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-chrome-border/70 p-2 text-ink-muted hover:border-accent hover:text-ink-primary"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex flex-wrap gap-2 border-b border-chrome-border/70 p-3">
          <button type="button" className={tabButton(tab === 'global')} onClick={() => setTab('global')}>
            Global
          </button>
          <button type="button" className={tabButton(tab === 'reader')} onClick={() => setTab('reader')}>
            Reader
          </button>
          <button type="button" className={tabButton(tab === 'chat')} onClick={() => setTab('chat')}>
            Chat
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">{body}</div>
      </aside>
    </div>
  )
}

export default SettingsDrawer
