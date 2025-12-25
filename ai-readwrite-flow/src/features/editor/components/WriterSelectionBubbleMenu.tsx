import { useEffect, useMemo, useRef, useState } from 'react'
import { posToDOMRect } from '@tiptap/react'
import type { Editor as TipTapEditor } from '@tiptap/core'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import useWriterSelectionTemplateStore, {
  type WriterRewriteTone,
  type WriterSelectionAction,
} from '../../../stores/writerSelectionTemplateStore'

type Props = {
  editor: TipTapEditor
  disabled?: boolean
  onQuickPrompt: (prompt: { text: string; autoSend: boolean; meta?: unknown }) => void
}

type Rect = {
  left: number
  top: number
  width: number
  height: number
  bottom: number
}

type Anchor = { x: number; y: number; source: 'pointer' | 'selection' }

const prevent = (event: { preventDefault: () => void; stopPropagation: () => void }) => {
  event.preventDefault()
  event.stopPropagation()
}

const getSelectedText = (editor: TipTapEditor) => {
  const { from, to } = editor.state.selection
  if (from === to) return ''
  return editor.state.doc.textBetween(from, to, '\n').trim()
}

const toneItems: { id: WriterRewriteTone; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'formal', label: 'Formal' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'academic', label: 'Academic' },
  { id: 'bullet', label: 'Bullet' },
]

const WriterSelectionBubbleMenu = ({ editor, disabled, onQuickPrompt }: Props) => {
  const buildSelectionPrompt = useWriterSelectionTemplateStore((s) => s.buildSelectionPrompt)
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
      const nextRect: Rect = {
        left: next.left,
        top: next.top,
        width: next.width,
        height: next.height,
        bottom: next.bottom,
      }
      setRect((prev) => {
        if (!prev) return nextRect
        const dx = Math.abs(prev.left - nextRect.left)
        const dy = Math.abs(prev.top - nextRect.top)
        if (dx < 8 && dy < 8) return prev
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

    window.addEventListener('scroll', scheduleCompute, true)
    window.addEventListener('resize', scheduleCompute)

    const dom = editor.view.dom
    const onMouseUp = (event: MouseEvent) => {
      setAnchor({ x: event.clientX, y: event.clientY, source: 'pointer' })
      scheduleCompute()
    }
    const onTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches.item(0)
      if (touch) setAnchor({ x: touch.clientX, y: touch.clientY, source: 'pointer' })
      scheduleCompute()
    }
    const onKeyUp = () => {
      const { from, to } = editor.state.selection
      if (from === to) return
      const r = rect
      if (r) {
        setAnchor({ x: r.left + r.width / 2, y: r.top, source: 'selection' })
      } else {
        const next = posToDOMRect(editor.view, from, to)
        setAnchor({ x: next.left + next.width / 2, y: next.top, source: 'selection' })
      }
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
      window.removeEventListener('scroll', scheduleCompute, true)
      window.removeEventListener('resize', scheduleCompute)
      dom.removeEventListener('mousedown', hide)
      dom.removeEventListener('touchstart', hide)
      dom.removeEventListener('mouseup', onMouseUp)
      dom.removeEventListener('touchend', onTouchEnd)
      dom.removeEventListener('keyup', onKeyUp)
    }
  }, [disabled, editor, rect])

  useEffect(() => {
    const el = menuRef.current
    if (!el) return
    if (!isVisible || !anchor) return

    const padding = 12
    const offsetY = 12

    const place = () => {
      const menuRect = el.getBoundingClientRect()

      let left = anchor.x - menuRect.width / 2
      if (left < padding) left = padding
      if (left + menuRect.width > window.innerWidth - padding) {
        left = window.innerWidth - padding - menuRect.width
      }

      let top = anchor.y - offsetY - menuRect.height
      if (top < padding) top = anchor.y + offsetY
      if (top + menuRect.height > window.innerHeight - padding) {
        top = window.innerHeight - padding - menuRect.height
      }

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
  }, [anchor, isVisible])

  const runAction = (action: WriterSelectionAction, options?: { rewriteTone?: WriterRewriteTone }) => {
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

  if (!isVisible || !rect || !anchor) return null

  const node = (
    <div ref={menuRef} className="fixed z-50" style={{ left: 0, top: 0 }}>
      <div className="relative flex items-center gap-1 rounded-xl border border-chrome-border/70 bg-surface-base/95 p-1 shadow-xl backdrop-blur">
        <button
          type="button"
          className="rounded-lg px-2 py-1 text-xs text-ink-primary hover:bg-surface-raised/60"
          onMouseDown={(e) => {
            prevent(e)
            runAction('simplify')
          }}
          onTouchStart={(e) => {
            prevent(e)
            runAction('simplify')
          }}
        >
          Simplify
        </button>
        <button
          type="button"
          className="rounded-lg px-2 py-1 text-xs text-ink-primary hover:bg-surface-raised/60"
          onMouseDown={(e) => {
            prevent(e)
            runAction('concise')
          }}
          onTouchStart={(e) => {
            prevent(e)
            runAction('concise')
          }}
        >
          Concise
        </button>

        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-ink-primary hover:bg-surface-raised/60"
          aria-haspopup="menu"
          aria-expanded={rewriteOpen}
          onMouseDown={(e) => {
            prevent(e)
            setRewriteOpen((v) => !v)
          }}
          onTouchStart={(e) => {
            prevent(e)
            setRewriteOpen((v) => !v)
          }}
        >
          Rewrite
          <ChevronDown className="size-3 text-ink-muted" />
        </button>

        <button
          type="button"
          className="rounded-lg px-2 py-1 text-xs text-ink-primary hover:bg-surface-raised/60"
          onMouseDown={(e) => {
            prevent(e)
            runAction('translate')
          }}
          onTouchStart={(e) => {
            prevent(e)
            runAction('translate')
          }}
        >
          Translate
        </button>
        <button
          type="button"
          className="rounded-lg px-2 py-1 text-xs text-ink-primary hover:bg-surface-raised/60"
          onMouseDown={(e) => {
            prevent(e)
            runAction('explain')
          }}
          onTouchStart={(e) => {
            prevent(e)
            runAction('explain')
          }}
        >
          Explain
        </button>
        <button
          type="button"
          className="rounded-lg px-2 py-1 text-xs text-ink-primary hover:bg-surface-raised/60"
          onMouseDown={(e) => {
            prevent(e)
            runAction('ask-ai')
          }}
          onTouchStart={(e) => {
            prevent(e)
            runAction('ask-ai')
          }}
        >
          Ask AI
        </button>

        {rewriteOpen && (
          <div
            role="menu"
            className="absolute left-0 top-full mt-1 w-44 rounded-xl border border-chrome-border/70 bg-surface-base/95 p-1 shadow-xl"
          >
            {toneItems.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                className="w-full rounded-lg px-2 py-2 text-left text-xs text-ink-primary hover:bg-surface-raised/60"
                onMouseDown={(e) => {
                  prevent(e)
                  runAction('rewrite', { rewriteTone: item.id })
                }}
                onTouchStart={(e) => {
                  prevent(e)
                  runAction('rewrite', { rewriteTone: item.id })
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(node, document.body)
}

export default WriterSelectionBubbleMenu
