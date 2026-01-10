import { create } from 'zustand'

export type TabKey = 'library' | 'reader' | 'editor' | 'chat'
export type DesktopView = 'reader' | 'writer'

type UiState = {
  activeTab: TabKey
  setActiveTab: (tab: TabKey) => void
  mobileChatOpen: boolean
  setMobileChatOpen: (open: boolean) => void
  openMobileChat: () => void
  closeMobileChat: () => void
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
  openSettings: () => void
  closeSettings: () => void
  showNav: boolean
  setShowNav: (show: boolean) => void
  desktopView: DesktopView
  setDesktopView: (view: DesktopView) => void
  writerChatCollapsed: boolean
  setWriterChatCollapsed: (collapsed: boolean) => void
  writerIsPreview: boolean
  setWriterIsPreview: (preview: boolean) => void
}

const useUiStore = create<UiState>((set) => ({
  activeTab: 'library',
  setActiveTab: (activeTab) => set({ activeTab }),
  mobileChatOpen: false,
  setMobileChatOpen: (mobileChatOpen) => set({ mobileChatOpen }),
  openMobileChat: () => set({ mobileChatOpen: true }),
  closeMobileChat: () => set({ mobileChatOpen: false }),
  settingsOpen: false,
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  showNav: true,
  setShowNav: (showNav) => set({ showNav }),
  desktopView: 'reader',
  setDesktopView: (desktopView) => set({ desktopView }),
  writerChatCollapsed: false,
  setWriterChatCollapsed: (writerChatCollapsed) => set({ writerChatCollapsed }),
  writerIsPreview: false,
  setWriterIsPreview: (writerIsPreview) => set({ writerIsPreview }),
}))

export default useUiStore
