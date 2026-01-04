import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import type { Editor as TipTapEditor } from '@tiptap/core'
import { useWriterInsertFlash } from './useWriterInsertFlash'

type UpdateHandler = () => void

const createFakeEditor = () => {
  const handlers = new Set<UpdateHandler>()
  const setWriterInsertFlash = vi.fn()
  const clearWriterInsertFlash = vi.fn()

  const editor = {
    on: (event: string, handler: UpdateHandler) => {
      if (event !== 'update') return
      handlers.add(handler)
    },
    off: (event: string, handler: UpdateHandler) => {
      if (event !== 'update') return
      handlers.delete(handler)
    },
    commands: {
      setWriterInsertFlash,
      clearWriterInsertFlash,
    },
    __emitUpdate: () => {
      for (const handler of handlers) handler()
    },
  }

  return editor as unknown as TipTapEditor & {
    __emitUpdate: () => void
    commands: { setWriterInsertFlash: typeof setWriterInsertFlash; clearWriterInsertFlash: typeof clearWriterInsertFlash }
  }
}

describe('useWriterInsertFlash', () => {
  it('clears on next editor update', async () => {
    const editor = createFakeEditor()
    let flash!: (range: { from: number; to: number } | null) => void

    const App = () => {
      const api = useWriterInsertFlash({ editor })
      useEffect(() => {
        flash = api.flash
      }, [api.flash])
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

    flash({ from: 1, to: 2 })
    expect(editor.commands.setWriterInsertFlash).toHaveBeenCalledTimes(1)

    editor.__emitUpdate()
    expect(editor.commands.clearWriterInsertFlash).toHaveBeenCalledTimes(1)

    root.unmount()
    host.remove()
  })

  it('clears after timeout', async () => {
    vi.useFakeTimers()
    const editor = createFakeEditor()
    let flash!: (range: { from: number; to: number } | null) => void

    const App = () => {
      const api = useWriterInsertFlash({ editor, timeoutMs: 7000 })
      useEffect(() => {
        flash = api.flash
      }, [api.flash])
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

    flash({ from: 1, to: 2 })
    await vi.advanceTimersByTimeAsync(7000)
    expect(editor.commands.clearWriterInsertFlash).toHaveBeenCalledTimes(1)

    root.unmount()
    host.remove()
    vi.useRealTimers()
  })
})

