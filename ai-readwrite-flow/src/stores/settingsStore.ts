import { create } from 'zustand'
import { defaultBaseUrl, defaultModel } from '../lib/constants'
import { loadSettingsFromStore, persistSettings } from '../lib/db'
import { defaultThemePreset, type ThemePreset } from '../lib/theme'

type Status = 'idle' | 'loading' | 'ready' | 'error'

type SettingsState = {
  apiKey: string
  baseUrl: string
  model: string
  themePreset: ThemePreset
  status: Status
  error?: string
  setApiKey: (apiKey: string) => void
  setBaseUrl: (baseUrl: string) => void
  setModel: (model: string) => void
  setThemePreset: (theme: ThemePreset) => void
  hydrate: () => Promise<void>
  save: () => Promise<void>
}

const useSettingsStore = create<SettingsState>((set, get) => ({
  apiKey: '',
  baseUrl: defaultBaseUrl,
  model: defaultModel,
  themePreset: defaultThemePreset,
  status: 'idle',
  error: undefined,
  setApiKey: (apiKey) => set({ apiKey }),
  setBaseUrl: (baseUrl) => set({ baseUrl }),
  setModel: (model) => set({ model }),
  setThemePreset: (themePreset) => set({ themePreset }),
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
