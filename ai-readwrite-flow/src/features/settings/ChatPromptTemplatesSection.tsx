import { useMemo, useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import useTemplateStore, { type PromptTemplate } from '../../stores/templateStore'

const inputClass =
  'w-full rounded-lg border border-chrome-border/80 bg-surface-raised/70 px-3 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none'

type Draft = { id: string | null; name: string; prompt: string }

const toDraft = (tpl: PromptTemplate): Draft => ({ id: tpl.id, name: tpl.name, prompt: tpl.prompt })

const ChatPromptTemplatesSection = () => {
  const { templates, addTemplate, removeTemplate } = useTemplateStore()
  const [draft, setDraft] = useState<Draft>({ id: null, name: '', prompt: '' })

  const canSave = useMemo(() => Boolean(draft.name.trim() && draft.prompt.trim()), [draft.name, draft.prompt])
  const isEditing = Boolean(draft.id)

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-ink-primary">Chat Prompt Templates</p>
        <p className="text-xs text-ink-muted">
          Optional snippets you can insert into the chat input. Does not affect Reader shortcuts.
        </p>
      </div>

      <div className="grid gap-2">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="flex items-start gap-2 rounded-xl border border-chrome-border/70 bg-surface-raised/50 p-3"
          >
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => setDraft(toDraft(tpl))}
              title="Edit"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold text-ink-primary">{tpl.name}</span>
                <span className="text-[11px] text-ink-muted">Edit</span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{tpl.prompt}</p>
            </button>
            <button
              type="button"
              onClick={() => removeTemplate(tpl.id)}
              className="rounded-lg border border-transparent p-2 text-ink-muted hover:border-status-danger/70 hover:text-status-danger"
              aria-label="Remove template"
              title="Delete"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-chrome-border/70 bg-surface-raised/40 p-3">
        <div className="grid gap-2">
          <input
            value={draft.name}
            onChange={(e) => setDraft((cur) => ({ ...cur, name: e.target.value }))}
            placeholder="Template name"
            className={inputClass}
          />
          <textarea
            value={draft.prompt}
            onChange={(e) => setDraft((cur) => ({ ...cur, prompt: e.target.value }))}
            placeholder="Template prompt"
            rows={5}
            className={inputClass}
          />
          <div className="flex items-center justify-end gap-2">
            {isEditing && (
              <button
                type="button"
                onClick={() => setDraft({ id: null, name: '', prompt: '' })}
                className="rounded-lg border border-chrome-border/70 px-3 py-2 text-xs text-ink-primary hover:border-accent"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              disabled={!canSave}
              onClick={() => {
                if (!canSave) return
                addTemplate(draft.name.trim(), draft.prompt.trim())
                setDraft({ id: null, name: '', prompt: '' })
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
              title={isEditing ? 'Saved as a new template (overwrite not supported yet)' : 'Save template'}
            >
              {isEditing ? <Save className="size-4" /> : <Plus className="size-4" />}
              {isEditing ? 'Save as new' : 'Save'}
            </button>
          </div>
          <p className="text-xs text-ink-muted">
            Tip: if you want true overwrite editing, say so and I’ll convert this store to support updates.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChatPromptTemplatesSection
