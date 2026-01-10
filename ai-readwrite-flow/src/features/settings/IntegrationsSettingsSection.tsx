import { useMemo, useState } from 'react'
import { CheckCircle2, Link2, Loader2, RefreshCcw, TestTube } from 'lucide-react'
import { z } from 'zod'
import useSettingsStore from '../../stores/settingsStore'
import { postToFlomo } from '../integrations/flomo/flomoClient'
import useFlomoComposerStore from '../integrations/flomo/flomoComposerStore'

const inputClass =
  'w-full rounded-lg border border-chrome-border/80 bg-surface-raised/70 px-3 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none'

const urlSchema = z.string().trim().url()

const getEnvFlomoUrl = () => (import.meta.env.VITE_FLOMO_API ?? '').trim()

const IntegrationsSettingsSection = () => {
  const { flomoWebhookUrl, setFlomoWebhookUrl, save } = useSettingsStore()
  const openFlomoComposer = useFlomoComposerStore((s) => s.open)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [editing, setEditing] = useState(false)

  const envDefaultUrl = useMemo(() => getEnvFlomoUrl(), [])
  const savedUrl = flomoWebhookUrl.trim()
  const effectiveUrl = savedUrl || envDefaultUrl

  const validationMessage = useMemo(() => {
    if (!savedUrl) return envDefaultUrl ? 'Using env default' : 'Not configured'
    const parsed = urlSchema.safeParse(savedUrl)
    if (!parsed.success) return 'Invalid URL'
    return 'Configured'
  }, [envDefaultUrl, savedUrl])

  const handleTestAndSave = async () => {
    if (!effectiveUrl) {
      setMessage('Missing Flomo webhook URL (and VITE_FLOMO_API not detected)')
      return
    }
    const parsed = urlSchema.safeParse(effectiveUrl)
    if (!parsed.success) {
      setMessage('Invalid Flomo webhook URL')
      return
    }
    setTesting(true)
    setMessage('')
    const result = await postToFlomo(parsed.data, `Flomo connection test @ ${new Date().toISOString()}`)
    setMessage(result.ok ? 'Flomo connection ok' : `Flomo test failed: ${result.error}`)
    if (!savedUrl && envDefaultUrl) setFlomoWebhookUrl(envDefaultUrl)
    await save()
    setTesting(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink-primary">Integrations</p>
          <p className="text-xs text-ink-muted">Export notes to Flomo via webhook (write-only).</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <Link2 className="size-4" />
          <span>{validationMessage}</span>
        </div>
      </div>

      <label className="space-y-1 text-sm text-ink-primary">
        <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-muted">
          <Link2 className="size-4" />
          Flomo Webhook URL
        </span>
        <div className="flex items-stretch gap-2">
          <input
            className={inputClass}
            value={flomoWebhookUrl}
            onChange={(event) => setFlomoWebhookUrl(event.target.value)}
            type="password"
            inputMode="url"
            readOnly={savedUrl.length > 0 && !editing}
          />
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-chrome-border/80 bg-surface-raised/70 px-3 text-ink-muted hover:border-accent hover:text-ink-primary"
            onClick={() => {
              setEditing(true)
              setFlomoWebhookUrl('')
              setMessage('')
            }}
            aria-label="Replace Flomo webhook URL"
            title="Replace"
          >
            <RefreshCcw className="size-4" />
          </button>
        </div>
      </label>

      <p className="text-xs text-ink-muted">
        Notes: URL is never revealed or copyable in the UI. `VITE_FLOMO_API` is a build-time default—if you edit `.env*`, restart the dev server or rebuild the app.
      </p>
      {envDefaultUrl && (
        <p className="text-xs text-ink-muted">Env default detected (will be used when the saved URL is empty).</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => void handleTestAndSave()}
          disabled={testing}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {testing ? <Loader2 className="size-4 animate-spin" /> : <TestTube className="size-4" />}
          <span>Test & Save</span>
        </button>
        {message && (
          <span className="flex items-center gap-2 text-sm text-ink-primary">
            <CheckCircle2 className={`size-4 ${message.includes('ok') ? 'text-status-success' : 'text-status-warning'}`} />
            {message}
          </span>
        )}
      </div>

      {import.meta.env.DEV && (
        <div className="rounded-xl border border-chrome-border/70 bg-surface-raised/40 p-3">
          <p className="mb-2 text-xs uppercase tracking-wide text-ink-muted">Dev tools</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-3 py-2 text-xs text-ink-primary hover:border-accent"
              onClick={() =>
                openFlomoComposer({
                  mode: 'reader',
                  quote: 'Demo quote…',
                  note: '',
                  bookTitle: 'Demo Book',
                  tags: ['#books/Demo-Book'],
                })
              }
            >
              Open Reader composer
            </button>
            <button
              type="button"
              className="rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-3 py-2 text-xs text-ink-primary hover:border-accent"
              onClick={() =>
                openFlomoComposer({
                  mode: 'writer',
                  selection: 'Demo selection…',
                  context: 'Demo context…',
                  projectTitle: 'Demo Project',
                  tags: ['#写作/Demo-Project'],
                })
              }
            >
              Open Writer composer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default IntegrationsSettingsSection
