import { defaultBaseUrl, defaultModel } from './constants'
import { logEvent } from './logger'
import { isGpt5Model, type ChatResponseSettings } from './chatResponseSettings'
import type { ChatMessageInput, ChatResponse } from './chatApiTypes'

type ResponsesInputItem = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

type ResponsesUsage = {
  input_tokens?: number
  output_tokens?: number
  total_tokens?: number
}

const normalizeBase = (url: string) => url.replace(/\/+$/, '')

const buildResponsesInput = (messages: ChatMessageInput[]): ResponsesInputItem[] =>
  messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }))

const extractResponsesText = (payload: unknown): string => {
  if (!payload || typeof payload !== 'object') return ''
  const direct = (payload as { output_text?: unknown }).output_text
  if (typeof direct === 'string' && direct.trim()) return direct
  const output = (payload as { output?: unknown }).output
  if (!Array.isArray(output)) return ''
  const parts: string[] = []
  for (const item of output) {
    if (!item || typeof item !== 'object') continue
    const content = (item as { content?: unknown }).content
    if (!Array.isArray(content)) continue
    for (const entry of content) {
      if (!entry || typeof entry !== 'object') continue
      const type = (entry as { type?: unknown }).type
      const text = (entry as { text?: unknown }).text
      if (type === 'output_text' && typeof text === 'string') {
        parts.push(text)
      }
    }
  }
  return parts.join('\n').trim()
}

const usageSafeNumber = (value: unknown): number | undefined =>
  typeof value === 'number' ? value : undefined

const parseResponsesUsage = (usage: ResponsesUsage | undefined) => {
  if (!usage) return undefined
  const promptTokens = usageSafeNumber(usage.input_tokens)
  const completionTokens = usageSafeNumber(usage.output_tokens)
  const totalTokens = usageSafeNumber(usage.total_tokens)
  if (!promptTokens && !completionTokens && !totalTokens) return undefined
  return { promptTokens, completionTokens, totalTokens }
}

export const sendResponsesRequest = async (
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessageInput[],
  settings: ChatResponseSettings,
): Promise<ChatResponse> => {
  const safeBase = normalizeBase(baseUrl || defaultBaseUrl)
  if (!apiKey) return { ok: false, error: 'API Key is required' }

  const started = performance.now()
  try {
    const payload: Record<string, unknown> = {
      model: model || defaultModel,
      input: buildResponsesInput(messages),
    }
    if (typeof settings.maxOutputTokens === 'number') {
      payload.max_output_tokens = settings.maxOutputTokens
    }
    if (isGpt5Model(model)) {
      payload.reasoning = { effort: settings.reasoningEffort }
      payload.text = { verbosity: settings.verbosity }
    }

    const response = await fetch(`${safeBase}/responses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const payloadJson: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      const message =
        (payloadJson as { error?: { message?: string } })?.error?.message ??
        `Request failed with status ${response.status}`
      void logEvent('warn', 'Responses API HTTP error', {
        status: response.status,
        baseUrl: safeBase,
        model: model || defaultModel,
      })
      return { ok: false, error: message }
    }

    const content = extractResponsesText(payloadJson)
    const usage = parseResponsesUsage((payloadJson as { usage?: ResponsesUsage }).usage)
    if (!content) {
      void logEvent('warn', 'Responses API empty content', {
        baseUrl: safeBase,
        model: model || defaultModel,
      })
      return {
        ok: false,
        error: 'Empty response from model',
        latencyMs: Math.round(performance.now() - started),
        usage,
      }
    }
    return { ok: true, content, latencyMs: Math.round(performance.now() - started), usage }
  } catch (error) {
    void logEvent('error', 'Responses API exception', {
      baseUrl: safeBase,
      model: model || defaultModel,
      message: error instanceof Error ? error.message : 'Unknown error',
    })
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      latencyMs: Math.round(performance.now() - started),
    }
  }
}

export const __test__ = {
  buildResponsesInput,
  extractResponsesText,
}
