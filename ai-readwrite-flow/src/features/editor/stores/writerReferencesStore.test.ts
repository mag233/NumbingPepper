import { describe, expect, it } from 'vitest'
import useWriterReferencesStore from './writerReferencesStore'

const reset = () => {
  useWriterReferencesStore.setState({
    status: 'idle',
    error: null,
    projectId: null,
    references: [],
    membership: [],
  })
}

describe('writerReferencesStore', () => {
  it('adds manual reference and toggles membership', async () => {
    reset()
    await useWriterReferencesStore.getState().hydrate('p1')
    const ok = await useWriterReferencesStore.getState().addManual({ snippetText: 'Hello' })
    expect(ok).toBe(true)
    const refId = useWriterReferencesStore.getState().references[0]?.id ?? ''
    expect(refId).toBeTruthy()
    const toggleOk = await useWriterReferencesStore.getState().toggleIncluded(refId, true)
    expect(toggleOk).toBe(true)
    expect(useWriterReferencesStore.getState().membership.find((m) => m.referenceId === refId)?.included).toBe(true)
  })
})

