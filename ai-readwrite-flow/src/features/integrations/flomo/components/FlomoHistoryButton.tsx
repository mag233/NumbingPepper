import { History, Send } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import useFlomoComposerStore from '../flomoComposerStore'
import { buildSelectionPreview, listProjectOutbox, type FlomoOutboxEntry } from '../flomoOutbox'
import useWriterContextStore from '../../../editor/stores/writerContextStore'
import useWriterProjectStore from '../../../editor/stores/writerProjectStore'
import { defaultProjectTag } from '../flomoNoteBuilder'

type Anchor = { rect: DOMRect; viewportWidth: number; viewportHeight: number }

const panelClass =
  'fixed w-[420px] max-w-[90vw] overflow-hidden rounded-2xl border border-chrome-border/70 bg-surface-base shadow-2xl'

const buttonClass =
  'inline-flex items-center gap-2 rounded-lg border border-chrome-border/70 bg-surface-raised/60 px-3 py-2 text-ink-primary hover:border-accent'

const formatWhen = (sentAt: number) => {
  const d = new Date(sentAt)
  return d.toLocaleString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const OutboxRow = ({ entry, onResend }: { entry: FlomoOutboxEntry; onResend: () => void }) => {
  const preview = useMemo(() => buildSelectionPreview(entry.selectionText), [entry.selectionText])
  return (
    <div className="flex items-start justify-between gap-3 border-t border-chrome-border/70 px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[11px] text-ink-muted">
          <span className="rounded-full border border-chrome-border/70 bg-surface-raised/40 px-2 py-0.5">Selection</span>
          <span title={new Date(entry.sentAt).toISOString()}>{formatWhen(entry.sentAt)}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-ink-primary">{preview || '(empty)'}</p>
        {entry.tags.length > 0 && (
          <p className="mt-1 text-[11px] text-ink-muted">Tags: {entry.tags.length}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onResend}
        className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white shadow hover:bg-accent/90"
      >
        <Send className="size-4" />
        Resend
      </button>
    </div>
  )
}

const FlomoHistoryButton = () => {
  const openComposer = useFlomoComposerStore((s) => s.open)
  const contextText = useWriterContextStore((s) => s.contextText)
  const projectId = useWriterProjectStore((s) => s.activeProjectId)
  const projectTitle = useWriterProjectStore((s) => s.projects.find((p) => p.id === s.activeProjectId)?.title ?? 'Untitled')
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const entries = useMemo(
    () => (open && projectId ? listProjectOutbox(projectId, 20) : []),
    [open, projectId],
  )

  const resend = (entry: FlomoOutboxEntry) => {
    if (!projectId) return
    const tags = entry.tags.length ? entry.tags : [defaultProjectTag(projectTitle)]
    openComposer({
      mode: 'writer',
      selection: entry.selectionText,
      context: contextText,
      projectTitle,
      tags,
      source: { type: 'writer-selection', projectId },
    })
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  const openPopover = () => {
    const el = buttonRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setAnchor({ rect, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight })
    setOpen(true)
  }

  const closePopover = () => setOpen(false)

  const panelStyle = useMemo(() => {
    if (!anchor) return undefined
    const padding = 12
    const right = Math.max(padding, anchor.viewportWidth - anchor.rect.right)
    const spaceBelow = anchor.viewportHeight - anchor.rect.bottom
    if (spaceBelow < 360) {
      const bottom = Math.max(padding, anchor.viewportHeight - anchor.rect.top + 8)
      return { right, bottom, maxHeight: '340px', zIndex: 60 } as const
    }
    const top = Math.min(anchor.viewportHeight - padding, anchor.rect.bottom + 8)
    return { right, top, maxHeight: '340px', zIndex: 60 } as const
  }, [anchor])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        className={buttonClass}
        onClick={() => (open ? closePopover() : openPopover())}
        disabled={!projectId}
      >
        <History className="size-4" />
        Flomo History
      </button>
      {open && anchor && panelStyle
        ? createPortal(
            <div className="fixed inset-0 z-50">
              <button
                type="button"
                className="absolute inset-0 bg-black/0"
                onClick={closePopover}
                aria-label="Close Flomo History"
              />
              <div className={panelClass} style={panelStyle} role="dialog" aria-label="Flomo History">
                <div className="flex items-center justify-between border-b border-chrome-border/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-ink-primary">Flomo History</p>
                    <p className="text-[11px] text-ink-muted">Local-only outbox for this writing project.</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg border border-chrome-border/70 px-3 py-2 text-xs text-ink-muted hover:border-accent hover:text-ink-primary"
                    onClick={closePopover}
                  >
                    Close
                  </button>
                </div>
                <div className="max-h-[340px] overflow-y-auto">
                  {entries.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-ink-muted">No Flomo exports yet.</div>
                  ) : (
                    entries.map((entry) => (
                      <OutboxRow key={entry.id} entry={entry} onResend={() => resend(entry)} />
                    ))
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

export default FlomoHistoryButton
