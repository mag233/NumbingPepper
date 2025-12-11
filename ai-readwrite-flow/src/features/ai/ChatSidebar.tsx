import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Loader2, MessageCircle, RotateCcw, Send, Trash2 } from 'lucide-react'
import Card from '../../shared/components/Card'
import useChatStore from '../../stores/chatStore'
import useSettingsStore from '../../stores/settingsStore'
import { sendChatCompletion, type ChatMessageInput } from '../../lib/apiClient'
import useTemplateStore from '../../stores/templateStore'

type Props = {
  quickPrompt?: string
  onConsumeQuickPrompt?: () => void
}

const bubbleClass =
  'rounded-xl border px-3 py-2 text-sm shadow-sm border-slate-800/70 bg-slate-900/70'

const ChatSidebar = ({ quickPrompt, onConsumeQuickPrompt }: Props) => {
  const { messages, addMessage, reset } = useChatStore()
  const { model, apiKey, baseUrl } = useSettingsStore()
  const { templates } = useTemplateStore()
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastPrompt, setLastPrompt] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  useEffect(() => {
    if (!quickPrompt) return
    setDraft(quickPrompt)
    onConsumeQuickPrompt?.()
  }, [quickPrompt, onConsumeQuickPrompt])

  const historyMessages: ChatMessageInput[] = useMemo(
    () =>
      messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    [messages],
  )

  const doSend = async (content: string) => {
    const userMessage = content.trim()
    if (!userMessage || sending) return
    setError(null)
    setSending(true)
    setLastPrompt(userMessage)
    addMessage({ id: '', role: 'user', content: userMessage, createdAt: Date.now() })

    const response = await sendChatCompletion(baseUrl, apiKey, model, [
      ...historyMessages,
      { role: 'user', content: userMessage },
    ])

    if (response.ok && response.content) {
      addMessage({
        id: '',
        role: 'assistant',
        content: response.content,
        createdAt: Date.now(),
      })
    } else {
      setError(response.error ?? 'Request failed')
    }
    setSending(false)
  }

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

  return (
    <Card
      title="AI Chat"
      action={
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-800/70 px-2 py-1 text-xs text-slate-300 hover:border-red-400 hover:text-red-200"
        >
          <Trash2 className="size-4" />
          Clear
        </button>
      }
      className="flex h-full max-h-[calc(100vh-160px)] flex-col"
    >
      <div className="flex h-full flex-col gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <MessageCircle className="size-4 text-sky-300" />
          <span>Selected text is auto-appended to keep answers contextual.</span>
        </div>
        <div className="grid flex-[2] gap-3 overflow-y-auto rounded-xl border border-slate-800/70 bg-slate-950/60 p-3">
          {messages.length === 0 && (
            <p className="text-sm text-slate-500">No messages yet. Select text in Reader or ask a question.</p>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${bubbleClass} ${
                msg.role === 'user' ? 'border-sky-500/60 bg-slate-900 text-slate-100' : ''
              }`}
            >
              <p className="text-xs uppercase text-slate-500">{msg.role}</p>
              <p className="whitespace-pre-wrap text-sm text-slate-100">{msg.content}</p>
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
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            placeholder="Ask a question or paste selected text..."
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

export default ChatSidebar
