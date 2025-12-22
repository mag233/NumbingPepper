import { create } from 'zustand'
import { z } from 'zod'

export type ReaderShortcutAction = 'summarize' | 'explain' | 'chat' | 'questions'

export type ReaderShortcutTemplateId =
  | 'reader-ask-ai'
  | 'reader-summarize'
  | 'reader-explain'
  | 'reader-questions'

export type ReaderShortcutTemplate = {
  id: ReaderShortcutTemplateId
  label: string
  shortLabel: string
  description: string
  instruction: string
  autoSend: boolean
}

type ReaderTemplateOverrides = Partial<Record<ReaderShortcutTemplateId, { instruction: string }>>

type ReaderShortcutTemplateState = {
  useDefaults: boolean
  overrides: ReaderTemplateOverrides
  setUseDefaults: (useDefaults: boolean) => void
  setInstruction: (id: ReaderShortcutTemplateId, instruction: string) => void
  resetTemplate: (id: ReaderShortcutTemplateId) => void
  resetAll: () => void
  getEffectiveTemplate: (id: ReaderShortcutTemplateId) => ReaderShortcutTemplate
  buildQuickPrompt: (action: ReaderShortcutAction, selectedText: string) => { text: string; autoSend: boolean }
}

const STORAGE_KEY = 'ai-readwrite-flow-reader-shortcuts-v1'

const templateIdSchema = z.enum(['reader-ask-ai', 'reader-summarize', 'reader-explain', 'reader-questions'])

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

const defaults: Record<ReaderShortcutTemplateId, ReaderShortcutTemplate> = {
  'reader-ask-ai': {
    id: 'reader-ask-ai',
    label: 'Ask AI',
    shortLabel: 'Ask AI',
    description: 'Prefill Context + Instruction and focus input.',
    instruction: '',
    autoSend: false,
  },
  'reader-summarize': {
    id: 'reader-summarize',
    label: 'Summarize',
    shortLabel: 'Summarize',
    description: 'Auto-send a concise summary request grounded in the selected text.',
    instruction:
      'Summarize the context in 5 bullets, then add a 1-sentence takeaway.\n' +
      'Be faithful to the context; do not add outside facts.',
    autoSend: true,
  },
  'reader-explain': {
    id: 'reader-explain',
    label: 'Explain',
    shortLabel: 'Explain',
    description: 'Auto-send a clear explanation request grounded in the selected text.',
    instruction:
      'Explain the context in simple terms.\n' +
      'Define key terms and describe the logic flow.\n' +
      'If there are assumptions, list them.',
    autoSend: true,
  },
  'reader-questions': {
    id: 'reader-questions',
    label: 'Generate Questions',
    shortLabel: 'Questions',
    description: 'Auto-send: generate 3–5 active-recall Q/A pairs.',
    instruction:
      'Generate 3–5 active-recall question/answer pairs based ONLY on the context.\n' +
      '\n' +
      'Rules:\n' +
      '- Output 3–5 items.\n' +
      '- Each item MUST be two lines:\n' +
      '  Q: ...\n' +
      '  A: ...\n' +
      '- Include at least one of each tag: [Terminology], [Logic], [Insight].\n' +
      '- Keep answers short and grounded in the context.\n' +
      '- If the context is insufficient, ask 1–2 clarifying questions instead of guessing.',
    autoSend: true,
  },
}

const actionToTemplateId = (action: ReaderShortcutAction): ReaderShortcutTemplateId => {
  if (action === 'chat') return 'reader-ask-ai'
  if (action === 'summarize') return 'reader-summarize'
  if (action === 'explain') return 'reader-explain'
  return 'reader-questions'
}

const normalizeSelectedText = (text: string) => text.trim()

const buildContextInstructionMessage = (context: string, instruction: string) =>
  `Context:\n${context}\n\nInstruction:\n${instruction.trim()}\n`

const buildAskAiDraft = (context: string, instruction: string) => {
  const trimmed = instruction.trim()
  if (!trimmed) return `Context:\n${context}\n\nInstruction:\n`
  return `Context:\n${context}\n\nInstruction:\n${trimmed}\n`
}

const loadPersisted = (): { useDefaults: boolean; overrides: ReaderTemplateOverrides } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { useDefaults: false, overrides: {} }
    const json: unknown = JSON.parse(raw)
    const parsed = persistedSchema.safeParse(json)
    if (!parsed.success) return { useDefaults: false, overrides: {} }
    const overrides: ReaderTemplateOverrides = {}
    for (const entry of parsed.data.overrides ?? []) {
      overrides[entry.id] = { instruction: entry.instruction }
    }
    return { useDefaults: parsed.data.useDefaults ?? false, overrides }
  } catch (error) {
    console.warn('Failed to load reader shortcut templates', error)
    return { useDefaults: false, overrides: {} }
  }
}

const persist = (useDefaults: boolean, overrides: ReaderTemplateOverrides) => {
  try {
    const rows = Object.entries(overrides).flatMap(([id, value]) => {
      if (!value) return []
      return [{ id, instruction: value.instruction }]
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ useDefaults, overrides: rows }))
  } catch (error) {
    console.warn('Failed to persist reader shortcut templates', error)
  }
}

const initial = loadPersisted()

const useReaderShortcutTemplateStore = create<ReaderShortcutTemplateState>((set, get) => ({
  useDefaults: initial.useDefaults,
  overrides: initial.overrides,
  setUseDefaults: (useDefaults) =>
    set((state) => {
      persist(useDefaults, state.overrides)
      return { useDefaults }
    }),
  setInstruction: (id, instruction) =>
    set((state) => {
      const next: ReaderTemplateOverrides = { ...state.overrides, [id]: { instruction } }
      persist(state.useDefaults, next)
      return { overrides: next }
    }),
  resetTemplate: (id) =>
    set((state) => {
      const next: ReaderTemplateOverrides = { ...state.overrides }
      delete next[id]
      persist(state.useDefaults, next)
      return { overrides: next }
    }),
  resetAll: () =>
    set((state) => {
      const next: ReaderTemplateOverrides = {}
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
  buildQuickPrompt: (action, selectedText) => {
    const context = normalizeSelectedText(selectedText)
    const id = actionToTemplateId(action)
    const template = get().getEffectiveTemplate(id)
    if (id === 'reader-ask-ai') {
      return { text: buildAskAiDraft(context, template.instruction), autoSend: false }
    }
    return { text: buildContextInstructionMessage(context, template.instruction), autoSend: template.autoSend }
  },
}))

export default useReaderShortcutTemplateStore
