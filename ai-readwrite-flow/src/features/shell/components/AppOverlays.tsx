import type { QuickPrompt } from '../../../lib/quickPrompt'
import type { FlomoComposerDraft } from '../../integrations/flomo/flomoComposerStore'
import SettingsDrawer from '../../settings/SettingsDrawer'
import MobileOverlay from '../../../shared/components/MobileOverlay'
import ChatSidebar from '../../ai/ChatSidebar'
import FlomoComposer from '../../integrations/flomo/components/FlomoComposer'
import { READER_CHAT_SCOPE } from '../../../shared/chatScope'

type Props = {
  settingsOpen: boolean
  onCloseSettings: () => void
  isMobile: boolean
  mobileChatOpen: boolean
  quickPrompt?: QuickPrompt
  onConsumeQuickPrompt: () => void
  onCloseMobileChat: () => void
  flomoDraft: FlomoComposerDraft | null
  onCloseFlomoComposer: () => void
}

const AppOverlays = ({
  settingsOpen,
  onCloseSettings,
  isMobile,
  mobileChatOpen,
  quickPrompt,
  onConsumeQuickPrompt,
  onCloseMobileChat,
  flomoDraft,
  onCloseFlomoComposer,
}: Props) => (
  <>
    {settingsOpen && <SettingsDrawer onClose={onCloseSettings} />}
    {isMobile && mobileChatOpen && (
      <MobileOverlay>
        <ChatSidebar
          variant="mobileOverlay"
          quickPrompt={quickPrompt}
          onConsumeQuickPrompt={onConsumeQuickPrompt}
          onClose={onCloseMobileChat}
          scope={READER_CHAT_SCOPE}
        />
      </MobileOverlay>
    )}
    {flomoDraft && <FlomoComposer draft={flomoDraft} onClose={onCloseFlomoComposer} />}
  </>
)

export default AppOverlays
