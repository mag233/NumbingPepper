import { useMemo, useState } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import useWriterSelectionTemplateStore, {
  type WriterSelectionTemplateId,
} from '../../stores/writerSelectionTemplateStore'
import WriterRewriteToneProfilesEditor from './WriterRewriteToneProfilesEditor'

const inputClass =
  'w-full rounded-lg border border-chrome-border/80 bg-surface-raised/70 px-3 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none'

const templatesOrder: WriterSelectionTemplateId[] = [
  'writer-ask-ai',
  'writer-simplify',
  'writer-concise',
  'writer-rewrite',
  'writer-translate',
  'writer-explain',
]

const WriterSelectionTemplatesSection = () => {
  const useDefaults = useWriterSelectionTemplateStore((s) => s.useDefaults)
  const setUseDefaults = useWriterSelectionTemplateStore((s) => s.setUseDefaults)
  const setTemplateInstruction = useWriterSelectionTemplateStore((s) => s.setTemplateInstruction)
  const resetTemplate = useWriterSelectionTemplateStore((s) => s.resetTemplate)
  const resetAllTemplates = useWriterSelectionTemplateStore((s) => s.resetAllTemplates)
  const getEffectiveTemplate = useWriterSelectionTemplateStore((s) => s.getEffectiveTemplate)

  const [activeId, setActiveId] = useState<WriterSelectionTemplateId>('writer-rewrite')
  const template = getEffectiveTemplate(activeId)
  const [draft, setDraft] = useState(template.instruction)

  const list = useMemo(() => templatesOrder.map((id) => getEffectiveTemplate(id)), [getEffectiveTemplate])

  const select = (id: WriterSelectionTemplateId) => {
    setActiveId(id)
    setDraft(getEffectiveTemplate(id).instruction)
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-ink-primary">Writer AI Templates</p>
        <p className="text-xs text-ink-muted">Controls selection actions (Simplify/Concise/Rewrite/Translate/Explain/Ask AI).</p>
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
            resetAllTemplates()
            setDraft(getEffectiveTemplate(activeId).instruction)
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-chrome-border/70 px-3 py-2 text-xs text-ink-primary hover:border-amber-400 hover:text-amber-200"
          title="Reset all overrides"
        >
          <RefreshCcw className="size-4" />
          Reset all
        </button>
        {useDefaults && (
          <span className="ml-auto inline-flex items-center gap-2 text-xs text-amber-100">
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
                t.id === activeId
                  ? 'border-accent bg-accent/10'
                  : 'border-chrome-border/70 bg-surface-raised/50 hover:border-accent'
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
              className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-chrome-border/70 px-3 py-2 text-xs text-ink-primary hover:border-amber-400 hover:text-amber-200"
            >
              <RefreshCcw className="size-4" />
              Reset
            </button>
          </div>

          <div className="mt-3 grid gap-2">
            <label className="text-[11px] uppercase tracking-wide text-ink-muted">Instruction text</label>
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
                onClick={() => setTemplateInstruction(activeId, draft)}
                className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent/90"
              >
                Save
              </button>
            </div>
            <p className="text-xs text-ink-muted">These templates only affect Writer selection actions.</p>
          </div>
        </div>
      </div>

      <div className="border-t border-chrome-border/70 pt-3">
        <WriterRewriteToneProfilesEditor />
      </div>
    </div>
  )
}

export default WriterSelectionTemplatesSection
