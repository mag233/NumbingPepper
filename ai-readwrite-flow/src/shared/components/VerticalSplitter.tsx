import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

type Props = {
  disabled?: boolean
  label: string
  minPx: number
  maxPx: number
  valuePx: number
  onChange: (nextPx: number) => void
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const VerticalSplitter = ({ disabled, label, minPx, maxPx, valuePx, onChange }: Props) => {
  const startXRef = useRef<number>(0)
  const startValueRef = useRef<number>(0)
  const [dragging, setDragging] = useState(false)

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (disabled) return
      event.preventDefault()
      startXRef.current = event.clientX
      startValueRef.current = valuePx
      setDragging(true)

      const target = event.currentTarget
      target.setPointerCapture(event.pointerId)

      const onMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - startXRef.current
        onChange(clamp(startValueRef.current + delta, minPx, maxPx))
      }
      const onUp = () => {
        setDragging(false)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [disabled, maxPx, minPx, onChange, valuePx],
  )

  return (
    <div
      role="separator"
      aria-label={label}
      aria-orientation="vertical"
      aria-valuemin={minPx}
      aria-valuemax={maxPx}
      aria-valuenow={Math.round(valuePx)}
      onPointerDown={onPointerDown}
      className={`group relative w-3 shrink-0 ${disabled ? 'cursor-default' : 'cursor-col-resize'} ${
        dragging ? 'bg-accent/10' : ''
      }`}
    >
      <div
        className={`absolute inset-y-2 left-1/2 w-px -translate-x-1/2 rounded ${
          disabled ? 'bg-chrome-border/40' : 'bg-chrome-border/70 group-hover:bg-accent'
        }`}
      />
    </div>
  )
}

export default VerticalSplitter

