## 2026-10-03 — Foundation — First feature boundary
**Decision:** Start with a runnable Go/Next.js/SQLite foundation and readiness screen.
**Why:** The PRD defines features but not delivery batches. This establishes the runtime needed by bank and session work without claiming those features exist.
**Alternatives considered:** Building the complete practice loop first would delay the required independent review checkpoint.
**Status:** accepted

## 2026-10-03 — Foundation — Canonical context locations
**Decision:** Move AGENTS.md, STATE.md, DECISIONS.md, and BACKLOG.md to the repository root; retain the product document in context/.
**Why:** The workflow explicitly requires single root-level tracking files, and root AGENTS.md applies to all implementation directories.
**Alternatives considered:** Duplicate files would create conflicting sources of truth.
**Status:** accepted

## 2026-10-03 — Foundation — Repository layout
**Decision:** Use backend/ for the Go module, frontend/ for the Next.js app, scripts/ for local commands, and docs/features/ for scope and evidence.
**Why:** Each runtime keeps its own dependencies while root commands provide one entry point.
**Status:** accepted
