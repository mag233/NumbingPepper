import { useEffect, useRef } from 'react'
import type { WriterChatMessage } from '../stores/writerChatStore'

const bubbleBase =
  'rounded-xl border px-3 py-2 text-sm shadow-sm border-chrome-border/70 bg-surface-raised/70'

type Props = {
  messages: WriterChatMessage[]
}

const WriterChatMessages = ({ messages }: Props) => {
  const messagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [messages.length])

  return (
    <div
      ref={messagesRef}
      className="grid min-h-48 flex-1 gap-3 overflow-y-auto rounded-xl border border-chrome-border/70 bg-surface-raised/40 p-3"
    >
      {messages.length === 0 && <p className="text-sm text-ink-muted">No messages yet.</p>}
      {messages.map((msg) => (
        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`${bubbleBase} max-w-[85%] ${
              msg.role === 'user' ? 'border-accent/70 bg-accent/10' : 'border-chrome-border/70 bg-surface-raised/70'
            }`}
          >
            <p className="text-xs uppercase text-ink-muted">{msg.role === 'user' ? 'You' : 'AI'}</p>
            <p className="whitespace-pre-wrap text-sm text-ink-primary">{msg.content}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default WriterChatMessages
