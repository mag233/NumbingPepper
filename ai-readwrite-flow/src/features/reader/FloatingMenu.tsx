import { CircleHelp, Copy, Highlighter, MessageSquare, Sparkles, StickyNote } from 'lucide-react'

type FloatingMenuProps = {
  x: number
  y: number
  text: string
  copyStatus?: 'idle' | 'copied' | 'error'
  onAction: (action: 'summarize' | 'explain' | 'chat' | 'questions' | 'highlight' | 'copy') => void
}

const FloatingMenu = ({ x, y, text, copyStatus = 'idle', onAction }: FloatingMenuProps) => (
  <div
    className="absolute z-20 flex max-w-full -translate-y-full items-center gap-2 overflow-x-auto rounded-full border border-slate-800/80 bg-slate-900/90 px-3 py-2 text-xs text-slate-100 shadow-lg"
    style={{ top: y, left: x }}
  >
    <span className="line-clamp-1 max-w-[180px] text-slate-400">"{text}"</span>
    <button
      onClick={() => onAction('copy')}
      className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-1 hover:bg-sky-600 whitespace-nowrap"
    >
      <Copy className="size-4" />
      {copyStatus === 'copied' ? 'Copied' : 'Copy'}
    </button>
    <button
      onClick={() => onAction('summarize')}
      className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-1 hover:bg-sky-600 whitespace-nowrap"
    >
      <Sparkles className="size-4" />
      Summarize
    </button>
    <button
      onClick={() => onAction('explain')}
      className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-1 hover:bg-sky-600 whitespace-nowrap"
    >
      <StickyNote className="size-4" />
      Explain
    </button>
    <button
      onClick={() => onAction('chat')}
      className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-1 hover:bg-sky-600 whitespace-nowrap"
    >
      <MessageSquare className="size-4" />
      Chat
    </button>
    <button
      onClick={() => onAction('questions')}
      className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-1 hover:bg-sky-600 whitespace-nowrap"
    >
      <CircleHelp className="size-4" />
      Questions
    </button>
    <button
      onClick={() => onAction('highlight')}
      className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-1 hover:bg-amber-600 whitespace-nowrap"
    >
      <Highlighter className="size-4" />
      Highlight
    </button>
  </div>
)

export default FloatingMenu
