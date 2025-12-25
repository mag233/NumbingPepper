import { beforeEach, describe, expect, it } from 'vitest'
import useWriterSelectionTemplateStore from './writerSelectionTemplateStore'

type State = ReturnType<typeof useWriterSelectionTemplateStore.getState>

const resetStore = (partial: Partial<State>) => {
  useWriterSelectionTemplateStore.setState({
    useDefaults: false,
    overrides: {},
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
  })

  it('injects translate target language (defaults to English)', () => {
    const { buildSelectionPrompt } = useWriterSelectionTemplateStore.getState()

    const { text: defaultText } = buildSelectionPrompt('translate', 'Hello')
    expect(defaultText).toContain('Target language: English')

    const { text: customText } = buildSelectionPrompt('translate', 'Hello', { translateTargetLanguage: '中文' })
    expect(customText).toContain('Target language: 中文')
  })

  it('uses overrides when defaults are off and ignores them when defaults are on', () => {
    const { setInstruction, setUseDefaults, getEffectiveTemplate } = useWriterSelectionTemplateStore.getState()
    setInstruction('writer-explain', 'OVERRIDE')
    expect(getEffectiveTemplate('writer-explain').instruction).toBe('OVERRIDE')
    setUseDefaults(true)
    expect(getEffectiveTemplate('writer-explain').instruction).not.toBe('OVERRIDE')
  })
})

