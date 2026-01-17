import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import Card from '../../shared/components/Card'
import ChatErrorBanner from '../../shared/components/ChatErrorBanner'
import ChatPanelBody from '../../shared/components/ChatPanelBody'
import ChatForm from '../../shared/components/ChatForm'
import { CHAT_TEXTAREA_ROWS } from '../../lib/chatFormSizing'
import useTemplateStore from '../../stores/templateStore'
import useSettingsStore from '../../stores/settingsStore'
import useMetricsStore from '../../stores/metricsStore'
import { sendChatRequest } from '../../lib/apiClient'
import type { ChatMessageInput } from '../../lib/chatApiTypes'
import useWriterProjectStore from './stores/writerProjectStore'
import useWriterChatStore from './stores/writerChatStore'
import { chatSessionIdForProject } from './services/writerChatSession'
import useWriterContextStore from './stores/writerContextStore'
import { buildWriterUserPrompt, stripWriterPromptToInstruction } from './services/writerChatPrompt'
import WriterChatMessages from './components/WriterChatMessages'
import { applyQuickPrompt, parseWriterSelectionQuickPromptMeta } from '../../lib/quickPrompt'
import { useChatTemplateSelection } from '../../lib/hooks/useChatTemplateSelection'
import useWriterSelectionSuggestionStore from './stores/writerSelectionSuggestionStore'
import { WRITER_CHAT_SCOPE, type WriterChatScope } from '../../shared/chatScope'
import useWriterReferencesStore from './stores/writerReferencesStore'
import WriterChatControls from './components/WriterChatControls'
import WriterChatCollapsed from './components/WriterChatCollapsed'
import WriterChatHeaderActions from './components/WriterChatHeaderActions'
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
  const { model, apiKey, baseUrl, chatResponseSettings } = useSettingsStore()
  const { templates } = useTemplateStore()
  const { setMetrics } = useMetricsStore()
  const activeProjectId = useWriterProjectStore((s) => s.activeProjectId)
  const { messages, addMessage, clear, hydrate } = useWriterChatStore()
  const setSuggestionSession = useWriterSelectionSuggestionStore((s) => s.setSession)
  const setSuggestion = useWriterSelectionSuggestionStore((s) => s.setSuggestion)
  const contextText = useWriterContextStore((s) => s.contextText)
  const references = useWriterReferencesStore((s) => s.references)
  const membership = useWriterReferencesStore((s) => s.membership)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastPrompt, setLastPrompt] = useState<string | null>(null)
  const [includeContext, setIncludeContext] = useState(true)
  const [includeReferences, setIncludeReferences] = useState(true)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { selectedTemplateId, selectedTemplate, applySelectedTemplate, onSelectTemplate } =
    useChatTemplateSelection({ templates, applyOnSelect: false })
  const sessionId = useMemo(() => chatSessionIdForProject(activeProjectId), [activeProjectId])
  const includedReferences = useMemo(() => {
    const included = new Set(membership.filter((m) => m.included).map((m) => m.referenceId))
    return references.filter((ref) => included.has(ref.id))
  }, [membership, references])
  const hasIncludedReferences = includedReferences.length > 0
  const focusInput = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  }, [])
  const historyMessages: ChatMessageInput[] = useMemo(
    () =>
      messages.reduce<ChatMessageInput[]>((acc, msg) => {
        const content =
          msg.role === 'user' ? stripWriterPromptToInstruction(msg.content) : msg.content
        if (!content.trim()) return acc
        acc.push({ role: msg.role, content })
        return acc
      }, []),
    [messages],
  )
  useEffect(() => {
    void hydrate(sessionId)
    setSuggestionSession(sessionId)
  }, [hydrate, sessionId, setSuggestionSession])

  const doSend = useCallback(
    async (
      content: string,
      options?: { includeContext?: boolean; includeReferences?: boolean; meta?: unknown },
    ) => {
      if (sending) return
      const prompt = buildWriterUserPrompt(
        content,
        contextText,
        options?.includeContext ?? includeContext,
        includedReferences,
        (options?.includeReferences ?? includeReferences) && hasIncludedReferences,
      )
      if (!prompt) return
      setError(null)
      setSending(true)
      setLastPrompt(content.trim())
      await addMessage({ id: '', role: 'user', content: prompt, createdAt: Date.now(), referenceHighlightId: null })

      const response = await sendChatRequest(baseUrl, apiKey, model, [
        ...historyMessages,
        { role: 'user', content: prompt },
      ], chatResponseSettings)

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
        const parsed = parseWriterSelectionQuickPromptMeta(options?.meta)
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
    [
      addMessage,
      apiKey,
      baseUrl,
      chatResponseSettings,
      contextText,
      historyMessages,
      includeContext,
      includeReferences,
      includedReferences,
      hasIncludedReferences,
      model,
      sending,
      setMetrics,
      setSuggestion,
    ],
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
  const handleInsertTemplate = () => {
    if (!applySelectedTemplate({ mode: 'append', setDraft })) return
    window.setTimeout(focusInput, 0)
  }
  useEffect(() => {
    applyQuickPrompt({
      quickPrompt,
      onConsume: onConsumeQuickPrompt,
      setDraft,
      doSend: (text, meta) => void doSend(text, { includeContext: false, meta }),
      focusInput,
    })
  }, [quickPrompt, onConsumeQuickPrompt, focusInput, doSend])
  if (collapsed) {
    return <WriterChatCollapsed onExpand={() => onCollapsedChange(false)} />
  }
  return (
    <Card
      title="Chat"
      action={<WriterChatHeaderActions onCollapse={() => onCollapsedChange(true)} onClear={() => void clear()} />}
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
              <WriterChatControls
                includeContext={includeContext}
                onIncludeContextChange={setIncludeContext}
                includeReferences={includeReferences}
                onIncludeReferencesChange={setIncludeReferences}
                hasIncludedReferences={hasIncludedReferences}
                includedCount={includedReferences.length}
                templates={templates}
                selectedTemplateId={selectedTemplateId}
                hasSelectedTemplate={Boolean(selectedTemplate)}
                onSelectTemplate={onSelectTemplate}
                onInsertTemplate={handleInsertTemplate}
              />
            }
          />
        }
      />
    </Card>
  )
}

export default WriterChatSidebar
