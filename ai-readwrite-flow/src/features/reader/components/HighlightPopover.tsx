import { useState } from 'react'
import { CircleHelp, FolderPlus, MessageSquare, Paintbrush, Sparkles, StickyNote, Trash2 } from 'lucide-react'
import { type Highlight, type HighlightColor } from '../types'
import useFlomoComposerStore from '../../integrations/flomo/flomoComposerStore'
import useLibraryStore from '../../../stores/libraryStore'
import { defaultBookTag } from '../../integrations/flomo/flomoNoteBuilder'
import { buildAiReaderTagLines } from '../../../lib/referenceTags'

type Props = {
  highlight: Highlight
  x: number
  y: number
  onClose: () => void
  onDelete: () => Promise<void>
  onAskAi: () => void
  onSummarize: () => void
  onExplain: () => void
  onGenerateQuestions: () => void
  onAddToWritingContext: () => void
  onAddAsWritingReference: () => void
  onSetColor: (color: HighlightColor) => Promise<void>
  onSetNote: (note: string | null) => Promise<void>
}

const colorOptions: { id: HighlightColor; label: string; className: string }[] = [
  { id: 'yellow', label: 'Yellow', className: 'bg-highlight-yellow' },
  { id: 'red', label: 'Red', className: 'bg-highlight-red' },
  { id: 'blue', label: 'Blue', className: 'bg-highlight-blue' },
]

const HighlightPopover = ({
  highlight,
  x,
  y,
  onClose,
  onDelete,
  onAskAi,
  onSummarize,
  onExplain,
  onGenerateQuestions,
  onAddToWritingContext,
  onAddAsWritingReference,
  onSetColor,
  onSetNote,
}: Props) => {
  const openFlomoComposer = useFlomoComposerStore((s) => s.open)
  const bookItem = useLibraryStore((s) => s.items.find((item) => item.id === highlight.bookId))
  const bookTitle = bookItem?.title ?? 'Untitled'
  const bookTags = bookItem?.tags ?? []
  const [note, setNote] = useState(highlight.note ?? '')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [deleteArmed, setDeleteArmed] = useState(false)

  return (
    <div
      className="absolute z-30 w-[260px] rounded-xl border border-chrome-border/80 bg-surface-base/95 p-3 text-xs text-ink-primary shadow-xl"
      style={{ left: x, top: y }}
    >
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-xs text-ink-muted">
          <Paintbrush className="size-4 text-status-warning" />
          Highlight
        </div>
        <button
          onClick={onClose}
          className="rounded-md border border-chrome-border/80 px-2 py-1 text-[11px] text-ink-muted hover:border-accent hover:text-ink-primary"
        >
          Close
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {colorOptions.map((c) => (
          <button
            key={c.id}
            onClick={() => void onSetColor(c.id)}
            className={`h-6 w-6 rounded-full ${c.className} ${
              highlight.color === c.id ? 'ring-2 ring-white/70' : 'ring-1 ring-white/20'
            }`}
            aria-label={`Set highlight color ${c.label}`}
            title={c.label}
          />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={onSummarize}
          className="inline-flex w-full items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-chrome-border/80 px-2 py-1 text-[11px] text-ink-primary hover:border-accent"
        >
          <Sparkles className="size-3" />
          Summarize
        </button>
        <button
          onClick={onExplain}
          className="inline-flex w-full items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-chrome-border/80 px-2 py-1 text-[11px] text-ink-primary hover:border-accent"
        >
          <StickyNote className="size-3" />
          Explain
        </button>
        <button
          onClick={onAskAi}
          className="inline-flex w-full items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-chrome-border/80 px-2 py-1 text-[11px] text-ink-primary hover:border-accent"
        >
          <MessageSquare className="size-3" />
          Ask AI
        </button>
        <button
          onClick={onGenerateQuestions}
          className="inline-flex w-full items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-chrome-border/80 px-2 py-1 text-[11px] text-ink-primary hover:border-accent"
          title="Generate Questions"
        >
          <CircleHelp className="size-3" />
          Questions
        </button>
        <button
          onClick={onAddToWritingContext}
          className="inline-flex w-full items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-chrome-border/80 px-2 py-1 text-[11px] text-ink-primary hover:border-status-success/70 hover:text-status-success"
          title="Append this highlight to the active writing project context"
        >
          <FolderPlus className="size-3" />
          To Context
        </button>
        <button
          onClick={onAddAsWritingReference}
          className="inline-flex w-full items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-chrome-border/80 px-2 py-1 text-[11px] text-ink-primary hover:border-status-success/70 hover:text-status-success"
          title="Save as a reference in the active writing project"
        >
          <FolderPlus className="size-3" />
          To Ref
        </button>
        <div className="col-span-2 mt-1">
          <button
            onClick={() => {
              if (deleteArmed) {
                void onDelete()
                return
              }
              setDeleteArmed(true)
              window.setTimeout(() => setDeleteArmed(false), 2500)
            }}
            className={`inline-flex w-full items-center justify-center gap-1 rounded-lg border px-2 py-1 text-[11px] whitespace-nowrap ${
              deleteArmed
                ? 'border-status-danger bg-status-danger/10 text-status-danger'
                : 'border-chrome-border/80 text-ink-primary hover:border-status-danger/70 hover:text-status-danger'
            }`}
          >
            <Trash2 className="size-3" />
            {deleteArmed ? 'Confirm' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-[11px] text-ink-muted">Note</label>
          <button
            type="button"
            onClick={() =>
              openFlomoComposer({
                mode: 'reader',
                quote: highlight.content,
                note: note.trim(),
                bookTitle,
                tags: [defaultBookTag(bookTitle), ...buildAiReaderTagLines(bookTags)],
                source: { type: 'highlight', bookId: highlight.bookId, highlightId: highlight.id },
              })
            }
            className="rounded-md border border-chrome-border/80 px-2 py-1 text-[11px] text-ink-muted hover:border-accent hover:text-ink-primary"
          >
            Flomo…
          </button>
        </div>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          className="w-full rounded-lg border border-chrome-border/80 bg-surface-raised/60 p-2 text-xs text-ink-primary focus:border-accent focus:outline-none"
          placeholder="Add a note..."
        />
        <div className="mt-2 flex items-center justify-end gap-2">
          {saveStatus === 'saved' && (
            <span className="mr-auto text-[11px] text-status-success">Saved</span>
          )}
          {saveStatus === 'error' && (
            <span className="mr-auto text-[11px] text-status-warning">Save failed</span>
          )}
          <button
            onClick={() => {
              setNote('')
              void onSetNote(null).then(() => {
                setSaveStatus('saved')
                window.setTimeout(() => setSaveStatus('idle'), 1200)
              })
            }}
            className="rounded-lg border border-chrome-border/80 px-2 py-1 text-[11px] text-ink-muted hover:border-accent hover:text-ink-primary"
          >
            Clear
          </button>
          <button
            onClick={() => {
              setSaveStatus('saving')
              void onSetNote(note.trim() ? note.trim() : null)
                .then(() => {
                  setSaveStatus('saved')
                  window.setTimeout(() => setSaveStatus('idle'), 1200)
                })
                .catch(() => setSaveStatus('error'))
            }}
            className="rounded-lg bg-accent px-3 py-1 text-[11px] font-semibold text-white hover:bg-accent/90"
          >
            {saveStatus === 'saving' ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default HighlightPopover
