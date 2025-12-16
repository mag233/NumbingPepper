import { BookOpen, Circle, Dot } from 'lucide-react'
import type { LibraryItem } from '../services/libraryImport'
import { formatSize } from '../lib/formatSize'

type Props = {
  items: LibraryItem[]
  selectedId: string | null
  activeId: string | null
  onSelect: (id: string) => void
  onOpen: (id: string) => void
}

const getRowClassName = (selected: boolean, active: boolean) => {
  if (active) return 'border-sky-500/70 bg-slate-900'
  if (selected) return 'border-amber-500/60 bg-slate-900/60'
  return 'border-slate-800/70 bg-slate-900/40'
}

const LibraryBookList = ({ items, selectedId, activeId, onSelect, onOpen }: Props) => {
  if (items.length === 0) return null

  return (
    <div className="max-h-44 overflow-auto pr-1">
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const selected = selectedId === item.id
          const active = activeId === item.id
          return (
            <div
              key={item.id}
              className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 transition hover:border-sky-500 hover:bg-slate-900 ${getRowClassName(
                selected,
                active,
              )}`}
            >
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className="flex shrink-0 items-center justify-center rounded-md p-1 text-slate-200 hover:bg-slate-800/60"
                aria-label={selected ? 'Selected' : 'Select'}
                title={selected ? 'Selected' : 'Select'}
              >
                {selected ? <Dot className="size-5 text-amber-300" /> : <Circle className="size-5 text-slate-500" />}
              </button>
              <button
                type="button"
                onClick={() => onOpen(item.id)}
                className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                aria-label={`Open ${item.title}`}
              >
                <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-100">
                  <BookOpen className="size-4 text-sky-300" />
                  <span className="truncate">{item.title}</span>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{formatSize(item.fileSize)}</span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default LibraryBookList

