# ISSUE-0001: Implement real AI request pipeline

## Context
- PRD requires hitting `https://xiaoai.plus/v1` with default model `gpt-5-mini`, keyed by user-provided API key.
- Live chat is wired: ChatSidebar calls `/chat/completions` with saved base/model/key, shows loading/error/retry, records latency/tokens, auto-scrolls to latest, and auto-sends Reader summarize/explain prompts.

## Scope
- Add API client to send chat/completion requests using saved settings (baseUrl/model/apiKey).
- Surface loading/error states in ChatSidebar; handle rate/timeout gracefully.
- Ensure prompts include selected text context when initiated from Reader actions.
- Add minimal tests (TS) for API client behavior and settings integration.
- Optional: stream responses and insert into editor at cursor.

## Definition of Done
- ChatSidebar sends live requests and displays streamed or buffered responses. (Buffered done; streaming pending.)
- Errors surfaced to user with retry; no crashes when offline/misconfigured. (Basic retry done.)
- Reuses stored settings; respects mobile + desktop layouts. (Done.)
- Build (`npm run build`) and basic lint/tests pass. (Not yet tested.)
- Streaming and editor insertion paths covered, or explicitly deferred with tests/notes.
