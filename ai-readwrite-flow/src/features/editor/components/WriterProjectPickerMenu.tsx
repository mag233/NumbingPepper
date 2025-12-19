import { Check, Pencil, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import useWriterProjectStore from '../stores/writerProjectStore'
import { filterProjectsByTag } from '../services/writerProjectTagFilter'

const btn =
  'inline-flex items-center justify-center rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-2 py-1 text-xs text-ink-primary hover:border-accent'

type Props = {
  variant: 'toolbar' | 'sidebar'
  startCreate: boolean
  onClose: () => void
}

const WriterProjectPickerMenu = ({ variant, startCreate, onClose }: Props) => {
  const { projects, activeProjectId, selectProject, createProject, renameProject, deleteProject } =
    useWriterProjectStore()
  const tagFilter = useWriterProjectStore((s) => s.tagFilter)
  const allTags = useWriterProjectStore((s) => s.allTags)
  const tagsByProjectId = useWriterProjectStore((s) => s.tagsByProjectId)
  const setTagFilter = useWriterProjectStore((s) => s.setTagFilter)

  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const [createMode, setCreateMode] = useState(startCreate)
  const [createTitle, setCreateTitle] = useState('')

  const dropdownCls =
    variant === 'sidebar'
      ? 'absolute left-0 top-8 z-50 w-full min-w-0 rounded-xl border border-chrome-border/70 bg-surface-base/95 p-2 shadow-xl'
      : 'absolute right-0 top-8 z-50 w-72 rounded-xl border border-chrome-border/70 bg-surface-base/95 p-2 shadow-xl'

  const visibleProjects = useMemo(
    () => filterProjectsByTag(projects, tagsByProjectId, tagFilter),
    [projects, tagsByProjectId, tagFilter],
  )

  const cancelRename = () => {
    setRenameId(null)
    setRenameValue('')
  }

  const cancelCreate = () => {
    setCreateMode(false)
    setCreateTitle('')
  }

  const closeMenu = () => {
    cancelRename()
    cancelCreate()
    setConfirmDeleteId(null)
    onClose()
  }

  return (
    <div className={dropdownCls}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-ink-primary">Projects</span>
        <button className={btn} onClick={closeMenu} type="button" aria-label="Close projects menu" title="Close">
          <X className="size-4" />
        </button>
      </div>

      <div className="mb-2 flex items-center gap-2">
        <select
          value={tagFilter ?? ''}
          onChange={(e) => setTagFilter(e.target.value || null)}
          className="w-full rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-2 py-1 text-xs text-ink-primary focus:border-accent focus:outline-none"
        >
          <option value="">All tags</option>
          {allTags.map((t) => (
            <option key={t} value={t}>
              #{t}
            </option>
          ))}
        </select>
      </div>

      {createMode && (
        <form
          className="mb-2 grid gap-2 rounded-lg border border-chrome-border/70 bg-surface-raised/40 p-2"
          onSubmit={(e) => {
            e.preventDefault()
            const title = createTitle.trim() || 'Untitled'
            void createProject(title).then((project) => {
              if (!project) return
              closeMenu()
            })
          }}
        >
          <input
            autoFocus
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
            className="w-full rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-2 py-1 text-xs text-ink-primary focus:border-accent focus:outline-none"
            placeholder="Project name (optional)"
          />
          <div className="flex items-center justify-end gap-2">
            <button className={btn} type="button" onClick={cancelCreate}>
              Cancel
            </button>
            <button className={btn} type="submit">
              Save
            </button>
          </div>
        </form>
      )}

      <div className="max-h-64 overflow-auto">
        {visibleProjects.length ? (
          visibleProjects.map((project) => {
            const active = project.id === activeProjectId
            const isRenaming = renameId === project.id
            const deleting = confirmDeleteId === project.id
            const tags = tagsByProjectId[project.id] ?? []
            return (
              <div
                key={project.id}
                className={`flex items-center gap-2 rounded-lg px-2 py-1 ${active ? 'bg-surface-raised/70' : 'hover:bg-surface-raised/40'}`}
              >
                <button
                  className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left text-sm text-ink-primary"
                  onClick={() => {
                    selectProject(project.id)
                    closeMenu()
                  }}
                  title={project.title}
                >
                  <span className="flex w-full items-center gap-2">
                    <span className="truncate">{project.title}</span>
                    {active && <Check className="size-4 text-accent" />}
                  </span>
                  {tags.length > 0 && (
                    <span className="text-[11px] text-ink-muted">
                      {tags.slice(0, 3).map((t) => `#${t}`).join(' ')}
                      {tags.length > 3 ? ` +${tags.length - 3}` : ''}
                    </span>
                  )}
                </button>

                {isRenaming ? (
                  <form
                    className="flex items-center gap-1"
                    onSubmit={(e) => {
                      e.preventDefault()
                      void renameProject(project.id, renameValue).then((ok) => {
                        if (!ok) return
                        cancelRename()
                      })
                    }}
                  >
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="w-24 rounded border border-chrome-border/70 bg-surface-raised/70 px-1 py-0.5 text-xs text-ink-primary focus:border-accent focus:outline-none"
                    />
                    <button className={btn} type="submit" aria-label="Save rename">
                      <Check className="size-4" />
                    </button>
                    <button className={btn} type="button" onClick={cancelRename} aria-label="Cancel rename">
                      <X className="size-4" />
                    </button>
                  </form>
                ) : (
                  <button
                    className={btn}
                    onClick={() => {
                      setRenameId(project.id)
                      setRenameValue(project.title)
                      setConfirmDeleteId(null)
                      setCreateMode(false)
                    }}
                    aria-label="Rename project"
                    title="Rename"
                  >
                    <Pencil className="size-4" />
                  </button>
                )}

                <button
                  className={`${btn} ${deleting ? 'border-amber-500/60 text-amber-100 hover:border-amber-400' : ''}`}
                  onClick={() => {
                    if (!deleting) {
                      setConfirmDeleteId(project.id)
                      return
                    }
                    void deleteProject(project.id).then(() => setConfirmDeleteId(null))
                  }}
                  aria-label={deleting ? 'Confirm delete project' : 'Delete project'}
                  title={deleting ? 'Click again to confirm delete' : 'Delete'}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            )
          })
        ) : (
          <p className="p-2 text-xs text-ink-muted">
            {projects.length ? 'No projects match this tag.' : 'No projects yet. Click + to create one.'}
          </p>
        )}
      </div>
    </div>
  )
}

export default WriterProjectPickerMenu
