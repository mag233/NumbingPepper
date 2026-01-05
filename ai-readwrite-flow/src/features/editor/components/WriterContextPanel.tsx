import useWriterContextStore from '../stores/writerContextStore'
import { estimateTokens } from '../services/tokenEstimate'

const btn =
  'inline-flex items-center justify-center rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-3 py-1 text-xs text-ink-primary hover:border-accent'

const contextSoftTokenLimit = 2000

type Props = {
  fill?: boolean
  noTopMargin?: boolean
  embedded?: boolean
}

const WriterContextPanel = ({ fill, noTopMargin, embedded }: Props) => {
  const { contextText, setContextText, clearContext, undoLastAppend, lastAppendUndo, projectId } =
    useWriterContextStore()

  const approxTokens = estimateTokens(contextText)
  const overSoftLimit = approxTokens >= contextSoftTokenLimit

  const wrapperClass = embedded
    ? `${fill ? 'flex h-full min-h-0 flex-col' : ''}`
    : `rounded-xl border border-chrome-border/70 bg-surface-raised/40 p-3 ${noTopMargin ? '' : 'mt-3'} ${
        fill ? 'flex h-full min-h-0 flex-col' : ''
      }`

  return (
    <div
      className={wrapperClass}
    >
        <div className="mb-2 flex items-center justify-between gap-2">
          {!embedded && <div className="text-xs text-ink-primary">Context (project-scoped)</div>}
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-muted">
              {contextText.length} chars | ~{approxTokens} tokens
            </span>
            {overSoftLimit && (
              <span className="rounded-md border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-200">
                Long context (soft limit ~{contextSoftTokenLimit})
              </span>
            )}
            {lastAppendUndo && (
              <button className={btn} onClick={undoLastAppend} disabled={!projectId} title="Undo the last append action">
                Undo append
              </button>
            )}
            <button className={btn} onClick={clearContext} disabled={!contextText || !projectId}>
              Clear
            </button>
          </div>
        </div>
      <textarea
        id="writer-context-textarea"
        value={contextText}
        onChange={(e) => setContextText(e.target.value)}
        placeholder="Paste or type context here. Reader highlights can be appended later."
        className={`w-full rounded-lg border border-chrome-border/70 bg-surface-base/30 p-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none ${fill ? 'min-h-0 flex-1 resize-none' : 'min-h-32 resize-y'}`}
      />
    </div>
  )
}

export default WriterContextPanel
