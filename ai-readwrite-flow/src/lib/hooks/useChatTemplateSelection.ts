import { useMemo, useState } from 'react'
import type { ChatTemplate } from '../chatTemplateUtils'
import { applyTemplateToDraft, findChatTemplate, type ChatTemplateInsertMode } from '../chatTemplateUtils'

type Options = {
  templates: ChatTemplate[]
  applyOnSelect?: boolean
}

type ApplyArgs = {
  mode: ChatTemplateInsertMode
  setDraft: (next: string | ((current: string) => string)) => void
}

export const useChatTemplateSelection = ({ templates, applyOnSelect = true }: Options) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState('')

  const selectedTemplate = useMemo(
    () => (selectedTemplateId ? findChatTemplate(templates, selectedTemplateId) : undefined),
    [selectedTemplateId, templates],
  )

  const onSelectTemplate = (id: string, setDraft?: ApplyArgs['setDraft']) => {
    setSelectedTemplateId(id)
    if (!applyOnSelect || !setDraft) return
    applyTemplateById(id, { mode: 'replace', setDraft })
  }

  const applyTemplateById = (id: string, { mode, setDraft }: ApplyArgs) => {
    const template = findChatTemplate(templates, id)
    if (!template) return false
    setDraft((current) => applyTemplateToDraft({ current, prompt: template.prompt, mode }))
    return true
  }

  const applySelectedTemplate = ({ mode, setDraft }: ApplyArgs) => {
    if (!selectedTemplate) return false
    setDraft((current) => applyTemplateToDraft({ current, prompt: selectedTemplate.prompt, mode }))
    return true
  }

  return {
    selectedTemplateId,
    selectedTemplate,
    onSelectTemplate,
    applyTemplateById,
    applySelectedTemplate,
  }
}
