import { z } from 'zod'

export const chatApiModeSchema = z.enum(['chat', 'responses'])
export const reasoningEffortSchema = z.enum(['low', 'medium', 'high'])
export const verbositySchema = z.enum(['low', 'medium', 'high'])

export type ChatApiMode = z.infer<typeof chatApiModeSchema>
export type ReasoningEffort = z.infer<typeof reasoningEffortSchema>
export type VerbosityLevel = z.infer<typeof verbositySchema>

export type ChatResponseSettings = {
  apiMode: ChatApiMode
  reasoningEffort: ReasoningEffort
  verbosity: VerbosityLevel
  maxOutputTokens: number | null
}

export const defaultChatResponseSettings: ChatResponseSettings = {
  apiMode: 'chat',
  reasoningEffort: 'medium',
  verbosity: 'medium',
  maxOutputTokens: null,
}

const chatResponseSettingsSchema = z.object({
  apiMode: chatApiModeSchema.optional(),
  reasoningEffort: reasoningEffortSchema.optional(),
  verbosity: verbositySchema.optional(),
  maxOutputTokens: z.number().int().positive().nullable().optional(),
})

const normalizeMaxOutputTokens = (value: number | null | undefined) => {
  if (typeof value !== 'number') return null
  if (!Number.isFinite(value)) return null
  const rounded = Math.floor(value)
  return rounded > 0 ? rounded : null
}

export const normalizeChatResponseSettings = (value: unknown): ChatResponseSettings => {
  const parsed = chatResponseSettingsSchema.safeParse(value)
  const next = parsed.success ? parsed.data : {}
  return {
    apiMode: next.apiMode ?? defaultChatResponseSettings.apiMode,
    reasoningEffort: next.reasoningEffort ?? defaultChatResponseSettings.reasoningEffort,
    verbosity: next.verbosity ?? defaultChatResponseSettings.verbosity,
    maxOutputTokens: normalizeMaxOutputTokens(next.maxOutputTokens),
  }
}

export const isGpt5Model = (model: string) => model.trim().toLowerCase().startsWith('gpt-5')
