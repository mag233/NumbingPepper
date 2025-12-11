import { create } from 'zustand'

export type TabKey = 'library' | 'reader' | 'editor' | 'chat'

type UiState = {
  activeTab: TabKey
  setActiveTab: (tab: TabKey) => void
}

const useUiStore = create<UiState>((set) => ({
  activeTab: 'library',
  setActiveTab: (activeTab) => set({ activeTab }),
}))

export default useUiStore
