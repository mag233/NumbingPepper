import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { loadDraft, saveDraft } from '../services/draftRepo'
import type { JSONContent } from '@tiptap/core'
import { loadWritingContent, upsertWritingContent } from '../services/writingRepo'
import { markdownSourceToTipTapDoc, tipTapDocToMarkdownSource } from '../services/tiptapMarkdown'

type Args = {
  editor: Editor | null
  draftId: string
}

export type DraftSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type Result = {
  status: DraftSaveStatus
  lastSavedAt: number | null
  flushNow: () => Promise<boolean>
}

const DEBOUNCE_MS = 500
const EMPTY_DOC: JSONContent = { type: 'doc', content: [{ type: 'paragraph' }] }

type EditorSnapshot = {
  doc: JSONContent
  text: string
}

const hasAnyTextNode = (doc: JSONContent): boolean => {
  const stack: unknown[] = [doc]
  while (stack.length) {
    const value = stack.pop()
    if (!value || typeof value !== 'object') continue
    const rec = value as Record<string, unknown>
    if (typeof rec.text === 'string' && rec.text.trim().length) return true
    const children = rec.content
    if (Array.isArray(children)) stack.push(...children)
  }
  return false
}

const isEditorDestroyed = (editor: Editor): boolean => {
  const rec = editor as unknown as Record<string, unknown>
  return rec.isDestroyed === true
}

const snapshotFromEditor = (editor: Editor): EditorSnapshot => ({ doc: editor.getJSON(), text: editor.getText() })

const projectIdFromDraftId = (draftId: string): string | null => {
  const trimmed = draftId.trim()
  if (!trimmed.startsWith('project:')) return null
  const projectId = trimmed.slice('project:'.length)
  return projectId.length ? projectId : null
}

export const useDraftPersistence = ({ editor, draftId }: Args) => {
  const timerRef = useRef<number | null>(null)
  const loadSeqRef = useRef(0)
  const dirtyRef = useRef(false)
  const lastSnapshotRef = useRef<EditorSnapshot | null>(null)
  const isHydratingRef = useRef(false)
  const [status, setStatus] = useState<DraftSaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)

  const projectId = useMemo(() => projectIdFromDraftId(draftId), [draftId])

  const performSave = useCallback(
    async (updatedAt: number, snapshot: EditorSnapshot | null): Promise<boolean> => {
      if (!snapshot) return false
      setStatus('saving')

      const rawDoc = snapshot.doc
      const plainText = snapshot.text.trim()
      let contentText = tipTapDocToMarkdownSource(rawDoc)
      if (!contentText && plainText) contentText = plainText

      const editorDoc = contentText && !hasAnyTextNode(rawDoc) ? markdownSourceToTipTapDoc(contentText) : rawDoc

      const results: boolean[] = []
      results.push(await saveDraft({ id: draftId, editorDoc, updatedAt }))
      if (projectId) results.push(await upsertWritingContent(projectId, contentText, updatedAt))

      const ok = results.every(Boolean)
      setStatus(ok ? 'saved' : 'error')
      if (ok) setLastSavedAt(updatedAt)
      return ok
    },
    [draftId, projectId],
  )

  useEffect(() => {
    if (!editor) return
    if (!draftId) return
    loadSeqRef.current += 1
    const seq = loadSeqRef.current
    isHydratingRef.current = true
    void (async () => {
      try {
        const draft = await loadDraft(draftId)
        if (seq !== loadSeqRef.current) return
        const projectId = projectIdFromDraftId(draftId)
        const content = projectId ? await loadWritingContent(projectId) : null
        if (seq !== loadSeqRef.current) return

        const draftUpdatedAt = draft?.updatedAt ?? -1
        const contentUpdatedAt = content?.updatedAt ?? -1

        if (draft?.editorDoc && draftUpdatedAt >= contentUpdatedAt) {
          editor.commands.setContent(draft.editorDoc ?? EMPTY_DOC, { emitUpdate: false })
          lastSnapshotRef.current = snapshotFromEditor(editor)
          setLastSavedAt(draftUpdatedAt >= 0 ? draftUpdatedAt : null)
          setStatus('idle')
          return
        }

        if (content?.contentText) {
          editor.commands.setContent(markdownSourceToTipTapDoc(content.contentText), { emitUpdate: false })
          lastSnapshotRef.current = snapshotFromEditor(editor)
          setLastSavedAt(contentUpdatedAt >= 0 ? contentUpdatedAt : null)
          setStatus('idle')
          return
        }

        editor.commands.setContent(EMPTY_DOC, { emitUpdate: false })
        lastSnapshotRef.current = snapshotFromEditor(editor)
        setStatus('idle')
      } finally {
        if (seq === loadSeqRef.current) isHydratingRef.current = false
      }
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
      const updatedAt = Date.now()
      dirtyRef.current = false
      const snapshot = lastSnapshotRef.current ?? (isEditorDestroyed(editor) ? null : snapshotFromEditor(editor))
      void performSave(updatedAt, snapshot)
    }

    const scheduleSave = () => {
      if (isHydratingRef.current) {
        const snapshot = isEditorDestroyed(editor) ? null : snapshotFromEditor(editor)
        if (!snapshot || snapshot.text.trim().length === 0) return
        loadSeqRef.current += 1
        isHydratingRef.current = false
        lastSnapshotRef.current = snapshot
      }
      if (isEditorDestroyed(editor)) return
      lastSnapshotRef.current = snapshotFromEditor(editor)
      dirtyRef.current = true
      clearTimer()
      timerRef.current = window.setTimeout(() => {
        const updatedAt = Date.now()
        timerRef.current = null
        dirtyRef.current = false
        void performSave(updatedAt, lastSnapshotRef.current)
      }, DEBOUNCE_MS)
    }

    const flushIfDirty = () => {
      if (isHydratingRef.current) return
      if (!dirtyRef.current && timerRef.current === null) return
      clearTimer()
      flushSave()
    }

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') return
      flushIfDirty()
    }

    editor.on('update', scheduleSave)
    window.addEventListener('pagehide', flushIfDirty)
    window.addEventListener('beforeunload', flushIfDirty)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      editor.off('update', scheduleSave)
      window.removeEventListener('pagehide', flushIfDirty)
      window.removeEventListener('beforeunload', flushIfDirty)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      flushIfDirty()
    }
  }, [draftId, editor, performSave])

  const flushNow = useCallback(async (): Promise<boolean> => {
    if (!editor) return false
    if (!draftId) return false
    if (isHydratingRef.current) return false
    const updatedAt = Date.now()
    dirtyRef.current = false
    if (isEditorDestroyed(editor)) return performSave(updatedAt, lastSnapshotRef.current)
    return performSave(updatedAt, lastSnapshotRef.current ?? snapshotFromEditor(editor))
  }, [draftId, editor, performSave])

  return { status, lastSavedAt, flushNow } satisfies Result
}
