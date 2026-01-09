import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import PanelErrorBoundary from '../../shared/components/PanelErrorBoundary'
import ReaderPane from '../reader/ReaderPane'
import ChatSidebar from '../ai/ChatSidebar'
import ReaderDesktopSidebar from '../reader/components/ReaderDesktopSidebar'
import type { ReaderShortcutAction } from '../../stores/readerShortcutTemplateStore'
import type { QuickPrompt } from '../../lib/quickPrompt'
import WriterDesktopLayout from '../editor/components/WriterDesktopLayout'
import VerticalSplitter from '../../shared/components/VerticalSplitter'
import VerticalDivider from '../../shared/components/VerticalDivider'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import useShellLayoutModeStore from '../../stores/shellLayoutModeStore'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const MIN_READER_MAIN_PX = 520
const MIN_READER_CHAT_PX = 320

type Props = {
  showNav: boolean
  onToggleNav: () => void
  desktopView: 'reader' | 'writer'
  onSetDesktopView: (view: 'reader' | 'writer') => void
  onReaderAction: (action: ReaderShortcutAction, text: string) => void
  quickPrompt?: QuickPrompt
  onConsumeQuickPrompt: () => void
  onSetQuickPrompt: (prompt: QuickPrompt) => void
  writerChatCollapsed: boolean
  onWriterChatCollapsedChange: (collapsed: boolean) => void
  writerIsPreview: boolean
  onWriterIsPreviewChange: (isPreview: boolean) => void
  readerSidebarWidthPx: number
  onReaderSidebarWidthPxChange: (nextPx: number) => void
  writerSidebarWidthPx: number
  onWriterSidebarWidthPxChange: (nextPx: number) => void
  readerMainSplitRatio: number
  onReaderMainSplitRatioChange: (nextRatio: number) => void
}

