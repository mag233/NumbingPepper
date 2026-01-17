import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircle, Trash2, X } from 'lucide-react'
import Card from '../../shared/components/Card'
import ChatErrorBanner from '../../shared/components/ChatErrorBanner'
import ChatForm from '../../shared/components/ChatForm'
import ChatPanelBody from '../../shared/components/ChatPanelBody'
import ChatScrollContainer from '../../shared/components/ChatScrollContainer'
import { buildChatBubbleClass } from '../../shared/components/chatBubble'
import { READER_CHAT_SCOPE, type ReaderChatScope } from '../../shared/chatScope'
import useChatStore from '../../stores/chatStore'
import useSettingsStore from '../../stores/settingsStore'
import { sendChatRequest } from '../../lib/apiClient'
import type { ChatMessageInput } from '../../lib/chatApiTypes'
import useTemplateStore from '../../stores/templateStore'
import useMetricsStore from '../../stores/metricsStore'
import useLibraryStore from '../../stores/libraryStore'
import { applyQuickPrompt } from '../../lib/quickPrompt'
import { CHAT_TEXTAREA_MOBILE_CLASS, CHAT_TEXTAREA_ROWS } from '../../lib/chatFormSizing'
import { useChatTemplateSelection } from '../../lib/hooks/useChatTemplateSelection'
import { chatSessionIdForBook } from './services/chatSession'

type Props = {
  quickPrompt?: { text: string; autoSend?: boolean; meta?: unknown }
  onConsumeQuickPrompt?: () => void
  variant?: 'default' | 'mobileOverlay'
  onClose?: () => void
  scope: ReaderChatScope
}

const bubbleClass = 'rounded-xl border px-3 py-2 text-sm shadow-sm'

const ChatSidebar = ({ quickPrompt, onConsumeQuickPrompt, variant = 'default', onClose, scope }: Props) => {
  if (import.meta.env.DEV && scope !== READER_CHAT_SCOPE) {
    throw new Error('ChatSidebar must be used with READER_CHAT_SCOPE')
  }
  const { messages, addMessage, clear, hydrate } = useChatStore()
  const { model, apiKey, baseUrl, chatResponseSettings } = useSettingsStore()
  const { templates } = useTemplateStore()
  const { setMetrics } = useMetricsStore()
  const { activeId } = useLibraryStore()
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastPrompt, setLastPrompt] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { selectedTemplateId, onSelectTemplate } = useChatTemplateSelection({ templates, applyOnSelect: true })

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

      const response = await sendChatRequest(baseUrl, apiKey, model, [
        ...historyMessages,
        { role: 'user', content: userMessage },
      ], chatResponseSettings)

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
    [addMessage, apiKey, baseUrl, chatResponseSettings, historyMessages, model, sending, setMetrics],
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
      doSend: (text) => void doSend(text),
      focusInput,
      afterAutoSendFocus: true,
    })
  }, [quickPrompt, onConsumeQuickPrompt, doSend, focusInput])

  const renderMessages = () => (
    <ChatScrollContainer
      scrollKey={messages.length}
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
            className={buildChatBubbleClass(
              bubbleClass,
              msg.role === 'user'
                ? 'w-full max-w-[80%] border-accent/70 bg-accent/10'
                : 'w-full max-w-[80%] border-chrome-border/70 bg-surface-raised/70',
              variant === 'mobileOverlay' ? 'shadow-none' : undefined,
            )}
          >
            <p className="text-xs uppercase text-ink-muted">{msg.role}</p>
            <p className="whitespace-pre-wrap text-sm text-ink-primary leading-relaxed">{msg.content}</p>
          </div>
        </div>
      ))}
    </ChatScrollContainer>
  )

  const renderForm = () => (
    <ChatForm
      value={draft}
      onChange={setDraft}
      onSubmit={handleSend}
      placeholder="Ask a question or paste selected text..."
      rows={variant === 'mobileOverlay' ? CHAT_TEXTAREA_ROWS.mobile : CHAT_TEXTAREA_ROWS.desktop}
      sending={sending}
      textareaRef={inputRef}
      className={
        variant === 'mobileOverlay'
          ? 'space-y-2 border-t border-chrome-border/50 bg-surface-base/92 p-3 shadow-[0_-10px_20px_-14px_rgba(0,0,0,0.5)]'
          : 'space-y-2 flex-1'
      }
      textareaClassName={`w-full rounded-xl border border-chrome-border/60 bg-surface-raised/80 p-3 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none ${
        variant === 'mobileOverlay' ? CHAT_TEXTAREA_MOBILE_CLASS : ''
      }`}
      controls={
        templates.length > 0 ? (
          <div className="flex items-center gap-2 text-xs">
            <select
              value={selectedTemplateId}
              onChange={(event) => {
                const id = event.target.value
                onSelectTemplate(id, setDraft)
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
        ) : undefined
      }
    />
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
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-chrome-border/60 px-3 text-xs text-ink-muted hover:border-status-danger/70 hover:text-status-danger"
            >
              <Trash2 className="size-4" />
              Clear
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-chrome-border/70 text-ink-muted hover:border-accent hover:text-ink-primary"
                aria-label="Close chat"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </header>
        <ChatPanelBody
          className="flex min-h-0 flex-1 flex-col gap-3 py-2"
          helper={<div className="px-4 text-xs text-ink-muted">Context from selected text is auto-appended.</div>}
          messages={renderMessages()}
          error={error ? <ChatErrorBanner message={error} onRetry={lastPrompt ? handleRetry : undefined} /> : undefined}
          form={renderForm()}
        />
      </div>
    )
  }

  return (
    <Card
      title="AI Chat"
      action={
        <button
          onClick={() => void clear()}
          className="inline-flex items-center gap-2 rounded-lg border border-chrome-border/70 px-2 py-1 text-xs text-ink-muted hover:border-status-danger/70 hover:text-status-danger"
        >
          <Trash2 className="size-4" />
          Clear
        </button>
      }
      className="flex h-full max-h-[calc(100vh-160px)] flex-col"
    >
      <ChatPanelBody
        className="flex h-full flex-col gap-3"
        helper={
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <MessageCircle className="size-4 text-accent" />
            <span className="text-ink-muted">Selected text is auto-appended to keep answers contextual.</span>
          </div>
        }
        messages={renderMessages()}
        error={error ? <ChatErrorBanner message={error} onRetry={lastPrompt ? handleRetry : undefined} /> : undefined}
        form={renderForm()}
      />
    </Card>
  )
}

export default ChatSidebar
