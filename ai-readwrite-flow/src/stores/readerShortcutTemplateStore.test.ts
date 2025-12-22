import { beforeEach, describe, expect, it } from 'vitest'
import useReaderShortcutTemplateStore from './readerShortcutTemplateStore'

type State = ReturnType<typeof useReaderShortcutTemplateStore.getState>

const resetStore = (partial: Partial<State>) => {
  useReaderShortcutTemplateStore.setState({
    useDefaults: false,
    overrides: {},
    ...partial,
  })
}

describe('readerShortcutTemplateStore', () => {
  beforeEach(() => {
    localStorage.clear()
    resetStore({})
  })

  it('builds Questions quick prompt as context+instruction and auto-sends', () => {
    const { buildQuickPrompt } = useReaderShortcutTemplateStore.getState()
    const { text, autoSend } = buildQuickPrompt('questions', '  Hello world  ')
    expect(autoSend).toBe(true)
    expect(text).toContain('Context:\nHello world')
    expect(text).toContain('\n\nInstruction:\n')
    expect(text).toContain('3–5')
    expect(text).toContain('Q:')
    expect(text).toContain('A:')
  })

  it('builds Ask AI quick prompt as draft (no auto-send)', () => {
    const { buildQuickPrompt } = useReaderShortcutTemplateStore.getState()
    const { text, autoSend } = buildQuickPrompt('chat', 'Hi')
    expect(autoSend).toBe(false)
    expect(text).toContain('Context:\nHi')
    expect(text).toContain('\n\nInstruction:\n')
  })

  it('uses overrides when defaults are off and ignores them when defaults are on', () => {
    const { setInstruction, setUseDefaults, getEffectiveTemplate } = useReaderShortcutTemplateStore.getState()
    setInstruction('reader-questions', 'OVERRIDE')
    expect(getEffectiveTemplate('reader-questions').instruction).toBe('OVERRIDE')
    setUseDefaults(true)
    expect(getEffectiveTemplate('reader-questions').instruction).not.toBe('OVERRIDE')
  })
})

