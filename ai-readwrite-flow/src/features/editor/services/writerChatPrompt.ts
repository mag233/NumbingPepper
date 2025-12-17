export const buildWriterUserPrompt = (input: string, contextText: string, includeContext: boolean) => {
  const trimmed = input.trim()
  if (!trimmed) return ''
  if (!includeContext) return trimmed
  const ctx = contextText.trim()
  if (!ctx) return trimmed
  return `Context:\n${ctx}\n\nInstruction:\n${trimmed}`
}

