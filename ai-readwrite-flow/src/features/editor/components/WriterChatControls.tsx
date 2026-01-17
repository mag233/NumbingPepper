import type { PromptTemplate } from '../../../stores/templateStore'
import ChatContextToggle from '../../../shared/components/ChatContextToggle'

type Props = {
  includeContext: boolean
  onIncludeContextChange: (value: boolean) => void
  includeReferences: boolean
  onIncludeReferencesChange: (value: boolean) => void
  hasIncludedReferences: boolean
  includedCount: number
  templates: PromptTemplate[]
  selectedTemplateId: string
  hasSelectedTemplate: boolean
  onSelectTemplate: (id: string) => void
  onInsertTemplate: () => void
}

const WriterChatControls = ({
  includeContext,
  onIncludeContextChange,
  includeReferences,
  onIncludeReferencesChange,
  hasIncludedReferences,
  includedCount,
  templates,
  selectedTemplateId,
  hasSelectedTemplate,
  onSelectTemplate,
  onInsertTemplate,
}: Props) => (
  <>
    <ChatContextToggle checked={includeContext} label="Include Writer Context" onChange={onIncludeContextChange} />
    {hasIncludedReferences && (
      <ChatContextToggle
        checked={includeReferences}
        label={`Include References (${includedCount})`}
        onChange={onIncludeReferencesChange}
      />
    )}
    {templates.length > 0 && (
      <div className="flex items-center gap-2 text-xs">
        <select
          value={selectedTemplateId}
          onChange={(event) => onSelectTemplate(event.target.value)}
          className="w-full rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-2 py-2 text-xs text-ink-primary focus:border-accent focus:outline-none"
        >
          <option value="">Choose a template</option>
          {templates.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>
              {tpl.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="shrink-0 rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-3 py-2 text-xs text-ink-primary hover:border-accent disabled:opacity-60"
          disabled={!hasSelectedTemplate}
          onClick={onInsertTemplate}
        >
          Insert
        </button>
      </div>
    )}
  </>
)

export default WriterChatControls
