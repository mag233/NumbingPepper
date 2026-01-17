export type ChatMessageInput = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export type ChatResponse = {
  ok: boolean
  content?: string
  error?: string
  latencyMs?: number
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
}
