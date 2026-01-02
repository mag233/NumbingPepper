import { useCallback, useEffect, useMemo, useState } from 'react'
import { BookPlus, ChevronDown, ChevronRight, Eraser, FileDown, Sparkles, Trash2 } from 'lucide-react'
import Card from '../../../shared/components/Card'
import useWriterArtifactsStore from '../stores/writerArtifactsStore'
import useWriterProjectStore from '../stores/writerProjectStore'
import useWriterToastStore from '../stores/writerToastStore'

const buttonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-chrome-border/70 bg-surface-raised/60 px-3 py-2 text-xs text-ink-primary hover:border-accent disabled:opacity-60'

const miniButtonClass =
  'inline-flex items-center justify-center gap-1 rounded-lg border border-chrome-border/70 bg-surface-raised/60 px-2 py-1 text-[11px] text-ink-primary hover:border-accent disabled:opacity-60'

const artifactRowClass = 'flex items-center gap-2 rounded-lg border border-chrome-border/70 bg-surface-raised/40 px-2 py-2'

const typeLabel = (type: string) => {
  switch (type) {
    case 'kickoff':
      return 'Kickoff'
    case 'definition':
      return 'Definition'
    case 'explanation':
      return 'Explain'
    case 'rewrite':
      return 'Rewrite'
    case 'polish':
      return 'Polish'
    default:
      return type
  }
}

const WriterStudioPanel = () => {
  const activeProjectId = useWriterProjectStore((s) => s.activeProjectId)
  const { toast, pending, cancelPending, confirmCreate } = useWriterToastStore()
  const {
    hydrate,
    artifacts,
    generating,
    error,
    generate,
    requestInsert,
    appendArtifactToContext,
    saveArtifactAsReference,
    deleteArtifact,
  } = useWriterArtifactsStore()

  const [instruction, setInstruction] = useState('')
  const [showAllArtifacts, setShowAllArtifacts] = useState(false)
  const [collapsed, setCollapsed] = useState(true)
  const [expandedPreviews, setExpandedPreviews] = useState<Record<string, boolean>>({})

  const hasArtifacts = artifacts.length > 0

  const helperText = useMemo(() => {
    if (generating) return 'Generating...'
    if (error) return error
    return 'Generate an artifact first; insert only when ready.'
  }, [error, generating])

  useEffect(() => {
    void hydrate(activeProjectId)
  }, [activeProjectId, hydrate])

  useEffect(() => {
    if (!toast || pending?.kind !== 'artifact') return
    window.setTimeout(() => setCollapsed(false), 0)
  }, [pending?.kind, toast])

  const togglePreview = useCallback((artifactId: string) => {
    setExpandedPreviews((current) => ({ ...current, [artifactId]: !current[artifactId] }))
  }, [])

  return (
    <Card
      title="Studio"
      action={
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-ink-muted">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-amber-300" />
            <span>{activeProjectId ? 'Project-scoped' : 'No active project'}</span>
          </div>
          <button
            type="button"
            className="rounded-lg border border-chrome-border/70 bg-surface-raised/60 px-2 py-1 text-[11px] text-ink-primary hover:border-accent"
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
      }
      className={collapsed ? '' : 'space-y-3'}
    >
      {collapsed ? null : (
        <>
          {toast && pending?.kind === 'artifact' && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-2 text-xs text-amber-100">
              <span className="flex-1">{toast.message}</span>
              <button
                onClick={() => void confirmCreate()}
                className="rounded border border-amber-400 px-2 py-1 text-amber-50 hover:border-amber-300"
              >
                Create
              </button>
              <button
                onClick={cancelPending}
                className="rounded border border-amber-400/40 px-2 py-1 text-amber-50/90 hover:border-amber-300/70"
              >
                Cancel
              </button>
            </div>
          )}

          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            rows={2}
            placeholder="Optional instruction (e.g., audience, tone, constraints)..."
            className="w-full rounded-xl border border-chrome-border/70 bg-surface-raised/60 p-3 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none"
          />

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(['kickoff', 'definition', 'explanation', 'rewrite', 'polish'] as const).map((type) => (
              <button
                key={type}
                type="button"
                disabled={generating}
                onClick={() => void generate(type, instruction)}
                className={buttonClass}
              >
                <Sparkles className="size-4 text-accent" />
                {typeLabel(type)}
              </button>
            ))}
          </div>

          <p className={`text-xs ${error ? 'text-amber-100' : 'text-ink-muted'}`}>{helperText}</p>

          {!hasArtifacts && <p className="text-sm text-ink-muted">No artifacts yet.</p>}
          {hasArtifacts && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-ink-muted">Artifacts ({artifacts.length})</p>
                {artifacts.length > 3 && (
                  <button
                    type="button"
                    className="rounded-lg border border-chrome-border/70 bg-surface-raised/60 px-2 py-1 text-[11px] text-ink-primary hover:border-accent"
                    onClick={() => setShowAllArtifacts((v) => !v)}
                  >
                    {showAllArtifacts ? 'Recent' : 'All...'}
                  </button>
                )}
              </div>

              <div className={`grid gap-2 ${showAllArtifacts ? 'max-h-72 overflow-y-auto pr-1' : ''}`}>
                {(showAllArtifacts ? artifacts : artifacts.slice(0, 3)).map((artifact) => (
                  <div key={artifact.id} className="space-y-2">
                    <div className={artifactRowClass}>
                      <button
                        type="button"
                        onClick={() => togglePreview(artifact.id)}
                        className="inline-flex items-center justify-center rounded-md p-1 text-ink-muted hover:bg-surface-base/40 hover:text-ink-primary"
                        title={expandedPreviews[artifact.id] ? 'Hide preview' : 'Show preview'}
                        aria-expanded={expandedPreviews[artifact.id] ?? false}
                        aria-label="Toggle artifact preview"
                      >
                        {expandedPreviews[artifact.id] ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-ink-primary">{artifact.title}</p>
                          <span className="shrink-0 rounded-md border border-chrome-border/70 bg-surface-base/40 px-2 py-0.5 text-[11px] text-ink-muted">
                            {typeLabel(artifact.type)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className={miniButtonClass}
                          onClick={() => requestInsert(artifact.id)}
                          title="Insert into the writer content at cursor"
                        >
                          <FileDown className="size-4 text-accent" />
                          <span className="hidden md:inline">Insert</span>
                        </button>
                        <button
                          type="button"
                          className={miniButtonClass}
                          onClick={() => appendArtifactToContext(artifact.id)}
                          title="Append to Writer Context"
                        >
                          <BookPlus className="size-4 text-accent" />
                          <span className="hidden md:inline">Ctx</span>
                        </button>
                        <button
                          type="button"
                          className={miniButtonClass}
                          onClick={() => void saveArtifactAsReference(artifact.id)}
                          title="Save as a manual reference"
                        >
                          <Eraser className="size-4 text-accent" />
                          <span className="hidden md:inline">Ref</span>
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-chrome-border/70 p-2 text-ink-muted hover:border-red-500 hover:text-red-200"
                          title="Delete artifact"
                          onClick={() => void deleteArtifact(artifact.id)}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>

                    {expandedPreviews[artifact.id] && (
                      <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-chrome-border/70 bg-surface-base/40 p-2 text-xs text-ink-primary">
                        {artifact.contentText}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  )
}

export default WriterStudioPanel
