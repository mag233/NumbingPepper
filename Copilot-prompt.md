# Context
Repo: AI-ReadWrite-Flow (Tauri v2 + React/TS, local-first)
Rules: follow docs/copilot-instructions.md strictly.
Docs: docs/PRD.md, docs/TASKS.md, relevant docs/*SRS*.md, docs/RISKS.md, docs/CHANGELOG.md.
# Task
Task ID(s): X.Y (from docs/TASKS.md)
Goal (1 sentence):
Out of scope (explicit):
Target files/areas (if known):
Spec → Verify Gate (required before coding)
Specification
Data contracts (TS types / Rust structs):
State/store changes:
Edge cases:
Failure modes:
Web vs Desktop differences (if any):
Verifiable Criteria
Unit tests (Vitest): what to test + files to add
Manual acceptance steps (numbered):
Expected observable results:
Implementation constraints
No any; use unknown + narrowing if needed.
Zod for external/untrusted input.
File <250 LOC; function <30 LOC; nesting ≤3 (guard clauses).
Mobile-first; Tailwind utilities only; avoid hard-coded widths and unnecessary absolute.
Do not break existing app/web separation rules.
Update docs after changes: docs/TASKS.md statuses, docs/CHANGELOG.md, and PRD/SRS if requirements changed.
# Execution requirements
Run and record:
cd ai-readwrite-flow; cmd /c npm test
cd ai-readwrite-flow; cmd /c npm run lint
cd ai-readwrite-flow; cmd /c npm run build
If Rust changed: cd ai-readwrite-flow/src-tauri; cargo check
# Output format
First output must include: Clarity Rating, Completeness Rating, Risk Assessment, Rule Compliance Check, Action Plan.
Do not start coding until I say “Proceed”.