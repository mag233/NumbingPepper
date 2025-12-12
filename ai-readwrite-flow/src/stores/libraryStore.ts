import { invoke } from '@tauri-apps/api/core'
import { create } from 'zustand'
import {
  findBookByHash,
  loadBooks,
  persistBook,
  type BookRecord,
  type LastReadPosition,
  updateLastReadPosition,
} from '../lib/db'
import { isTauri } from '../lib/isTauri'

export type LibraryItem = BookRecord & { url?: string }

type LibraryState = {
  items: LibraryItem[]
  activeId?: string
  importFiles: (files: File[]) => Promise<void>
  hydrate: () => Promise<void>
  setActive: (id: string) => void
  setLastPosition: (bookId: string, position: LastReadPosition) => Promise<void>
}

type TauriImportResult = {
  id: string
  file_name: string
  file_path: string
  file_hash: string
  file_size: number
  mtime: number
  format: string
  added_at: number
}

const titleFromName = (name: string) => name.replace(/\.[^/.]+$/, '') || name

const mapImportToRecord = (entry: TauriImportResult): BookRecord => ({
  id: entry.id,
  title: titleFromName(entry.file_name),
  filePath: entry.file_path,
  format: entry.format,
  fileHash: entry.file_hash,
  fileSize: entry.file_size,
  mtime: entry.mtime,
  addedAt: entry.added_at,
  processedForSearch: false,
})

const useLibraryStore = create<LibraryState>((set, get) => ({
  items: [],
  activeId: undefined,
  importFiles: async (files) => {
    if (!files.length) return
    if (!isTauri()) {
      const now = Date.now()
      const toDataUrl = async (file: File) => {
        const buffer = await file.arrayBuffer()
        const bytes = new Uint8Array(buffer)
        let binary = ''
        const chunk = 0x8000
        for (let i = 0; i < bytes.length; i += chunk) {
          binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
        }
        return `data:application/pdf;base64,${btoa(binary)}`
      }
      const fallbacks: LibraryItem[] = []
      for (const file of files) {
        const dataUrl = await toDataUrl(file)
        const id = crypto.randomUUID ? crypto.randomUUID() : `${now}-${Math.random()}`
        const record: LibraryItem = {
          id,
          title: titleFromName(file.name),
          filePath: dataUrl,
          format: 'pdf',
          fileSize: file.size,
          addedAt: now,
          url: dataUrl,
        }
        fallbacks.push(record)
        void persistBook(record)
      }
      set((state) => ({
        items: [...fallbacks, ...state.items],
        activeId: fallbacks[0]?.id ?? state.activeId,
      }))
      return
    }

    const paths = files
      .map((file) => (file as unknown as { path?: string })?.path)
      .filter((p): p is string => Boolean(p))
    let results: TauriImportResult[] = []

    if (paths.length) {
      results = await invoke<TauriImportResult[]>('copy_to_library', { paths })
    } else {
      const toBase64 = async (file: File) => {
        const buffer = await file.arrayBuffer()
        const bytes = new Uint8Array(buffer)
        let binary = ''
        const chunk = 0x8000
        for (let i = 0; i < bytes.length; i += chunk) {
          binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
        }
        return btoa(binary)
      }
      const payload = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          data_base64: await toBase64(file),
        })),
      )
      results = await invoke<TauriImportResult[]>('copy_files_payload', { files: payload })
    }

    const deduped: LibraryItem[] = []

    for (const entry of results) {
      const record = mapImportToRecord(entry)
      const existing = record.fileHash ? await findBookByHash(record.fileHash) : undefined
      if (existing) {
        deduped.push(existing)
        // If duplicated, best-effort cleanup of the extra copy.
        if (existing.filePath !== record.filePath) {
          void invoke('remove_path', { path: record.filePath })
        }
        continue
      }
      await persistBook(record)
      deduped.push(record)
    }

    set((state) => {
      const filtered = state.items.filter(
        (item) => !deduped.some((next) => next.id === item.id),
      )
      return {
        items: [...deduped, ...filtered],
        activeId: deduped[0]?.id ?? state.activeId,
      }
    })
  },
  hydrate: async () => {
    const books = await loadBooks()
    const withUrls = books.map((book) => {
      if (book.filePath.startsWith('data:')) return { ...book, url: book.filePath }
      if (!isTauri()) {
        // Web cannot read native paths; mark them as hidden for web to avoid broken selection.
        return { ...book, url: undefined }
      }
      return book
    })
    const visible = isTauri()
      ? withUrls
      : withUrls.filter((book) => typeof book.url === 'string' && book.url.startsWith('data:'))
    set((state) => ({
      items: visible,
      activeId: state.activeId ?? visible[0]?.id,
    }))
  },
  setActive: (id) => set({ activeId: id }),
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
}))

export default useLibraryStore
