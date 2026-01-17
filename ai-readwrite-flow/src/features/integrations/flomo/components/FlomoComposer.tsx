import { useMemo, useState } from 'react'
import { Loader2, Send, X } from 'lucide-react'
import { z } from 'zod'
import { useMediaQuery } from '../../../../lib/hooks/useMediaQuery'
import { MOBILE_MEDIA_QUERY } from '../../../../lib/constants'
import useSettingsStore from '../../../../stores/settingsStore'
import useHighlightStore from '../../../../stores/highlightStore'
import useLibraryStore from '../../../../stores/libraryStore'
import useWriterProjectStore from '../../../editor/stores/writerProjectStore'
import { postToFlomo } from '../flomoClient'
import {
  buildReaderFlomoContent,
  buildReferenceFlomoContent,
  buildWriterFlomoContent,
  buildWriterFlomoContentFull,
} from '../flomoNoteBuilder'
import type { FlomoComposerDraft } from '../flomoComposerStore'
import {
  getFlomoLastSentAt,
  makeReaderHighlightSendKey,
  makeReaderSelectionSendKey,
  makeWriterProjectSendKey,
  makeWriterReferenceSendKey,
  makeWriterSelectionSendKey,
  markFlomoSentAt,
} from '../flomoSendHistory'
import { appendWriterSelectionOutbox } from '../flomoOutbox'
import { parseFlomoTags } from '../flomoTagRules'

type Props = {
  draft: FlomoComposerDraft
  onClose: () => void
}

const webhookUrlSchema = z.string().trim().url()

const textareaClass =
  'w-full rounded-xl border border-chrome-border/70 bg-surface-raised/60 p-3 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none'

