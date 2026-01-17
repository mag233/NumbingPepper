import { useMemo, useState } from 'react'
import useWriterReferenceTagPromptStore from '../stores/writerReferenceTagPromptStore'
import { splitTagsInput } from '../../../lib/referenceTags'
import { saveWriterReferenceFromHighlight } from '../services/writerReferenceFromHighlight'

const textareaClass =
  'w-full rounded-lg border border-chrome-border/70 bg-surface-base/40 p-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none'

const buttonClass =
  'rounded-lg border border-chrome-border/70 bg-surface-raised/60 px-3 py-1 text-xs text-ink-primary hover:border-accent'

const WriterReferenceTagPrompt = () => {
  const pending = useWriterReferenceTagPromptStore((s) => s.pending)
  const tagsText = useWriterReferenceTagPromptStore((s) => s.tagsText)
  const setTagsText = useWriterReferenceTagPromptStore((s) => s.setTagsText)
  const close = useWriterReferenceTagPromptStore((s) => s.close)
  const [error, setError] = useState<string | null>(null)

  const hasPending = Boolean(pending)
  const tags = useMemo(() => splitTagsInput(tagsText), [tagsText])

  if (!pending) return null

  const submit = async (useTags: string[]) => {
    setError(null)
    const ok = await saveWriterReferenceFromHighlight({
      projectId: pending.projectId,
      highlight: pending.highlight,
      tags: useTags,
      onClosePopover: pending.onClosePopover,
    })
    if (!ok) {
      setError('Failed to save reference.')
      return
    }
    close()
  }

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-black/60" onClick={close} aria-label="Close tag prompt" />
      <section className="absolute left-1/2 top-1/2 w-11/12 max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-chrome-border/70 bg-surface-base/95 p-4 shadow-2xl">
        <div className="space-y-2">
          <div className="text-sm font-semibold text-ink-primary">Add tags (optional)</div>
          <textarea
            className={textareaClass}
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            rows={3}
            placeholder="Add tags here (comma or newline separated)"
          />
          {error && <div className="text-xs text-status-danger">{error}</div>}
          <div className="flex items-center justify-end gap-2">
            <button type="button" className={buttonClass} onClick={close}>
              Cancel
            </button>
            <button type="button" className={buttonClass} onClick={() => void submit([])} disabled={!hasPending}>
              Skip
            </button>
            <button type="button" className={buttonClass} onClick={() => void submit(tags)} disabled={!hasPending}>
              Save
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default WriterReferenceTagPrompt
