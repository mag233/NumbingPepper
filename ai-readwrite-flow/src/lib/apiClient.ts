import { defaultBaseUrl, defaultModel } from './constants'
import { logEvent } from './logger'
import type { ChatResponseSettings } from './chatResponseSettings'
import { sendResponsesRequest } from './responsesClient'
import type { ChatMessageInput, ChatResponse } from './chatApiTypes'

export type ConnectionResult = {
  ok: boolean
  modelFound: boolean
  latencyMs?: number
  error?: string
}

const normalizeBase = (url: string) => url.replace(/\/+$/, '')

export const testConnection = async (
  baseUrl: string,
  apiKey: string,
  model: string,
): Promise<ConnectionResult> => {
  const safeBase = normalizeBase(baseUrl || defaultBaseUrl)
  if (!apiKey) {
    return { ok: false, modelFound: false, error: 'API Key is required' }
  }

  const started = performance.now()
  try {
    const response = await fetch(`${safeBase}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return {
        ok: false,
        modelFound: false,
        error: `Request failed with status ${response.status}`,
      }
    }

    const payload = await response.json()
    const models = Array.isArray(payload?.data) ? payload.data : []
    const found = models.some((entry: { id?: string }) => entry.id === model)
    return {
      ok: true,
      modelFound: found || model === defaultModel,
      latencyMs: Math.round(performance.now() - started),
    }
  } catch (error) {
    return {
      ok: false,
      modelFound: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}

// Basic chat completion call (OpenAI-style /chat/completions)
export const sendChatCompletion = async (
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessageInput[],
): Promise<ChatResponse> => {
  const safeBase = normalizeBase(baseUrl || defaultBaseUrl)
  if (!apiKey) return { ok: false, error: 'API Key is required' }

  const started = performance.now()
  try {
    const response = await fetch(`${safeBase}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || defaultModel,
        messages,
        stream: false,
      }),
    })

    if (!response.ok) {
      void logEvent('warn', 'Chat completion HTTP error', {
        status: response.status,
        baseUrl: safeBase,
        model: model || defaultModel,
      })
      return { ok: false, error: `Request failed with status ${response.status}` }
    }

    const payload = await response.json()
    const choice = payload?.choices?.[0]
    const content: string | undefined = choice?.message?.content ?? choice?.delta?.content
    const usage = payload?.usage
      ? {
          promptTokens: usageSafeNumber(payload.usage.prompt_tokens),
          completionTokens: usageSafeNumber(payload.usage.completion_tokens),
          totalTokens: usageSafeNumber(payload.usage.total_tokens),
        }
      : undefined
    if (!content) {
      void logEvent('warn', 'Chat completion empty content', {
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
    void logEvent('error', 'Chat completion exception', {
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

export const sendChatRequest = async (
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessageInput[],
  settings: ChatResponseSettings,
): Promise<ChatResponse> => {
  if (settings.apiMode === 'responses') {
    return sendResponsesRequest(baseUrl, apiKey, model, messages, settings)
  }
  return sendChatCompletion(baseUrl, apiKey, model, messages)
}

const usageSafeNumber = (value: unknown): number | undefined =>
  typeof value === 'number' ? value : undefined
