import { useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { loadDraft, saveDraft } from '../services/draftRepo'

type Args = {
  editor: Editor | null
  draftId: string
}

const DEBOUNCE_MS = 500

export const useDraftPersistence = ({ editor, draftId }: Args) => {
  const timerRef = useRef<number | null>(null)
  const loadingRef = useRef(false)

  useEffect(() => {
    if (!editor) return
    if (!draftId) return
    if (loadingRef.current) return

    loadingRef.current = true
    void (async () => {
      const draft = await loadDraft(draftId)
      if (!draft) return
      editor.commands.setContent(draft.editorDoc, { emitUpdate: false })
    })().finally(() => {
      loadingRef.current = false
    })
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
