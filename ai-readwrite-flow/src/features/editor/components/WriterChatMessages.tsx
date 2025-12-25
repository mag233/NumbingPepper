import { useEffect, useMemo, useRef, useState } from 'react'
import type { WriterChatMessage } from '../stores/writerChatStore'
import useWriterSelectionSuggestionStore from '../stores/writerSelectionSuggestionStore'
import useWriterSelectionApplyStore from '../stores/writerSelectionApplyStore'
import { copyTextToClipboard } from '../../../lib/clipboard'

const bubbleBase =
  'rounded-xl border px-3 py-2 text-sm shadow-sm border-chrome-border/70 bg-surface-raised/70'

type Props = {
  messages: WriterChatMessage[]
}

const WriterChatMessages = ({ messages }: Props) => {
  const messagesRef = useRef<HTMLDivElement>(null)
  const suggestionsByMessageId = useWriterSelectionSuggestionStore((s) => s.byMessageId)
  const requestApply = useWriterSelectionApplyStore((s) => s.requestApply)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [messages.length])

  const copiedResetTimerRef = useRef<number | null>(null)
  useEffect(() => {
    if (copiedResetTimerRef.current !== null) window.clearTimeout(copiedResetTimerRef.current)
    if (!copiedId) return
    copiedResetTimerRef.current = window.setTimeout(() => setCopiedId(null), 900)
    return () => {
      if (copiedResetTimerRef.current !== null) window.clearTimeout(copiedResetTimerRef.current)
      copiedResetTimerRef.current = null
    }
  }, [copiedId])

  const suggestionIds = useMemo(() => new Set(Object.keys(suggestionsByMessageId)), [suggestionsByMessageId])

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
              msg.role === 'user'
                ? 'border-accent/70 bg-accent/10'
                : suggestionIds.has(msg.id)
                  ? 'border-emerald-500/50 bg-emerald-500/10'
                  : 'border-chrome-border/70 bg-surface-raised/70'
            }`}
          >
            <p className="text-xs uppercase text-ink-muted">
              {msg.role === 'user' ? 'You' : suggestionIds.has(msg.id) ? 'Suggestion' : 'AI'}
            </p>
            <p className="whitespace-pre-wrap text-sm text-ink-primary">{msg.content}</p>
            {msg.role === 'assistant' && suggestionIds.has(msg.id) && (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent/90"
                  onClick={() => {
                    const s = suggestionsByMessageId[msg.id]
                    if (!s) return
                    requestApply({ messageId: msg.id, mode: 'replace', selection: s.selection, text: msg.content })
                  }}
                >
                  Replace selection
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-3 py-1.5 text-xs text-ink-primary hover:border-accent"
                  onClick={() => {
                    const s = suggestionsByMessageId[msg.id]
                    if (!s) return
                    requestApply({ messageId: msg.id, mode: 'insert', selection: s.selection, text: msg.content })
                  }}
                >
                  Insert below
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-3 py-1.5 text-xs text-ink-primary hover:border-accent"
                  onClick={() => {
                    void copyTextToClipboard(msg.content).then((ok) => {
                      if (ok) setCopiedId(msg.id)
                    })
                  }}
                >
                  {copiedId === msg.id ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default WriterChatMessages
