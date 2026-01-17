import useSettingsStore from '../../stores/settingsStore'

const checkboxClass = 'size-4 accent-accent'

const WriterReferenceSettingsSection = () => {
  const { referenceDefaultTags, setReferenceDefaultTags, save } = useSettingsStore()

  const update = (key: 'book' | 'author' | 'year') => (checked: boolean) => {
    setReferenceDefaultTags({ ...referenceDefaultTags, [key]: checked })
  }

  return (
    <div className="space-y-3 rounded-xl border border-chrome-border/70 bg-surface-raised/50 p-3">
      <div>
        <p className="text-sm font-semibold text-ink-primary">Reference Default Tags</p>
        <p className="text-xs text-ink-muted">Applied when creating a new reference. Existing tags are untouched.</p>
      </div>

      <div className="grid gap-2 text-sm text-ink-primary">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            className={checkboxClass}
            checked={referenceDefaultTags.book}
            onChange={(e) => update('book')(e.target.checked)}
          />
          #ai_reader/title/&lt;title&gt;
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            className={checkboxClass}
            checked={referenceDefaultTags.author}
            onChange={(e) => update('author')(e.target.checked)}
          />
          #ai_reader/author/&lt;author&gt;
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            className={checkboxClass}
            checked={referenceDefaultTags.year}
            onChange={(e) => update('year')(e.target.checked)}
          />
          #ai_reader/year/&lt;year&gt;
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void save()}
          className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent/90"
        >
          Save
        </button>
      </div>
    </div>
  )
}

export default WriterReferenceSettingsSection
