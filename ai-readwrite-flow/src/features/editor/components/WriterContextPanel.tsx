import useWriterContextStore from '../stores/writerContextStore'

const btn =
  'inline-flex items-center justify-center rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-1 text-xs text-slate-100 hover:border-sky-500'

const WriterContextPanel = () => {
  const { contextText, setContextText, clearContext, undoLastAppend, lastAppendUndo, projectId } =
    useWriterContextStore()

  return (
    <div className="mt-3 rounded-xl border border-slate-800/70 bg-slate-900/40 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-xs text-slate-300">Context (project-scoped)</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{contextText.length} chars</span>
            {lastAppendUndo && (
              <button className={btn} onClick={undoLastAppend} disabled={!projectId} title="Undo the last ‘append’ action">
                Undo append
              </button>
            )}
            <button className={btn} onClick={clearContext} disabled={!contextText || !projectId}>
              Clear
            </button>
          </div>
        </div>
      <textarea
        value={contextText}
        onChange={(e) => setContextText(e.target.value)}
        placeholder="Paste or type context here. Reader highlights can be appended later."
        className="min-h-32 w-full resize-y rounded-lg border border-slate-800/70 bg-slate-950/40 p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
      />
    </div>
  )
}

export default WriterContextPanel
