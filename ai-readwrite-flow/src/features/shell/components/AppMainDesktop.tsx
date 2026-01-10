import type { ReaderShortcutAction } from '../../../stores/readerShortcutTemplateStore'
import type { QuickPrompt } from '../../../lib/quickPrompt'
import DesktopWorkspace from '../DesktopWorkspace'

type Props = {
  showNav: boolean
  onToggleNav: () => void
  desktopView: 'reader' | 'writer'
  onSetDesktopView: (view: 'reader' | 'writer') => void
  onReaderAction: (action: ReaderShortcutAction, text: string) => void
  quickPrompt?: QuickPrompt
  onConsumeQuickPrompt: () => void
  onSetQuickPrompt: (prompt?: QuickPrompt) => void
  writerChatCollapsed: boolean
  onWriterChatCollapsedChange: (next: boolean) => void
  writerIsPreview: boolean
  onWriterIsPreviewChange: (next: boolean) => void
  readerSidebarWidthPx: number
  onReaderSidebarWidthPxChange: (next: number) => void
  writerSidebarWidthPx: number
  onWriterSidebarWidthPxChange: (next: number) => void
  readerMainSplitRatio: number
  onReaderMainSplitRatioChange: (next: number) => void
}

const AppMainDesktop = (props: Props) => <DesktopWorkspace {...props} />

export default AppMainDesktop
