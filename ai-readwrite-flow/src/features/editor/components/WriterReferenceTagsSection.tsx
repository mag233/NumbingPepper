import { Tags } from 'lucide-react'
import {
  formatSystemTagLabel,
  formatTagDisplay,
  splitReferenceTags,
} from '../../../lib/referenceTags'

type Props = {
  tags?: string[]
  tagDraftValue: string
  onTagDraftChange: (value: string) => void
  onSave: () => void
  inputClass: string
  buttonClass: string
}

const WriterReferenceTagsSection = ({
  tags,
  tagDraftValue,
  onTagDraftChange,
  onSave,
  inputClass,
  buttonClass,
}: Props) => {
  const { systemTags, userTags } = splitReferenceTags(tags ?? [])

  return (
    <div className="space-y-2">
      <div className="text-[11px] uppercase tracking-wide text-ink-muted">Tags</div>
      {(systemTags.length > 0 || userTags.length > 0) ? (
        <div className="space-y-2">
          {systemTags.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wide text-ink-muted">System</div>
              <div className="space-y-1">
                {systemTags.map((tag) => (
                  <div
                    key={tag}
                    className="truncate rounded-full border border-accent/40 bg-accent/10 px-2 py-1 text-[11px] text-accent"
                    title={formatSystemTagLabel(tag)}
                  >
                    {formatSystemTagLabel(tag)}
                  </div>
                ))}
              </div>
            </div>
          )}
          {userTags.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wide text-ink-muted">User</div>
              <div className="flex flex-wrap gap-1">
                {userTags.map((tag) => (
                  <span
                    key={tag}
                    className="max-w-full break-all rounded-full border border-action-positive/40 bg-action-positive/10 px-2 py-1 text-[11px] text-action-positive"
                  >
                    {formatTagDisplay(tag)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-[11px] text-ink-muted">No tags yet.</div>
      )}
      <div className="flex flex-wrap items-start gap-2">
        <Tags className="size-3 text-ink-muted" />
        <textarea
          className={`${inputClass} min-h-16 resize-y`}
          value={tagDraftValue}
          onChange={(e) => onTagDraftChange(e.target.value)}
          placeholder="Tags (comma/newline-separated)"
        />
        <button type="button" className={buttonClass} onClick={onSave}>
          Save Tags
        </button>
      </div>
    </div>
  )
}

export default WriterReferenceTagsSection
