type Props = {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}

const ChatContextToggle = ({ checked, label, onChange }: Props) => (
  <label className="flex items-center gap-2 text-xs text-ink-muted">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="accent-accent"
    />
    {label}
  </label>
)

export default ChatContextToggle
