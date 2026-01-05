import { useEffect } from 'react'

type Params = {
  enabled: boolean
  currentPage: number
  pageCount: number
  setPage: (page: number) => void
}

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select'
}

export const usePagedKeyNav = ({ enabled, currentPage, pageCount, setPage }: Params) => {
  useEffect(() => {
    if (!enabled) return
    if (pageCount <= 0) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return
      const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown'
      const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp'
      if (!forward && !backward) return
      const next = currentPage + (forward ? 1 : -1)
      if (next < 1 || next > pageCount) return
      event.preventDefault()
      setPage(next)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [currentPage, enabled, pageCount, setPage])
}
