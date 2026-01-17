import { create } from 'zustand'
import { defaultBaseUrl, defaultModel } from '../lib/constants'
import { loadSettingsFromStore, persistSettings } from '../lib/db'
import { defaultReferenceDefaultTags, type ReferenceDefaultTags } from '../lib/referenceTags'
import {
  defaultChatResponseSettings,
  normalizeChatResponseSettings,
  type ChatResponseSettings,
} from '../lib/chatResponseSettings'
import { defaultThemePreset, type ThemePreset } from '../lib/theme'

type Status = 'idle' | 'loading' | 'ready' | 'error'

type SettingsState = {
  apiKey: string
  baseUrl: string
  model: string
  themePreset: ThemePreset
  flomoWebhookUrl: string
  referenceDefaultTags: ReferenceDefaultTags
  chatResponseSettings: ChatResponseSettings
  status: Status
  error?: string
  setApiKey: (apiKey: string) => void
  setBaseUrl: (baseUrl: string) => void
  setModel: (model: string) => void
  setThemePreset: (theme: ThemePreset) => void
  setFlomoWebhookUrl: (url: string) => void
  setReferenceDefaultTags: (tags: ReferenceDefaultTags) => void
  setChatResponseSettings: (settings: ChatResponseSettings) => void
  updateChatResponseSettings: (next: Partial<ChatResponseSettings>) => void
  hydrate: () => Promise<void>
  save: () => Promise<void>
}

const useSettingsStore = create<SettingsState>((set, get) => ({
  apiKey: '',
  baseUrl: defaultBaseUrl,
  model: defaultModel,
  themePreset: defaultThemePreset,
  flomoWebhookUrl: '',
  referenceDefaultTags: defaultReferenceDefaultTags,
  chatResponseSettings: defaultChatResponseSettings,
  status: 'idle',
  error: undefined,
  setApiKey: (apiKey) => set({ apiKey }),
  setBaseUrl: (baseUrl) => set({ baseUrl }),
  setModel: (model) => set({ model }),
  setThemePreset: (themePreset) => set({ themePreset }),
  setFlomoWebhookUrl: (flomoWebhookUrl) => set({ flomoWebhookUrl }),
  setReferenceDefaultTags: (referenceDefaultTags) => set({ referenceDefaultTags }),
  setChatResponseSettings: (chatResponseSettings) => set({ chatResponseSettings }),
  updateChatResponseSettings: (next) =>
    set((state) => ({
      chatResponseSettings: normalizeChatResponseSettings({ ...state.chatResponseSettings, ...next }),
    })),
  hydrate: async () => {
    set({ status: 'loading', error: undefined })
    const stored = await loadSettingsFromStore()
    set({ ...stored, status: 'ready', error: undefined })
  },
  save: async () => {
    const snapshot = {
      apiKey: get().apiKey,
      baseUrl: get().baseUrl,
      model: get().model,
      themePreset: get().themePreset,
      flomoWebhookUrl: get().flomoWebhookUrl,
      referenceDefaultTags: get().referenceDefaultTags,
      chatResponseSettings: get().chatResponseSettings,
    }
    try {
      await persistSettings(snapshot)
      set({ status: 'ready', error: undefined })
    } catch (error) {
      set({
        status: 'error',
        error: error instanceof Error ? error.message : 'Save failed',
      })
    }
  },
}))

export default useSettingsStore
