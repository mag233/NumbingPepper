export type WriterSelectionAction = 'simplify' | 'concise' | 'rewrite' | 'translate' | 'explain' | 'ask-ai'

export type WriterRewriteTone = 'default' | 'formal' | 'friendly' | 'academic' | 'bullet'

export type WriterSelectionTemplateId =
  | 'writer-ask-ai'
  | 'writer-simplify'
  | 'writer-concise'
  | 'writer-rewrite'
  | 'writer-translate'
  | 'writer-explain'

export type WriterSelectionTemplate = {
  id: WriterSelectionTemplateId
  label: string
  shortLabel: string
  description: string
  instruction: string
  autoSend: boolean
}

export type WriterSelectionBuildOptions = {
  rewriteTone?: WriterRewriteTone
  translateTargetLanguage?: string
}

export type WriterRewriteToneProfile = {
  tone: WriterRewriteTone
  label: string
  description: string
  directive: string
  examples: string[]
}

export type WriterTemplateOverrides = Partial<Record<WriterSelectionTemplateId, { instruction: string }>>

export type WriterRewriteToneProfileOverride = Partial<Omit<WriterRewriteToneProfile, 'tone'>>

export type WriterRewriteToneProfileOverrides = Partial<Record<WriterRewriteTone, WriterRewriteToneProfileOverride>>

export const writerSelectionTemplateIds: WriterSelectionTemplateId[] = [
  'writer-ask-ai',
  'writer-simplify',
  'writer-concise',
  'writer-rewrite',
  'writer-translate',
  'writer-explain',
]

export const writerRewriteTones: WriterRewriteTone[] = ['default', 'formal', 'friendly', 'academic', 'bullet']

