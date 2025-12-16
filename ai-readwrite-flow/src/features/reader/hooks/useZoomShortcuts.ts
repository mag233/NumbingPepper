import { useEffect } from 'react'
import useReaderStore from '../../../stores/readerStore'

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select'
}

export const useZoomShortcuts = () => {
  const zoomIn = useReaderStore((s) => s.zoomIn)
  const zoomOut = useReaderStore((s) => s.zoomOut)
  const resetZoom = useReaderStore((s) => s.resetZoom)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isAccel = event.ctrlKey || event.metaKey
      if (!isAccel) return
      if (isEditableTarget(event.target)) return

      if (event.key === '+' || event.key === '=') {
        event.preventDefault()
        zoomIn()
        return
      }
      if (event.key === '-') {
        event.preventDefault()
        zoomOut()
        return
      }
      if (event.key === '0') {
        event.preventDefault()
        resetZoom()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [resetZoom, zoomIn, zoomOut])
}

