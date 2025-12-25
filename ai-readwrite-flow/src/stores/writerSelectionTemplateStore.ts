import { create } from 'zustand'
import { z } from 'zod'

export type WriterSelectionAction =
  | 'simplify'
  | 'concise'
  | 'rewrite'
  | 'translate'
  | 'explain'
  | 'ask-ai'

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

type WriterTemplateOverrides = Partial<Record<WriterSelectionTemplateId, { instruction: string }>>

export type WriterSelectionBuildOptions = {
  rewriteTone?: WriterRewriteTone
  translateTargetLanguage?: string
}

type WriterSelectionTemplateState = {
  useDefaults: boolean
  overrides: WriterTemplateOverrides
  setUseDefaults: (useDefaults: boolean) => void
  setInstruction: (id: WriterSelectionTemplateId, instruction: string) => void
  resetTemplate: (id: WriterSelectionTemplateId) => void
  resetAll: () => void
  getEffectiveTemplate: (id: WriterSelectionTemplateId) => WriterSelectionTemplate
  buildSelectionPrompt: (
    action: WriterSelectionAction,
    selectedText: string,
    options?: WriterSelectionBuildOptions,
  ) => { text: string; autoSend: boolean }
}

const STORAGE_KEY = 'ai-readwrite-flow-writer-selection-templates-v1'

const templateIdSchema = z.enum([
  'writer-ask-ai',
  'writer-simplify',
  'writer-concise',
  'writer-rewrite',
  'writer-translate',
  'writer-explain',
])

const persistedSchema = z.object({
  useDefaults: z.boolean().optional(),
  overrides: z
    .array(
      z.object({
        id: templateIdSchema,
        instruction: z.string(),
      }),
    )
    .optional(),
})

const defaults: Record<WriterSelectionTemplateId, WriterSelectionTemplate> = {
  'writer-ask-ai': {
    id: 'writer-ask-ai',
    label: 'Ask AI',
    shortLabel: 'Ask AI',
    description: 'Prefill Context + Instruction and focus input (no auto-send).',
    instruction: '',
    autoSend: false,
  },
  'writer-simplify': {
    id: 'writer-simplify',
    label: 'Simplify',
    shortLabel: 'Simplify',
    description: 'Auto-send: simplify the selected text without changing meaning.',
    instruction:
      'Rewrite the context in simpler language.\n' +
      'Keep meaning and facts unchanged.\n' +
      'Output ONLY the rewritten text (no preface, no bullets unless the original is bullets).',
    autoSend: true,
  },
  'writer-concise': {
    id: 'writer-concise',
    label: 'Concise',
    shortLabel: 'Concise',
    description: 'Auto-send: make the selected text shorter and clearer.',
    instruction:
      'Rewrite the context to be more concise.\n' +
      'Remove redundancy, keep key details.\n' +
      'Output ONLY the rewritten text.',
    autoSend: true,
  },
  'writer-rewrite': {
    id: 'writer-rewrite',
    label: 'Rewrite',
    shortLabel: 'Rewrite',
    description: 'Auto-send: rewrite the selected text in a chosen tone.',
    instruction:
      'Rewrite the context with improved clarity and flow.\n' +
      'Output ONLY the rewritten text.',
    autoSend: true,
  },
  'writer-translate': {
    id: 'writer-translate',
    label: 'Translate',
    shortLabel: 'Translate',
    description: 'Auto-send: translate the selected text to a target language.',
    instruction:
      'Translate the context to the target language.\n' +
      'Preserve meaning and proper nouns.\n' +
      'Output ONLY the translated text.',
    autoSend: true,
  },
  'writer-explain': {
    id: 'writer-explain',
    label: 'Explain',
    shortLabel: 'Explain',
    description: 'Auto-send: explain the selected text for better understanding.',
    instruction:
      'Explain the context in 3–6 bullets.\n' +
      'Define key terms and describe the logic flow.\n' +
      'Keep it grounded in the context.',
    autoSend: true,
  },
}

const actionToTemplateId = (action: WriterSelectionAction): WriterSelectionTemplateId => {
  if (action === 'ask-ai') return 'writer-ask-ai'
  if (action === 'simplify') return 'writer-simplify'
  if (action === 'concise') return 'writer-concise'
  if (action === 'rewrite') return 'writer-rewrite'
  if (action === 'translate') return 'writer-translate'
  return 'writer-explain'
}

