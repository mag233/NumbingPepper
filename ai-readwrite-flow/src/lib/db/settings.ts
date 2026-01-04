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
  flomoWebhookUrl: string
}

const LOCAL_STORAGE_KEY = 'ai-readwrite-flow-settings'
const DEFAULT_SETTINGS: StoredSettings = {
  apiKey: '',
  baseUrl: defaultBaseUrl,
  model: defaultModel,
  themePreset: defaultThemePreset,
  flomoWebhookUrl: '',
}

const storedSettingsInputSchema = z.object({
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  model: z.string().optional(),
  themePreset: z.string().optional(),
  flomoWebhookUrl: z.string().optional(),
})

const getDefaultFlomoWebhookUrl = () => {
  return (import.meta.env.VITE_FLOMO_API ?? '').trim()
}

const normalizeFlomoWebhookUrl = (raw: string | undefined) => (raw ?? '').trim()

export const loadSettingsFromStore = async (): Promise<StoredSettings> => {
  const st = await ensureStore()
  if (st) {
    try {
      const raw: unknown = await st.get('settings')
      const parsed = storedSettingsInputSchema.safeParse(raw)
      if (parsed.success) {
        const envDefaultFlomoUrl = getDefaultFlomoWebhookUrl()
        return {
          ...DEFAULT_SETTINGS,
          ...parsed.data,
          themePreset: normalizeThemePreset(parsed.data.themePreset ?? getPreferredThemePreset()),
          flomoWebhookUrl: normalizeFlomoWebhookUrl(parsed.data.flomoWebhookUrl) || envDefaultFlomoUrl,
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
      const envDefaultFlomoUrl = getDefaultFlomoWebhookUrl()
      return {
        ...DEFAULT_SETTINGS,
        ...parsed.data,
        themePreset: normalizeThemePreset(parsed.data.themePreset ?? getPreferredThemePreset()),
        flomoWebhookUrl: normalizeFlomoWebhookUrl(parsed.data.flomoWebhookUrl) || envDefaultFlomoUrl,
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
      const envDefaultFlomoUrl = getDefaultFlomoWebhookUrl()
      return {
        apiKey: record.apiKey ?? '',
        baseUrl: record.baseUrl ?? defaultBaseUrl,
        model: record.model ?? defaultModel,
        themePreset: normalizeThemePreset(record.themePreset ?? preferred),
        flomoWebhookUrl: normalizeFlomoWebhookUrl(record.flomoWebhookUrl) || envDefaultFlomoUrl,
      }
    } catch (error) {
      console.warn('SQLite settings read failed, using defaults', error)
    }
  }

  return { ...DEFAULT_SETTINGS, flomoWebhookUrl: getDefaultFlomoWebhookUrl() }
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
      await db.execute('INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2)', [
        'flomoWebhookUrl',
        settings.flomoWebhookUrl,
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
