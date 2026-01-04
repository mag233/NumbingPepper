import { useMemo, useState } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import useWriterSelectionTemplateStore from '../../stores/writerSelectionTemplateStore'
import { writerRewriteTones, type WriterRewriteTone } from '../../stores/writerSelectionTemplateModel'

const inputClass =
  'w-full rounded-lg border border-chrome-border/80 bg-surface-raised/70 px-3 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none'

const toneLabel = (tone: WriterRewriteTone) => {
  if (tone === 'default') return 'Default'
  if (tone === 'formal') return 'Formal'
  if (tone === 'friendly') return 'Friendly'
  if (tone === 'academic') return 'Academic'
  return 'Bullet'
}

const linesToExamples = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)

const examplesToLines = (examples: string[]) => examples.join('\n')

const WriterRewriteToneProfilesEditor = () => {
  const useDefaults = useWriterSelectionTemplateStore((s) => s.useDefaults)
  const setRewriteToneProfile = useWriterSelectionTemplateStore((s) => s.setRewriteToneProfile)
  const resetRewriteToneProfile = useWriterSelectionTemplateStore((s) => s.resetRewriteToneProfile)
  const resetAllRewriteToneProfiles = useWriterSelectionTemplateStore((s) => s.resetAllRewriteToneProfiles)
  const getEffectiveRewriteToneProfile = useWriterSelectionTemplateStore((s) => s.getEffectiveRewriteToneProfile)

  const [activeTone, setActiveTone] = useState<WriterRewriteTone>('formal')
  const profile = getEffectiveRewriteToneProfile(activeTone)

  const [labelDraft, setLabelDraft] = useState(profile.label)
  const [directiveDraft, setDirectiveDraft] = useState(profile.directive)
  const [descriptionDraft, setDescriptionDraft] = useState(profile.description)
  const [examplesDraft, setExamplesDraft] = useState(examplesToLines(profile.examples))

  const tones = useMemo(() => writerRewriteTones.map((tone) => ({ tone, label: toneLabel(tone) })), [])

  const loadDrafts = (tone: WriterRewriteTone) => {
    const next = getEffectiveRewriteToneProfile(tone)
    setLabelDraft(next.label)
    setDirectiveDraft(next.directive)
    setDescriptionDraft(next.description)
    setExamplesDraft(examplesToLines(next.examples))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink-primary">Rewrite tone profiles</p>
          <p className="text-xs text-ink-muted">Customize tone descriptions and examples for Rewrite.</p>
        </div>
        {useDefaults && (
          <span className="inline-flex items-center gap-2 text-xs text-amber-100">
            <AlertTriangle className="size-4" />
            Defaults are active; overrides are ignored until you turn this off.
          </span>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-[220px_1fr]">
        <div className="grid gap-2">
          {tones.map((item) => (
            <button
              key={item.tone}
              type="button"
              onClick={() => {
                setActiveTone(item.tone)
                loadDrafts(item.tone)
              }}
              className={`w-full rounded-xl border px-3 py-2 text-left ${
                item.tone === activeTone
                  ? 'border-accent bg-accent/10'
                  : 'border-chrome-border/70 bg-surface-raised/50 hover:border-accent'
              }`}
            >
              <span className="text-sm font-semibold text-ink-primary">{item.label}</span>
              <p className="mt-1 text-xs text-ink-muted">{getEffectiveRewriteToneProfile(item.tone).description || '—'}</p>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              if (!window.confirm('Reset ALL rewrite tone overrides?')) return
              resetAllRewriteToneProfiles()
              loadDrafts(activeTone)
            }}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg border border-chrome-border/70 px-3 py-2 text-xs text-ink-primary hover:border-amber-400 hover:text-amber-200"
            title="Reset all tone overrides"
          >
            <RefreshCcw className="size-4" />
            Reset all tones
          </button>
        </div>

        <div className="rounded-xl border border-chrome-border/70 bg-surface-raised/50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink-primary">{toneLabel(activeTone)}</p>
              <p className="text-xs text-ink-muted">Used as extra directives for Rewrite (tone ≠ Default).</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!window.confirm(`Reset "${toneLabel(activeTone)}" to default?`)) return
                resetRewriteToneProfile(activeTone)
                loadDrafts(activeTone)
              }}
              className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-chrome-border/70 px-3 py-2 text-xs text-ink-primary hover:border-amber-400 hover:text-amber-200"
            >
              <RefreshCcw className="size-4" />
              Reset
            </button>
          </div>

          <div className="mt-3 grid gap-2">
            <label className="text-[11px] uppercase tracking-wide text-ink-muted">Label</label>
            <input value={labelDraft} onChange={(e) => setLabelDraft(e.target.value)} className={inputClass} />

            <label className="text-[11px] uppercase tracking-wide text-ink-muted">Directive</label>
            <input
              value={directiveDraft}
              onChange={(e) => setDirectiveDraft(e.target.value)}
              className={inputClass}
              placeholder="e.g. Tone: Formal"
            />

            <label className="text-[11px] uppercase tracking-wide text-ink-muted">Description</label>
            <textarea
              value={descriptionDraft}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              rows={4}
              className={inputClass}
              placeholder="Optional..."
            />

            <label className="text-[11px] uppercase tracking-wide text-ink-muted">Examples (max 3 lines)</label>
            <textarea
              value={examplesDraft}
              onChange={(e) => setExamplesDraft(e.target.value)}
              rows={4}
              className={inputClass}
              placeholder="One example per line..."
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => loadDrafts(activeTone)}
                className="rounded-lg border border-chrome-border/70 px-3 py-2 text-xs text-ink-primary hover:border-accent"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() =>
                  setRewriteToneProfile(activeTone, {
                    label: labelDraft,
                    directive: directiveDraft,
                    description: descriptionDraft,
                    examples: linesToExamples(examplesDraft),
                  })
                }
                className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent/90"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WriterRewriteToneProfilesEditor

