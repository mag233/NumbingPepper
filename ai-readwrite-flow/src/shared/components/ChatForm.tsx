import type { FormEvent, ReactNode, RefObject } from 'react'
import { Loader2, Send } from 'lucide-react'

type Props = {
  value: string
  onChange: (next: string) => void
  onSubmit: (event: FormEvent) => void
  placeholder: string
  rows: number
  sending: boolean
  textareaRef?: RefObject<HTMLTextAreaElement | null>
  controls?: ReactNode
  className?: string
  textareaClassName?: string
}

const ChatForm = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  rows,
  sending,
  textareaRef,
  controls,
  className,
  textareaClassName,
}: Props) => (
  <form onSubmit={onSubmit} className={className}>
    {controls}
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      placeholder={placeholder}
      className={textareaClassName}
    />
    <button
      type="submit"
      disabled={sending}
      className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
      {sending ? 'Sending...' : 'Send'}
    </button>
  </form>
)

export default ChatForm
