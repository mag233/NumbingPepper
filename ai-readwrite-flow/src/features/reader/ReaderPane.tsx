import { useEffect, useMemo, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { FileWarning, MousePointerClick } from 'lucide-react'
import { convertFileSrc } from '@tauri-apps/api/core'
import Card from '../../shared/components/Card'
import useLibraryStore from '../../stores/libraryStore'
import FloatingMenu from './FloatingMenu'
import { isTauri } from '../../lib/isTauri'
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import useReaderStore from '../../stores/readerStore'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc

type Props = {
  onAction: (action: 'summarize' | 'explain' | 'chat', text: string) => void
}

type MenuState = {
  visible: boolean
  x: number
  y: number
  text: string
}

const ReaderPane = ({ onAction }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pageWidth, setPageWidth] = useState(720)
  const [loadError, setLoadError] = useState<string | null>(null)
  const { currentPage, setPage, setPageCount, pageCount, scrollMode } = useReaderStore()
  const [menu, setMenu] = useState<MenuState>({
    visible: false,
    x: 0,
    y: 0,
    text: '',
  })
  const { items, activeId } = useLibraryStore()

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeId),
    [items, activeId],
  )

  useEffect(() => {
    const resize = () => {
      const width = containerRef.current?.clientWidth
      if (width) setPageWidth(Math.min(1400, width - 32))
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    const node = containerRef.current
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
      setMenu({
        visible: true,
        text,
        x: rect.left - hostRect.left,
        y: rect.top - hostRect.top,
      })
    }

    node.addEventListener('mouseup', handleSelection)
    return () => node.removeEventListener('mouseup', handleSelection)
  }, [])

  useEffect(() => {
    setLoadError(null)
    setPage(1)
  }, [activeItem?.id, setPage])

  const handleAction = (action: 'summarize' | 'explain' | 'chat') => {
    if (!menu.text) return
    onAction(action, menu.text)
    setMenu((state) => ({ ...state, visible: false }))
  }

  const hasPdf = !!activeItem?.url
  const tauriFileUrl =
    activeItem?.path && isTauri() ? convertFileSrc(activeItem.path, 'asset') : undefined

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (scrollMode === 'continuous') return
    if (!pageCount) return
    const direction = event.deltaY > 0 ? 1 : -1
    const next = currentPage + direction
    if (next >= 1 && next <= pageCount) {
      event.preventDefault()
      event.stopPropagation()
      setPage(next)
    }
  }

  return (
    <Card title="Reader / PDF">
      <div
        ref={containerRef}
        className="relative rounded-xl border border-slate-800/70 bg-slate-900/50"
      >
        {hasPdf ? (
          <div
            className="flex max-h-[calc(100vh-200px)] flex-col gap-3 overflow-auto p-4"
            onWheel={handleWheel}
          >
            <Document
              file={tauriFileUrl ?? activeItem?.url ?? activeItem?.path}
              onLoadError={(error) => setLoadError(error.message)}
              onSourceError={(error) => setLoadError(error.message)}
              onLoadSuccess={(data) => setPageCount(data.numPages)}
              loading={<p className="text-sm text-slate-400">Loading PDF...</p>}
              error={
                <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-100">
                  Failed to load PDF file.
                </div>
              }
            >
              {scrollMode === 'continuous' && pageCount > 0 ? (
                Array.from({ length: pageCount }).map((_, idx) => (
                  <div
                    key={idx}
                    className="mb-6 rounded-lg border border-slate-800/60 bg-slate-900/60 p-2"
                  >
                    <Page pageNumber={idx + 1} width={pageWidth} />
                  </div>
                ))
              ) : (
                <Page pageNumber={currentPage} width={pageWidth} />
              )}
            </Document>
            <p className="text-xs text-slate-400">
              {scrollMode === 'continuous'
                ? 'Continuous scroll: use mouse wheel to browse pages.'
                : 'Paged mode: mouse wheel flips pages; select text to open the floating menu.'}
            </p>
            {loadError && (
              <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-100">
                {loadError}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex items-center gap-2 rounded-lg border border-slate-800/70 bg-slate-900/70 p-3">
              <FileWarning className="size-5 text-amber-400" />
              <p>No PDF selected. Import from Library and click a file to open.</p>
            </div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
              <MousePointerClick className="size-4" />
              Try selecting text below; the floating menu will appear.
            </div>
            <p className="rounded-lg bg-slate-900/70 p-3 leading-relaxed text-slate-200">
              AI-ReadWrite-Flow keeps reading and writing side by side: Reader on the left, Writer and
              Chat on the right. Select any text to invoke the floating menu, quickly summarize, explain,
              or start a chat while keeping context in sync.
            </p>
          </div>
        )}

        {menu.visible && (
          <FloatingMenu
            x={menu.x}
            y={menu.y}
            text={menu.text}
            onAction={handleAction}
          />
        )}
      </div>
    </Card>
  )
}

export default ReaderPane
