import { useState } from 'react'
import { pickHighlightAtPoint } from '../services/highlightHitTest'
import { type Highlight, type HighlightColor } from '../types'

export type ReaderAction = 'summarize' | 'explain' | 'chat' | 'questions'

type PopoverState = {
  id: string
  x: number
  y: number
}

type Args = {
  activeId?: string
  highlights: Highlight[]
  highlightsForPage: (page: number) => Highlight[]
  container: React.RefObject<HTMLDivElement | null>
  onAction: (action: ReaderAction, text: string) => void
  removeHighlight: (id: string, bookId: string) => Promise<void>
  setHighlightColor: (id: string, bookId: string, color: HighlightColor) => Promise<void>
  setHighlightNote: (id: string, bookId: string, note: string | null) => Promise<void>
}

export const useHighlightPopover = ({
  activeId,
  highlights,
  highlightsForPage,
  container,
  onAction,
  removeHighlight,
  setHighlightColor,
  setHighlightNote,
}: Args) => {
  const [popover, setPopover] = useState<PopoverState | null>(null)

  const selectedHighlight = popover?.id
    ? highlights.find((h) => h.id === popover.id)
    : undefined

  const handleHit = (pageNumber: number, x: number, y: number, clientX: number, clientY: number) => {
    if (!activeId) return
    const hit = pickHighlightAtPoint(highlightsForPage(pageNumber), x, y)
    if (!hit) {
      setPopover(null)
      return
    }
    const hostRect = container.current?.getBoundingClientRect()
    if (!hostRect) return
    setPopover({
      id: hit.id,
      x: clientX - hostRect.left + 8,
      y: clientY - hostRect.top + 8,
    })
  }

  const close = () => setPopover(null)

  const askAi = () => {
    if (!selectedHighlight) return
    onAction('chat', selectedHighlight.content)
    close()
  }

  const summarize = () => {
    if (!selectedHighlight) return
    onAction('summarize', selectedHighlight.content)
    close()
  }

  const explain = () => {
    if (!selectedHighlight) return
    onAction('explain', selectedHighlight.content)
    close()
  }

  const generateQuestions = () => {
    if (!selectedHighlight) return
    onAction('questions', selectedHighlight.content)
    close()
  }

  const setColor = (color: HighlightColor) => {
    if (!selectedHighlight || !activeId) return Promise.resolve()
    return setHighlightColor(selectedHighlight.id, activeId, color)
  }

  const setNote = (note: string | null) => {
    if (!selectedHighlight || !activeId) return Promise.resolve()
    return setHighlightNote(selectedHighlight.id, activeId, note)
  }

  const remove = () => {
    if (!selectedHighlight || !activeId) return Promise.resolve()
    return removeHighlight(selectedHighlight.id, activeId).then(close)
  }

  return {
    popover,
    selectedHighlight,
    handleHit,
    close,
    askAi,
    summarize,
    explain,
    generateQuestions,
    setColor,
    setNote,
    remove,
  }
}
