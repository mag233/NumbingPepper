import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import type { JSONContent } from '@tiptap/core'
import type { Editor } from '@tiptap/react'
import { useDraftPersistence } from './useDraftPersistence'

const mockSaveDraft = vi.fn<(...args: unknown[]) => Promise<boolean>>()
const mockLoadDraft = vi.fn<(...args: unknown[]) => Promise<unknown>>()
const mockUpsertWritingContent = vi.fn<(...args: unknown[]) => Promise<boolean>>()
const mockLoadWritingContent = vi.fn<(...args: unknown[]) => Promise<unknown>>()

vi.mock('../services/draftRepo', () => ({
  loadDraft: (...args: unknown[]) => mockLoadDraft(...args),
  saveDraft: (...args: unknown[]) => mockSaveDraft(...args),
}))

vi.mock('../services/writingRepo', () => ({
  loadWritingContent: (...args: unknown[]) => mockLoadWritingContent(...args),
  upsertWritingContent: (...args: unknown[]) => mockUpsertWritingContent(...args),
}))

type UpdateHandler = () => void

const createFakeEditor = () => {
  const handlers = new Set<UpdateHandler>()
  const state: {
    isDestroyed: boolean
    doc: JSONContent
    text: string
  } = { isDestroyed: false, doc: { type: 'doc', content: [{ type: 'paragraph' }] }, text: '' }

  const setContent = vi.fn()

  const editor = {
    get isDestroyed() {
      return state.isDestroyed
    },
    getJSON: () => state.doc,
    getText: () => state.text,
    on: (event: string, handler: UpdateHandler) => {
      if (event !== 'update') return
      handlers.add(handler)
    },
    off: (event: string, handler: UpdateHandler) => {
      if (event !== 'update') return
      handlers.delete(handler)
    },
    commands: {
      setContent,
    },
    __emitUpdate: () => {
      for (const handler of handlers) handler()
    },
    __setText: (text: string) => {
      state.text = text
      state.doc = {
        type: 'doc',
        content: [{ type: 'paragraph', content: text ? [{ type: 'text', text }] : [] }],
      }
    },
    __destroy: () => {
      state.isDestroyed = true
      state.text = ''
      state.doc = { type: 'doc', content: [{ type: 'paragraph' }] }
    },
  }

  return editor as unknown as Editor & {
    __emitUpdate: () => void
    __setText: (text: string) => void
    __destroy: () => void
    commands: { setContent: typeof setContent }
  }
}

describe('useDraftPersistence', () => {
  const resetMocks = () => {
    mockSaveDraft.mockReset()
    mockLoadDraft.mockReset()
    mockUpsertWritingContent.mockReset()
    mockLoadWritingContent.mockReset()
  }

  const flushMicrotasks = async () => {
    await Promise.resolve()
    await Promise.resolve()
  }

  it('does not save during initial hydration (prevents empty overwrite on mount)', async () => {
    resetMocks()
    vi.useFakeTimers()

    let resolveDraft!: (value: unknown) => void
    mockLoadDraft.mockImplementationOnce(
      () =>
        new Promise<unknown>((resolve) => {
          resolveDraft = resolve
        }),
    )
    mockLoadWritingContent.mockResolvedValueOnce(null)
    mockSaveDraft.mockResolvedValue(true)
    mockUpsertWritingContent.mockResolvedValue(true)

    const editor = createFakeEditor()

    const App = () => {
      useDraftPersistence({ editor, draftId: 'project:test' })
      return null
    }

    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    await new Promise<void>((resolve) => {
      const Wrapper = () => {
        useEffect(() => resolve(), [])
        return <App />
      }
      root.render(<Wrapper />)
    })
    await flushMicrotasks()

    editor.__emitUpdate()
    await vi.advanceTimersByTimeAsync(600)
    expect(mockSaveDraft).toHaveBeenCalledTimes(0)

    resolveDraft({
      id: 'project:test',
      editorDoc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hello' }] }] },
      updatedAt: Date.now(),
    })
    await flushMicrotasks()

    editor.__setText('hello again')
    editor.__emitUpdate()
    await vi.advanceTimersByTimeAsync(600)
    expect(mockSaveDraft).toHaveBeenCalledTimes(1)

    root.unmount()
    host.remove()
    vi.useRealTimers()
  })

  it('does not overwrite content with empty doc on editor teardown', async () => {
    resetMocks()
    vi.useFakeTimers()
    mockLoadDraft.mockResolvedValueOnce(null)
    mockLoadWritingContent.mockResolvedValueOnce(null)
    mockSaveDraft.mockResolvedValue(true)
    mockUpsertWritingContent.mockResolvedValue(true)

    const editor = createFakeEditor()

    const App = () => {
      useDraftPersistence({ editor, draftId: 'project:test' })
      return null
    }

    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)

    await new Promise<void>((resolve) => {
      const Wrapper = () => {
        useEffect(() => resolve(), [])
        return <App />
      }
      root.render(<Wrapper />)
    })
    await flushMicrotasks()

    editor.__setText('hello')
    editor.__emitUpdate()
    await vi.advanceTimersByTimeAsync(600)

    expect(mockSaveDraft).toHaveBeenCalledTimes(1)

    editor.__destroy()
    editor.__emitUpdate()

    window.dispatchEvent(new Event('beforeunload'))
    await vi.advanceTimersByTimeAsync(600)

    expect(mockSaveDraft).toHaveBeenCalledTimes(1)
    root.unmount()
    host.remove()
    vi.useRealTimers()
  })

  it('saves user edits made before hydration resolves (prevents loss on slow load)', async () => {
    resetMocks()
    vi.useFakeTimers()

    let resolveDraft!: (value: unknown) => void
    mockLoadDraft.mockImplementationOnce(
      () =>
        new Promise<unknown>((resolve) => {
          resolveDraft = resolve
        }),
    )
    mockLoadWritingContent.mockResolvedValueOnce(null)
    mockSaveDraft.mockResolvedValue(true)
    mockUpsertWritingContent.mockResolvedValue(true)

    const editor = createFakeEditor()

    const App = () => {
      useDraftPersistence({ editor, draftId: 'project:test' })
      return null
    }

    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    await new Promise<void>((resolve) => {
      const Wrapper = () => {
        useEffect(() => resolve(), [])
        return <App />
      }
      root.render(<Wrapper />)
    })
    await flushMicrotasks()

    editor.__setText('typed before hydration')
    editor.__emitUpdate()
    await vi.advanceTimersByTimeAsync(600)

    expect(mockSaveDraft).toHaveBeenCalledTimes(1)
    expect(editor.commands.setContent).toHaveBeenCalledTimes(0)

    resolveDraft({
      id: 'project:test',
      editorDoc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'disk' }] }] },
      updatedAt: Date.now(),
    })
    await flushMicrotasks()

    expect(editor.commands.setContent).toHaveBeenCalledTimes(0)

    root.unmount()
    host.remove()
    vi.useRealTimers()
  })
})
