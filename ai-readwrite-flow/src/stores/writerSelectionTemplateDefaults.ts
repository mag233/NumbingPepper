import type {
  WriterRewriteTone,
  WriterRewriteToneProfile,
  WriterSelectionAction,
  WriterSelectionTemplate,
  WriterSelectionTemplateId,
} from './writerSelectionTemplateModel'

export const defaultWriterSelectionTemplates: Record<WriterSelectionTemplateId, WriterSelectionTemplate> = {
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
    instruction: 'Rewrite the context with improved clarity and flow.\nOutput ONLY the rewritten text.',
    autoSend: true,
  },
  'writer-translate': {
    id: 'writer-translate',
    label: 'Translate',
    shortLabel: 'Translate',
    description: 'Auto-send: translate the selected text to a target language.',
    instruction: 'Translate the context to the target language.\nPreserve meaning and proper nouns.\nOutput ONLY the translated text.',
    autoSend: true,
  },
  'writer-explain': {
    id: 'writer-explain',
    label: 'Explain',
    shortLabel: 'Explain',
    description: 'Auto-send: explain the selected text for better understanding.',
    instruction: 'Explain the context in 3–5 bullets.\nDefine key terms and describe the logic flow.\nKeep it grounded in the context.',
    autoSend: true,
  },
}

export const defaultWriterRewriteToneProfiles: Record<WriterRewriteTone, WriterRewriteToneProfile> = {
  default: { tone: 'default', label: 'Default', description: '', directive: '', examples: [] },
  formal: {
    tone: 'formal',
    label: 'Formal',
    description: 'Professional, precise, and structured. Avoid slang and contractions.',
    directive: 'Tone: Formal',
    examples: ['Use clear topic sentences and avoid casual phrasing.'],
  },
  friendly: {
    tone: 'friendly',
    label: 'Friendly',
    description: 'Warm and approachable. Prefer short sentences and plain language.',
    directive: 'Tone: Friendly',
    examples: ['Explain ideas as if to a colleague, keeping the language simple.'],
  },
  academic: {
    tone: 'academic',
    label: 'Academic',
    description: 'Neutral and analytical. Prefer precise definitions and cautious claims.',
    directive: 'Tone: Academic',
    examples: ['Use formal connectors (therefore, however) and define key terms.'],
  },
  bullet: {
    tone: 'bullet',
    label: 'Bullet',
    description: 'Rewrite into bullet points. Preserve all key facts and structure.',
    directive: 'Tone: Bullet points',
    examples: ['Use 3–7 bullets and keep each bullet concise.'],
  },
}

export const actionToTemplateId = (action: WriterSelectionAction): WriterSelectionTemplateId => {
  if (action === 'ask-ai') return 'writer-ask-ai'
  if (action === 'simplify') return 'writer-simplify'
  if (action === 'concise') return 'writer-concise'
  if (action === 'rewrite') return 'writer-rewrite'
  if (action === 'translate') return 'writer-translate'
  return 'writer-explain'
}

