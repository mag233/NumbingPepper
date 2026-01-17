import { Filter, X } from 'lucide-react'

type Option = {
  tag: string
  label: string
  isSystem: boolean
}

type Props = {
  options: Option[]
  selected: string[]
  onSelectedChange: (next: string[]) => void
  includeSystemTags: boolean
  onIncludeSystemTagsChange: (value: boolean) => void
}

const chipClass = (active: boolean, isSystem: boolean) =>
  `rounded-full border px-2 py-1 text-[11px] ${
    active
      ? 'border-accent bg-accent/15 text-ink-primary'
      : isSystem
        ? 'border-chrome-border/60 text-ink-muted'
        : 'border-chrome-border/70 text-ink-muted hover:border-accent'
  }`

const WriterReferenceTagFilter = ({
  options,
  selected,
  onSelectedChange,
  includeSystemTags,
  onIncludeSystemTagsChange,
}: Props) => {
  if (options.length === 0) return null

  const toggleTag = (tag: string) => {
    if (selected.includes(tag)) {
      onSelectedChange(selected.filter((t) => t !== tag))
      return
    }
    onSelectedChange([...selected, tag])
  }

  const clearSelection = () => {
    if (selected.length === 0) return
    onSelectedChange([])
  }

  return (
    <div className="space-y-2 rounded-lg border border-chrome-border/60 bg-surface-raised/40 p-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
        <div className="flex items-center gap-2">
          <Filter className="size-3" />
          <span>Filter tags</span>
          <label className="flex items-center gap-1 text-[11px]">
            <input
              type="checkbox"
              className="size-3 accent-accent"
              checked={includeSystemTags}
              onChange={(e) => onIncludeSystemTagsChange(e.target.checked)}
            />
            Include system
          </label>
        </div>
        {selected.length > 0 && (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-chrome-border/60 px-2 py-1 text-[11px] text-ink-muted hover:border-accent"
            onClick={clearSelection}
          >
            <X className="size-3" />
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option.tag)
          return (
            <button
              key={option.tag}
              type="button"
              className={chipClass(active, option.isSystem)}
              onClick={() => toggleTag(option.tag)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default WriterReferenceTagFilter
