import { create } from 'zustand'

export type PromptTemplate = {
  id: string
  name: string
  prompt: string
}

const defaultTemplates: PromptTemplate[] = [
  { id: 'tmpl-summarize', name: 'Summarize', prompt: 'Summarize the selected text.' },
  { id: 'tmpl-explain', name: 'Explain', prompt: 'Explain the selected text in simple terms.' },
  { id: 'tmpl-continue', name: 'Continue Writing', prompt: 'Continue writing from the selected context.' },
]

type TemplateState = {
  templates: PromptTemplate[]
  addTemplate: (name: string, prompt: string) => void
  removeTemplate: (id: string) => void
}

const STORAGE_KEY = 'ai-readwrite-flow-templates'

const loadTemplates = (): PromptTemplate[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultTemplates
    const parsed = JSON.parse(raw) as PromptTemplate[]
    if (Array.isArray(parsed)) return parsed
  } catch (error) {
    console.warn('Failed to load templates', error)
  }
  return defaultTemplates
}

const persistTemplates = (templates: PromptTemplate[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  } catch (error) {
    console.warn('Failed to persist templates', error)
  }
}

const createId = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)

const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: loadTemplates(),
  addTemplate: (name, prompt) =>
    set((state) => {
      const next = [...state.templates, { id: createId(), name, prompt }]
      persistTemplates(next)
      return { templates: next }
    }),
  removeTemplate: (id) =>
    set((state) => {
      const next = state.templates.filter((item) => item.id !== id)
      persistTemplates(next)
      return { templates: next }
    }),
}))

export default useTemplateStore
