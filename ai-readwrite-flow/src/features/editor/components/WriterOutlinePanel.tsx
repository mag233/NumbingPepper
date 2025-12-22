import { BookOpen } from 'lucide-react'
import { useEffect } from 'react'
import useWriterProjectStore from '../stores/writerProjectStore'
import useWriterOutlineStore from '../stores/writerOutlineStore'
import useWriterEditorCommandStore from '../stores/writerEditorCommandStore'

type Props = {
  noTopMargin?: boolean
}

const WriterOutlinePanel = ({ noTopMargin }: Props) => {
  const activeProjectId = useWriterProjectStore((s) => s.activeProjectId)
  const { items, hydrate } = useWriterOutlineStore()
  const requestScrollToOutline = useWriterEditorCommandStore((s) => s.requestScrollToOutline)

  useEffect(() => {
    void hydrate(activeProjectId)
  }, [activeProjectId, hydrate])

  const padClassForLevel = (level: number) => {
    switch (level) {
      case 1:
        return 'pl-3'
      case 2:
        return 'pl-7'
      case 3:
        return 'pl-11'
      case 4:
        return 'pl-14'
      case 5:
        return 'pl-[4.25rem]'
      default:
        return 'pl-[5.25rem]'
    }
  }

  return (
    <div className={`rounded-xl border border-chrome-border/70 bg-surface-raised/40 p-3 ${noTopMargin ? '' : 'mt-3'}`}>
      <div className="mb-2 flex items-center gap-2 text-xs text-ink-primary">
        <BookOpen className="size-4 text-accent" />
        Outline
        <span className="text-ink-muted">({items.length})</span>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-ink-muted">Add markdown headings (e.g. `## Chapter`) to build an outline.</p>
      ) : (
        <div className="max-h-56 overflow-auto rounded-lg border border-chrome-border/60">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => requestScrollToOutline(item)}
              className={`flex w-full items-center border-b border-chrome-border/60 px-2 py-2 text-left text-sm text-ink-primary hover:bg-surface-raised/70 last:border-b-0 ${padClassForLevel(
                item.level,
              )}`}
              title={item.needle}
            >
              <span className="mr-2 shrink-0 rounded border border-chrome-border/60 bg-surface-base/30 px-1 py-0.5 text-[10px] text-ink-muted">
                H{item.level}
              </span>
              <span className="min-w-0 flex-1 truncate">{item.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default WriterOutlinePanel