const normalizeSelectedText = (text: string) => text.trim()

const buildAskAiDraft = (context: string, instruction: string) => {
  const trimmed = instruction.trim()
  if (!trimmed) return `Context:\n${context}\n\nInstruction:\n`
  return `Context:\n${context}\n\nInstruction:\n${trimmed}\n`
}

const buildContextInstructionMessage = (context: string, instruction: string, extraDirectives: string[]) => {
  const trimmedInstruction = instruction.trim()
  const extras = extraDirectives.filter(Boolean).join('\n')
  const suffix = extras ? `\n\n${extras}\n` : '\n'
  return `Context:\n${context}\n\nInstruction:\n${trimmedInstruction}${suffix}`
}

const toneDirective = (tone: WriterRewriteTone) => {
  if (tone === 'default') return ''
  if (tone === 'formal') return 'Tone: Formal'
  if (tone === 'friendly') return 'Tone: Friendly'
  if (tone === 'academic') return 'Tone: Academic'
  return 'Tone: Bullet points'
}

const loadPersisted = (): { useDefaults: boolean; overrides: WriterTemplateOverrides } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { useDefaults: false, overrides: {} }
    const json: unknown = JSON.parse(raw)
    const parsed = persistedSchema.safeParse(json)
    if (!parsed.success) return { useDefaults: false, overrides: {} }
    const overrides: WriterTemplateOverrides = {}
    for (const entry of parsed.data.overrides ?? []) {
      overrides[entry.id] = { instruction: entry.instruction }
    }
    return { useDefaults: parsed.data.useDefaults ?? false, overrides }
  } catch (error) {
    console.warn('Failed to load writer selection templates', error)
    return { useDefaults: false, overrides: {} }
  }
}

const persist = (useDefaults: boolean, overrides: WriterTemplateOverrides) => {
  try {
    const rows = Object.entries(overrides).flatMap(([id, value]) => {
      if (!value) return []
      return [{ id, instruction: value.instruction }]
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ useDefaults, overrides: rows }))
  } catch (error) {
    console.warn('Failed to persist writer selection templates', error)
  }
}

const initial = loadPersisted()

const useWriterSelectionTemplateStore = create<WriterSelectionTemplateState>((set, get) => ({
  useDefaults: initial.useDefaults,
  overrides: initial.overrides,
  setUseDefaults: (useDefaults) =>
    set((state) => {
      persist(useDefaults, state.overrides)
      return { useDefaults }
    }),
  setInstruction: (id, instruction) =>
    set((state) => {
      const next: WriterTemplateOverrides = { ...state.overrides, [id]: { instruction } }
      persist(state.useDefaults, next)
      return { overrides: next }
    }),
  resetTemplate: (id) =>
    set((state) => {
      const next: WriterTemplateOverrides = { ...state.overrides }
      delete next[id]
      persist(state.useDefaults, next)
      return { overrides: next }
    }),
  resetAll: () =>
    set((state) => {
      const next: WriterTemplateOverrides = {}
      persist(state.useDefaults, next)
      return { overrides: next }
    }),
  getEffectiveTemplate: (id) => {
    const state = get()
    const base = defaults[id]
    if (state.useDefaults) return base
    const override = state.overrides[id]
    if (!override) return base
    return { ...base, instruction: override.instruction }
  },
  buildSelectionPrompt: (action, selectedText, options) => {
    const context = normalizeSelectedText(selectedText)
    const id = actionToTemplateId(action)
    const template = get().getEffectiveTemplate(id)
    if (id === 'writer-ask-ai') {
      return { text: buildAskAiDraft(context, template.instruction), autoSend: false }
    }

    const extraDirectives: string[] = []
    if (id === 'writer-rewrite') {
      extraDirectives.push(toneDirective(options?.rewriteTone ?? 'default'))
    }
    if (id === 'writer-translate') {
      const lang = (options?.translateTargetLanguage ?? 'English').trim()
      if (lang) extraDirectives.push(`Target language: ${lang}`)
    }

    return {
      text: buildContextInstructionMessage(context, template.instruction, extraDirectives),
      autoSend: template.autoSend,
    }
  },
}))

export default useWriterSelectionTemplateStore

