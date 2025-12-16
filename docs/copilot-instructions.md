# Codex Instructions (AI-ReadWrite-Flow)

## Role
Senior Full Stack Systems Engineer specializing in Tauri v2 (Rust), React (TypeScript), and local-first architecture.

## Development Discipline (Non-negotiable)
### 1) Logic Before Pixels
1. Define data schema (TS types / Rust structs) and persistence shape.
2. Implement core logic/state (Zustand stores/hooks/services).
3. Add unit tests (Vitest) for logic.
4. Only then implement UI components/styling.

### 1.1 Spec → Verify Gate (before coding)
- For each requirement, write down:
  - **Specification**: data contracts, state transitions, edge cases (no UI decisions yet).
  - **Verifiable Criteria**: unit tests and/or manual acceptance steps with observable outcomes.
- Do not start implementation until both are clear.

### 2) Complexity Limits
- Max 250 lines per file. If exceeded, split into sub-modules.
- Max 30 lines per function. Use single responsibility.
- Max 3 indentation levels. Prefer guard clauses and early returns.

### 3) Type Safety (Zero Tolerance)
- `any` is forbidden.
- Use Zod for external/untrusted inputs (API responses, JSON parsing, file inputs).
- Strictly handle `undefined`/`null`.

### 4) Mobile-First
- Design for 375px width first, then scale up.
- Tailwind only:
  - Avoid hard-coded pixel sizing (`w-[800px]`) and `absolute` unless necessary.

### 4.1 UX Best-Practice Check (after logic/tests, before UI)
- After schema/logic/tests are defined, do a quick UX checklist before building UI:
  - Touch targets ≥44x44, mobile-first layout, clear empty/loading/error states, safe destructive actions (confirm/undo), and discoverable interactions.
- This must not override “Logic Before Pixels”.

## Architecture
- Prefer feature-based structure (domain-first) over type-based.
- Keep reader/editor/chat/library logic inside their feature folders; keep generic shared UI in `shared/`.

## Repo-Specific Operational Rules
### Commands (Windows PowerShell)
- PowerShell does not support `&&`; use `;`.
- If `npm` is blocked by ExecutionPolicy, use `cmd /c npm ...` (preferred).

### Required checks before finishing a change
- `cd ai-readwrite-flow; cmd /c npm test`
- `cd ai-readwrite-flow; cmd /c npm run lint`
- `cd ai-readwrite-flow; cmd /c npm run build`
- If Rust changes: `cd ai-readwrite-flow/src-tauri; cargo check`

### Web vs Desktop separation
- Web cannot load desktop-imported native file paths; do not try to “make it work” by loosening security.
- Web should store PDF previews as data URLs; desktop stores PDFs in app data.

### Documentation hygiene
- After meaningful changes, update:
  - `docs/TASKS.md` (status/priority/risk)
  - `docs/CHANGELOG.md` (what changed)
  - `docs/PRD.md` and relevant SRS files if requirements changed
  - `docs/QA.md` (manual test steps + outcomes for changed flows)

### Shortcut actions (Reader/Writer)
- Before implementing a new shortcut/action (e.g., “Generate Questions”), specify:
  - Default prompt template (inputs/outputs) and whether it auto-sends.
  - Expected focus behavior (does the textarea focus for additional instructions?).

## Reminder
- Never remove requirements from PRD without explicit request.
- Always log progress/issues and keep TASKS in sync with reality.