const FlomoComposer = ({ draft, onClose }: Props) => {
  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY)
  const flomoWebhookUrl = useSettingsStore((s) => s.flomoWebhookUrl)
  const envDefaultUrl = (import.meta.env.VITE_FLOMO_API ?? '').trim()
  const effectiveWebhookUrl = flomoWebhookUrl.trim() || envDefaultUrl
  const addHighlight = useHighlightStore((s) => s.add)
  const setHighlightNote = useHighlightStore((s) => s.setNote)
  const updateBookTags = useLibraryStore((s) => s.updateBookTags)
  const updateProjectTags = useWriterProjectStore((s) => s.updateProjectTags)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState(draft.mode === 'reader' ? draft.note : '')
  const [tagsText, setTagsText] = useState(draft.tags.join('\n'))
  const [contextOpen, setContextOpen] = useState(!isMobile)
  const [saveDefaults, setSaveDefaults] = useState(false)

  const canSaveDefaults = useMemo(() => {
    if (draft.mode === 'reader') return Boolean(draft.source)
    if (draft.mode === 'writer') return draft.source?.type === 'writer-selection'
    if (draft.mode === 'writer-full') return draft.source?.type === 'writer-project'
    if (draft.mode === 'reference') return Boolean(draft.source?.bookId)
    return false
  }, [draft])

  const trimmedNote = note.trim()
  const canSaveReaderNote = draft.mode === 'reader' && Boolean(draft.source) && trimmedNote.length > 0 && !sending
  const canSend = Boolean(effectiveWebhookUrl) && !sending

  const sendKey = useMemo(() => {
    if (draft.mode === 'reader') {
      const source = draft.source
      if (!source) return ''
      if (source.type === 'highlight') return makeReaderHighlightSendKey(source.bookId, source.highlightId)
      return makeReaderSelectionSendKey({ bookId: source.bookId, page: source.page, rects: source.rects })
    }
    const source = draft.source
    if (!source) return ''
    if (draft.mode === 'reference' && source.type === 'writer-reference') {
      return makeWriterReferenceSendKey(source.projectId, source.referenceId)
    }
    if (draft.mode === 'writer' && source.type === 'writer-selection') {
      return makeWriterSelectionSendKey(source.projectId, draft.selection)
    }
    if (draft.mode === 'writer-full' && source.type === 'writer-project') {
      return makeWriterProjectSendKey(source.projectId)
    }
    return ''
  }, [draft])

  const lastSentAt = useMemo(() => (sendKey ? getFlomoLastSentAt(sendKey) : null), [sendKey])

  const parsedTags = useMemo(() => parseFlomoTags(tagsText), [tagsText])

  const content = useMemo(() => {
    const tags = parsedTags.tagLines
    if (draft.mode === 'reader') {
      return buildReaderFlomoContent({
        quote: draft.quote,
        note,
        bookTitle: draft.bookTitle,
        tags,
      })
    }
    if (draft.mode === 'writer') {
      return buildWriterFlomoContent({
        selection: draft.selection,
        context: draft.context,
        projectTitle: draft.projectTitle,
        tags,
      })
    }
    if (draft.mode === 'writer-full') {
      return buildWriterFlomoContentFull({
        content: draft.content,
        context: draft.context,
        projectTitle: draft.projectTitle,
        tags,
      })
    }
    return buildReferenceFlomoContent({
      snippet: draft.snippet,
      title: draft.title,
      author: draft.author,
      year: draft.year,
      tags,
    })
  }, [draft, note, parsedTags.tagLines])

  const saveReaderNote = async () => {
    if (draft.mode !== 'reader') return
    if (!draft.source) return
    if (!trimmedNote) return

    if (draft.source.type === 'highlight') {
      await setHighlightNote(draft.source.highlightId, draft.source.bookId, trimmedNote)
      return
    }

    await addHighlight({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      bookId: draft.source.bookId,
      content: draft.quote,
      color: 'yellow',
      note: trimmedNote,
      contextRange: { page: draft.source.page, rects: draft.source.rects, zoom: null },
      createdAt: Date.now(),
    })
  }

  const handleSend = async (opts?: { requireSavedNote?: boolean }) => {
    const parsed = webhookUrlSchema.safeParse(effectiveWebhookUrl)
    if (!parsed.success) {
      setError('Flomo webhook is not configured. Go to Settings → Integrations to set it.')
      return
    }
    setSending(true)
    setError(null)
    if (draft.mode === 'reader' && opts?.requireSavedNote) {
      try {
        await saveReaderNote()
      } catch (e) {
        setSending(false)
        setError(e instanceof Error ? e.message : 'Save failed')
        return
      }
    }
    const result = await postToFlomo(parsed.data, content)
    setSending(false)
    if (result.ok) {
      const now = Date.now()
      if (sendKey) markFlomoSentAt(sendKey, now)
      if (draft.mode === 'writer' && draft.source?.type === 'writer-selection') {
        appendWriterSelectionOutbox({
          projectId: draft.source.projectId,
          selectionText: draft.selection,
          tags: parsedTags.tagLines,
          sentAt: now,
        })
      }
      if (saveDefaults) {
        if (draft.mode === 'reader' && draft.source) {
          void updateBookTags(draft.source.bookId, parsedTags.explicitTags)
        }
        if (draft.mode === 'writer' && draft.source?.type === 'writer-selection') {
          void updateProjectTags(draft.source.projectId, parsedTags.explicitTags)
        }
        if (draft.mode === 'writer-full' && draft.source?.type === 'writer-project') {
          void updateProjectTags(draft.source.projectId, parsedTags.explicitTags)
        }
        if (draft.mode === 'reference' && draft.source?.type === 'writer-reference' && draft.source.bookId) {
          void updateBookTags(draft.source.bookId, parsedTags.explicitTags)
        }
      }
      onClose()
      return
    }
    setError(result.error)
  }

  const panelClass = isMobile
    ? 'absolute inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t border-chrome-border/70 bg-surface-base/95 shadow-2xl'
    : 'absolute left-1/2 top-1/2 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-chrome-border/70 bg-surface-base/95 shadow-2xl'

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close composer" />
      <section className={panelClass}>
        <header className="flex items-center justify-between gap-3 border-b border-chrome-border/70 p-4">
          <div>
            <p className="text-sm font-semibold text-ink-primary">Send to Flomo</p>
            <p className="text-xs text-ink-muted">
              {draft.mode === 'reader'
                ? 'Reader note'
                : draft.mode === 'writer'
                  ? 'Writer note'
                  : draft.mode === 'writer-full'
                    ? 'Writer export'
                    : 'Writer reference'}
            </p>
            {lastSentAt && (
              <p className="mt-1 text-[11px] text-ink-muted">Last sent: {new Date(lastSentAt).toLocaleString()}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-chrome-border/70 p-2 text-ink-muted hover:border-accent hover:text-ink-primary"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="grid gap-3 p-4">
          {draft.mode === 'reader' ? (
            <>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-ink-muted">Quote</p>
                <textarea className={textareaClass} value={draft.quote} readOnly rows={4} />
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-ink-muted">My note</p>
                <textarea className={textareaClass} value={note} onChange={(e) => setNote(e.target.value)} rows={4} />
              </div>
            </>
          ) : draft.mode === 'writer' ? (
            <>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-ink-muted">Selection</p>
                <textarea className={textareaClass} value={draft.selection} readOnly rows={4} />
              </div>
              <div>
                <button
                  type="button"
                  className="mb-1 inline-flex items-center gap-2 text-xs uppercase tracking-wide text-ink-muted hover:text-ink-primary"
                  onClick={() => setContextOpen((v) => !v)}
                >
                  Context {contextOpen ? '▲' : '▼'}
                </button>
                {contextOpen && <textarea className={textareaClass} value={draft.context} readOnly rows={5} />}
              </div>
            </>
          ) : draft.mode === 'writer-full' ? (
            <>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-ink-muted">Content</p>
                <textarea className={textareaClass} value={draft.content} readOnly rows={6} />
              </div>
              <div>
                <button
                  type="button"
                  className="mb-1 inline-flex items-center gap-2 text-xs uppercase tracking-wide text-ink-muted hover:text-ink-primary"
                  onClick={() => setContextOpen((v) => !v)}
                >
                  Context {contextOpen ? '−' : '+'}
                </button>
                {contextOpen && <textarea className={textareaClass} value={draft.context} readOnly rows={5} />}
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-ink-muted">Reference</p>
                <textarea className={textareaClass} value={draft.snippet} readOnly rows={4} />
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-ink-muted">Source</p>
                <textarea
                  className={textareaClass}
                  value={(() => {
                    const lines = [
                      draft.title ? `Title: ${draft.title}` : null,
                      draft.author ? `Author: ${draft.author}` : null,
                      typeof draft.year === 'number' ? `Year: ${draft.year}` : null,
                    ].filter((line): line is string => Boolean(line))
                    return (lines.length ? lines : ['Unknown']).join('\n')
                  })()}
                  readOnly
                  rows={3}
                />
              </div>
            </>
          )}

          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-ink-muted">Tags (one per line)</p>
            <textarea
              className={textareaClass}
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              rows={3}
              placeholder="#tag/a\n#tag/b"
            />
          </div>

          {canSaveDefaults && (
            <label className="flex items-center gap-2 text-xs text-ink-muted">
              <input
                type="checkbox"
                checked={saveDefaults}
                onChange={(e) => setSaveDefaults(e.target.checked)}
                className="size-4 accent-accent"
              />
              Save as default tags
            </label>
          )}

          {error && (
            <p className="rounded-lg border border-status-warning/40 bg-status-warning/10 p-2 text-xs text-status-warning">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-chrome-border/70 bg-surface-raised/50 px-4 py-2 text-sm text-ink-primary hover:border-accent"
            >
              Cancel
            </button>
            {draft.mode === 'reader' && draft.source ? (
              <>
                <button
                  type="button"
                  disabled={!canSaveReaderNote}
                  onClick={() => {
                    setSending(true)
                    setError(null)
                    void saveReaderNote()
                      .then(() => {
                        setError(null)
                      })
                      .catch((e) => setError(e instanceof Error ? e.message : 'Save failed'))
                      .finally(() => setSending(false))
                  }}
                  className="rounded-lg border border-chrome-border/70 bg-surface-raised/50 px-4 py-2 text-sm text-ink-primary hover:border-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Save
                </button>
                <button
                  type="button"
                  disabled={!canSaveReaderNote}
                  onClick={() => {
                    setSending(true)
                    setError(null)
                    void saveReaderNote()
                      .then(() => onClose())
                      .catch((e) => setError(e instanceof Error ? e.message : 'Save failed'))
                      .finally(() => setSending(false))
                  }}
                  className="rounded-lg border border-chrome-border/70 bg-surface-raised/50 px-4 py-2 text-sm text-ink-primary hover:border-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Save & Close
                </button>
                <button
                  type="button"
                  disabled={!canSaveReaderNote}
                  onClick={() => void handleSend({ requireSavedNote: true })}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  Save & Send
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={!canSend}
                onClick={() => void handleSend()}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Send
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default FlomoComposer
