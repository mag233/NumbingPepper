import { useEffect, useMemo, useRef, useState } from 'react'
import { FolderDown, LibraryBig, Trash2 } from 'lucide-react'
import Card from '../../shared/components/Card'
import useLibraryStore from '../../stores/libraryStore'
import { isTauri } from '../../lib/isTauri'
import LibraryBookList from './components/LibraryBookList'
import LibrarySelectionPanel, { type PendingDelete } from './components/LibrarySelectionPanel'
type Props = {
  compact?: boolean
  onOpen?: () => void
}

const LibraryPanel = ({ compact = false, onOpen }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { items, trashItems, activeId, importFiles, setActive, removeFromLibrary, restoreFromTrash, deleteLocalFile } =
    useLibraryStore()
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null)
  const [view, setView] = useState<'library' | 'trash'>('library')
  const [trashSelectedId, setTrashSelectedId] = useState<string | null>(null)
  const [librarySelectedId, setLibrarySelectedId] = useState<string | null>(activeId ?? null)
  const isDesktop = isTauri()
  const list = view === 'trash' ? trashItems : items
  const resolvedLibrarySelectedId = useMemo(() => {
    if (view !== 'library') return null
    const candidate = librarySelectedId ?? activeId ?? items[0]?.id ?? null
    if (!candidate) return null
    if (items.some((item) => item.id === candidate)) return candidate
    return activeId ?? items[0]?.id ?? null
  }, [view, librarySelectedId, activeId, items])

  const selectedId = view === 'trash' ? trashSelectedId : resolvedLibrarySelectedId
  const activeItem = useMemo(() => list.find((i) => i.id === selectedId), [list, selectedId])
  const openItemTitle = useMemo(() => items.find((i) => i.id === activeId)?.title, [items, activeId])

  useEffect(() => {
    if (!pendingDelete) return
    const handle = window.setTimeout(() => setPendingDelete(null), 2500)
    return () => window.clearTimeout(handle)
  }, [pendingDelete])

  const switchView = (next: 'library' | 'trash') => {
    setPendingDelete(null)
    setInfo(null)
    setTrashSelectedId(null)
    setView(next)
  }

  const handleFiles = (fileList?: FileList | null) => {
    if (!fileList?.length) return
    const files = Array.from(fileList)
    void importFiles(files)
      .then((summary) => {
        setError(null)
        setInfo(summary.deduped ? `Already imported: reused ${summary.deduped} existing book(s).` : null)
        setView('library')
        setLibrarySelectedId(null)
        onOpen?.()
      })
      .catch((err) => {
        console.error(err)
        setError(
          err instanceof Error
            ? err.message
            : isTauri()
              ? 'Import failed. Check app data permissions.'
              : 'Import requires Tauri runtime; falling back to in-memory view.',
        )
        setInfo(null)
        // Store handles non-Tauri fallback; nothing else needed here.
      })
  }

  const runRemove = async (id: string) => {
    await removeFromLibrary(id)
    setPendingDelete(null)
    setInfo('Moved to Trash.')
  }

  const runRestore = async (id: string) => {
    await restoreFromTrash(id)
    setTrashSelectedId(null)
    setInfo('Restored to Library.')
  }

  const runDelete = async (id: string) => {
    await deleteLocalFile(id)
    setPendingDelete(null)
    setInfo('Deleted app copy.')
  }

  const selectLibrary = (id: string) => {
    setPendingDelete(null)
    setLibrarySelectedId(id)
  }

  const selectTrash = (id: string) => {
    setPendingDelete(null)
    setTrashSelectedId(id)
  }

  const openFromLibrary = (id: string) => {
    setPendingDelete(null)
    setLibrarySelectedId(id)
    setActive(id)
    onOpen?.()
  }

  return (
    <Card
      title={view === 'trash' ? 'Trash' : 'Library'}
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => switchView(view === 'library' ? 'trash' : 'library')}
            className="inline-flex items-center gap-2 rounded-lg border border-chrome-border/80 px-3 py-1 text-xs text-ink-primary hover:border-accent"
          >
            <Trash2 className="size-4" />
            {view === 'library' ? `Trash (${trashItems.length})` : 'Back to Library'}
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-chrome-border/80 px-3 py-1 text-xs text-ink-primary hover:border-accent"
          >
            <FolderDown className="size-4" />
            Add PDF...
          </button>
        </div>
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
        className="flex flex-col gap-3 rounded-xl border border-dashed border-chrome-border/80 bg-surface-raised/40 p-4"
      >
        {error && (
          <div className="rounded-lg border border-status-warning/70 bg-status-warning/10 p-2 text-xs text-status-warning">
            {error}
          </div>
        )}
        {info && (
          <div className="rounded-lg border border-chrome-border/70 bg-surface-raised/60 p-2 text-xs text-ink-primary">
            {info}
          </div>
        )}
        {items.length === 0 && (
          <div className="flex items-center gap-3 text-sm text-ink-muted">
            <LibraryBig className="size-5 text-ink-muted" />
            <p>Drag & drop PDFs or click Import. Files will be stored to the app data library with metadata persisted.</p>
          </div>
        )}
        {!isDesktop && items.length === 0 && (
          <p className="text-xs text-status-warning">
            Files imported on desktop are hidden here; re-import in web to view.
          </p>
        )}
        {list.length > 0 && (
          <LibraryBookList
            items={list}
            selectedId={selectedId}
            activeId={activeId ?? null}
            onSelect={(id) => {
              if (view === 'trash') {
                selectTrash(id)
                return
              }
              selectLibrary(id)
            }}
            onOpen={(id) => {
              if (view === 'trash') {
                selectTrash(id)
                return
              }
              openFromLibrary(id)
            }}
          />
        )}
        {activeItem && (
          <LibrarySelectionPanel
            view={view}
            selectedItem={activeItem}
            openItemTitle={openItemTitle}
            canOpenSelected={view === 'library' && activeId !== activeItem.id}
            isDesktop={isDesktop}
            pendingDelete={pendingDelete}
            setPendingDelete={setPendingDelete}
            onOpenSelected={() => openFromLibrary(activeItem.id)}
            onMoveToTrash={(id) => void runRemove(id)}
            onRestore={(id) => void runRestore(id)}
            onDeleteAppCopy={(id) => void runDelete(id)}
          />
        )}
      </div>
    </Card>
  )
}
export default LibraryPanel
