import { useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { loadDraft, saveDraft } from '../services/draftRepo'
import type { JSONContent } from '@tiptap/core'

type Args = {
  editor: Editor | null
  draftId: string
}

const DEBOUNCE_MS = 500
const EMPTY_DOC: JSONContent = { type: 'doc', content: [{ type: 'paragraph' }] }

export const useDraftPersistence = ({ editor, draftId }: Args) => {
  const timerRef = useRef<number | null>(null)
  const loadSeqRef = useRef(0)

  useEffect(() => {
    if (!editor) return
    if (!draftId) return
    loadSeqRef.current += 1
    const seq = loadSeqRef.current
    void (async () => {
      const draft = await loadDraft(draftId)
      if (seq !== loadSeqRef.current) return
      editor.commands.setContent(draft?.editorDoc ?? EMPTY_DOC, { emitUpdate: false })
    })()
  }, [draftId, editor])

  useEffect(() => {
    if (!editor) return
    if (!draftId) return

    const clearTimer = () => {
      if (timerRef.current === null) return
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }

    const flushSave = () => {
      const doc = editor.getJSON()
      void saveDraft({ id: draftId, editorDoc: doc, updatedAt: Date.now() })
    }

    const scheduleSave = () => {
      clearTimer()
      timerRef.current = window.setTimeout(() => {
        const doc = editor.getJSON()
        void saveDraft({ id: draftId, editorDoc: doc, updatedAt: Date.now() })
      }, DEBOUNCE_MS)
    }

    editor.on('update', scheduleSave)
    return () => {
      editor.off('update', scheduleSave)
      if (timerRef.current !== null) flushSave()
      clearTimer()
    }
  }, [draftId, editor])
}
