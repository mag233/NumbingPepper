import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, MessageCircle, Trash2 } from 'lucide-react'
import Card from '../../shared/components/Card'
import ChatErrorBanner from '../../shared/components/ChatErrorBanner'
import ChatPanelBody from '../../shared/components/ChatPanelBody'
import ChatContextToggle from '../../shared/components/ChatContextToggle'
import ChatForm from '../../shared/components/ChatForm'
import { CHAT_TEXTAREA_ROWS } from '../../lib/chatFormSizing'
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
import { applyQuickPrompt, parseWriterSelectionQuickPromptMeta } from '../../lib/quickPrompt'
import { useChatTemplateSelection } from '../../lib/hooks/useChatTemplateSelection'
import useWriterSelectionSuggestionStore from './stores/writerSelectionSuggestionStore'
import { WRITER_CHAT_SCOPE, type WriterChatScope } from '../../shared/chatScope'
type Props = {
  quickPrompt?: { text: string; autoSend?: boolean; meta?: unknown }
  onConsumeQuickPrompt?: () => void
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  scope: WriterChatScope
}

const WriterChatSidebar = ({ quickPrompt, onConsumeQuickPrompt, collapsed, onCollapsedChange, scope }: Props) => {
  if (import.meta.env.DEV && scope !== WRITER_CHAT_SCOPE) {
    throw new Error('WriterChatSidebar must be used with WRITER_CHAT_SCOPE')
  }
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
  const [includeContext, setIncludeContext] = useState(true)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { selectedTemplateId, selectedTemplate, applySelectedTemplate, onSelectTemplate } =
    useChatTemplateSelection({ templates, applyOnSelect: false })

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
    applyQuickPrompt({
      quickPrompt,
      onConsume: onConsumeQuickPrompt,
      setDraft,
      doSend: (text, meta) => void doSend(text, false, meta),
      focusInput,
    })
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
            className="inline-flex items-center gap-2 rounded-lg border border-chrome-border/70 px-2 py-1 text-xs text-ink-muted hover:border-status-danger/70 hover:text-status-danger"
          >
            <Trash2 className="size-4" />
            Clear
          </button>
        </div>
      }
      className="flex h-full min-h-0 flex-col"
    >
      <ChatPanelBody
        className="flex min-h-0 flex-1 flex-col gap-3"
        helper={
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <MessageCircle className="size-4 text-accent" />
            <span>Chat is scoped to the active writing project.</span>
          </div>
        }
        messages={
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <WriterChatMessages messages={messages} />
            {error && <ChatErrorBanner message={error} onRetry={lastPrompt ? handleRetry : undefined} />}
          </div>
        }
        form={
          <ChatForm
            value={draft}
            onChange={setDraft}
            onSubmit={handleSend}
            placeholder="Ask for help on your writing..."
            rows={CHAT_TEXTAREA_ROWS.desktop}
            sending={sending}
            textareaRef={inputRef}
            className="space-y-2"
            textareaClassName="w-full rounded-xl border border-chrome-border/70 bg-surface-raised/70 p-3 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none"
            controls={
              <>
                <ChatContextToggle
                  checked={includeContext}
                  label="Include Writer Context"
                  onChange={setIncludeContext}
                />
                {templates.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <select
                      value={selectedTemplateId}
                      onChange={(event) => onSelectTemplate(event.target.value)}
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
                        if (!applySelectedTemplate({ mode: 'append', setDraft })) return
                        window.setTimeout(focusInput, 0)
                      }}
                    >
                      Insert
                    </button>
                  </div>
                )}
              </>
            }
          />
        }
      />
    </Card>
  )
}

export default WriterChatSidebar
