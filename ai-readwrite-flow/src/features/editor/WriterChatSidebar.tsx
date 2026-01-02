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
import WriterChatMessages from './components/WriterChatMessages'
import { parseWriterSelectionQuickPromptMeta } from '../../lib/quickPrompt'
import useWriterSelectionSuggestionStore from './stores/writerSelectionSuggestionStore'
type Props = {
  quickPrompt?: { text: string; autoSend?: boolean; meta?: unknown }
  onConsumeQuickPrompt?: () => void
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

const WriterChatSidebar = ({ quickPrompt, onConsumeQuickPrompt, collapsed, onCollapsedChange }: Props) => {
  const { model, apiKey, baseUrl } = useSettingsStore()
  const { templates } = useTemplateStore()
  const { setMetrics } = useMetricsStore()
  const activeProjectId = useWriterProjectStore((s) => s.activeProjectId)
  const { messages, addMessage, clear, hydrate } = useWriterChatStore()
  const setSuggestionSession = useWriterSelectionSuggestionStore((s) => s.setSession)
  const setSuggestion = useWriterSelectionSuggestionStore((s) => s.setSuggestion)
  const contextText = useWriterContextStore((s) => s.contextText)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastPrompt, setLastPrompt] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [includeContext, setIncludeContext] = useState(true)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const sessionId = useMemo(() => chatSessionIdForProject(activeProjectId), [activeProjectId])

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
    void hydrate(sessionId)
    setSuggestionSession(sessionId)
  }, [hydrate, sessionId, setSuggestionSession])

  const doSend = useCallback(
    async (content: string, includeContextOverride?: boolean, meta?: unknown) => {
      if (sending) return
      const prompt = buildWriterUserPrompt(content, contextText, includeContextOverride ?? includeContext)
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
        const assistantMsg = await addMessage({
          id: '',
          role: 'assistant',
          content: response.content,
          createdAt: Date.now(),
          referenceHighlightId: null,
        })
        const parsed = parseWriterSelectionQuickPromptMeta(meta)
        if (assistantMsg && parsed && parsed.type === 'writer-selection') {
          setSuggestion({
            messageId: assistantMsg.id,
            action: parsed.action,
            selection: parsed.selection,
            outputText: response.content,
            createdAt: assistantMsg.createdAt,
          })
        }
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
    [addMessage, apiKey, baseUrl, contextText, historyMessages, includeContext, model, sending, setMetrics, setSuggestion],
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
        void doSend(text, false, quickPrompt.meta)
        setDraft('')
      }, 0)
    } else {
      window.setTimeout(focusInput, 0)
    }
    onConsumeQuickPrompt?.()
  }, [quickPrompt, onConsumeQuickPrompt, focusInput, doSend])

  if (collapsed) {
    return (
      <div className="flex h-full items-start justify-end overflow-hidden">
        <button
          onClick={() => onCollapsedChange(false)}
          className="inline-flex w-full max-w-full items-center justify-center rounded-lg border border-chrome-border/70 bg-surface-raised/60 px-2 py-2 text-xs text-ink-primary hover:border-accent"
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
      title="Chat"
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => onCollapsedChange(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-chrome-border/70 px-2 py-1 text-xs text-ink-muted hover:border-accent hover:text-ink-primary"
          >
            <ChevronRight className="size-4" />
            Hide
          </button>
          <button
            onClick={() => void clear()}
            className="inline-flex items-center gap-2 rounded-lg border border-chrome-border/70 px-2 py-1 text-xs text-ink-muted hover:border-red-500 hover:text-red-300"
          >
            <Trash2 className="size-4" />
            Clear
          </button>
        </div>
      }
      className="flex h-full min-h-0 flex-col"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <MessageCircle className="size-4 text-accent" />
          <span>Chat is scoped to the active writing project.</span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <WriterChatMessages messages={messages} />
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
          <form onSubmit={handleSend} className="space-y-2">
            <label className="flex items-center gap-2 text-xs text-ink-muted">
              <input
                type="checkbox"
                checked={includeContext}
                onChange={(e) => setIncludeContext(e.target.checked)}
                className="accent-accent"
              />
              Include Writer Context
            </label>
            {templates.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <select
                  value={selectedTemplate}
                  onChange={(event) => setSelectedTemplate(event.target.value)}
                  className="w-full rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-2 py-2 text-xs text-ink-primary focus:border-accent focus:outline-none"
                >
                  <option value="">Choose a template</option>
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="shrink-0 rounded-lg border border-chrome-border/70 bg-surface-raised/70 px-3 py-2 text-xs text-ink-primary hover:border-accent disabled:opacity-60"
                  disabled={!selectedTemplate}
                  onClick={() => {
                    const tpl = templates.find((t) => t.id === selectedTemplate)
                    if (!tpl) return
                    setDraft((cur) => (cur.trim() ? `${cur}\n\n${tpl.prompt}` : tpl.prompt))
                    window.setTimeout(focusInput, 0)
                  }}
                >
                  Insert
                </button>
              </div>
            )}
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              placeholder="Ask for help on your writing..."
              className="w-full rounded-xl border border-chrome-border/70 bg-surface-raised/70 p-3 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none"
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
        </div>
      </div>
    </Card>
  )
}

export default WriterChatSidebar
