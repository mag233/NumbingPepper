import useSettingsStore from '../../stores/settingsStore'
import { isGpt5Model } from '../../lib/chatResponseSettings'

const inputClass =
  'w-full rounded-lg border border-chrome-border/80 bg-surface-raised/70 px-3 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none'

const ChatResponseSettingsSection = () => {
  const { model, baseUrl, chatResponseSettings, updateChatResponseSettings, save } = useSettingsStore()
  const isGpt5 = isGpt5Model(model)
  const usingResponses = chatResponseSettings.apiMode === 'responses'

  const updateMaxTokens = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) {
      updateChatResponseSettings({ maxOutputTokens: null })
      return
    }
    const parsed = Number.parseInt(trimmed, 10)
    updateChatResponseSettings({ maxOutputTokens: Number.isFinite(parsed) ? parsed : null })
  }

  return (
    <div className="space-y-3 rounded-xl border border-chrome-border/70 bg-surface-raised/50 p-3">
      <div>
        <p className="text-sm font-semibold text-ink-primary">GPT-5 Responses API</p>
        <p className="text-xs text-ink-muted">
          Controls advanced GPT-5 response parameters. These are only applied when Responses API is enabled.
        </p>
      </div>

      <div className="grid gap-2 text-sm text-ink-primary">
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            name="chat-api-mode"
            checked={chatResponseSettings.apiMode === 'chat'}
            onChange={() => updateChatResponseSettings({ apiMode: 'chat' })}
            className="accent-accent"
          />
          Chat Completions (default)
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            name="chat-api-mode"
            checked={chatResponseSettings.apiMode === 'responses'}
            onChange={() => updateChatResponseSettings({ apiMode: 'responses' })}
            className="accent-accent"
          />
          Responses API (GPT-5)
        </label>
      </div>

      {!isGpt5 && (
        <div className="rounded-lg border border-status-warning/40 bg-status-warning/10 px-3 py-2 text-xs text-status-warning">
          Current model is not GPT-5. Reasoning and verbosity controls will be ignored.
        </div>
      )}

      <div className="grid gap-2 md:grid-cols-2">
        <label className="grid gap-1 text-xs text-ink-muted">
          Reasoning effort
          <select
            value={chatResponseSettings.reasoningEffort}
            onChange={(event) => updateChatResponseSettings({ reasoningEffort: event.target.value as 'low' | 'medium' | 'high' })}
            className={inputClass}
            disabled={!isGpt5 || !usingResponses}
          >
            <option value="low">low — faster/cheaper</option>
            <option value="medium">medium — balanced</option>
            <option value="high">high — deeper reasoning</option>
          </select>
        </label>

        <label className="grid gap-1 text-xs text-ink-muted">
          Verbosity
          <select
            value={chatResponseSettings.verbosity}
            onChange={(event) => updateChatResponseSettings({ verbosity: event.target.value as 'low' | 'medium' | 'high' })}
            className={inputClass}
            disabled={!isGpt5 || !usingResponses}
          >
            <option value="low">low — concise</option>
            <option value="medium">medium — balanced</option>
            <option value="high">high — detailed</option>
          </select>
        </label>

        <label className="grid gap-1 text-xs text-ink-muted">
          Max output tokens
          <input
            type="number"
            min={1}
            value={chatResponseSettings.maxOutputTokens ?? ''}
            onChange={(event) => updateMaxTokens(event.target.value)}
            className={inputClass}
            placeholder="Leave blank for model default"
            disabled={!usingResponses}
          />
        </label>
      </div>

      {usingResponses && (
        <p className="text-[11px] text-ink-muted">
          Base URL: {baseUrl || '(default)'} — ensure the server supports the /responses endpoint.
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void save()}
          className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent/90"
        >
          Save
        </button>
      </div>
    </div>
  )
}

export default ChatResponseSettingsSection
