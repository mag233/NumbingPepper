import { useState } from 'react'
import { CircleHelp, FolderPlus, MessageSquare, Paintbrush, Sparkles, StickyNote, Trash2 } from 'lucide-react'
import { type Highlight, type HighlightColor } from '../types'

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
  { id: 'yellow', label: 'Yellow', className: 'bg-amber-400' },
  { id: 'red', label: 'Red', className: 'bg-red-400' },
  { id: 'blue', label: 'Blue', className: 'bg-sky-400' },
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
          <Paintbrush className="size-4 text-amber-300" />
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
        >
          <CircleHelp className="size-3" />
          Questions
        </button>
        <button
          onClick={onAddToWritingContext}
          className="inline-flex w-full items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-chrome-border/80 px-2 py-1 text-[11px] text-ink-primary hover:border-emerald-500 hover:text-emerald-300"
          title="Append this highlight to the active writing project context"
        >
          <FolderPlus className="size-3" />
          To Context
        </button>
        <button
          onClick={onAddAsWritingReference}
          className="inline-flex w-full items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-chrome-border/80 px-2 py-1 text-[11px] text-ink-primary hover:border-emerald-500 hover:text-emerald-300"
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
                ? 'border-red-500 bg-red-500/10 text-red-300'
                : 'border-chrome-border/80 text-ink-primary hover:border-red-500 hover:text-red-300'
            }`}
          >
            <Trash2 className="size-3" />
            {deleteArmed ? 'Confirm' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-[11px] text-ink-muted">Note</label>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          className="w-full rounded-lg border border-chrome-border/80 bg-surface-raised/60 p-2 text-xs text-ink-primary focus:border-accent focus:outline-none"
          placeholder="Add a note..."
        />
        <div className="mt-2 flex items-center justify-end gap-2">
          {saveStatus === 'saved' && (
            <span className="mr-auto text-[11px] text-emerald-200">Saved</span>
          )}
          {saveStatus === 'error' && (
            <span className="mr-auto text-[11px] text-amber-200">Save failed</span>
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
