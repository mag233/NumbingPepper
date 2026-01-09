import { Plus, HistoryIcon, Camera } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import useWriterProjectStore from '../stores/writerProjectStore'
import WriterProjectPickerMenu from './WriterProjectPickerMenu'

type OnSnapshot = {
  onSaveSnapshot: () => void
  onShowHistory: () => void
}

const btn =
  'inline-flex items-center justify-center rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-2 py-1 text-xs text-ink-primary hover:border-accent'

type Props = {
  className?: string
  variant?: 'toolbar' | 'sidebar'
  onSnapshotActions?: OnSnapshot
}

type OpenMode = 'default' | 'create'

const WriterProjectPicker = ({ className, variant = 'toolbar', onSnapshotActions }: Props) => {
  const projects = useWriterProjectStore((s) => s.projects)
  const activeProjectId = useWriterProjectStore((s) => s.activeProjectId)

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<OpenMode>('default')
  const rootRef = useRef<HTMLDivElement | null>(null)

  const activeTitle = useMemo(() => {
    const active = projects.find((p) => p.id === activeProjectId)
    return active?.title ?? 'No project'
  }, [activeProjectId, projects])

  const closeMenu = () => {
    setOpen(false)
    setMode('default')
  }

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (rootRef.current?.contains(target)) return
      closeMenu()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      closeMenu()
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className={`relative ${className ?? ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`${variant === 'sidebar' ? 'w-full' : 'min-w-0 flex-1'} truncate text-xs text-ink-muted`} title={activeTitle}>
          Active: {activeTitle}
        </span>
        <div className="flex items-center gap-2">
          <button
            className={btn}
            onClick={() => {
              if (open) {
                closeMenu()
                return
              }
              setMode('default')
              setOpen(true)
            }}
            aria-expanded={open}
          >
            Projects
          </button>
          <button
            className={btn}
            onClick={() => {
              setMode('create')
              setOpen(true)
            }}
            aria-label="New project"
            title="New project"
          >
            <Plus className="size-4" />
          </button>
          {onSnapshotActions && (
            <>
              <button
                className={`${btn} border-accent/60 text-ink-primary hover:border-accent`}
                onClick={onSnapshotActions.onSaveSnapshot}
                aria-label="Save snapshot"
                title="Save snapshot"
              >
                <Camera className="size-4" />
              </button>
              <button
                className={btn}
                onClick={onSnapshotActions.onShowHistory}
                aria-label="Snapshot history"
                title="Snapshot history"
              >
                <HistoryIcon className="size-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {open && (
        <WriterProjectPickerMenu
          key={`${variant}:${mode}`}
          variant={variant}
          startCreate={mode === 'create'}
          onClose={closeMenu}
        />
      )}
    </div>
  )
}

export default WriterProjectPicker
