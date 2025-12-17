import { describe, expect, it } from 'vitest'
import useWriterContextStore from './writerContextStore'

const reset = () => {
  useWriterContextStore.setState({
    status: 'idle',
    error: null,
    projectId: null,
    contextText: '',
    lastAppendUndo: null,
  })
}

describe('writerContextStore', () => {
  it('appends with separators and supports undo', async () => {
    reset()
    await useWriterContextStore.getState().hydrate('p1')
    useWriterContextStore.getState().setContextText('A')
    useWriterContextStore.getState().appendToContext('B')
    expect(useWriterContextStore.getState().contextText).toBe('A\n\nB')
    useWriterContextStore.getState().undoLastAppend()
    expect(useWriterContextStore.getState().contextText).toBe('A')
  })
})

