import { useEffect, useMemo, useState } from 'react'
import { Bot, LayoutPanelTop, Smartphone, Sparkles } from 'lucide-react'
import SettingsPanel from './features/settings/SettingsPanel'
import LibraryPanel from './features/library/LibraryPanel'
import ReaderPane from './features/reader/ReaderPane'
import ReaderNav from './features/reader/ReaderNav'
import EditorPane from './features/editor/EditorPane'
import ChatSidebar from './features/ai/ChatSidebar'
import { useMediaQuery } from './lib/hooks/useMediaQuery'
import { appTitle } from './lib/constants'
import useUiStore, { type TabKey } from './stores/uiStore'
import useSettingsStore from './stores/settingsStore'
import useReaderStore from './stores/readerStore'
import useMetricsStore from './stores/metricsStore'
import useLibraryStore from './stores/libraryStore'

type Action = 'summarize' | 'explain' | 'chat' | 'questions'

const App = () => {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const { activeTab, setActiveTab } = useUiStore()
  const { hydrate, model } = useSettingsStore()
  const { scrollMode, toggleScrollMode } = useReaderStore()
  const { lastLatencyMs, lastTokens, lastModel } = useMetricsStore()
  const { hydrate: hydrateLibrary } = useLibraryStore()
  const [quickPrompt, setQuickPrompt] = useState<{ text: string; autoSend?: boolean }>()
  const [showTopBar, setShowTopBar] = useState(true)
  const [showNav, setShowNav] = useState(true)
  const [desktopView, setDesktopView] = useState<'reader' | 'writer'>('reader')

  useEffect(() => {
    void hydrate()
    void hydrateLibrary()
  }, [hydrate, hydrateLibrary])

  const navTabs: { id: TabKey; label: string }[] = useMemo(
    () => [
      { id: 'library', label: 'Library' },
      { id: 'reader', label: 'Reader' },
      { id: 'editor', label: 'Writer' },
      { id: 'chat', label: 'Chat' },
    ],
    [],
  )

  const handleReaderAction = (action: Action, text: string) => {
    const prefixMap: Record<Action, string> = {
      summarize: 'Summarize this text:',
      explain: 'Explain this text:',
      chat: 'Context:',
      questions: 'Context:',
    }
    const quoted = `"${text}"`
    const prompt = (() => {
      if (action === 'chat') return `${prefixMap[action]}\n${quoted}\n\nInstruction:\n`
      if (action === 'questions') {
        return `${prefixMap[action]}\n${quoted}\n\nInstruction:\nGenerate 8 active-recall questions. Return a numbered list. Do not answer.\n`
      }
      return `${prefixMap[action]} ${quoted}`
    })()
    setQuickPrompt({ text: prompt, autoSend: action !== 'chat' })
    if (isMobile) setActiveTab('chat')
  }

  const handleEditorCommand = (prompt: string) => {
    setQuickPrompt({ text: prompt, autoSend: false })
    if (isMobile) setActiveTab('chat')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="border-b border-slate-800/70 bg-slate-900/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-screen-3xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Bot className="size-5 text-sky-400" />
            <span>{appTitle}</span>
            <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300">
              Tauri v2 / React / Tailwind
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <Sparkles className="size-4 text-amber-300" />
            <span>Default model: {model}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-screen-3xl flex-col gap-4 px-6 py-6">
        {isMobile ? (
          <section className="flex flex-col gap-3">
            <SettingsPanel />
            <nav className="grid grid-cols-4 gap-2 rounded-xl border border-slate-800/70 bg-slate-900/60 p-1">
              {navTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center rounded-lg px-2 py-2 text-xs font-semibold transition ${
                    activeTab === tab.id
                      ? 'bg-sky-500 text-white shadow'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-3">
              {activeTab === 'library' && (
                <LibraryPanel compact onOpen={() => setActiveTab('reader')} />
              )}
              {activeTab === 'reader' && <ReaderPane onAction={handleReaderAction} />}
              {activeTab === 'editor' && <EditorPane onCommand={handleEditorCommand} />}
              {activeTab === 'chat' && (
                <ChatSidebar
                  quickPrompt={quickPrompt}
                  onConsumeQuickPrompt={() => setQuickPrompt(undefined)}
                />
              )}
            </div>
          </section>
        ) : (
          <>
            <div className="hidden items-center gap-3 text-xs text-slate-400 md:flex">
              <span>View:</span>
              <button
                className="rounded-lg border border-slate-800/70 px-2 py-1 hover:border-sky-500 hover:text-sky-100"
                onClick={() => setShowTopBar((v) => !v)}
              >
                {showTopBar ? 'Hide top bar' : 'Show top bar'}
              </button>
              <button
                className="rounded-lg border border-slate-800/70 px-2 py-1 hover:border-sky-500 hover:text-sky-100"
                onClick={() => setShowNav((v) => !v)}
              >
                {showNav ? 'Hide navigation' : 'Show navigation'}
              </button>
              <button
                className={`rounded-lg border px-2 py-1 ${
                  desktopView === 'reader'
                    ? 'border-sky-500 bg-sky-500/20 text-sky-100'
                    : 'border-slate-800/70 hover:border-sky-500 hover:text-sky-100'
                }`}
                onClick={() => setDesktopView('reader')}
              >
                Reader
              </button>
              <button
                className={`rounded-lg border px-2 py-1 ${
                  desktopView === 'writer'
                    ? 'border-sky-500 bg-sky-500/20 text-sky-100'
                    : 'border-slate-800/70 hover:border-sky-500 hover:text-sky-100'
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

            {desktopView === 'reader' && (
              <section
                className={`grid items-start gap-4 ${
                  showNav ? 'md:grid-cols-[240px_minmax(0,3.5fr)_1.1fr]' : 'md:grid-cols-[minmax(0,3.5fr)_1.1fr]'
                }`}
              >
                {showNav && (
                  <div className="h-full">
                    <ReaderNav
                      scrollMode={scrollMode}
                      onToggleScrollMode={toggleScrollMode}
                    />
                  </div>
                )}
                <div className="min-h-[86vh]">
                  <ReaderPane onAction={handleReaderAction} />
                </div>
                <div className="h-full">
                  <ChatSidebar
                    quickPrompt={quickPrompt}
                    onConsumeQuickPrompt={() => setQuickPrompt(undefined)}
                  />
                </div>
              </section>
            )}

            {desktopView === 'writer' && (
              <section
                className={`grid items-start gap-4 ${
                  showNav ? 'md:grid-cols-[240px_minmax(0,3.5fr)_1.1fr]' : 'md:grid-cols-[minmax(0,3.5fr)_1.1fr]'
                }`}
              >
                {showNav && (
                  <div className="h-full">
                    <ReaderNav
                      scrollMode={scrollMode}
                      onToggleScrollMode={toggleScrollMode}
                    />
                  </div>
                )}
                <div className="min-h-[86vh]">
                  <EditorPane onCommand={handleEditorCommand} />
                </div>
                <div className="h-full">
                  <ChatSidebar
                    quickPrompt={quickPrompt}
                    onConsumeQuickPrompt={() => setQuickPrompt(undefined)}
                  />
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-slate-800/70 bg-slate-900/60">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 text-xs text-slate-500">
          <LayoutPanelTop className="size-4" />
          Desktop: Split View (Reader | Writer/Chat), Mobile: Tabs (Library/Reader/Writer/Chat)
          <span className="ml-auto inline-flex items-center gap-1">
            <Smartphone className="size-4" />
            Mobile-first layout enabled
          </span>
          <span className="ml-4 inline-flex items-center gap-2 text-[11px] text-slate-400">
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