const DesktopWorkspace = ({
  showNav,
  onToggleNav,
  desktopView,
  onSetDesktopView,
  onReaderAction,
  quickPrompt,
  onConsumeQuickPrompt,
  onSetQuickPrompt,
  writerChatCollapsed,
  onWriterChatCollapsedChange,
  writerIsPreview,
  onWriterIsPreviewChange,
  readerSidebarWidthPx,
  onReaderSidebarWidthPxChange,
  writerSidebarWidthPx,
  onWriterSidebarWidthPxChange,
  readerMainSplitRatio,
  onReaderMainSplitRatioChange,
}: Props) => {
  const layoutAdjusting = useShellLayoutModeStore((s) => s.adjusting)
  const gapClass = 'gap-[var(--app-gap,1rem)]'
  const sidebarMinPx = 240
  const sidebarMaxPx = 420
  const readerMainRef = useRef<HTMLDivElement>(null)

  const clampReaderMainRatio = useCallback((rawRatio: number, hostWidth: number) => {
    if (hostWidth <= 0) return rawRatio
    const min = MIN_READER_MAIN_PX / hostWidth
    const max = 1 - MIN_READER_CHAT_PX / hostWidth
    if (min >= max) return Math.min(1, Math.max(0, rawRatio))
    return Math.min(max, Math.max(min, rawRatio))
  }, [])

  const onReaderMainSplitterPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const host = readerMainRef.current
      if (!host) return
      event.preventDefault()
      const target = event.currentTarget
      target.setPointerCapture(event.pointerId)

      const rect = host.getBoundingClientRect()
      const onMove = (moveEvent: PointerEvent) => {
        const raw = (moveEvent.clientX - rect.left) / rect.width
        onReaderMainSplitRatioChange(clampReaderMainRatio(raw, rect.width))
      }
      const onUp = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [clampReaderMainRatio, onReaderMainSplitRatioChange],
  )

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${gapClass}`}>
      <div className="hidden items-center gap-3 text-xs text-ink-muted md:flex">
        <span>View:</span>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-chrome-border/70 bg-surface-raised/50 p-2 text-ink-primary hover:border-accent"
          onClick={onToggleNav}
          title={showNav ? 'Hide navigation' : 'Show navigation'}
          aria-label={showNav ? 'Hide navigation' : 'Show navigation'}
        >
          {showNav ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
        </button>
        <button
          className={`rounded-lg border px-2 py-1 ${
            desktopView === 'reader'
              ? 'border-accent bg-accent/15 text-ink-primary'
              : 'border-chrome-border/70 text-ink-muted hover:border-accent hover:text-ink-primary'
          }`}
          onClick={() => onSetDesktopView('reader')}
        >
          Reader
        </button>
        <button
          className={`rounded-lg border px-2 py-1 ${
            desktopView === 'writer'
              ? 'border-accent bg-accent/15 text-ink-primary'
              : 'border-chrome-border/70 text-ink-muted hover:border-accent hover:text-ink-primary'
          }`}
          onClick={() => onSetDesktopView('writer')}
        >
          Writer
        </button>
      </div>

      <div className="min-h-0 flex-1">
        {desktopView === 'reader' && (
          <div className="flex h-full min-h-0 items-stretch">
            {showNav && (
              <>
                <div className="min-h-0 shrink-0" style={{ width: readerSidebarWidthPx }}>
                  <ReaderDesktopSidebar
                    onOpenBook={() => onSetDesktopView('reader')}
                  />
                </div>
                {!layoutAdjusting ? (
                  <VerticalDivider label="Sidebar divider" />
                ) : (
                  <VerticalSplitter
                    label="Resize sidebar"
                    minPx={sidebarMinPx}
                    maxPx={sidebarMaxPx}
                    valuePx={readerSidebarWidthPx}
                    onChange={onReaderSidebarWidthPxChange}
                  />
                )}
              </>
            )}
            <div ref={readerMainRef} className="flex h-full min-h-0 flex-1 items-stretch">
              <div
                className="h-full min-h-0 flex-1"
                style={{ flex: `${readerMainSplitRatio} 1 0%`, minWidth: MIN_READER_MAIN_PX }}
              >
                <PanelErrorBoundary title="Reader">
                  <ReaderPane onAction={onReaderAction} showBottomToolbar />
                </PanelErrorBoundary>
              </div>
              {!layoutAdjusting && <VerticalDivider label="Reader and chat divider" />}
              {layoutAdjusting && (
                <div
                  role="separator"
                  aria-orientation="vertical"
                  className="group relative w-3 shrink-0 cursor-col-resize"
                  onPointerDown={onReaderMainSplitterPointerDown}
                >
                  <div className="absolute inset-y-2 left-1/2 w-px -translate-x-1/2 rounded bg-chrome-border/70 group-hover:bg-accent" />
                </div>
              )}
              <div className="h-full min-h-0" style={{ flex: `${1 - readerMainSplitRatio} 1 0%`, minWidth: MIN_READER_CHAT_PX }}>
                <PanelErrorBoundary title="Chat">
                  <ChatSidebar quickPrompt={quickPrompt} onConsumeQuickPrompt={onConsumeQuickPrompt} />
                </PanelErrorBoundary>
              </div>
            </div>
          </div>
        )}

        {desktopView === 'writer' && (
          <WriterDesktopLayout
            showNav={showNav}
            quickPrompt={quickPrompt}
            onConsumeQuickPrompt={onConsumeQuickPrompt}
            onSetQuickPrompt={onSetQuickPrompt}
            chatCollapsed={writerChatCollapsed}
            onChatCollapsedChange={onWriterChatCollapsedChange}
            sidebarWidthPx={writerSidebarWidthPx}
            onSidebarWidthPxChange={(nextPx) => onWriterSidebarWidthPxChange(clamp(nextPx, sidebarMinPx, sidebarMaxPx))}
            isPreview={writerIsPreview}
            onIsPreviewChange={onWriterIsPreviewChange}
          />
        )}
      </div>
    </div>
  )
}

export default DesktopWorkspace
