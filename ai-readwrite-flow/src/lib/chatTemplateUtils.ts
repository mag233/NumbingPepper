export type ChatTemplateInsertMode = 'replace' | 'append'

type ApplyTemplateArgs = {
  current: string
  prompt: string
  mode: ChatTemplateInsertMode
}

export const applyTemplateToDraft = ({ current, prompt, mode }: ApplyTemplateArgs) => {
  if (mode === 'replace') return prompt
  const trimmed = current.trim()
  return trimmed ? `${current}\n\n${prompt}` : prompt
}

export type ChatTemplate = {
  id: string
  name: string
  prompt: string
}

export const findChatTemplate = (templates: ChatTemplate[], id: string) =>
  templates.find((template) => template.id === id)
