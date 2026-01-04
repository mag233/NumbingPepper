import { describe, expect, it } from 'vitest'
import { loadWriterSelectionTemplatesState, STORAGE_KEY_V2 } from './writerSelectionTemplatePersistence'

describe('writerSelectionTemplatePersistence', () => {
  it('migrates v1 templates to v2 shape', () => {
    localStorage.clear()
    localStorage.setItem(
      'ai-readwrite-flow-writer-selection-templates-v1',
      JSON.stringify({
        useDefaults: false,
        overrides: [{ id: 'writer-explain', instruction: 'OVERRIDE' }],
      }),
    )

    const state = loadWriterSelectionTemplatesState()
    expect(state.useDefaults).toBe(false)
    expect(state.templateOverrides['writer-explain']?.instruction).toBe('OVERRIDE')
    expect(localStorage.getItem(STORAGE_KEY_V2)).not.toBeNull()
  })
})

