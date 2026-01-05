import { useEffect, useMemo, useState } from 'react'
import { BookmarkPlus, Pencil, Trash2 } from 'lucide-react'
import useBookmarkStore from '../../../stores/bookmarkStore'
import useReaderStore, { type PageLabels } from '../../../stores/readerStore'
import { formatPageForDisplay } from '../services/pageLabels'
import { generateBookmarkId } from '../services/bookmarkIds'
import type { Bookmark } from '../types'

type Props = {
  activeBookId: string | null
  currentPage: number
  pageLabels: PageLabels | null
}

const buttonClass =
  'inline-flex items-center gap-1 rounded-lg border border-chrome-border/70 bg-surface-raised/60 px-2 py-1 text-[11px] text-ink-primary hover:border-accent'

const formatBookmarkLabel = (bookmark: Bookmark) => {
  if (bookmark.title && bookmark.title.trim()) return bookmark.title.trim()
  if (bookmark.pageLabel && bookmark.pageLabel.trim()) return bookmark.pageLabel.trim()
  return `Page ${bookmark.page}`
}

const ReaderBookmarksPanel = ({ activeBookId, currentPage, pageLabels }: Props) => {
  const requestJump = useReaderStore((s) => s.requestJump)
  const { byBookId, hydrate, add, remove, rename } = useBookmarkStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')

  useEffect(() => {
    if (!activeBookId) return
    void hydrate(activeBookId)
  }, [activeBookId, hydrate])

  const bookmarks = useMemo(() => {
    if (!activeBookId) return []
    return byBookId[activeBookId] ?? []
  }, [activeBookId, byBookId])

  const addBookmark = () => {
    if (!activeBookId) return
    const now = Date.now()
    const pageLabel = formatPageForDisplay(currentPage, pageLabels)
    const bookmark: Bookmark = {
      id: generateBookmarkId(),
      bookId: activeBookId,
      page: currentPage,
      pageLabel,
      title: null,
      createdAt: now,
      updatedAt: now,
    }
    void add(bookmark)
  }

  const beginEdit = (bookmark: Bookmark) => {
    setEditingId(bookmark.id)
    setDraftTitle(bookmark.title ?? '')
  }

  const saveEdit = (bookmark: Bookmark) => {
    void rename(bookmark.id, bookmark.bookId, draftTitle)
    setEditingId(null)
    setDraftTitle('')
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <span>Saved marks</span>
        <button type="button" className={buttonClass} onClick={addBookmark} disabled={!activeBookId}>
          <BookmarkPlus className="size-3" />
          Add bookmark
        </button>
      </div>
      {bookmarks.length === 0 ? (
        <p className="rounded-lg border border-chrome-border/70 bg-surface-raised/60 p-2 text-xs text-ink-muted">
          No bookmarks yet.
        </p>
      ) : (
        <div className="space-y-2">
          {bookmarks.map((bookmark) => {
            const isEditing = editingId === bookmark.id
            return (
              <div
                key={bookmark.id}
                className="flex flex-col gap-2 rounded-lg border border-chrome-border/70 bg-surface-raised/60 px-2 py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left text-ink-primary hover:text-accent"
                    onClick={() => requestJump(bookmark.page)}
                    title={`Go to page ${bookmark.page}`}
                  >
                    {formatBookmarkLabel(bookmark)}
                  </button>
                  <span className="text-[11px] text-ink-muted">
                    {formatPageForDisplay(bookmark.page, pageLabels)}
                  </span>
                  <button
                    type="button"
                    className="rounded p-1 text-ink-muted hover:text-ink-primary"
                    onClick={() => beginEdit(bookmark)}
                    title="Edit title"
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    type="button"
                    className="rounded p-1 text-ink-muted hover:text-red-200"
                    onClick={() => void remove(bookmark.id, bookmark.bookId)}
                    title="Remove bookmark"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
                {isEditing && (
                  <div className="flex w-full flex-col gap-2">
                    <input
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      placeholder={bookmark.pageLabel ?? `Page ${bookmark.page}`}
                      className="w-full rounded-lg border border-chrome-border/70 bg-surface-base/70 px-2 py-1 text-xs text-ink-primary focus:border-accent focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="rounded border border-chrome-border/70 px-2 py-1 text-[11px] text-ink-primary hover:border-accent"
                        onClick={() => {
                          setEditingId(null)
                          setDraftTitle('')
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="rounded bg-accent px-2 py-1 text-[11px] font-semibold text-white hover:bg-accent/90"
                        onClick={() => saveEdit(bookmark)}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ReaderBookmarksPanel
