import { useEffect, useState } from 'react'
import { Bot, LayoutPanelTop, Smartphone, Sparkles } from 'lucide-react'
import SettingsPanel from './features/settings/SettingsPanel'
import LibraryPanel from './features/library/LibraryPanel'
import ReaderPane from './features/reader/ReaderPane'
import ReaderNav from './features/reader/ReaderNav'
import EditorPane from './features/editor/EditorPane'
import WriterSidebar from './features/editor/WriterSidebar'
import ChatSidebar from './features/ai/ChatSidebar'
import WriterChatSidebar from './features/editor/WriterChatSidebar'
import PanelErrorBoundary from './shared/components/PanelErrorBoundary'
import { useMediaQuery } from './lib/hooks/useMediaQuery'
import { appTitle } from './lib/constants'
import useUiStore, { type TabKey } from './stores/uiStore'
import useSettingsStore from './stores/settingsStore'
import useReaderStore from './stores/readerStore'
import useMetricsStore from './stores/metricsStore'
import useLibraryStore from './stores/libraryStore'
import { normalizeThemePreset } from './lib/theme'
import { getWriterGridCols } from './lib/layout'
import useReaderShortcutTemplateStore, { type ReaderShortcutAction } from './stores/readerShortcutTemplateStore'

const NAV_TABS: { id: TabKey; label: string }[] = [
  { id: 'library', label: 'Library' },
  { id: 'reader', label: 'Reader' },
  { id: 'editor', label: 'Writer' },
  { id: 'chat', label: 'Chat' },
]

