import Database from '@tauri-apps/plugin-sql'
import { Store } from '@tauri-apps/plugin-store'
import { defaultBaseUrl, defaultModel } from './constants'
import { isTauri } from './isTauri'

export type StoredSettings = {
  apiKey: string
  baseUrl: string
  model: string
}

const LOCAL_STORAGE_KEY = 'ai-readwrite-flow-settings'
const DEFAULT_SETTINGS: StoredSettings = {
  apiKey: '',
  baseUrl: defaultBaseUrl,
  model: defaultModel,
}
const STORE_FILE = 'settings.store.dat'

let client: Database | null = null
let store: Store | null = null

const ensureClient = async () => {
  if (!isTauri()) return null
  if (client) return client
  client = await Database.load('sqlite:settings.db')
  return client
}

const ensureStore = async () => {
  if (!isTauri()) return null
  if (store) return store
  try {
    store = await Store.load(STORE_FILE)
    return store
  } catch (error) {
    console.warn('Tauri store load failed', error)
    return null
  }
}

export const loadSettingsFromStore = async (): Promise<StoredSettings> => {
  // 1) Tauri store file
  if (isTauri()) {
    try {
      const st = await ensureStore()
      if (st) {
        const raw = await st.get<StoredSettings>('settings')
        if (raw) return { ...DEFAULT_SETTINGS, ...raw }
      }
    } catch (error) {
      console.warn('Tauri store read failed', error)
    }
  }

  // 2) localStorage to survive DB/plugin issues (also for web dev)
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch (error) {
    console.warn('Local settings read failed', error)
  }

  const db = await ensureClient()
  if (db) {
    try {
      const rows =
        (await db.select<{ key: string; value: string }[]>(
          'SELECT key, value FROM settings',
        )) || []
      if (!rows.length) return DEFAULT_SETTINGS
      const record = rows.reduce<Record<string, string>>((acc, row) => {
        acc[row.key] = row.value
        return acc
      }, {})
      return {
        apiKey: record.apiKey ?? '',
        baseUrl: record.baseUrl ?? defaultBaseUrl,
        model: record.model ?? defaultModel,
      }
    } catch (error) {
      console.warn('SQLite settings read failed, using defaults', error)
    }
  }

  return DEFAULT_SETTINGS
}

export const persistSettings = async (settings: StoredSettings) => {
  try {
    const db = await ensureClient()
    if (db) {
      try {
        await db.execute(
          'INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2)',
          ['apiKey', settings.apiKey],
        )
        await db.execute(
          'INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2)',
          ['baseUrl', settings.baseUrl],
        )
        await db.execute(
          'INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2)',
          ['model', settings.model],
        )
      } catch (error) {
        console.warn('SQLite settings write failed, still persisting to store/localStorage', error)
      }
    }
  } catch (error) {
    console.warn('SQLite client init failed', error)
  }

  try {
    const st = await ensureStore()
    if (st) {
      try {
        await st.set('settings', settings)
        await st.save()
      } catch (error) {
        console.warn('Tauri store settings write failed', error)
      }
    }
  } catch (error) {
    console.warn('Tauri store init failed', error)
  }

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.warn('Local settings write failed', error)
  }
}
