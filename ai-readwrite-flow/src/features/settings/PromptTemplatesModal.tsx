import { Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import useTemplateStore from '../../stores/templateStore'

type Props = {
  onClose: () => void
}

const inputClass =
  'w-full rounded-lg border border-chrome-border/80 bg-surface-raised/70 px-3 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none'

const PromptTemplatesModal = ({ onClose }: Props) => {
  const { templates, addTemplate, removeTemplate } = useTemplateStore()
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplatePrompt, setNewTemplatePrompt] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-3xl rounded-2xl border border-chrome-border/70 bg-surface-base/95 p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink-primary">Prompt Templates</p>
            <p className="text-xs text-ink-muted">Add, update, or remove quick prompts.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-chrome-border/70 p-2 text-ink-muted hover:border-accent hover:text-ink-primary"
            aria-label="Close template manager"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid max-h-[60vh] gap-2 overflow-y-auto">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="flex items-center gap-2 rounded-lg border border-chrome-border/70 bg-surface-raised/60 px-3 py-2"
            >
              <div className="flex-1 text-left text-sm text-ink-primary">
                <span className="font-medium">{tpl.name}</span>
                <span className="ml-2 text-xs text-ink-muted">{tpl.prompt}</span>
              </div>
              <button
                onClick={() => removeTemplate(tpl.id)}
                className="rounded border border-transparent p-1 text-ink-muted hover:border-status-danger/70 hover:text-status-danger"
                aria-label="Remove template"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <div className="rounded-lg border border-dashed border-chrome-border/70 bg-surface-raised/40 p-3">
            <div className="grid gap-2">
              <input
                value={newTemplateName}
                onChange={(event) => setNewTemplateName(event.target.value)}
                placeholder="Template name"
                className={inputClass}
              />
              <input
                value={newTemplatePrompt}
                onChange={(event) => setNewTemplatePrompt(event.target.value)}
                placeholder="Template prompt"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => {
                  if (!newTemplateName.trim() || !newTemplatePrompt.trim()) return
                  addTemplate(newTemplateName.trim(), newTemplatePrompt.trim())
                  setNewTemplateName('')
                  setNewTemplatePrompt('')
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-chrome-border/70 px-3 py-2 text-xs font-semibold text-ink-primary hover:border-accent"
              >
                <Plus className="size-4" />
                Save Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PromptTemplatesModal
