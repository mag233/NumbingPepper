import { useState } from 'react'
import useWriterContextStore from '../stores/writerContextStore'
import useWriterChatStore from '../stores/writerChatStore'
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
  const clearChat = useWriterChatStore((s) => s.clear)
  const [showClearPrompt, setShowClearPrompt] = useState(false)

  const approxTokens = estimateTokens(contextText)
  const overSoftLimit = approxTokens >= contextSoftTokenLimit

  const wrapperClass = embedded
    ? `${fill ? 'flex h-full min-h-0 flex-col' : ''}`
    : `rounded-xl border border-chrome-border/70 bg-surface-raised/40 p-3 ${noTopMargin ? '' : 'mt-3'} ${
        fill ? 'flex h-full min-h-0 flex-col' : ''
      }`

  const handleClear = (mode: 'context' | 'context+chat') => {
    clearContext()
    if (mode === 'context+chat') {
      void clearChat()
    }
    setShowClearPrompt(false)
  }

  return (
    <div className={wrapperClass}>
      {showClearPrompt && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowClearPrompt(false)}
            aria-label="Close clear prompt"
          />
          <section className="absolute left-1/2 top-1/2 w-11/12 max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-chrome-border/70 bg-surface-base/95 p-4 shadow-2xl">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-ink-primary">Clear context</div>
              <p className="text-xs text-ink-muted">Choose whether to clear just Context or both Context and Chat.</p>
              <div className="flex items-center justify-end gap-2">
                <button type="button" className={btn} onClick={() => setShowClearPrompt(false)}>
                  Cancel
                </button>
                <button type="button" className={btn} onClick={() => handleClear('context')}>
                  Clear context only
                </button>
                <button type="button" className={btn} onClick={() => handleClear('context+chat')}>
                  Clear context + chat
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
      <div className="mb-2 flex items-center justify-between gap-2">
        {!embedded && <div className="text-xs text-ink-primary">Context (project-scoped)</div>}
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-muted">
            {contextText.length} chars | ~{approxTokens} tokens
          </span>
          {overSoftLimit && (
            <span className="rounded-md border border-status-warning/50 bg-status-warning/10 px-2 py-0.5 text-[11px] text-status-warning">
              Long context (soft limit ~{contextSoftTokenLimit})
            </span>
          )}
          {lastAppendUndo && (
            <button className={btn} onClick={undoLastAppend} disabled={!projectId} title="Undo the last append action">
              Undo append
            </button>
          )}
          <button
            className={btn}
            onClick={() => setShowClearPrompt(true)}
            disabled={!contextText || !projectId}
          >
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
