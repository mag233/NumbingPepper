import { beforeEach, describe, expect, it } from 'vitest'
import useWriterSelectionTemplateStore from './writerSelectionTemplateStore'

type State = ReturnType<typeof useWriterSelectionTemplateStore.getState>

const resetStore = (partial: Partial<State>) => {
  useWriterSelectionTemplateStore.setState({
    useDefaults: false,
    templateOverrides: {},
    rewriteToneProfiles: {},
    ...partial,
  })
}

describe('writerSelectionTemplateStore', () => {
  beforeEach(() => {
    localStorage.clear()
    resetStore({})
  })

  it('builds Ask AI prompt as draft (no auto-send)', () => {
    const { buildSelectionPrompt } = useWriterSelectionTemplateStore.getState()
    const { text, autoSend } = buildSelectionPrompt('ask-ai', 'Hi')
    expect(autoSend).toBe(false)
    expect(text).toContain('Context:\nHi')
    expect(text).toContain('\n\nInstruction:\n')
  })

  it('injects rewrite tone directive when requested', () => {
    const { buildSelectionPrompt } = useWriterSelectionTemplateStore.getState()
    const { text } = buildSelectionPrompt('rewrite', 'Hello', { rewriteTone: 'bullet' })
    expect(text).toContain('Context:\nHello')
    expect(text).toContain('Instruction:\n')
    expect(text).toContain('Tone: Bullet points')
    expect(text).toContain('Examples:')
  })

  it('injects translate target language (defaults to English)', () => {
    const { buildSelectionPrompt } = useWriterSelectionTemplateStore.getState()

    const { text: defaultText } = buildSelectionPrompt('translate', 'Hello')
    expect(defaultText).toContain('Target language: English')

    const { text: customText } = buildSelectionPrompt('translate', 'Hello', { translateTargetLanguage: '中文' })
    expect(customText).toContain('Target language: 中文')
  })

  it('uses overrides when defaults are off and ignores them when defaults are on', () => {
    const { setTemplateInstruction, setUseDefaults, getEffectiveTemplate } = useWriterSelectionTemplateStore.getState()
    setTemplateInstruction('writer-explain', 'OVERRIDE')
    expect(getEffectiveTemplate('writer-explain').instruction).toBe('OVERRIDE')
    setUseDefaults(true)
    expect(getEffectiveTemplate('writer-explain').instruction).not.toBe('OVERRIDE')
  })

  it('ignores rewrite tone overrides when defaults are on', () => {
    const { setRewriteToneProfile, setUseDefaults, buildSelectionPrompt } = useWriterSelectionTemplateStore.getState()
    setRewriteToneProfile('formal', { directive: 'Tone: Very Formal' })
    expect(buildSelectionPrompt('rewrite', 'Hello', { rewriteTone: 'formal' }).text).toContain('Tone: Very Formal')
    setUseDefaults(true)
    expect(buildSelectionPrompt('rewrite', 'Hello', { rewriteTone: 'formal' }).text).not.toContain('Tone: Very Formal')
  })

  it('includes tone description and examples in rewrite prompt', () => {
    const { setRewriteToneProfile, buildSelectionPrompt } = useWriterSelectionTemplateStore.getState()
    setRewriteToneProfile('formal', { description: 'DESC', examples: ['EX1'] })
    const { text } = buildSelectionPrompt('rewrite', 'Hello', { rewriteTone: 'formal' })
    expect(text).toContain('Description: DESC')
    expect(text).toContain('Examples:')
    expect(text).toContain('- EX1')
  })

  it('supports reset and reset all', () => {
    const { setTemplateInstruction, getEffectiveTemplate, resetTemplate, resetAllTemplates } =
      useWriterSelectionTemplateStore.getState()
    const before = getEffectiveTemplate('writer-explain').instruction
    setTemplateInstruction('writer-explain', 'OVERRIDE')
    expect(getEffectiveTemplate('writer-explain').instruction).toBe('OVERRIDE')
    resetTemplate('writer-explain')
    expect(getEffectiveTemplate('writer-explain').instruction).toBe(before)
    setTemplateInstruction('writer-explain', 'OVERRIDE2')
    resetAllTemplates()
    expect(getEffectiveTemplate('writer-explain').instruction).toBe(before)
  })
})
