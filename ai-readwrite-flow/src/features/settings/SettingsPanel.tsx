import { useMemo, useState } from 'react'
import { CheckCircle2, Loader2, Plus, ShieldCheck, TestTube, Wifi } from 'lucide-react'
import Card from '../../shared/components/Card'
import useSettingsStore from '../../stores/settingsStore'
import { testConnection } from '../../lib/apiClient'
import { defaultBaseUrl, defaultModel } from '../../lib/constants'
import useTemplateStore from '../../stores/templateStore'
import { themePresetSchema, type ThemePreset } from '../../lib/theme'
import ReaderShortcutTemplatesModal from './ReaderShortcutTemplatesModal'
import WriterSelectionTemplatesModal from './WriterSelectionTemplatesModal'
import PromptTemplatesModal from './PromptTemplatesModal'

const inputClass =
  'w-full rounded-lg border border-chrome-border/80 bg-surface-raised/70 px-3 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none'

const SettingsPanel = () => {
  const {
    apiKey,
    baseUrl,
    model,
    themePreset,
    setApiKey,
    setBaseUrl,
    setModel,
    setThemePreset,
    save,
    status,
  } = useSettingsStore()
  const templates = useTemplateStore((s) => s.templates)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [showReaderTemplates, setShowReaderTemplates] = useState(false)
  const [showWriterTemplates, setShowWriterTemplates] = useState(false)

  const statusTone = useMemo(() => {
    if (testing) return 'Testing...'
    if (status === 'error') return 'Save failed, try again.'
    if (status === 'ready') return 'Settings loaded'
    return 'Waiting for config'
  }, [status, testing])

  const handleTestAndSave = async () => {
    setTesting(true)
    const result = await testConnection(baseUrl, apiKey, model)
    setMessage(
      result.ok
        ? `Connection ok${result.modelFound ? '' : ' (model availability to confirm)'}`
        : result.error ?? 'Connection failed',
    )
    await save()
    setTesting(false)
  }

  return (
    <Card
      title="AI Settings (defaults per PRD)"
      action={
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <Wifi className="size-4" />
          <span>{statusTone}</span>
        </div>
      }
      className="bg-surface-base/90"
    >
      <div className="grid gap-3 md:grid-cols-4">
        <label className="space-y-1 text-sm text-ink-primary">
          <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-muted">
            <ShieldCheck className="size-4" />
            API Base
          </span>
          <input
            className={inputClass}
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            placeholder={defaultBaseUrl}
          />
        </label>
        <label className="space-y-1 text-sm text-ink-primary">
          <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-muted">
            <TestTube className="size-4" />
            Model
          </span>
          <input
            className={inputClass}
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder={defaultModel}
          />
        </label>
        <label className="space-y-1 text-sm text-ink-primary">
          <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-muted">
            <ShieldCheck className="size-4" />
            API Key
          </span>
          <input
            className={inputClass}
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="sk-..."
            type="password"
          />
        </label>
        <label className="space-y-1 text-sm text-ink-primary">
          <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-muted">
            <ShieldCheck className="size-4" />
            Theme
          </span>
          <select
            className={inputClass}
            value={themePreset}
            onChange={(event) => {
              const next = themePresetSchema.safeParse(event.target.value)
              if (!next.success) return
              setThemePreset(next.data satisfies ThemePreset)
              void save()
            }}
          >
            <option value="soft-dark">Soft Dark</option>
            <option value="light">Light</option>
            <option value="ocean">Ocean</option>
            <option value="forest">Forest</option>
            <option value="sand">Sand</option>
          </select>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={handleTestAndSave}
          disabled={testing}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {testing ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          <span>Test & Save</span>
        </button>
        {message && (
          <span className="flex items-center gap-2 text-sm text-ink-primary">
            <ShieldCheck className="size-4 text-status-success" />
            {message}
          </span>
        )}
      </div>
      <div className="mt-4 rounded-xl border border-chrome-border/70 bg-surface-raised/70 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-ink-primary">Reader AI Templates</span>
          <button
            type="button"
            onClick={() => setShowReaderTemplates(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-chrome-border/70 px-3 py-1 text-xs font-semibold text-ink-primary hover:border-accent"
          >
            <Plus className="size-4" />
            Manage
          </button>
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          Edit the built-in Reader shortcuts (Ask AI / Summarize / Explain / Questions). Use defaults to recover if prompts break.
        </p>
      </div>
      <div className="mt-4 rounded-xl border border-chrome-border/70 bg-surface-raised/70 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-ink-primary">Writer AI Templates</span>
          <button
            type="button"
            onClick={() => setShowWriterTemplates(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-chrome-border/70 px-3 py-1 text-xs font-semibold text-ink-primary hover:border-accent"
          >
            <Plus className="size-4" />
            Manage
          </button>
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          Edit Writer selection actions (Simplify / Concise / Rewrite / Translate / Explain / Ask AI). Use defaults to recover if prompts break.
        </p>
      </div>
      <div className="mt-4 rounded-xl border border-chrome-border/70 bg-surface-raised/70 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-ink-primary">
            Prompt Templates ({templates.length})
          </span>
          <button
            type="button"
            onClick={() => setShowTemplates(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-chrome-border/70 px-3 py-1 text-xs font-semibold text-ink-primary hover:border-accent"
          >
            <Plus className="size-4" />
            Manage
          </button>
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          Manage templates in a modal; chat dropdown will pick them up automatically.
        </p>
      </div>
      {showTemplates && <PromptTemplatesModal onClose={() => setShowTemplates(false)} />}
      {showReaderTemplates && <ReaderShortcutTemplatesModal onClose={() => setShowReaderTemplates(false)} />}
      {showWriterTemplates && <WriterSelectionTemplatesModal onClose={() => setShowWriterTemplates(false)} />}
    </Card>
  )
}

export default SettingsPanel
