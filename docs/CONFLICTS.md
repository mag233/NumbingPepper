# Docs Conflict Check

## Result (latest)
- Found: encoding artifacts in PRD and TASKS (non-ASCII dash/quote corruption).
- Found: TASKS statuses drifted (schema/import marked Todo while already implemented).
- Resolved:
  - Rewrote `docs/PRD.md` with clean encoding and preserved requirements.
  - Updated `docs/TASKS.md` statuses for schema/import and marked highlights as in progress.

## Remaining known inconsistencies
- Highlighting: PRD declares highlight save/overlay as Alpha must-ship; current implementation exists but still needs geometry/merge/selection interactions to meet “Kindle-like” quality (tracked in `docs/reader-highlighting-srs.md` and Task 12).
