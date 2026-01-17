import { useEffect, useMemo } from 'react'
import useWriterProjectStore from '../../editor/stores/writerProjectStore'

type Props = {
  compact?: boolean
}

const ProjectScopeSelector = ({ compact = false }: Props) => {
  const projects = useWriterProjectStore((s) => s.projects)
  const activeProjectId = useWriterProjectStore((s) => s.activeProjectId)
  const status = useWriterProjectStore((s) => s.status)
  const hydrate = useWriterProjectStore((s) => s.hydrate)
  const selectProject = useWriterProjectStore((s) => s.selectProject)

  const activeTitle = useMemo(() => {
    const active = projects.find((p) => p.id === activeProjectId)
    return active?.title ?? 'Global'
  }, [activeProjectId, projects])

  useEffect(() => {
    if (status === 'idle') void hydrate()
  }, [hydrate, status])

  const labelClass = compact ? 'sr-only' : 'text-[11px] uppercase tracking-wide'

  return (
    <label className="flex items-center gap-2 text-xs text-ink-muted">
      <span className={labelClass}>Scope</span>
      <select
        value={activeProjectId ?? ''}
        onChange={(event) => {
          const value = event.target.value
          selectProject(value || null)
        }}
        className="max-w-[12rem] rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-2 py-1 text-xs text-ink-primary focus:border-accent focus:outline-none"
        title={`Scope: ${activeTitle}`}
      >
        <option value="">Global (no project)</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.title}
          </option>
        ))}
      </select>
    </label>
  )
}

export default ProjectScopeSelector
