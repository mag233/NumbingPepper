import { useEffect, useRef, useState } from 'react'
import { selectionToHighlight, type SelectionOverlayInfo } from '../services/selectionToHighlight'

type Args = {
  container: React.RefObject<HTMLDivElement | null>
}

export const useSelectionOverlay = ({ container }: Args) => {
  const [overlay, setOverlay] = useState<SelectionOverlayInfo | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const node = container.current
    if (!node) return

    const withinContainer = () => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) return false
      const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null
      const start = range?.startContainer ?? null
      if (!start) return false
      const element = start.nodeType === Node.ELEMENT_NODE ? (start as Element) : start.parentElement
      return Boolean(element && node.contains(element))
    }

    const sync = () => {
      rafRef.current = null
      if (!withinContainer()) {
        setOverlay(null)
        return
      }
      const next = selectionToHighlight()
      setOverlay(next ? { page: next.page, rects: next.rects } : null)
    }

    const schedule = () => {
      if (rafRef.current !== null) return
      rafRef.current = window.requestAnimationFrame(sync)
    }

    document.addEventListener('selectionchange', schedule)
    node.addEventListener('mouseup', schedule)
    node.addEventListener('keyup', schedule)
    return () => {
      document.removeEventListener('selectionchange', schedule)
      node.removeEventListener('mouseup', schedule)
      node.removeEventListener('keyup', schedule)
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current)
    }
  }, [container])

  return overlay
}

