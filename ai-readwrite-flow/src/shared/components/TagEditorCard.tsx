import { Pencil } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatTagDisplay, formatTagsInput, splitTagsInput } from '../../lib/referenceTags'

type Anchor = { rect: DOMRect; viewportWidth: number; viewportHeight: number }

type Props = {
  title: string
  description?: string
  tags: string[]
  onSave: (tags: string[]) => void
  disabled?: boolean
  placeholder?: string
  chipClassName?: string
  containerClassName?: string
}

const panelClass =
  'fixed w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-chrome-border/70 bg-surface-base shadow-2xl'

const buttonClass =
  'inline-flex items-center gap-2 rounded-lg border border-chrome-border/70 bg-surface-raised/60 px-3 py-1 text-xs text-ink-primary hover:border-accent disabled:cursor-not-allowed disabled:opacity-60'

const inputClass =
  'w-full rounded-xl border border-chrome-border/70 bg-surface-raised/60 p-3 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none'

const TagEditorCard = ({
  title,
  description,
  tags,
  onSave,
  disabled = false,
  placeholder = 'Add tags here (comma or newline separated)',
  chipClassName = 'rounded-full border border-action-positive/30 bg-action-positive/5 px-2 py-1 text-[11px] text-action-positive',
  containerClassName = 'rounded-xl border border-chrome-border/70 bg-surface-raised/40 p-3',
}: Props) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const [draft, setDraft] = useState('')

  const openPopover = () => {
    if (disabled) return
    const el = buttonRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setAnchor({ rect, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight })
    setDraft(formatTagsInput(tags))
    setOpen(true)
  }

  const closePopover = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  const panelStyle = useMemo(() => {
    if (!anchor) return undefined
    const padding = 12
    const width = 320
    const left = Math.min(
      Math.max(anchor.rect.left, padding),
      Math.max(padding, anchor.viewportWidth - width - padding),
    )
    const spaceBelow = anchor.viewportHeight - anchor.rect.bottom
    if (spaceBelow < 260) {
      const bottom = Math.max(padding, anchor.viewportHeight - anchor.rect.top + 8)
      return { left, bottom, maxHeight: '260px', zIndex: 60 } as const
    }
    const top = Math.min(anchor.viewportHeight - padding, anchor.rect.bottom + 8)
    return { left, top, maxHeight: '260px', zIndex: 60 } as const
  }, [anchor])

  return (
    <div className={containerClassName}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-ink-muted">{title}</div>
          {description && <p className="mt-1 text-xs text-ink-muted">{description}</p>}
        </div>
        <button ref={buttonRef} type="button" className={buttonClass} onClick={open ? closePopover : openPopover} disabled={disabled}>
          <Pencil className="size-3" />
          Edit
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {tags.length > 0 ? (
          tags.map((tag) => (
            <span key={tag} className={chipClassName}>
              {formatTagDisplay(tag)}
            </span>
          ))
        ) : (
          <span className="text-[11px] text-ink-muted">No tags yet.</span>
        )}
      </div>

      {open && anchor && panelStyle
        ? createPortal(
            <div className="fixed inset-0 z-50">
              <button type="button" className="absolute inset-0 bg-black/0" onClick={closePopover} aria-label="Close tags editor" />
              <div className={panelClass} style={panelStyle} role="dialog" aria-label="Edit tags">
                <div className="flex items-center justify-between border-b border-chrome-border/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-ink-primary">Edit tags</p>
                    <p className="text-[11px] text-ink-muted">{title}</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg border border-chrome-border/70 px-3 py-2 text-xs text-ink-muted hover:border-accent hover:text-ink-primary"
                    onClick={closePopover}
                  >
                    Close
                  </button>
                </div>
                <div className="grid gap-3 p-4">
                  <textarea
                    className={inputClass}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={4}
                    placeholder={placeholder}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button type="button" className={buttonClass} onClick={closePopover}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white shadow hover:bg-accent/90"
                      onClick={() => {
                        onSave(splitTagsInput(draft))
                        closePopover()
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

export default TagEditorCard
