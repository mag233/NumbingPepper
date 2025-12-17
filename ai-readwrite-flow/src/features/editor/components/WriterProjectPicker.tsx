import { Check, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import useWriterProjectStore from '../stores/writerProjectStore'
import { filterProjectsByTag } from '../services/writerProjectTagFilter'

const btn =
  'inline-flex items-center justify-center rounded-lg border border-slate-800/70 bg-slate-900/70 px-2 py-1 text-xs text-slate-100 hover:border-sky-500'

type Props = { className?: string }

const WriterProjectPicker = ({ className }: Props) => {
  const { projects, activeProjectId, selectProject, createProject, renameProject, deleteProject } =
    useWriterProjectStore()
  const tagFilter = useWriterProjectStore((s) => s.tagFilter)
  const allTags = useWriterProjectStore((s) => s.allTags)
  const tagsByProjectId = useWriterProjectStore((s) => s.tagsByProjectId)
  const setTagFilter = useWriterProjectStore((s) => s.setTagFilter)
  const [open, setOpen] = useState(false)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const activeTitle = useMemo(() => {
    const active = projects.find((p) => p.id === activeProjectId)
    return active?.title ?? 'No project'
  }, [activeProjectId, projects])

  const visibleProjects = useMemo(
    () => filterProjectsByTag(projects, tagsByProjectId, tagFilter),
    [projects, tagsByProjectId, tagFilter],
  )

  return (
    <div className={`relative ${className ?? ''}`}>
      <div className="flex items-center gap-2">
        <span className="max-w-[12rem] truncate text-xs text-slate-300" title={activeTitle}>
          Active: {activeTitle}
        </span>
        <button className={btn} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          Projects
        </button>
        <button
          className={btn}
          onClick={() => void createProject().then(() => setOpen(true))}
          aria-label="New project"
        >
          <Plus className="size-4" />
        </button>
      </div>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-72 rounded-xl border border-slate-800/70 bg-slate-950/90 p-2 shadow-xl">
          <div className="mb-2 flex items-center gap-2">
            <select
              value={tagFilter ?? ''}
              onChange={(e) => setTagFilter(e.target.value || null)}
              className="w-full rounded-lg border border-slate-800/70 bg-slate-900/70 px-2 py-1 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
            >
              <option value="">All tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </select>
          </div>
          <div className="max-h-64 overflow-auto">
            {visibleProjects.length ? (
              visibleProjects.map((p) => {
                const active = p.id === activeProjectId
                const isRenaming = renameId === p.id
                const deleting = confirmDeleteId === p.id
                const tags = tagsByProjectId[p.id] ?? []
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1 ${active ? 'bg-slate-900/70' : 'hover:bg-slate-900/40'}`}
                  >
                    <button
                      className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left text-sm text-slate-100"
                      onClick={() => selectProject(p.id)}
                      title={p.title}
                    >
                      <span className="flex w-full items-center gap-2">
                        <span className="truncate">{p.title}</span>
                        {active && <Check className="size-4 text-sky-300" />}
                      </span>
                      {tags.length > 0 && (
                        <span className="text-[11px] text-slate-500">
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
                          void renameProject(p.id, renameValue).then((ok) => {
                            if (!ok) return
                            setRenameId(null)
                            setRenameValue('')
                          })
                        }}
                      >
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="w-24 rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                        />
                        <button className={btn} type="submit" aria-label="Save rename">
                          <Check className="size-4" />
                        </button>
                      </form>
                    ) : (
                      <button
                        className={btn}
                        onClick={() => {
                          setRenameId(p.id)
                          setRenameValue(p.title)
                        }}
                        aria-label="Rename project"
                      >
                        <Pencil className="size-4" />
                      </button>
                    )}
                    <button
                      className={`${btn} ${deleting ? 'border-amber-500/60 text-amber-100 hover:border-amber-400' : ''}`}
                      onClick={() => {
                        if (!deleting) {
                          setConfirmDeleteId(p.id)
                          return
                        }
                        void deleteProject(p.id).then(() => setConfirmDeleteId(null))
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
              <p className="p-2 text-xs text-slate-400">
                {projects.length ? 'No projects match this tag.' : 'No projects yet. Click + to create one.'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default WriterProjectPicker
