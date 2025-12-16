import { useState } from 'react'
import { CircleHelp, MessageSquare, Paintbrush, Sparkles, StickyNote, Trash2 } from 'lucide-react'
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
  onSetColor,
  onSetNote,
}: Props) => {
  const [note, setNote] = useState(highlight.note ?? '')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [deleteArmed, setDeleteArmed] = useState(false)

  return (
    <div
      className="absolute z-30 w-[260px] rounded-xl border border-slate-800/80 bg-slate-950/95 p-3 text-xs text-slate-100 shadow-xl"
      style={{ left: x, top: y }}
    >
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-xs text-slate-300">
          <Paintbrush className="size-4 text-amber-300" />
          Highlight
        </div>
        <button
          onClick={onClose}
          className="rounded-md border border-slate-800/80 px-2 py-1 text-[11px] text-slate-300 hover:border-slate-700 hover:text-slate-100"
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
          className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-slate-800/80 px-2 py-1 text-[11px] text-slate-200 hover:border-sky-500 hover:text-sky-100 whitespace-nowrap"
        >
          <Sparkles className="size-3" />
          Summarize
        </button>
        <button
          onClick={onExplain}
          className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-slate-800/80 px-2 py-1 text-[11px] text-slate-200 hover:border-sky-500 hover:text-sky-100 whitespace-nowrap"
        >
          <StickyNote className="size-3" />
          Explain
        </button>
        <button
          onClick={onAskAi}
          className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-slate-800/80 px-2 py-1 text-[11px] text-slate-200 hover:border-sky-500 hover:text-sky-100 whitespace-nowrap"
        >
          <MessageSquare className="size-3" />
          Ask AI
        </button>
        <button
          onClick={onGenerateQuestions}
          className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-slate-800/80 px-2 py-1 text-[11px] text-slate-200 hover:border-sky-500 hover:text-sky-100 whitespace-nowrap"
        >
          <CircleHelp className="size-3" />
          Questions
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
                ? 'border-red-500 bg-red-500/10 text-red-100'
                : 'border-slate-800/80 text-slate-200 hover:border-red-500 hover:text-red-200'
            }`}
          >
            <Trash2 className="size-3" />
            {deleteArmed ? 'Confirm' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-[11px] text-slate-400">Note</label>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-800/80 bg-slate-900/60 p-2 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
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
            className="rounded-lg border border-slate-800/80 px-2 py-1 text-[11px] text-slate-300 hover:border-slate-700 hover:text-slate-100"
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
            className="rounded-lg bg-sky-500 px-3 py-1 text-[11px] font-semibold text-white hover:bg-sky-400"
          >
            {saveStatus === 'saving' ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default HighlightPopover
