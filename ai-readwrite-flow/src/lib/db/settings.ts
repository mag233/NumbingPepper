import { defaultBaseUrl, defaultModel } from '../constants'
import {
  defaultThemePreset,
  getPreferredThemePreset,
  normalizeThemePreset,
  type ThemePreset,
} from '../theme'
import { z } from 'zod'
import { ensureClient, ensureStore } from './client'

export type StoredSettings = {
  apiKey: string
  baseUrl: string
  model: string
  themePreset: ThemePreset
}

const LOCAL_STORAGE_KEY = 'ai-readwrite-flow-settings'
const DEFAULT_SETTINGS: StoredSettings = {
  apiKey: '',
  baseUrl: defaultBaseUrl,
  model: defaultModel,
  themePreset: defaultThemePreset,
}

const storedSettingsInputSchema = z.object({
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  model: z.string().optional(),
  themePreset: z.string().optional(),
})

export const loadSettingsFromStore = async (): Promise<StoredSettings> => {
  const st = await ensureStore()
  if (st) {
    try {
      const raw: unknown = await st.get('settings')
      const parsed = storedSettingsInputSchema.safeParse(raw)
      if (parsed.success) {
        return {
          ...DEFAULT_SETTINGS,
          ...parsed.data,
          themePreset: normalizeThemePreset(parsed.data.themePreset ?? getPreferredThemePreset()),
        }
      }
    } catch (error) {
      console.warn('Tauri store read failed', error)
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw) {
      const json: unknown = JSON.parse(raw)
      const parsed = storedSettingsInputSchema.safeParse(json)
      if (!parsed.success) throw new Error('Invalid settings in localStorage')
      return {
        ...DEFAULT_SETTINGS,
        ...parsed.data,
        themePreset: normalizeThemePreset(parsed.data.themePreset ?? getPreferredThemePreset()),
      }
    }
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
      const preferred = getPreferredThemePreset()
      return {
        apiKey: record.apiKey ?? '',
        baseUrl: record.baseUrl ?? defaultBaseUrl,
        model: record.model ?? defaultModel,
        themePreset: normalizeThemePreset(record.themePreset ?? preferred),
      }
    } catch (error) {
      console.warn('SQLite settings read failed, using defaults', error)
    }
  }

  return DEFAULT_SETTINGS
}

export const persistSettings = async (settings: StoredSettings) => {
  const db = await ensureClient()
  if (db) {
    try {
      await db.execute('INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2)', [
        'apiKey',
        settings.apiKey,
      ])
      await db.execute('INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2)', [
        'baseUrl',
        settings.baseUrl,
      ])
      await db.execute('INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2)', [
        'model',
        settings.model,
      ])
      await db.execute('INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2)', [
        'themePreset',
        settings.themePreset,
      ])
    } catch (error) {
      console.warn('SQLite settings write failed, still persisting to store/localStorage', error)
    }
  }

  const st = await ensureStore()
  if (st) {
    try {
      await st.set('settings', settings)
      await st.save()
    } catch (error) {
      console.warn('Tauri store settings write failed', error)
    }
  }

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.warn('Local settings write failed', error)
  }
}
