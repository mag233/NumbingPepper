import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, MessageCircle, RotateCcw, Send, Trash2 } from 'lucide-react'
import Card from '../../shared/components/Card'
import useTemplateStore from '../../stores/templateStore'
import useSettingsStore from '../../stores/settingsStore'
import useMetricsStore from '../../stores/metricsStore'
import { sendChatCompletion, type ChatMessageInput } from '../../lib/apiClient'
import useWriterProjectStore from './stores/writerProjectStore'
import useWriterChatStore from './stores/writerChatStore'
import { chatSessionIdForProject } from './services/writerChatSession'
import useWriterContextStore from './stores/writerContextStore'
import { buildWriterUserPrompt } from './services/writerChatPrompt'

type Props = {
  quickPrompt?: { text: string; autoSend?: boolean }
  onConsumeQuickPrompt?: () => void
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

const bubbleClass =
  'rounded-xl border px-3 py-2 text-sm shadow-sm border-slate-800/70 bg-slate-900/70'

const WriterChatSidebar = ({ quickPrompt, onConsumeQuickPrompt, collapsed, onCollapsedChange }: Props) => {
  const { model, apiKey, baseUrl } = useSettingsStore()
  const { templates } = useTemplateStore()
  const { setMetrics } = useMetricsStore()
  const activeProjectId = useWriterProjectStore((s) => s.activeProjectId)
  const { messages, addMessage, clear, hydrate } = useWriterChatStore()
  const contextText = useWriterContextStore((s) => s.contextText)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastPrompt, setLastPrompt] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [includeContext, setIncludeContext] = useState(true)
  const messagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const sessionId = useMemo(() => chatSessionIdForProject(activeProjectId), [activeProjectId])

  const historyMessages: ChatMessageInput[] = useMemo(
    () =>
      messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    [messages],
  )

  useEffect(() => {
    void hydrate(sessionId)
  }, [hydrate, sessionId])

  const doSend = useCallback(
    async (content: string) => {
      if (sending) return
      const prompt = buildWriterUserPrompt(content, contextText, includeContext)
      if (!prompt) return
      setError(null)
      setSending(true)
      setLastPrompt(content.trim())
      await addMessage({ id: '', role: 'user', content: prompt, createdAt: Date.now(), referenceHighlightId: null })

      const response = await sendChatCompletion(baseUrl, apiKey, model, [
        ...historyMessages,
        { role: 'user', content: prompt },
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
    [addMessage, apiKey, baseUrl, contextText, historyMessages, includeContext, model, sending, setMetrics],
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
    const { text } = quickPrompt
    window.setTimeout(() => setDraft(text), 0)
    window.setTimeout(() => {
      const el = inputRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(el.value.length, el.value.length)
    }, 0)
    onConsumeQuickPrompt?.()
  }, [quickPrompt, onConsumeQuickPrompt])

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [messages.length])

  if (collapsed) {
    return (
      <div className="flex h-full items-start justify-end overflow-hidden">
        <button
          onClick={() => onCollapsedChange(false)}
          className="inline-flex w-full max-w-full items-center justify-center rounded-lg border border-slate-800/70 bg-slate-900/60 px-2 py-2 text-xs text-slate-200 hover:border-sky-500"
          title="Show Writer AI"
          aria-label="Show Writer AI"
        >
          <ChevronLeft className="size-4 shrink-0" />
          <MessageCircle className="size-4 shrink-0" />
        </button>
      </div>
    )
  }

  return (
    <Card
      title="Writer AI"
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => onCollapsedChange(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-800/70 px-2 py-1 text-xs text-slate-300 hover:border-sky-500 hover:text-sky-100"
          >
            <ChevronRight className="size-4" />
            Hide
          </button>
          <button
            onClick={() => void clear()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-800/70 px-2 py-1 text-xs text-slate-300 hover:border-red-400 hover:text-red-200"
          >
            <Trash2 className="size-4" />
            Clear
          </button>
        </div>
      }
      className="flex h-full max-h-[calc(100vh-160px)] flex-col"
    >
      <div className="flex h-full flex-col gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <MessageCircle className="size-4 text-sky-300" />
          <span>Chat is scoped to the active writing project.</span>
        </div>
        <div
          ref={messagesRef}
          className="grid flex-[2] gap-3 overflow-y-auto rounded-xl border border-slate-800/70 bg-slate-950/60 p-3"
        >
          {messages.length === 0 && <p className="text-sm text-slate-500">No messages yet.</p>}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`${bubbleClass} max-w-[85%] ${
                  msg.role === 'user'
                    ? 'border-sky-500/60 bg-sky-500/10'
                    : 'border-slate-800/70 bg-slate-900/70'
                }`}
              >
                <p className="text-xs uppercase text-slate-500">{msg.role === 'user' ? 'You' : 'AI'}</p>
                <p className="whitespace-pre-wrap text-sm text-slate-100">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
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
        <form onSubmit={handleSend} className="space-y-2 flex-1">
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={includeContext}
              onChange={(e) => setIncludeContext(e.target.checked)}
            />
            Include Writer Context
          </label>
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
                className="w-full rounded-lg border border-slate-800/70 bg-slate-900/70 px-2 py-2 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
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
            rows={3}
            placeholder="Ask for help on your writing..."
            className="w-full rounded-xl border border-slate-800/70 bg-slate-900/70 p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </Card>
  )
}

export default WriterChatSidebar
