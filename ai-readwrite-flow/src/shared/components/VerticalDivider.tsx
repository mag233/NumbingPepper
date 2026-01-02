type Props = {
  label: string
}

const VerticalDivider = ({ label }: Props) => (
  <div role="separator" aria-label={label} aria-orientation="vertical" className="relative w-3 shrink-0 cursor-default">
    <div className="absolute inset-y-2 left-1/2 w-px -translate-x-1/2 rounded bg-chrome-border/40" />
  </div>
)

export default VerticalDivider
