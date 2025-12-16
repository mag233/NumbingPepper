import { useEffect } from 'react'

type Params = {
  scrollRef: React.RefObject<HTMLDivElement | null>
  enabled: boolean
  currentPage: number
  pageCount: number
  setPage: (page: number) => void
}

export const usePagedWheelFlip = ({
  scrollRef,
  enabled,
  currentPage,
  pageCount,
  setPage,
}: Params) => {
  useEffect(() => {
    if (!enabled) return
    const el = scrollRef.current
    if (!el) return
    if (pageCount <= 0) return

    const onWheel = (event: WheelEvent) => {
      const canScroll = el.scrollHeight > el.clientHeight + 2
      if (canScroll) return
      const direction = event.deltaY > 0 ? 1 : -1
      const next = currentPage + direction
      if (next < 1 || next > pageCount) return
      event.preventDefault()
      event.stopPropagation()
      setPage(next)
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel as EventListener)
  }, [currentPage, enabled, pageCount, scrollRef, setPage])
}

