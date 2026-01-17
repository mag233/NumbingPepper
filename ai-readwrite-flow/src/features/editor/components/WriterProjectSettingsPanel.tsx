import TagEditorCard from '../../../shared/components/TagEditorCard'
import useWriterProjectStore from '../stores/writerProjectStore'

const WriterProjectSettingsPanel = () => {
  const activeProjectId = useWriterProjectStore((s) => s.activeProjectId)
  const project = useWriterProjectStore((s) => s.projects.find((p) => p.id === activeProjectId) ?? null)
  const updateProjectTags = useWriterProjectStore((s) => s.updateProjectTags)

  if (!project) {
    return (
      <div className="rounded-lg border border-chrome-border/70 bg-surface-base/30 p-3 text-xs text-ink-muted">
        No active project selected.
      </div>
    )
  }

  return (
    <TagEditorCard
      title="Project tags"
      description="Default tags for Flomo. They will be prefixed with #ai_reader/ when sent."
      tags={project.tags ?? []}
      onSave={(next) => void updateProjectTags(project.id, next)}
    />
  )
}

export default WriterProjectSettingsPanel
