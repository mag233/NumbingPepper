import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Loader2, MessageCircle, RotateCcw, Send, Trash2 } from 'lucide-react'
import Card from '../../shared/components/Card'
import useChatStore from '../../stores/chatStore'
import useSettingsStore from '../../stores/settingsStore'
import { sendChatCompletion, type ChatMessageInput } from '../../lib/apiClient'
import useTemplateStore from '../../stores/templateStore'
import useMetricsStore from '../../stores/metricsStore'
import useLibraryStore from '../../stores/libraryStore'
import { chatSessionIdForBook } from './services/chatSession'

type Props = {
  quickPrompt?: { text: string; autoSend?: boolean; meta?: unknown }
  onConsumeQuickPrompt?: () => void
  variant?: 'default' | 'mobileOverlay'
  onClose?: () => void
}

const bubbleClass = 'rounded-xl border px-3 py-2 text-sm shadow-sm'

const ChatSidebar = ({ quickPrompt, onConsumeQuickPrompt, variant = 'default', onClose }: Props) => {
  const { messages, addMessage, clear, hydrate } = useChatStore()
  const { model, apiKey, baseUrl } = useSettingsStore()
  const { templates } = useTemplateStore()
  const { setMetrics } = useMetricsStore()
  const { activeId } = useLibraryStore()
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastPrompt, setLastPrompt] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const messagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const focusInput = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  }, [])

  const historyMessages: ChatMessageInput[] = useMemo(
    () =>
      messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    [messages],
  )

  useEffect(() => {
    void hydrate(chatSessionIdForBook(activeId))
  }, [activeId, hydrate])

  const doSend = useCallback(
    async (content: string) => {
      const userMessage = content.trim()
      if (!userMessage || sending) return
      setError(null)
      setSending(true)
      setLastPrompt(userMessage)
      await addMessage({ id: '', role: 'user', content: userMessage, createdAt: Date.now(), referenceHighlightId: null })

      const response = await sendChatCompletion(baseUrl, apiKey, model, [
        ...historyMessages,
        { role: 'user', content: userMessage },
      ])

      if (response.ok && response.content) {
        setMetrics({
          tokens: response.usage?.totalTokens,
          latencyMs: response.latencyMs,
          model,
        })
        await addMessage({
          id: '',
          role: 'assistant',
          content: response.content,
          createdAt: Date.now(),
          referenceHighlightId: null,
        })
      } else {
        setError(response.error ?? 'Request failed')
        setMetrics({
          tokens: response.usage?.totalTokens,
          latencyMs: response.latencyMs,
          model,
        })
      }
      setSending(false)
    },
    [addMessage, apiKey, baseUrl, historyMessages, model, sending, setMetrics],
  )

  const handleSend = (event: FormEvent) => {
    event.preventDefault()
    void doSend(draft)
    setDraft('')
  }

  const handleRetry = () => {
    if (!lastPrompt) return
    setDraft(lastPrompt)
    void doSend(lastPrompt)
  }

  useEffect(() => {
    if (!quickPrompt) return
    const { text, autoSend } = quickPrompt
    window.setTimeout(() => setDraft(text), 0)
    if (autoSend) {
      window.setTimeout(() => {
        void doSend(text)
        setDraft('')
        window.setTimeout(focusInput, 0)
      }, 0)
    } else {
      window.setTimeout(() => {
        focusInput()
      }, 0)
    }
    onConsumeQuickPrompt?.()
  }, [quickPrompt, onConsumeQuickPrompt, doSend, focusInput])

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages.length])

  const renderMessages = () => (
    <div
      ref={messagesRef}
      className={`grid content-start gap-3 overflow-y-auto ${
        variant === 'mobileOverlay'
          ? 'flex-1 rounded-none border-0 bg-transparent px-4'
          : 'flex-[2] rounded-xl border border-chrome-border/70 bg-surface-raised/40 p-3'
      }`}
    >
      {messages.length === 0 && (
        <p className="text-sm text-ink-muted">No messages yet. Select text in Reader or ask a question.</p>
      )}
      {messages.map((msg) => (
        <div key={msg.id} className={`flex items-start ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`${bubbleClass} ${
              msg.role === 'user'
                ? 'w-full max-w-[80%] border-accent/70 bg-accent/10'
                : 'w-full max-w-[80%] border-chrome-border/70 bg-surface-raised/70'
            } ${variant === 'mobileOverlay' ? 'shadow-none' : ''}`}
          >
            <p className="text-xs uppercase text-ink-muted">{msg.role}</p>
            <p className="whitespace-pre-wrap text-sm text-ink-primary leading-relaxed">{msg.content}</p>
          </div>
        </div>
      ))}
    </div>
  )

  const renderForm = () => (
    <form onSubmit={handleSend} className={variant === 'mobileOverlay' ? 'space-y-2 border-t border-chrome-border/50 bg-surface-base/92 p-3 shadow-[0_-10px_20px_-14px_rgba(0,0,0,0.5)]' : 'space-y-2 flex-1'}>
      {templates.length > 0 && (
        <div className="flex items-center gap-2 text-xs">
          <select
            value={selectedTemplate}
            onChange={(event) => {
              const id = event.target.value
              setSelectedTemplate(id)
              const tpl = templates.find((t) => t.id === id)
              if (tpl) setDraft(tpl.prompt)
            }}
            className="w-full rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-2 py-2 text-xs text-ink-primary focus:border-accent focus:outline-none"
          >
            <option value="">Choose a template</option>
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <textarea
        ref={inputRef}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        rows={variant === 'mobileOverlay' ? 2 : 3}
        placeholder="Ask a question or paste selected text..."
        className={`w-full rounded-xl border border-chrome-border/60 bg-surface-raised/80 p-3 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none ${
          variant === 'mobileOverlay' ? 'max-h-32 p-2 shadow-inner' : ''
        }`}
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

  if (variant === 'mobileOverlay') {
    return (
      <div className="flex h-full flex-col bg-surface-base/95">
        <header className="flex items-center justify-between gap-3 border-b border-chrome-border/60 px-4 pb-2 pt-3">
          <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-chrome-border/60" aria-hidden />
          <div className="flex items-center gap-2">
            <MessageCircle className="size-5 text-accent" />
            <div className="text-sm font-semibold text-ink-primary">AI Chat</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void clear()}
              className="inline-flex items-center gap-1 rounded-lg border border-chrome-border/60 px-3 py-1 text-xs text-ink-muted hover:border-red-500 hover:text-red-300"
            >
              <Trash2 className="size-4" />
              Clear
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-lg border border-chrome-border/70 p-2 text-ink-muted hover:border-accent hover:text-ink-primary"
                aria-label="Close chat"
              >
                X
              </button>
            )}
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-3 py-2">
          <div className="px-4 text-xs text-ink-muted">Context from selected text is auto-appended.</div>
          {renderMessages()}
          {error && (
            <div className="mx-4 flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-2 text-xs text-amber-100">
              <AlertCircle className="size-4" />
              <span>{error}</span>
              {lastPrompt && (
                <button
                  onClick={handleRetry}
                  className="ml-auto inline-flex items-center gap-1 rounded border border-amber-400 px-2 py-1 text-amber-50 hover:border-amber-300"
                >
                  <RotateCcw className="size-3" />
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
        {renderForm()}
      </div>
    )
  }

  return (
    <Card
      title="AI Chat"
      action={
        <button
          onClick={() => void clear()}
          className="inline-flex items-center gap-2 rounded-lg border border-chrome-border/70 px-2 py-1 text-xs text-ink-muted hover:border-red-500 hover:text-red-300"
        >
          <Trash2 className="size-4" />
          Clear
        </button>
      }
      className="flex h-full max-h-[calc(100vh-160px)] flex-col"
    >
      <div className="flex h-full flex-col gap-3">
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <MessageCircle className="size-4 text-accent" />
          <span className="text-ink-muted">Selected text is auto-appended to keep answers contextual.</span>
        </div>
        {renderMessages()}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-2 text-xs text-amber-100">
            <AlertCircle className="size-4" />
            <span>{error}</span>
            {lastPrompt && (
              <button
                onClick={handleRetry}
                className="ml-auto inline-flex items-center gap-1 rounded border border-amber-400 px-2 py-1 text-amber-50 hover:border-amber-300"
              >
                <RotateCcw className="size-3" />
                Retry
              </button>
            )}
          </div>
        )}
        {renderForm()}
      </div>
    </Card>
  )
}

export default ChatSidebar
