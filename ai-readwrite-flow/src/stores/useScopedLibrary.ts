import { useEffect, useMemo } from 'react'
import useWriterProjectStore from '../features/editor/stores/writerProjectStore'
import useLibraryStore from './libraryStore'
import useProjectBooksStore from './projectBooksStore'
import type { LibraryItem } from '../features/library/services/libraryImport'

type Scope = 'global' | 'project'

type ScopedLibrary = {
  items: LibraryItem[]
  activeId: string | null
  activeItem: LibraryItem | null
}

export const useScopedLibrary = (scope: Scope): ScopedLibrary => {
  const items = useLibraryStore((s) => s.items)
  const activeId = useLibraryStore((s) => s.activeId ?? null)
  const setActive = useLibraryStore((s) => s.setActive)
  const activeProjectId = useWriterProjectStore((s) => s.activeProjectId)
  const booksByProjectId = useProjectBooksStore((s) => s.booksByProjectId)
  const hydrateProjectBooks = useProjectBooksStore((s) => s.hydrate)

  const scopedItems = useMemo(() => {
    if (scope !== 'project' || !activeProjectId) return items
    const allowed = new Set(booksByProjectId[activeProjectId] ?? [])
    if (allowed.size === 0) return []
    return items.filter((item) => allowed.has(item.id))
  }, [activeProjectId, booksByProjectId, items, scope])

  useEffect(() => {
    void hydrateProjectBooks()
  }, [hydrateProjectBooks])

  const scopedActiveId = useMemo(() => {
    if (scope !== 'project' || !activeProjectId) return activeId
    if (activeId && scopedItems.some((item) => item.id === activeId)) return activeId
    return scopedItems[0]?.id ?? null
  }, [activeId, activeProjectId, scopedItems, scope])

  useEffect(() => {
    if (scope !== 'project' || !activeProjectId) return
    if (!scopedActiveId) return
    if (scopedActiveId === activeId) return
    setActive(scopedActiveId)
  }, [activeId, activeProjectId, scopedActiveId, scope, setActive])

  const activeItem = useMemo(() => {
    if (!scopedActiveId) return null
    return scopedItems.find((item) => item.id === scopedActiveId) ?? null
  }, [scopedActiveId, scopedItems])

  return { items: scopedItems, activeId: scopedActiveId, activeItem }
}
