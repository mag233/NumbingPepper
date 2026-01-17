import { describe, expect, it } from 'vitest'
import { __test__ } from './responsesClient'

describe('responsesClient', () => {
  it('builds responses input items', () => {
    const items = __test__.buildResponsesInput([{ role: 'user', content: 'Hello' }])
    expect(items).toEqual([{ role: 'user', content: 'Hello' }])
  })

  it('extracts output_text when present', () => {
    const text = __test__.extractResponsesText({ output_text: 'ok' })
    expect(text).toBe('ok')
  })

  it('extracts output content when output_text missing', () => {
    const text = __test__.extractResponsesText({
      output: [{ content: [{ type: 'output_text', text: 'A' }] }],
    })
    expect(text).toBe('A')
  })
})
