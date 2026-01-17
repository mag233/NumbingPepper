import { defaultBaseUrl, defaultModel } from '../constants'
import {
  defaultThemePreset,
  getPreferredThemePreset,
  normalizeThemePreset,
  type ThemePreset,
} from '../theme'
import { defaultReferenceDefaultTags, type ReferenceDefaultTags } from '../referenceTags'
import {
  defaultChatResponseSettings,
  normalizeChatResponseSettings,
  type ChatResponseSettings,
} from '../chatResponseSettings'
import { z } from 'zod'
import { ensureClient, ensureStore } from './client'

export type StoredSettings = {
  apiKey: string
  baseUrl: string
  model: string
  themePreset: ThemePreset
  flomoWebhookUrl: string
  referenceDefaultTags: ReferenceDefaultTags
  chatResponseSettings: ChatResponseSettings
}

const LOCAL_STORAGE_KEY = 'ai-readwrite-flow-settings'
const DEFAULT_SETTINGS: StoredSettings = {
  apiKey: '',
  baseUrl: defaultBaseUrl,
  model: defaultModel,
  themePreset: defaultThemePreset,
  flomoWebhookUrl: '',
  referenceDefaultTags: defaultReferenceDefaultTags,
  chatResponseSettings: defaultChatResponseSettings,
}

const storedSettingsInputSchema = z.object({
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  model: z.string().optional(),
  themePreset: z.string().optional(),
  flomoWebhookUrl: z.string().optional(),
  referenceDefaultTags: z
    .object({
      book: z.boolean().optional(),
      author: z.boolean().optional(),
      year: z.boolean().optional(),
    })
    .optional(),
  chatResponseSettings: z
    .object({
      apiMode: z.enum(['chat', 'responses']).optional(),
      reasoningEffort: z.enum(['low', 'medium', 'high']).optional(),
      verbosity: z.enum(['low', 'medium', 'high']).optional(),
      maxOutputTokens: z.number().int().positive().nullable().optional(),
    })
    .optional(),
})

const getDefaultFlomoWebhookUrl = () => {
  return (import.meta.env.VITE_FLOMO_API ?? '').trim()
}

const normalizeFlomoWebhookUrl = (raw: string | undefined) => (raw ?? '').trim()
const parseReferenceDefaultTags = (raw: string | undefined): ReferenceDefaultTags => {
  if (!raw) return defaultReferenceDefaultTags
  try {
    const parsed = JSON.parse(raw) as Partial<ReferenceDefaultTags>
    return { ...defaultReferenceDefaultTags, ...(parsed ?? {}) }
  } catch {
    return defaultReferenceDefaultTags
  }
}

const parseChatResponseSettings = (raw: string | undefined): ChatResponseSettings => {
  if (!raw) return defaultChatResponseSettings
  try {
    const parsed = JSON.parse(raw) as unknown
    return normalizeChatResponseSettings(parsed)
  } catch {
    return defaultChatResponseSettings
  }
}

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
          referenceDefaultTags: {
            ...defaultReferenceDefaultTags,
            ...(parsed.data.referenceDefaultTags ?? {}),
          },
          chatResponseSettings: normalizeChatResponseSettings(parsed.data.chatResponseSettings),
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
        referenceDefaultTags: {
          ...defaultReferenceDefaultTags,
          ...(parsed.data.referenceDefaultTags ?? {}),
        },
        chatResponseSettings: normalizeChatResponseSettings(parsed.data.chatResponseSettings),
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
        referenceDefaultTags: parseReferenceDefaultTags(record.referenceDefaultTags),
        chatResponseSettings: parseChatResponseSettings(record.chatResponseSettings),
      }
    } catch (error) {
      console.warn('SQLite settings read failed, using defaults', error)
    }
  }

  return {
    ...DEFAULT_SETTINGS,
    flomoWebhookUrl: getDefaultFlomoWebhookUrl(),
    referenceDefaultTags: defaultReferenceDefaultTags,
    chatResponseSettings: defaultChatResponseSettings,
  }
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
      await db.execute('INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2)', [
        'referenceDefaultTags',
        JSON.stringify(settings.referenceDefaultTags),
      ])
      await db.execute('INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2)', [
        'chatResponseSettings',
        JSON.stringify(settings.chatResponseSettings),
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
