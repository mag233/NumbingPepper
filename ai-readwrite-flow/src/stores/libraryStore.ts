import { create } from 'zustand'

export type LibraryItem = {
  id: string
  name: string
  size: number
  addedAt: number
  path?: string
  url?: string
}

type LibraryState = {
  items: LibraryItem[]
  activeId?: string
  addItems: (files: File[]) => void
  setActive: (id: string) => void
}

const createId = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)

const useLibraryStore = create<LibraryState>((set) => ({
  items: [],
  activeId: undefined,
  addItems: (files) =>
    set((state) => {
      const nextItems = files.map((file) => ({
        id: createId(),
        name: file.name,
        size: file.size,
        addedAt: Date.now(),
        path: (file as unknown as { path?: string })?.path,
        url: URL.createObjectURL(file),
      }))
      return { items: [...nextItems, ...state.items], activeId: nextItems[0]?.id ?? state.activeId }
    }),
  setActive: (id) => set({ activeId: id }),
}))

export default useLibraryStore