const App = () => {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const { activeTab, setActiveTab } = useUiStore()
  const { hydrate, model, themePreset } = useSettingsStore()
  const { scrollMode, toggleScrollMode } = useReaderStore()
  const { lastLatencyMs, lastTokens, lastModel } = useMetricsStore()
  const { hydrate: hydrateLibrary } = useLibraryStore()
  const [quickPrompt, setQuickPrompt] = useState<{ text: string; autoSend?: boolean }>()
  const [showTopBar, setShowTopBar] = useState(true)
  const [showNav, setShowNav] = useState(true)
  const [desktopView, setDesktopView] = useState<'reader' | 'writer'>('reader')
  const [writerChatCollapsed, setWriterChatCollapsed] = useState(false)
  const writerCols = getWriterGridCols(showNav, writerChatCollapsed)
  const buildReaderQuickPrompt = useReaderShortcutTemplateStore((s) => s.buildQuickPrompt)

  useEffect(() => {
    void hydrate()
    void hydrateLibrary()
  }, [hydrate, hydrateLibrary])

  useEffect(() => {
    document.documentElement.dataset.theme = normalizeThemePreset(themePreset)
  }, [themePreset])

  const handleReaderAction = (action: ReaderShortcutAction, text: string) => {
    setQuickPrompt(buildReaderQuickPrompt(action, text))
    if (isMobile) setActiveTab('chat')
  }

  const handleEditorCommand = (prompt: string) => {
    setQuickPrompt({ text: prompt, autoSend: false })
    if (isMobile) setActiveTab('chat')
  }

  return (
    <div
      className={`${isMobile ? 'min-h-screen' : 'h-screen overflow-hidden'} flex flex-col bg-surface-base text-ink-primary`}
    >
      <header className="border-b border-chrome-border/70 bg-surface-base/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-screen-3xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-primary">
            <Bot className="size-5 text-accent" />
            <span>{appTitle}</span>
            <span className="rounded-full bg-surface-raised/80 px-2 py-1 text-[11px] font-medium text-ink-muted">
              Tauri v2 / React / Tailwind
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-ink-muted">
            <Sparkles className="size-4 text-amber-300" />
            <span>Default model: {model}</span>
          </div>
        </div>
      </header>

      <main className={`mx-auto flex w-full max-w-screen-3xl flex-1 flex-col gap-4 px-6 py-6 min-h-0 ${isMobile ? '' : 'overflow-hidden'}`}>
        {isMobile ? (
          <section className="flex flex-col gap-3">
            <SettingsPanel />
            <nav className="grid grid-cols-4 gap-2 rounded-xl border border-chrome-border/70 bg-surface-raised/60 p-1">
              {NAV_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center rounded-lg px-2 py-2 text-xs font-semibold transition ${
                    activeTab === tab.id
                      ? 'bg-accent text-white shadow'
                      : 'text-ink-muted hover:bg-surface-raised/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            <div className="rounded-2xl border border-chrome-border/70 bg-surface-raised/50 p-3">
              {activeTab === 'library' && (
                <LibraryPanel compact onOpen={() => setActiveTab('reader')} />
              )}
              {activeTab === 'reader' && (
                <PanelErrorBoundary title="Reader">
                  <ReaderPane onAction={handleReaderAction} />
                </PanelErrorBoundary>
              )}
              {activeTab === 'editor' && <EditorPane onCommand={handleEditorCommand} />}
              {activeTab === 'chat' && (
                <PanelErrorBoundary title="Chat">
                  <ChatSidebar
                    quickPrompt={quickPrompt}
                    onConsumeQuickPrompt={() => setQuickPrompt(undefined)}
                  />
                </PanelErrorBoundary>
              )}
            </div>
          </section>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="hidden items-center gap-3 text-xs text-ink-muted md:flex">
              <span>View:</span>
              <button
                className="rounded-lg border border-chrome-border/70 px-2 py-1 hover:border-accent hover:text-ink-primary"
                onClick={() => setShowTopBar((v) => !v)}
              >
                {showTopBar ? 'Hide top bar' : 'Show top bar'}
              </button>
              <button
                className="rounded-lg border border-chrome-border/70 px-2 py-1 hover:border-accent hover:text-ink-primary"
                onClick={() => setShowNav((v) => !v)}
              >
                {showNav ? 'Hide navigation' : 'Show navigation'}
              </button>
              <button
                className={`rounded-lg border px-2 py-1 ${
                  desktopView === 'reader'
                    ? 'border-accent bg-accent/15 text-ink-primary'
                    : 'border-chrome-border/70 text-ink-muted hover:border-accent hover:text-ink-primary'
                }`}
                onClick={() => setDesktopView('reader')}
              >
                Reader
              </button>
              <button
                className={`rounded-lg border px-2 py-1 ${
                  desktopView === 'writer'
                    ? 'border-accent bg-accent/15 text-ink-primary'
                    : 'border-chrome-border/70 text-ink-muted hover:border-accent hover:text-ink-primary'
                }`}
                onClick={() => setDesktopView('writer')}
              >
                Writer
              </button>
            </div>

            {showTopBar && (
              <section className="grid gap-4 md:grid-cols-[1.4fr_0.8fr]">
                <SettingsPanel />
                <LibraryPanel compact onOpen={() => setActiveTab('reader')} />
              </section>
            )}

            <div className="min-h-0 flex-1">
              {desktopView === 'reader' && (
              <section
                className={`grid h-full min-h-0 items-stretch gap-4 ${
                  showNav ? 'md:grid-cols-[240px_minmax(0,3.5fr)_1.1fr]' : 'md:grid-cols-[minmax(0,3.5fr)_1.1fr]'
                }`}
              >
                {showNav && (
                  <div className="min-h-0">
                    <ReaderNav
                      scrollMode={scrollMode}
                      onToggleScrollMode={toggleScrollMode}
                    />
                  </div>
                )}
                <div className="h-full min-h-0">
                  <PanelErrorBoundary title="Reader">
                    <ReaderPane onAction={handleReaderAction} />
                  </PanelErrorBoundary>
                </div>
                <div className="h-full min-h-0">
                  <PanelErrorBoundary title="Chat">
                    <ChatSidebar
                      quickPrompt={quickPrompt}
                      onConsumeQuickPrompt={() => setQuickPrompt(undefined)}
                    />
                  </PanelErrorBoundary>
                </div>
              </section>
              )}

               {desktopView === 'writer' && (
               <section className={`grid h-full min-h-0 items-stretch gap-4 ${writerCols}`}>
                 {showNav && (
                   <div className="min-h-0 relative z-20">
                     <WriterSidebar />
                   </div>
                 )}
                 <div className="h-full min-h-0 relative z-10">
                   <EditorPane onCommand={handleEditorCommand} />
                 </div>
                 <div className="h-full min-h-0 relative z-10">
                   <PanelErrorBoundary title="Chat">
                     <WriterChatSidebar
                       quickPrompt={quickPrompt}
                       onConsumeQuickPrompt={() => setQuickPrompt(undefined)}
                      collapsed={writerChatCollapsed}
                      onCollapsedChange={setWriterChatCollapsed}
                    />
                  </PanelErrorBoundary>
                </div>
              </section>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-chrome-border/70 bg-surface-base/70">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 text-xs text-ink-muted">
          <LayoutPanelTop className="size-4" />
          Desktop: Split View (Reader | Writer/Chat), Mobile: Tabs (Library/Reader/Writer/Chat)
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
    </div>
  )
}

export default App
