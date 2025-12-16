# SRS (Software Requirements Specification) — Project Index

PRD answers “what and why”. SRS answers “what exactly and how to verify”.

## Scope
- SRS is for complex, cross-cutting, or high-risk technical requirements.
- Keep SRS testable: include data contracts, edge cases, and acceptance criteria.

## Files
- `docs/reader-highlighting-srs.md`: Reader highlighting geometry, persistence, and interactions.
- `docs/chat-drafts-srs.md`: Chat history and writer draft persistence (sessions, storage, acceptance tests).
- `docs/writer-srs.md`: Writer requirements (entries/tags/AI actions/chat/markdown/export/personalization).

## Conventions
- Every SRS must include: Goals, Non-goals, Data contracts, Behaviors, Edge cases, Acceptance tests, Risks & mitigations.
- When PRD and SRS conflict on a detail: update PRD for priority/intent; SRS is authoritative for technical specifics.
