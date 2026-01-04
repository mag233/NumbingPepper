import { posToDOMRect } from '@tiptap/react'
import type { Editor as TipTapEditor } from '@tiptap/core'
import { createPortal } from 'react-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import useWriterSelectionTemplateStore, {
  type WriterRewriteTone,
  type WriterSelectionAction,
} from '../../../stores/writerSelectionTemplateStore'
import WriterSelectionBubbleMenuView from './WriterSelectionBubbleMenuView'
import useFlomoComposerStore from '../../integrations/flomo/flomoComposerStore'
import useWriterProjectStore from '../stores/writerProjectStore'
import useWriterContextStore from '../stores/writerContextStore'
import { defaultProjectTag } from '../../integrations/flomo/flomoNoteBuilder'

type Props = {
  editor: TipTapEditor
  disabled?: boolean
  onQuickPrompt: (prompt: { text: string; autoSend: boolean; meta?: unknown }) => void
}

type Rect = { left: number; top: number; width: number; height: number; bottom: number }
type Anchor = { x: number; y: number; source: 'pointer' | 'selection' }

const getSelectedText = (editor: TipTapEditor) => {
  const { from, to } = editor.state.selection
  if (from === to) return ''
  return editor.state.doc.textBetween(from, to, '\n').trim()
}

const selectionAnchorForKey = (editor: TipTapEditor) => {
  const { from, to } = editor.state.selection
  const next = posToDOMRect(editor.view, from, to)
  return { x: next.left + next.width / 2, y: next.top, source: 'selection' } as const
}

const closeEnough = (a: number, b: number, threshold = 8) => Math.abs(a - b) < threshold

