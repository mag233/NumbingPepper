import { useEffect, useState } from 'react'
import { selectionToHighlight } from '../services/selectionToHighlight'
import { type Highlight, type HighlightRect } from '../types'
import { copyTextToClipboard } from '../../../lib/clipboard'
import { cleanPdfCopiedText } from '../services/selectionText'
import useFlomoComposerStore from '../../integrations/flomo/flomoComposerStore'
import { useScopedLibrary } from '../../../stores/useScopedLibrary'
import { defaultBookTag } from '../../integrations/flomo/flomoNoteBuilder'
import { buildAiReaderTagLines } from '../../../lib/referenceTags'

export type SelectionMenuState = {
  visible: boolean
  x: number
  y: number
  text: string
  page?: number
  rects?: HighlightRect[]
  copyStatus?: 'idle' | 'copied' | 'error'
}

type Args = {
  container: React.RefObject<HTMLDivElement | null>
  activeBookId?: string
  addHighlight: (highlight: Highlight) => Promise<void>
  onAction: (action: 'summarize' | 'explain' | 'chat' | 'questions', text: string) => void
}

const clearSelection = () => {
  const selection = window.getSelection()
  selection?.removeAllRanges()
}

export const useSelectionMenu = ({ container, activeBookId, addHighlight, onAction }: Args) => {
  const openFlomoComposer = useFlomoComposerStore((s) => s.open)
  const { activeItem } = useScopedLibrary('project')
  const [menu, setMenu] = useState<SelectionMenuState>({
    visible: false,
    x: 0,
    y: 0,
    text: '',
    copyStatus: 'idle',
  })

  useEffect(() => {
    const node = container.current
    if (!node) return

    const handleSelection = () => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        setMenu((state) => ({ ...state, visible: false }))
        return
      }

      const text = selection.toString().trim()
      if (!text) {
        setMenu((state) => ({ ...state, visible: false }))
        return
      }

      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      const hostRect = node.getBoundingClientRect()
      const info = selectionToHighlight()
      setMenu({
        visible: true,
        text,
        x: rect.left - hostRect.left,
        y: rect.top - hostRect.top,
        page: info?.page,
        rects: info?.rects,
        copyStatus: 'idle',
      })
    }

    node.addEventListener('mouseup', handleSelection)
    return () => node.removeEventListener('mouseup', handleSelection)
  }, [container])

  const handleAction = async (
    action: 'summarize' | 'explain' | 'chat' | 'questions' | 'highlight' | 'copy' | 'note',
  ) => {
    if (!menu.text) return
    if (action === 'copy') {
      const ok = await copyTextToClipboard(cleanPdfCopiedText(menu.text))
      setMenu((state) => ({ ...state, copyStatus: ok ? 'copied' : 'error' }))
      window.setTimeout(() => setMenu((state) => ({ ...state, copyStatus: 'idle' })), 900)
      return
    }
    if (action === 'note') {
      if (!activeBookId || !menu.page || !menu.rects?.length) return
      const bookTitle = activeItem?.title?.trim() || 'Untitled'
      const bookTags = activeItem?.tags ?? []
      openFlomoComposer({
        mode: 'reader',
        quote: menu.text,
        note: '',
        bookTitle,
        tags: [defaultBookTag(bookTitle), ...buildAiReaderTagLines(bookTags)],
        source: { type: 'selection', bookId: activeBookId, page: menu.page, rects: menu.rects },
      })
      clearSelection()
      setMenu((state) => ({ ...state, visible: false }))
      return
    }
    if (action === 'highlight') {
      if (!activeBookId || !menu.page || !menu.rects?.length) return
      const highlight: Highlight = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        bookId: activeBookId,
        content: menu.text,
        color: 'yellow',
        note: null,
        contextRange: { page: menu.page, rects: menu.rects, zoom: null },
        createdAt: Date.now(),
      }
      await addHighlight(highlight)
      clearSelection()
      setMenu((state) => ({ ...state, visible: false }))
      return
    }
    onAction(action, menu.text)
    setMenu((state) => ({ ...state, visible: false }))
  }

  const dismissMenu = () => {
    setMenu((state) => ({ ...state, visible: false }))
  }

  return { menu, handleAction, dismissMenu }
}
