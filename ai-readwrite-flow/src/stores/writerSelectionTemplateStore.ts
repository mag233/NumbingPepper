import { create } from 'zustand'
import {
  defaultWriterRewriteToneProfiles,
  defaultWriterSelectionTemplates,
  actionToTemplateId,
} from './writerSelectionTemplateDefaults'
import {
  loadWriterSelectionTemplatesState,
  persistWriterSelectionTemplatesState,
} from './writerSelectionTemplatePersistence'
import type {
  WriterRewriteTone,
  WriterRewriteToneProfile,
  WriterRewriteToneProfileOverride,
  WriterRewriteToneProfileOverrides,
  WriterSelectionAction,
  WriterSelectionBuildOptions,
  WriterSelectionTemplate,
  WriterSelectionTemplateId,
  WriterTemplateOverrides,
} from './writerSelectionTemplateModel'

export type {
  WriterRewriteTone,
  WriterRewriteToneProfile,
  WriterSelectionAction,
  WriterSelectionBuildOptions,
  WriterSelectionTemplate,
  WriterSelectionTemplateId,
} from './writerSelectionTemplateModel'

type State = {
  useDefaults: boolean
  templateOverrides: WriterTemplateOverrides
  rewriteToneProfiles: WriterRewriteToneProfileOverrides
  setUseDefaults: (useDefaults: boolean) => void
  setTemplateInstruction: (id: WriterSelectionTemplateId, instruction: string) => void
  resetTemplate: (id: WriterSelectionTemplateId) => void
  resetAllTemplates: () => void
  getEffectiveTemplate: (id: WriterSelectionTemplateId) => WriterSelectionTemplate
  setRewriteToneProfile: (tone: WriterRewriteTone, patch: WriterRewriteToneProfileOverride) => void
  resetRewriteToneProfile: (tone: WriterRewriteTone) => void
  resetAllRewriteToneProfiles: () => void
  getEffectiveRewriteToneProfile: (tone: WriterRewriteTone) => WriterRewriteToneProfile
  buildSelectionPrompt: (
    action: WriterSelectionAction,
    selectedText: string,
    options?: WriterSelectionBuildOptions,
  ) => { text: string; autoSend: boolean }
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

const rewriteToneProfileDirectives = (tone: WriterRewriteTone, profile: WriterRewriteToneProfile) => {
  if (tone === 'default') return []
  const directives: string[] = []
  const directive = profile.directive.trim()
  directives.push(directive ? directive : `Tone: ${profile.label.trim() || 'Rewrite'}`)
  const description = profile.description.trim()
  if (description) directives.push(`Description: ${description}`)
  const examples = profile.examples.map((e) => e.trim()).filter(Boolean)
  if (examples.length) {
    directives.push('Examples:')
    for (const example of examples) directives.push(`- ${example}`)
  }
  return directives
}

const initial = loadWriterSelectionTemplatesState()

const persistSnapshot = (snapshot: {
  useDefaults: boolean
  templateOverrides: WriterTemplateOverrides
  rewriteToneProfiles: WriterRewriteToneProfileOverrides
}) => persistWriterSelectionTemplatesState(snapshot)

const createTemplateSelectors = (get: () => State) => ({
  getEffectiveTemplate: (id: WriterSelectionTemplateId) => {
    const state = get()
    const base = defaultWriterSelectionTemplates[id]
    if (state.useDefaults) return base
    const override = state.templateOverrides[id]
    if (!override) return base
    return { ...base, instruction: override.instruction }
  },
})

const createToneSelectors = (get: () => State) => ({
  getEffectiveRewriteToneProfile: (tone: WriterRewriteTone) => {
    const state = get()
    const base = defaultWriterRewriteToneProfiles[tone]
    if (state.useDefaults) return base
    const override = state.rewriteToneProfiles[tone]
    if (!override) return base
    return { ...base, ...override, tone }
  },
})

const createTemplateActions = (set: (fn: (s: State) => Partial<State>) => void) => ({
  setTemplateInstruction: (id: WriterSelectionTemplateId, instruction: string) =>
    set((state) => {
      const templateOverrides: WriterTemplateOverrides = { ...state.templateOverrides, [id]: { instruction } }
      persistSnapshot({ useDefaults: state.useDefaults, templateOverrides, rewriteToneProfiles: state.rewriteToneProfiles })
      return { templateOverrides }
    }),
  resetTemplate: (id: WriterSelectionTemplateId) =>
    set((state) => {
      const templateOverrides: WriterTemplateOverrides = { ...state.templateOverrides }
      delete templateOverrides[id]
      persistSnapshot({ useDefaults: state.useDefaults, templateOverrides, rewriteToneProfiles: state.rewriteToneProfiles })
      return { templateOverrides }
    }),
  resetAllTemplates: () =>
    set((state) => {
      const templateOverrides: WriterTemplateOverrides = {}
      persistSnapshot({ useDefaults: state.useDefaults, templateOverrides, rewriteToneProfiles: state.rewriteToneProfiles })
      return { templateOverrides }
    }),
})

const createToneActions = (set: (fn: (s: State) => Partial<State>) => void) => ({
  setRewriteToneProfile: (tone: WriterRewriteTone, patch: WriterRewriteToneProfileOverride) =>
    set((state) => {
      const prev = state.rewriteToneProfiles[tone] ?? {}
      const rewriteToneProfiles: WriterRewriteToneProfileOverrides = { ...state.rewriteToneProfiles, [tone]: { ...prev, ...patch } }
      persistSnapshot({ useDefaults: state.useDefaults, templateOverrides: state.templateOverrides, rewriteToneProfiles })
      return { rewriteToneProfiles }
    }),
  resetRewriteToneProfile: (tone: WriterRewriteTone) =>
    set((state) => {
      const rewriteToneProfiles: WriterRewriteToneProfileOverrides = { ...state.rewriteToneProfiles }
      delete rewriteToneProfiles[tone]
      persistSnapshot({ useDefaults: state.useDefaults, templateOverrides: state.templateOverrides, rewriteToneProfiles })
      return { rewriteToneProfiles }
    }),
  resetAllRewriteToneProfiles: () =>
    set((state) => {
      const rewriteToneProfiles: WriterRewriteToneProfileOverrides = {}
      persistSnapshot({ useDefaults: state.useDefaults, templateOverrides: state.templateOverrides, rewriteToneProfiles })
      return { rewriteToneProfiles }
    }),
})

const createPromptBuilder = (get: () => State) => ({
  buildSelectionPrompt: (
    action: WriterSelectionAction,
    selectedText: string,
    options?: WriterSelectionBuildOptions,
  ): { text: string; autoSend: boolean } => {
    const context = normalizeSelectedText(selectedText)
    const id = actionToTemplateId(action)
    const template = get().getEffectiveTemplate(id)
    if (id === 'writer-ask-ai') return { text: buildAskAiDraft(context, template.instruction), autoSend: false }

    const extraDirectives: string[] = []
    if (id === 'writer-rewrite') {
      const tone = options?.rewriteTone ?? 'default'
      extraDirectives.push(...rewriteToneProfileDirectives(tone, get().getEffectiveRewriteToneProfile(tone)))
    }
    if (id === 'writer-translate') {
      const lang = (options?.translateTargetLanguage ?? 'English').trim()
      if (lang) extraDirectives.push(`Target language: ${lang}`)
    }

    return { text: buildContextInstructionMessage(context, template.instruction, extraDirectives), autoSend: template.autoSend }
  },
})

const useWriterSelectionTemplateStore = create<State>((set, get) => ({
  useDefaults: initial.useDefaults,
  templateOverrides: initial.templateOverrides,
  rewriteToneProfiles: initial.rewriteToneProfiles,
  setUseDefaults: (useDefaults) =>
    set((state) => {
      persistSnapshot({ useDefaults, templateOverrides: state.templateOverrides, rewriteToneProfiles: state.rewriteToneProfiles })
      return { useDefaults }
    }),
  ...createTemplateSelectors(get),
  ...createToneSelectors(get),
  ...createTemplateActions(set),
  ...createToneActions(set),
  ...createPromptBuilder(get),
}))

export default useWriterSelectionTemplateStore
