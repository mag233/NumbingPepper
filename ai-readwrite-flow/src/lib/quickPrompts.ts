export type ReaderQuickAction = 'summarize' | 'explain' | 'chat' | 'questions'

export const buildReaderQuickPrompt = (action: ReaderQuickAction, text: string) => {
  const quoted = `"${text}"`
  if (action === 'chat') {
    return { text: `Context:\n${quoted}\n\nInstruction:\n`, autoSend: false }
  }
  if (action === 'questions') {
    return {
      text: `Context:\n${quoted}\n\nInstruction:\nGenerate 8 active-recall questions. Return a numbered list. Do not answer.\n`,
      autoSend: true,
    }
  }
  if (action === 'explain') return { text: `Explain this text: ${quoted}`, autoSend: true }
  return { text: `Summarize this text: ${quoted}`, autoSend: true }
}

