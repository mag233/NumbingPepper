import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { ChevronLeft, MessageCircle } from 'lucide-react'
import PanelErrorBoundary from '../../../shared/components/PanelErrorBoundary'
import type { QuickPrompt } from '../../../lib/quickPrompt'
import useWriterLayoutStore from '../../../stores/writerLayoutStore'
import useShellLayoutModeStore from '../../../stores/shellLayoutModeStore'
import WriterSidebar from '../WriterSidebar'
import EditorPane from '../EditorPane'
import WriterChatSidebar from '../WriterChatSidebar'
import WriterStudioPanel from './WriterStudioPanel'
import WriterContextCard from './WriterContextCard'
import VerticalSplitter from '../../../shared/components/VerticalSplitter'
import VerticalDivider from '../../../shared/components/VerticalDivider'

type Props = {
  showNav: boolean
  quickPrompt?: QuickPrompt
  onConsumeQuickPrompt: () => void
  onSetQuickPrompt: (prompt: QuickPrompt) => void
  chatCollapsed: boolean
  onChatCollapsedChange: (collapsed: boolean) => void
  sidebarWidthPx: number
  onSidebarWidthPxChange: (nextPx: number) => void
}

const MIN_EDITOR_PX = 520
const MIN_CHAT_PX = 320

const WriterDesktopLayout = ({
  showNav,
  quickPrompt,
  onConsumeQuickPrompt,
  onSetQuickPrompt,
  chatCollapsed,
  onChatCollapsedChange,
  sidebarWidthPx,
  onSidebarWidthPxChange,
}: Props) => {
  const splitRatio = useWriterLayoutStore((s) => s.splitRatio)
  const setSplitRatio = useWriterLayoutStore((s) => s.setSplitRatio)
  const density = useWriterLayoutStore((s) => s.density)
  const layoutAdjusting = useShellLayoutModeStore((s) => s.adjusting)

  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const gapClass = density === 'compact' ? 'gap-[var(--app-gap,0.75rem)]' : 'gap-[var(--app-gap,1rem)]'

  const getClampedRatio = useCallback(
    (rawRatio: number) => {
      const el = containerRef.current
      if (!el) return rawRatio
      const width = el.getBoundingClientRect().width
      if (width <= 0) return rawRatio
      const min = MIN_EDITOR_PX / width
      const max = 1 - MIN_CHAT_PX / width
      if (min >= max) return Math.min(1, Math.max(0, rawRatio))
      return Math.min(max, Math.max(min, rawRatio))
    },
    [containerRef],
  )

  const editorFlex = useMemo(() => ({ flex: `0 1 ${Math.round(splitRatio * 1000) / 10}%` }), [splitRatio])
  const chatFlex = useMemo(() => ({ flex: `0 1 ${Math.round((1 - splitRatio) * 1000) / 10}%` }), [splitRatio])

  useEffect(() => {
    if (!quickPrompt) return
    if (!chatCollapsed) return
    onChatCollapsedChange(false)
  }, [chatCollapsed, onChatCollapsedChange, quickPrompt])

  const onSplitterPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!layoutAdjusting) return
      const el = containerRef.current
      if (!el) return
      event.preventDefault()
      setDragging(true)
      const target = event.currentTarget
      target.setPointerCapture(event.pointerId)

      const rect = el.getBoundingClientRect()
      const onMove = (moveEvent: PointerEvent) => {
        const next = (moveEvent.clientX - rect.left) / rect.width
        setSplitRatio(getClampedRatio(next))
      }
      const onUp = () => {
        setDragging(false)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [getClampedRatio, layoutAdjusting, setSplitRatio],
  )

  const splitterInteractive = layoutAdjusting && !chatCollapsed

  return (
    <section className="flex h-full min-h-0 items-stretch">
      {showNav && (
        <>
          <div className="min-h-0 shrink-0" style={{ width: sidebarWidthPx }}>
            <WriterSidebar />
          </div>
          {!layoutAdjusting ? (
            <VerticalDivider label="Sidebar divider" />
          ) : (
            <VerticalSplitter
              label="Resize sidebar"
              minPx={240}
              maxPx={420}
              valuePx={sidebarWidthPx}
              onChange={onSidebarWidthPxChange}
            />
          )}
        </>
      )}
      <div ref={containerRef} className="relative flex min-h-0 flex-1 items-stretch overflow-visible">
        <div style={chatCollapsed ? undefined : editorFlex} className="min-h-0 min-w-[520px] flex-1">
          <div className={`flex h-full min-h-0 flex-col ${gapClass}`}>
            <div className="min-h-0 flex-[65_1_0%]">
              <EditorPane onQuickPrompt={onSetQuickPrompt} />
            </div>
            <div className="min-h-0 flex-[35_1_0%]">
              <WriterContextCard />
            </div>
          </div>
        </div>
        {chatCollapsed && (
          <div className="pointer-events-none absolute inset-y-0 right-2 z-30 flex items-center">
            <button
              type="button"
              onClick={() => onChatCollapsedChange(false)}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-chrome-border/70 bg-surface-raised/80 px-3 py-2 text-xs text-ink-primary shadow-card hover:border-accent"
              title="Show Writer AI"
              aria-label="Show Writer AI"
            >
              <ChevronLeft className="size-4" />
              <MessageCircle className="size-4" />
              <span className="hidden lg:inline">Show</span>
            </button>
          </div>
        )}
        {!chatCollapsed && !layoutAdjusting && <VerticalDivider label="Editor and chat divider" />}
        {!chatCollapsed && layoutAdjusting && (
          <div
            role="separator"
            aria-orientation="vertical"
            onPointerDown={splitterInteractive ? onSplitterPointerDown : undefined}
            className={`group relative w-3 shrink-0 ${
              splitterInteractive ? 'cursor-col-resize' : 'cursor-default'
            } ${dragging ? 'bg-accent/10' : ''}`}
          >
            <div
              className={`absolute inset-y-2 left-1/2 w-px -translate-x-1/2 rounded ${
                splitterInteractive ? 'bg-chrome-border/70 group-hover:bg-accent' : 'bg-chrome-border/50'
              }`}
            />
          </div>
        )}
        {!chatCollapsed && (
          <div style={chatFlex} className="min-h-0 min-w-[320px]">
            <div className={`flex h-full min-h-0 flex-col ${gapClass}`}>
              <WriterStudioPanel />
              <div className="min-h-0 flex-1">
                <PanelErrorBoundary title="Chat">
                  <WriterChatSidebar
                    quickPrompt={quickPrompt}
                    onConsumeQuickPrompt={onConsumeQuickPrompt}
                    collapsed={chatCollapsed}
                    onCollapsedChange={onChatCollapsedChange}
                  />
                </PanelErrorBoundary>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default WriterDesktopLayout
