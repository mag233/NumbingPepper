import { Bot } from 'lucide-react'
import type { ReaderShortcutAction } from '../../../stores/readerShortcutTemplateStore'
import type { TabKey } from '../../../stores/uiStore'
import type { QuickPrompt } from '../../../lib/quickPrompt'
import LibraryPanel from '../../library/LibraryPanel'
import PanelErrorBoundary from '../../../shared/components/PanelErrorBoundary'
import ReaderPane from '../../reader/ReaderPane'
import EditorPane from '../../editor/EditorPane'

const NAV_TABS: { id: TabKey; label: string }[] = [
  { id: 'library', label: 'Library' },
  { id: 'reader', label: 'Reader' },
  { id: 'editor', label: 'Writer' },
]

type Props = {
  activeTab: TabKey
  onSetActiveTab: (tab: TabKey) => void
  onReaderAction: (action: ReaderShortcutAction, text: string) => void
  onQuickPrompt: (prompt?: QuickPrompt) => void
  openMobileChat: () => void
}

const AppMainMobile = ({ activeTab, onSetActiveTab, onReaderAction, onQuickPrompt, openMobileChat }: Props) => (
  <section className="flex flex-col gap-3">
    <nav className="grid grid-cols-3 gap-2 rounded-xl border border-chrome-border/70 bg-surface-raised/60 p-1">
      {NAV_TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSetActiveTab(tab.id)}
          className={`flex items-center justify-center rounded-lg px-2 py-2 text-xs font-semibold transition ${
            activeTab === tab.id ? 'bg-accent text-white shadow' : 'text-ink-muted hover:bg-surface-raised/80'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
    <div className="rounded-2xl border border-chrome-border/70 bg-surface-raised/50 p-3">
      {activeTab === 'library' && <LibraryPanel compact onOpen={() => onSetActiveTab('reader')} />}
      {activeTab === 'reader' && (
        <PanelErrorBoundary title="Reader">
          <ReaderPane onAction={onReaderAction} />
        </PanelErrorBoundary>
      )}
      {activeTab === 'editor' && (
        <EditorPane onQuickPrompt={onQuickPrompt} isPreview={false} onIsPreviewChange={() => {}} onEditorChange={() => {}} />
      )}
    </div>
    {activeTab === 'editor' && (
      <button
        type="button"
        onClick={openMobileChat}
        className="fixed bottom-20 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/40"
        aria-label="Open chat"
      >
        <Bot className="size-4" />
        Chat
      </button>
    )}
  </section>
)

export default AppMainMobile
