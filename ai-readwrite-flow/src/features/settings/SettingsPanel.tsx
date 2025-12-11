import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  Loader2,
  ShieldCheck,
  TestTube,
  Wifi,
  Trash2,
  Plus,
  X,
} from 'lucide-react'
import Card from '../../shared/components/Card'
import useSettingsStore from '../../stores/settingsStore'
import { testConnection } from '../../lib/apiClient'
import { defaultBaseUrl, defaultModel } from '../../lib/constants'
import useTemplateStore from '../../stores/templateStore'

const inputClass =
  'w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none'

const SettingsPanel = () => {
  const { apiKey, baseUrl, model, setApiKey, setBaseUrl, setModel, save, status } =
    useSettingsStore()
  const { templates, addTemplate, removeTemplate } = useTemplateStore()
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplatePrompt, setNewTemplatePrompt] = useState('')
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [showTemplates, setShowTemplates] = useState(false)

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
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Wifi className="size-4" />
          <span>{statusTone}</span>
        </div>
      }
      className="bg-surface-base/90"
    >
      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-1 text-sm text-slate-200">
          <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
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
        <label className="space-y-1 text-sm text-slate-200">
          <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
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
        <label className="space-y-1 text-sm text-slate-200">
          <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
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
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={handleTestAndSave}
          disabled={testing}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {testing ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          <span>Test & Save</span>
        </button>
        {message && (
          <span className="flex items-center gap-2 text-sm text-slate-300">
            <ShieldCheck className="size-4 text-emerald-400" />
            {message}
          </span>
        )}
      </div>
      <div className="mt-4 rounded-xl border border-slate-800/70 bg-slate-900/70 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-100">
            Prompt Templates ({templates.length})
          </span>
          <button
            type="button"
            onClick={() => setShowTemplates(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-800/70 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-sky-400 hover:text-sky-200"
          >
            <Plus className="size-4" />
            Manage
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Manage templates in a modal; chat dropdown will pick them up automatically.
        </p>
      </div>
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-800/70 bg-slate-900/95 p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-100">Prompt Templates</p>
                <p className="text-xs text-slate-500">Add, update, or remove quick prompts.</p>
              </div>
              <button
                onClick={() => setShowTemplates(false)}
                className="rounded-lg border border-slate-800/70 p-2 text-slate-400 hover:border-sky-500 hover:text-sky-100"
                aria-label="Close template manager"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="grid gap-2 max-h-[60vh] overflow-y-auto">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="flex items-center gap-2 rounded-lg border border-slate-800/70 bg-slate-950/70 px-3 py-2"
                >
                  <div className="flex-1 text-left text-sm text-slate-100">
                    <span className="font-medium">{tpl.name}</span>
                    <span className="ml-2 text-xs text-slate-500">{tpl.prompt}</span>
                  </div>
                  <button
                    onClick={() => removeTemplate(tpl.id)}
                    className="rounded border border-transparent p-1 text-slate-500 hover:border-red-400 hover:text-red-200"
                    aria-label="Remove template"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              <div className="rounded-lg border border-dashed border-slate-800/70 bg-slate-950/60 p-3">
                <div className="grid gap-2">
                  <input
                    value={newTemplateName}
                    onChange={(event) => setNewTemplateName(event.target.value)}
                    placeholder="Template name"
                    className="w-full rounded border border-slate-800/70 bg-slate-900/70 px-2 py-1 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                  />
                  <input
                    value={newTemplatePrompt}
                    onChange={(event) => setNewTemplatePrompt(event.target.value)}
                    placeholder="Template prompt"
                    className="w-full rounded border border-slate-800/70 bg-slate-900/70 px-2 py-1 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newTemplateName.trim() || !newTemplatePrompt.trim()) return
                      addTemplate(newTemplateName.trim(), newTemplatePrompt.trim())
                      setNewTemplateName('')
                      setNewTemplatePrompt('')
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-800/70 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-sky-500"
                  >
                    <Plus className="size-4" />
                    Save Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

export default SettingsPanel
