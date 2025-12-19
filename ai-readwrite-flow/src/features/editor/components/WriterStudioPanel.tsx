import { useMemo, useState } from 'react'
import { BookPlus, Eraser, FileDown, Sparkles, Trash2 } from 'lucide-react'
import Card from '../../../shared/components/Card'
import useWriterProjectStore from '../stores/writerProjectStore'
import useWriterArtifactsStore from '../stores/writerArtifactsStore'
import useWriterToastStore from '../stores/writerToastStore'

const buttonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-chrome-border/70 bg-surface-raised/60 px-3 py-2 text-xs text-ink-primary hover:border-accent disabled:opacity-60'

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
  const { artifacts, generating, error, generate, requestInsert, appendArtifactToContext, saveArtifactAsReference, deleteArtifact } =
    useWriterArtifactsStore()
  const [instruction, setInstruction] = useState('')

  const hasArtifacts = artifacts.length > 0
  const helperText = useMemo(() => {
    if (generating) return 'Generating…'
    if (error) return error
    return 'Generate an artifact first; insert only when ready.'
  }, [error, generating])

  return (
    <Card
      title="Studio"
      action={
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <Sparkles className="size-4 text-amber-300" />
          <span>{activeProjectId ? 'Project-scoped' : 'No active project'}</span>
        </div>
      }
      className="space-y-3"
    >
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
        placeholder="Optional instruction (e.g., audience, tone, constraints)…"
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
        <div className="grid gap-2">
          {artifacts.slice(0, 10).map((artifact) => (
            <div
              key={artifact.id}
              className="rounded-xl border border-chrome-border/70 bg-surface-raised/40 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-primary">{artifact.title}</p>
                  <p className="text-xs text-ink-muted">{typeLabel(artifact.type)}</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-chrome-border/70 p-2 text-ink-muted hover:border-red-500 hover:text-red-200"
                  title="Delete artifact"
                  onClick={() => void deleteArtifact(artifact.id)}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <details className="mt-2">
                <summary className="cursor-pointer select-none text-xs text-ink-muted">Preview</summary>
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-chrome-border/70 bg-surface-base/40 p-2 text-xs text-ink-primary">
                  {artifact.contentText}
                </pre>
              </details>

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() => requestInsert(artifact.id)}
                  title="Insert into the writer content at cursor"
                >
                  <FileDown className="size-4 text-accent" />
                  Insert
                </button>
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() => appendArtifactToContext(artifact.id)}
                  title="Append to Writer Context"
                >
                  <BookPlus className="size-4 text-accent" />
                  To Context
                </button>
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() => void saveArtifactAsReference(artifact.id)}
                  title="Save as a manual reference"
                >
                  <Eraser className="size-4 text-accent" />
                  To Ref
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default WriterStudioPanel

