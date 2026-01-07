import { useEffect, useState, type CSSProperties } from 'react'
import { Bot, LayoutPanelTop, Settings, Smartphone, Sparkles } from 'lucide-react'
import SettingsPanel from './features/settings/SettingsPanel'
import LibraryPanel from './features/library/LibraryPanel'
import ReaderPane from './features/reader/ReaderPane'
import EditorPane from './features/editor/EditorPane'
import ChatSidebar from './features/ai/ChatSidebar'
import PanelErrorBoundary from './shared/components/PanelErrorBoundary'
import { useMediaQuery } from './lib/hooks/useMediaQuery'
import { appTitle } from './lib/constants'
import useUiStore, { type TabKey } from './stores/uiStore'
import useSettingsStore from './stores/settingsStore'
import useMetricsStore from './stores/metricsStore'
import useLibraryStore from './stores/libraryStore'
import { normalizeThemePreset } from './lib/theme'
import useReaderShortcutTemplateStore, { type ReaderShortcutAction } from './stores/readerShortcutTemplateStore'
import SettingsDrawer from './features/settings/SettingsDrawer'
import type { QuickPrompt } from './lib/quickPrompt'
import DesktopWorkspace from './features/shell/DesktopWorkspace'
import useWriterLayoutStore, { type WriterLayoutDensity } from './stores/writerLayoutStore'
import useShellLayoutStore from './stores/shellLayoutStore'
import useShellLayoutModeStore from './stores/shellLayoutModeStore'
import LayoutControls from './features/shell/components/LayoutControls'
import useFlomoComposerStore from './features/integrations/flomo/flomoComposerStore'
import FlomoComposer from './features/integrations/flomo/components/FlomoComposer'
import { densityVars, type LayoutDensity } from './features/shell/appDensity'

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
  const { lastLatencyMs, lastTokens, lastModel } = useMetricsStore()
  const { hydrate: hydrateLibrary } = useLibraryStore()
  const [quickPrompt, setQuickPrompt] = useState<QuickPrompt>()
  const [showNav, setShowNav] = useState(true)
  const [desktopView, setDesktopView] = useState<'reader' | 'writer'>('reader')
  const [writerChatCollapsed, setWriterChatCollapsed] = useState(false)
  const [writerIsPreview, setWriterIsPreview] = useState(false)
  const readerSidebarWidthPx = useShellLayoutStore((s) => s.readerSidebarWidthPx)
  const writerSidebarWidthPx = useShellLayoutStore((s) => s.writerSidebarWidthPx)
  const readerMainSplitRatio = useShellLayoutStore((s) => s.readerMainSplitRatio)
  const setReaderSidebarWidthPx = useShellLayoutStore((s) => s.setReaderSidebarWidthPx)
  const setWriterSidebarWidthPx = useShellLayoutStore((s) => s.setWriterSidebarWidthPx)
  const setReaderMainSplitRatio = useShellLayoutStore((s) => s.setReaderMainSplitRatio)
  const resetReaderLayout = useShellLayoutStore((s) => s.resetReaderLayout)
  const resetWriterSidebarLayout = useShellLayoutStore((s) => s.resetWriterLayout)
  const readerDensity = useShellLayoutStore((s) => s.readerDensity)
  const setReaderDensity = useShellLayoutStore((s) => s.setReaderDensity)
  const buildReaderQuickPrompt = useReaderShortcutTemplateStore((s) => s.buildQuickPrompt)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const writerDensity = useWriterLayoutStore((s) => s.density)
  const setWriterDensity = useWriterLayoutStore((s) => s.setDensity)
  const resetWriterLayout = useWriterLayoutStore((s) => s.reset)
  const layoutAdjusting = useShellLayoutModeStore((s) => s.adjusting)
  const toggleLayoutAdjusting = useShellLayoutModeStore((s) => s.toggle)
  const flomoDraft = useFlomoComposerStore((s) => s.draft)
  const closeFlomoComposer = useFlomoComposerStore((s) => s.close)

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

  useEffect(() => {
    if (!isMobile) return
    if (!quickPrompt) return
    const autoSend = quickPrompt.autoSend ?? false
    if (!autoSend) setActiveTab('chat')
  }, [isMobile, quickPrompt, setActiveTab])

  const consumeQuickPrompt = () => setQuickPrompt(undefined)

  const currentDensity: LayoutDensity = desktopView === 'writer' ? (writerDensity as LayoutDensity) : readerDensity

  const appStyle: CSSProperties | undefined = !isMobile ? (densityVars(currentDensity) as unknown as CSSProperties) : undefined

  const onSetCurrentDensity = (density: LayoutDensity) => {
    if (desktopView === 'writer') {
      setWriterDensity(density as WriterLayoutDensity)
      return
    }
    setReaderDensity(density)
  }

  return (
    <div
      className={`${isMobile ? 'min-h-screen' : 'h-screen overflow-hidden'} flex flex-col bg-surface-base text-ink-primary`}
      style={appStyle}
    >
      <header className="border-b border-chrome-border/70 bg-surface-base/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-screen-3xl items-center justify-between px-[var(--app-pad-x,1.5rem)] py-[var(--app-header-py,0.75rem)]">
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
                onToggleAdjusting={toggleLayoutAdjusting}
                onSetDensity={onSetCurrentDensity}
                onResetCurrentView={() => {
                  if (desktopView === 'reader') {
                    resetReaderLayout()
                    return
                  }
                  resetWriterLayout()
                  resetWriterSidebarLayout()
                }}
              />
            )}
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-chrome-border/70 bg-surface-raised/50 px-3 py-1 text-xs text-ink-primary hover:border-accent"
              title="Settings"
              aria-label="Settings"
            >
              <Settings className="size-4" />
              <span className="hidden md:inline">Settings</span>
            </button>
          </div>
        </div>
      </header>

      <main
        className={`mx-auto flex w-full max-w-screen-3xl flex-1 flex-col gap-[var(--app-gap,1rem)] px-[var(--app-pad-x,1.5rem)] py-[var(--app-pad-y,1.5rem)] min-h-0 ${isMobile ? '' : 'overflow-x-hidden overflow-y-visible'}`}
      >
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
              {activeTab === 'editor' && <EditorPane onQuickPrompt={setQuickPrompt} />}
              {activeTab === 'chat' && (
                <PanelErrorBoundary title="Chat">
                  <ChatSidebar quickPrompt={quickPrompt} onConsumeQuickPrompt={consumeQuickPrompt} />
                </PanelErrorBoundary>
              )}
            </div>
          </section>
        ) : (
          <DesktopWorkspace
            showNav={showNav}
            onToggleNav={() => setShowNav((v) => !v)}
            desktopView={desktopView}
            onSetDesktopView={setDesktopView}
            onReaderAction={handleReaderAction}
            quickPrompt={quickPrompt}
            onConsumeQuickPrompt={consumeQuickPrompt}
            onSetQuickPrompt={(prompt) => setQuickPrompt(prompt)}
            writerChatCollapsed={writerChatCollapsed}
            onWriterChatCollapsedChange={setWriterChatCollapsed}
            writerIsPreview={writerIsPreview}
            onWriterIsPreviewChange={setWriterIsPreview}
            readerSidebarWidthPx={readerSidebarWidthPx}
            onReaderSidebarWidthPxChange={setReaderSidebarWidthPx}
            writerSidebarWidthPx={writerSidebarWidthPx}
            onWriterSidebarWidthPxChange={setWriterSidebarWidthPx}
            readerMainSplitRatio={readerMainSplitRatio}
            onReaderMainSplitRatioChange={setReaderMainSplitRatio}
          />
        )}
      </main>

      <footer className="border-t border-chrome-border/70 bg-surface-base/70">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-[var(--app-footer-px,1rem)] py-[var(--app-footer-py,0.75rem)] text-xs text-ink-muted">
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
      {settingsOpen && <SettingsDrawer onClose={() => setSettingsOpen(false)} />}
      {flomoDraft && <FlomoComposer draft={flomoDraft} onClose={closeFlomoComposer} />}
    </div>
  )
}

export default App