const WriterSelectionBubbleMenu = ({ editor, disabled, onQuickPrompt }: Props) => {
  const buildSelectionPrompt = useWriterSelectionTemplateStore((s) => s.buildSelectionPrompt)
  const openFlomoComposer = useFlomoComposerStore((s) => s.open)
  const contextText = useWriterContextStore((s) => s.contextText)
  const projectId = useWriterProjectStore((s) => s.activeProjectId)
  const projectTitle = useWriterProjectStore((s) => s.projects.find((p) => p.id === s.activeProjectId)?.title ?? 'Untitled')

  const [rewriteOpen, setRewriteOpen] = useState(false)
  const [rect, setRect] = useState<Rect | null>(null)
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)

  const isVisible = useMemo(() => {
    if (disabled) return false
    const text = getSelectedText(editor)
    return text.length > 0 && rect !== null && anchor !== null
  }, [anchor, disabled, editor, rect])

  useEffect(() => {
    if (disabled) return

    const computeRect = () => {
      const text = getSelectedText(editor)
      if (!text) {
        setRect(null)
        setAnchor(null)
        setRewriteOpen(false)
        return
      }
      const { from, to } = editor.state.selection
      const next = posToDOMRect(editor.view, from, to)
      const nextRect: Rect = { left: next.left, top: next.top, width: next.width, height: next.height, bottom: next.bottom }
      setRect((prev) => {
        if (!prev) return nextRect
        if (closeEnough(prev.left, nextRect.left) && closeEnough(prev.top, nextRect.top)) return prev
        return nextRect
      })
    }

    const scheduleCompute = () => {
      if (rafRef.current !== null) return
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null
        computeRect()
      })
    }

    const hide = () => {
      setRect(null)
      setAnchor(null)
      setRewriteOpen(false)
    }

    queueMicrotask(scheduleCompute)
    editor.on('focus', scheduleCompute)
    editor.on('blur', hide)
    const onSelectionUpdate = () => {
      const text = getSelectedText(editor)
      if (!text) {
        hide()
        return
      }
      scheduleCompute()
    }
    editor.on('selectionUpdate', onSelectionUpdate)
    window.addEventListener('scroll', scheduleCompute, true)
    window.addEventListener('resize', scheduleCompute)

    const dom = editor.view.dom
    const onMouseUp = (event: MouseEvent) => {
      setAnchor((prev) => {
        const next = { x: event.clientX, y: event.clientY, source: 'pointer' as const }
        if (!prev) return next
        if (prev.source === next.source && closeEnough(prev.x, next.x) && closeEnough(prev.y, next.y)) return prev
        return next
      })
      scheduleCompute()
    }
    const onTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches.item(0)
      if (touch) {
        setAnchor((prev) => {
          const next = { x: touch.clientX, y: touch.clientY, source: 'pointer' as const }
          if (!prev) return next
          if (prev.source === next.source && closeEnough(prev.x, next.x) && closeEnough(prev.y, next.y)) return prev
          return next
        })
      }
      scheduleCompute()
    }
    const onKeyUp = () => {
      const { from, to } = editor.state.selection
      if (from === to) return
      setAnchor((prev) => {
        const next = selectionAnchorForKey(editor)
        if (!prev) return next
        if (prev.source === next.source && closeEnough(prev.x, next.x) && closeEnough(prev.y, next.y)) return prev
        return next
      })
      scheduleCompute()
    }

    dom.addEventListener('mousedown', hide)
    dom.addEventListener('touchstart', hide)
    dom.addEventListener('mouseup', onMouseUp)
    dom.addEventListener('touchend', onTouchEnd)
    dom.addEventListener('keyup', onKeyUp)

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      editor.off('focus', scheduleCompute)
      editor.off('blur', hide)
      editor.off('selectionUpdate', onSelectionUpdate)
      window.removeEventListener('scroll', scheduleCompute, true)
      window.removeEventListener('resize', scheduleCompute)
      dom.removeEventListener('mousedown', hide)
      dom.removeEventListener('touchstart', hide)
      dom.removeEventListener('mouseup', onMouseUp)
      dom.removeEventListener('touchend', onTouchEnd)
      dom.removeEventListener('keyup', onKeyUp)
    }
  }, [disabled, editor])

  useEffect(() => {
    if (!isVisible || !rect || !anchor) return
    const el = menuRef.current
    if (!el) return
    const padding = 10

    const place = () => {
      const menuRect = el.getBoundingClientRect()
      const desiredX = anchor.x - menuRect.width / 2
      const desiredY = Math.min(anchor.y, rect.top) - menuRect.height - 8
      const left = Math.max(padding, Math.min(window.innerWidth - padding - menuRect.width, desiredX))
      let top = desiredY
      if (top < padding) top = rect.bottom + 8
      if (top + menuRect.height > window.innerHeight - padding) top = window.innerHeight - padding - menuRect.height
      el.style.left = `${left}px`
      el.style.top = `${top}px`
    }

    const id = window.requestAnimationFrame(place)
    const onResize = () => place()
    window.addEventListener('resize', onResize)
    return () => {
      window.cancelAnimationFrame(id)
      window.removeEventListener('resize', onResize)
    }
  }, [anchor, isVisible, rect])

  const runQuickPromptAction = (action: WriterSelectionAction, options?: { rewriteTone?: WriterRewriteTone }) => {
    const text = getSelectedText(editor)
    if (!text) return
    const { text: prompt, autoSend } = buildSelectionPrompt(action, text, options)
    const { from, to } = editor.state.selection
    onQuickPrompt({
      text: prompt,
      autoSend,
      meta: {
        type: 'writer-selection',
        action,
        selection: { from, to },
        rewriteTone: options?.rewriteTone,
      },
    })
    setRewriteOpen(false)
    editor.commands.setTextSelection(editor.state.selection.to)
    editor.commands.focus()
  }

  const exportToFlomo = () => {
    const text = getSelectedText(editor)
    if (!text) return
    openFlomoComposer({
      mode: 'writer',
      selection: text,
      context: contextText,
      projectTitle,
      tags: [defaultProjectTag(projectTitle)],
      source: projectId ? { type: 'writer-selection', projectId } : undefined,
    })
    setRewriteOpen(false)
    editor.commands.setTextSelection(editor.state.selection.to)
    editor.commands.focus()
  }

  if (!isVisible || !rect || !anchor) return null

  const node = (
    <div ref={menuRef} className="fixed z-50" style={{ left: 0, top: 0 }}>
      <WriterSelectionBubbleMenuView
        rewriteOpen={rewriteOpen}
        onToggleRewrite={() => setRewriteOpen((v) => !v)}
        onRunAction={runQuickPromptAction}
        onExportFlomo={exportToFlomo}
      />
    </div>
  )

  return createPortal(node, document.body)
}

export default WriterSelectionBubbleMenu
