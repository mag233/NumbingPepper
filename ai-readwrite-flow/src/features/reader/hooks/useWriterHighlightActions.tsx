import { useCallback, useEffect, useMemo } from 'react'
import useWriterProjectStore from '../../editor/stores/writerProjectStore'
import { appendContextText, buildReferenceFromHighlight } from '../../editor/services/writerIntegration'
import {
  loadWritingContext,
  setWritingReferenceIncluded,
  upsertWritingContext,
  upsertWritingReference,
} from '../../editor/services/writingRepo'
import { generateReferenceId } from '../../editor/services/writingReferenceIds'
import useWriterToastStore from '../../editor/stores/writerToastStore'
import type { Highlight } from '../types'

type Args = {
  highlight: Highlight | undefined
  onClosePopover: () => void
}

export const useWriterHighlightActions = ({ highlight, onClosePopover }: Args) => {
  const activeProjectId = useWriterProjectStore((s) => s.activeProjectId)
  const hydrateWriterProjects = useWriterProjectStore((s) => s.hydrate)
  const toast = useWriterToastStore((s) => s.toast)
  const pending = useWriterToastStore((s) => s.pending)
  const showToast = useWriterToastStore((s) => s.show)
  const requestProject = useWriterToastStore((s) => s.requestProject)
  const clearToast = useWriterToastStore((s) => s.clear)
  const cancelPending = useWriterToastStore((s) => s.cancelPending)
  const confirmCreate = useWriterToastStore((s) => s.confirmCreate)

  useEffect(() => { void hydrateWriterProjects() }, [hydrateWriterProjects])

  const canWrite = useMemo(() => Boolean(activeProjectId), [activeProjectId])

  const doAddToContext = useCallback(async (projectId: string) => {
    if (!highlight) return
    const current = await loadWritingContext(projectId)
    const prev = current?.contextText ?? ''
    const next = appendContextText(prev, highlight.content)
    const ok = await upsertWritingContext({ projectId, contextText: next, updatedAt: Date.now() })
    if (!ok) {
      showToast('Failed to add to Context.')
      return
    }
    showToast('Added to Context', () => { void upsertWritingContext({ projectId, contextText: prev, updatedAt: Date.now() }) })
    onClosePopover()
  }, [highlight, onClosePopover, showToast])

  const doAddReference = useCallback(async (projectId: string) => {
    if (!highlight) return
    const now = Date.now()
    const referenceId = generateReferenceId()
    const ref = buildReferenceFromHighlight({ projectId, highlight, now, referenceId })
    const ok = await upsertWritingReference(ref)
    if (!ok) {
      showToast('Failed to add Reference.')
      return
    }
    await setWritingReferenceIncluded(projectId, referenceId, false, now)
    showToast('Added as Reference')
    onClosePopover()
  }, [highlight, onClosePopover, showToast])

  const addToWritingContext = useCallback(async () => {
    const projectId = useWriterProjectStore.getState().activeProjectId
    if (!projectId) {
      requestProject('context', async () => {
        const createdProjectId = useWriterProjectStore.getState().activeProjectId
        if (!createdProjectId) return
        await doAddToContext(createdProjectId)
      })
      return
    }
    await doAddToContext(projectId)
  }, [doAddToContext, requestProject])

  const addAsWritingReference = useCallback(async () => {
    const projectId = useWriterProjectStore.getState().activeProjectId
    if (!projectId) {
      requestProject('reference', async () => {
        const createdProjectId = useWriterProjectStore.getState().activeProjectId
        if (!createdProjectId) return
        await doAddReference(createdProjectId)
      })
      return
    }
    await doAddReference(projectId)
  }, [doAddReference, requestProject])

  const Toast = () => {
    if (!toast) return null
    return (
      <div className="absolute right-3 top-3 z-40 flex items-center gap-2 rounded-lg border border-slate-800/80 bg-slate-950/90 px-3 py-2 text-xs text-slate-100 shadow-lg">
        <span>{toast.message}</span>
        {pending && (
          <>
            <button
              className="rounded-md border border-slate-800/80 px-2 py-1 text-[11px] text-slate-200 hover:border-sky-500 hover:text-sky-100"
              onClick={() => void confirmCreate()}
            >
              Create
            </button>
            <button
              className="rounded-md border border-slate-800/80 px-2 py-1 text-[11px] text-slate-300 hover:border-slate-700 hover:text-slate-100"
              onClick={() => {
                cancelPending()
              }}
            >
              Cancel
            </button>
          </>
        )}
        {toast.undo && (
          <button
            className="rounded-md border border-slate-800/80 px-2 py-1 text-[11px] text-slate-200 hover:border-sky-500 hover:text-sky-100"
            onClick={() => {
              toast.undo?.()
              clearToast()
            }}
          >
            Undo
          </button>
        )}
      </div>
    )
  }

  return { Toast, canWrite, addToWritingContext, addAsWritingReference }
}
