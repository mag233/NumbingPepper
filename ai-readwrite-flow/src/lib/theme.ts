import { z } from 'zod'

export const themePresetSchema = z.enum([
  'soft-dark',
  'light',
  'ocean',
  'forest',
  'sand',
])

export type ThemePreset = z.infer<typeof themePresetSchema>

export const defaultThemePreset: ThemePreset = 'soft-dark'

export const normalizeThemePreset = (value: unknown): ThemePreset => {
  const parsed = themePresetSchema.safeParse(value)
  return parsed.success ? parsed.data : defaultThemePreset
}

export const getPreferredThemePreset = (): ThemePreset => {
  if (typeof window === 'undefined') return defaultThemePreset
  const media = window.matchMedia?.('(prefers-color-scheme: dark)')
  if (!media) return defaultThemePreset
  return media.matches ? 'soft-dark' : 'light'
}
