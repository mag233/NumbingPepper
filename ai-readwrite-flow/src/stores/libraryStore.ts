import { create } from 'zustand'
import {
  loadBooks,
  loadDeletedBooks,
  removeBook,
  restoreBook,
  type LastReadPosition,
  softDeleteBook,
  updateLastOpenedAt,
  updateLastReadPosition,
} from '../lib/db'
import { isTauri } from '../lib/isTauri'
import {
  type ImportSummary,
  type LibraryItem,
  importFilesTauri,
  importFilesWeb,
} from '../features/library/services/libraryImport'

type LibraryState = {
  items: LibraryItem[]
  trashItems: LibraryItem[]
  activeId?: string
  importFiles: (files: File[]) => Promise<ImportSummary>
  hydrate: () => Promise<void>
  setActive: (id: string) => void
  setLastPosition: (bookId: string, position: LastReadPosition) => Promise<void>
  removeFromLibrary: (bookId: string) => Promise<void>
  restoreFromTrash: (bookId: string) => Promise<void>
  deleteLocalFile: (bookId: string) => Promise<void>
}

const mergeUniqueById = (next: LibraryItem[], existing: LibraryItem[]) => {
  const filtered = existing.filter((item) => !next.some((n) => n.id === item.id))
  return [...next, ...filtered]
}

const useLibraryStore = create<LibraryState>((set, get) => ({
  items: [],
  trashItems: [],
  activeId: undefined,
  importFiles: async (files) => {
    if (!files.length) return { imported: 0, deduped: 0 }
    const paths = files
      .map((file) => (file as unknown as { path?: string })?.path)
      .filter((p): p is string => Boolean(p))
    const filesWithoutPath = files.filter((file) => !(file as unknown as { path?: string })?.path)
    const result = isTauri()
      ? await importFilesTauri(filesWithoutPath, paths)
      : await importFilesWeb(files)
    set((state) => ({
      items: mergeUniqueById(result.imported, state.items),
      activeId: result.imported[0]?.id ?? state.activeId,
    }))
    return result.summary
  },
  hydrate: async () => {
    const books = await loadBooks()
    const deleted = await loadDeletedBooks()
    const withUrls: LibraryItem[] = books.map((book) => {
      if (book.filePath.startsWith('data:')) return { ...book, url: book.filePath }
      if (!isTauri()) {
        // Web cannot read native paths; mark them as hidden for web to avoid broken selection.
        return { ...book, url: undefined }
      }
      return { ...book, url: undefined }
    })
    const deletedWithUrls: LibraryItem[] = deleted.map((book) => {
      if (book.filePath.startsWith('data:')) return { ...book, url: book.filePath }
      if (!isTauri()) return { ...book, url: undefined }
      return { ...book, url: undefined }
    })
    const visible = isTauri()
      ? withUrls
      : withUrls.filter((book) => typeof book.url === 'string' && book.url.startsWith('data:'))
    const visibleTrash = isTauri()
      ? deletedWithUrls
      : deletedWithUrls.filter((book) => typeof book.url === 'string' && book.url.startsWith('data:'))
    set((state) => ({
      items: visible,
      trashItems: visibleTrash,
      activeId: state.activeId ?? visible[0]?.id,
    }))
  },
  setActive: (id) => {
    set({ activeId: id })
    const openedAt = Date.now()
    set((state) => ({
      items: [...state.items]
        .map((book) => (book.id === id ? { ...book, lastOpenedAt: openedAt } : book))
        .sort((a, b) => (b.lastOpenedAt ?? b.addedAt) - (a.lastOpenedAt ?? a.addedAt)),
    }))
    void updateLastOpenedAt(id, openedAt)
  },
  setLastPosition: async (bookId, position) => {
    if (!bookId) return
    const { items } = get()
    set({
      items: items.map((book) =>
        book.id === bookId ? { ...book, lastReadPosition: position } : book,
      ),
    })
    await updateLastReadPosition(bookId, position)
  },
  removeFromLibrary: async (bookId) => {
    if (!bookId) return
    set((state) => ({
      items: state.items.filter((book) => book.id !== bookId),
      trashItems: [...state.trashItems, ...(state.items.filter((b) => b.id === bookId) ?? [])],
      activeId:
        state.activeId === bookId ? state.items.find((b) => b.id !== bookId)?.id : state.activeId,
    }))
    await softDeleteBook(bookId, Date.now())
  },
  restoreFromTrash: async (bookId) => {
    if (!bookId) return
    const restored = get().trashItems.find((b) => b.id === bookId)
    set((state) => ({
      trashItems: state.trashItems.filter((book) => book.id !== bookId),
      items: restored ? mergeUniqueById([restored], state.items) : state.items,
      activeId: state.activeId ?? restored?.id,
    }))
    await restoreBook(bookId)
  },
  deleteLocalFile: async (bookId) => {
    if (!bookId) return
    const item = get().items.find((b) => b.id === bookId) ?? get().trashItems.find((b) => b.id === bookId)
    if (!item) return
    const parentDir = item.filePath.replace(/[\\/][^\\/]+$/, '')
    set((state) => ({
      items: state.items.filter((b) => b.id !== bookId),
      trashItems: state.trashItems.filter((b) => b.id !== bookId),
      activeId: state.activeId === bookId ? state.items.find((b) => b.id !== bookId)?.id : state.activeId,
    }))
    await removeBook(bookId)
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core')
      void invoke('remove_path', { path: parentDir })
    }
  },
}))

export default useLibraryStore
