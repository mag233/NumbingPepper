# ISSUE-0001: Implement real AI request pipeline

## Context
- Current ChatSidebar simulates responses and only pushes prompts from Reader selection and Writer "/" commands.
- PRD requires hitting `https://xiaoai.plus/v1` with default model `gpt-5-mini`, keyed by user-provided API key.

## Scope
- Add API client to send chat/completion requests using saved settings (baseUrl/model/apiKey).
- Surface loading/error states in ChatSidebar; handle rate/timeout gracefully.
- Ensure prompts include selected text context when initiated from Reader actions.
- Add minimal tests (TS) for API client behavior and settings integration.

## Definition of Done
- ChatSidebar sends live requests and displays streamed or buffered responses.
- Errors surfaced to user with retry; no crashes when offline/misconfigured.
- Reuses stored settings; respects mobile + desktop layouts.
- Build (`npm run build`) and basic lint/tests pass.
