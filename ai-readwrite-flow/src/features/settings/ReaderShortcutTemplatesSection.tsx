import { useMemo, useState } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import useReaderShortcutTemplateStore, {
  type ReaderShortcutTemplateId,
} from '../../stores/readerShortcutTemplateStore'

const inputClass =
  'w-full rounded-lg border border-chrome-border/80 bg-surface-raised/70 px-3 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none'

const templatesOrder: ReaderShortcutTemplateId[] = [
  'reader-ask-ai',
  'reader-summarize',
  'reader-explain',
  'reader-questions',
]

const ReaderShortcutTemplatesSection = () => {
  const useDefaults = useReaderShortcutTemplateStore((s) => s.useDefaults)
  const setUseDefaults = useReaderShortcutTemplateStore((s) => s.setUseDefaults)
  const setInstruction = useReaderShortcutTemplateStore((s) => s.setInstruction)
  const resetTemplate = useReaderShortcutTemplateStore((s) => s.resetTemplate)
  const resetAll = useReaderShortcutTemplateStore((s) => s.resetAll)
  const getEffectiveTemplate = useReaderShortcutTemplateStore((s) => s.getEffectiveTemplate)

  const [activeId, setActiveId] = useState<ReaderShortcutTemplateId>('reader-questions')
  const template = getEffectiveTemplate(activeId)
  const [draft, setDraft] = useState(template.instruction)

  const list = useMemo(() => templatesOrder.map((id) => getEffectiveTemplate(id)), [getEffectiveTemplate])

  const select = (id: ReaderShortcutTemplateId) => {
    setActiveId(id)
    setDraft(getEffectiveTemplate(id).instruction)
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-ink-primary">Reader Shortcut Templates</p>
        <p className="text-xs text-ink-muted">Controls Ask AI / Summarize / Explain / Questions.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-chrome-border/70 bg-surface-raised/50 p-3">
        <label className="inline-flex items-center gap-2 text-xs text-ink-primary">
          <input
            type="checkbox"
            checked={useDefaults}
            onChange={(e) => setUseDefaults(e.target.checked)}
            className="accent-accent"
          />
          Use defaults
        </label>
        <button
          type="button"
          onClick={() => {
            if (!window.confirm('Reset ALL template overrides?')) return
            resetAll()
            setDraft(getEffectiveTemplate(activeId).instruction)
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-chrome-border/70 px-3 py-2 text-xs text-ink-primary hover:border-status-warning/70 hover:text-status-warning"
        >
          <RefreshCcw className="size-4" />
          Reset all
        </button>
        {useDefaults && (
          <span className="ml-auto inline-flex items-center gap-2 text-xs text-status-warning">
            <AlertTriangle className="size-4" />
            Defaults are active; overrides are ignored until you turn this off.
          </span>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-[240px_1fr]">
        <div className="grid gap-2">
          {list.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => select(t.id)}
              className={`w-full rounded-xl border px-3 py-2 text-left ${
                t.id === activeId ? 'border-accent bg-accent/10' : 'border-chrome-border/70 bg-surface-raised/50 hover:border-accent'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold text-ink-primary">{t.shortLabel}</span>
                <span className="text-[11px] text-ink-muted">{t.autoSend ? 'Auto-send' : 'Draft'}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{t.description}</p>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-chrome-border/70 bg-surface-raised/50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink-primary">{template.label}</p>
              <p className="text-xs text-ink-muted">{template.description}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!window.confirm(`Reset "${template.shortLabel}" to default?`)) return
                resetTemplate(activeId)
                setDraft(getEffectiveTemplate(activeId).instruction)
              }}
              className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-chrome-border/70 px-3 py-2 text-xs text-ink-primary hover:border-status-warning/70 hover:text-status-warning"
            >
              <RefreshCcw className="size-4" />
              Reset
            </button>
          </div>

          <div className="mt-3 grid gap-2">
            <label className="text-[11px] uppercase tracking-wide text-ink-muted">Instruction text</label>
            {activeId === 'reader-questions' && (
              <div className="rounded-lg border border-chrome-border/70 bg-surface-base/70 p-2 text-xs text-ink-muted">
                <span className="font-semibold text-ink-primary">Questions output contract:</span> 3–5 items, each with{' '}
                <span className="text-ink-primary">Q:</span> and <span className="text-ink-primary">A:</span>; include tags{' '}
                <span className="text-ink-primary">[Terminology]</span>/<span className="text-ink-primary">[Logic]</span>/
                <span className="text-ink-primary">[Insight]</span>.
              </div>
            )}
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={10}
              className={inputClass}
              placeholder="(Optional) Enter instruction text..."
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDraft(getEffectiveTemplate(activeId).instruction)}
                className="rounded-lg border border-chrome-border/70 px-3 py-2 text-xs text-ink-primary hover:border-accent"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => setInstruction(activeId, draft)}
                className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent/90"
              >
                Save
              </button>
            </div>
            <p className="text-xs text-ink-muted">
              Changes here affect Reader shortcuts only. Writer templates are configured separately under the Writer tab.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReaderShortcutTemplatesSection
