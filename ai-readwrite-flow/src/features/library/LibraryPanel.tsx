import { useRef } from 'react'
import { BookOpen, FolderDown, LibraryBig } from 'lucide-react'
import Card from '../../shared/components/Card'
import useLibraryStore from '../../stores/libraryStore'

type Props = {
  compact?: boolean
  onOpen?: () => void
}

const formatSize = (size: number) => {
  if (size > 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  if (size > 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${size} B`
}

const LibraryPanel = ({ compact = false, onOpen }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { items, activeId, addItems, setActive } = useLibraryStore()

  const handleFiles = (fileList?: FileList | null) => {
    if (!fileList?.length) return
    addItems(Array.from(fileList))
    onOpen?.()
  }

  return (
    <Card
      title="Library"
      action={
        <button
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-800/80 px-3 py-1 text-xs text-slate-200 hover:border-sky-400 hover:text-sky-200"
        >
          <FolderDown className="size-4" />
          Import
        </button>
      }
      className={compact ? 'p-3' : ''}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          handleFiles(event.dataTransfer.files)
        }}
        className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-800/80 bg-slate-900/40 p-4"
      >
        {items.length === 0 && (
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <LibraryBig className="size-5 text-slate-500" />
            <p>Drag & drop PDFs or click Import. Files will be stored to $APP_DATA/library (pending command wiring).</p>
          </div>
        )}
        {items.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActive(item.id)
                  onOpen?.()
                }}
                className={`flex flex-col items-start gap-1 rounded-xl border px-3 py-2 text-left transition hover:border-sky-500 hover:bg-slate-900 ${
                  activeId === item.id
                    ? 'border-sky-500/70 bg-slate-900'
                    : 'border-slate-800/70 bg-slate-900/40'
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <BookOpen className="size-4 text-sky-300" />
                  <span className="line-clamp-1">{item.name}</span>
                </div>
                <p className="text-xs text-slate-400">{formatSize(item.size)}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

export default LibraryPanel
