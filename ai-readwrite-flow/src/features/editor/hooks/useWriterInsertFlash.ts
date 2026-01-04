import { useCallback, useEffect, useRef, type MutableRefObject } from 'react'
import type { Editor as TipTapEditor } from '@tiptap/core'
import type { WriterInsertFlashRange } from '../extensions/writerInsertFlashExtension'

type Args = {
  editor: TipTapEditor | null
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 7000

const clearTimer = (timerRef: MutableRefObject<number | null>) => {
  if (timerRef.current === null) return
  window.clearTimeout(timerRef.current)
  timerRef.current = null
}

export const useWriterInsertFlash = ({ editor, timeoutMs = DEFAULT_TIMEOUT_MS }: Args) => {
  const timerRef = useRef<number | null>(null)
  const activeRef = useRef(false)

  const clear = useCallback(() => {
    if (!editor) return
    clearTimer(timerRef)
    activeRef.current = false
    editor.commands.clearWriterInsertFlash()
  }, [editor])

  const flash = useCallback(
    (range: WriterInsertFlashRange | null) => {
      if (!editor) return
      if (!range) return
      clearTimer(timerRef)
      activeRef.current = true
      editor.commands.setWriterInsertFlash(range)
      timerRef.current = window.setTimeout(() => clear(), timeoutMs)
    },
    [clear, editor, timeoutMs],
  )

  useEffect(() => {
    if (!editor) return
    const onUpdate = () => {
      if (!activeRef.current) return
      clear()
    }
    editor.on('update', onUpdate)
    return () => {
      editor.off('update', onUpdate)
      clear()
    }
  }, [clear, editor])

  return { flash, clear }
}
