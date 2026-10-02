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

## 2026-10-03 — Foundation — Toolchains and dependencies
**Decision:** Use Go 1.26, the current Next.js/React releases locked by npm, TypeScript, ESLint, Vitest, and Playwright. Use modernc.org/sqlite through database/sql.
**Why:** The PRD fixes the main stack. A pure-Go SQLite driver avoids a separate C compiler on Windows; unit tests cover transport logic and Playwright covers production browser behavior. Go is downloaded locally with official SHA-256 verification because it is absent from PATH.
**Alternatives considered:** A CGO driver adds host setup; a frontend-only mock cannot establish real backend readiness.
**Status:** accepted

## 2026-10-03 — Foundation — Development identity and screen
**Decision:** Use Coding Round as a provisional UI label, system fonts, and a responsive light workbench with teal status accents. Show foundation readiness and an empty scenario bank without active session controls.
**Why:** No product name or visual identity is specified. The first screen should distinguish working infrastructure from future practice features.
**Status:** accepted

## 2026-10-03 — Foundation — Local configuration contract
**Decision:** Bind Go to 127.0.0.1:8080 by default and reject non-loopback IPs, hostnames, and invalid ports. APP_DATA_DIR defaults to ../data from backend/.
**Why:** The v1 application has no authentication; accidental LAN exposure must not be a default. Explicit IPs avoid ambiguous hostname resolution.
**Status:** accepted

## 2026-10-03 — Foundation — Storage initialization
**Decision:** Use workbench.db, one pooled connection, WAL mode, foreign keys, a five-second busy timeout, and transactional user_version migrations. Initialize only an app_metadata table; reject newer schemas.
**Why:** This provides persistent, versioned storage without prematurely choosing bank/session schemas. Future features append migrations.
**Status:** accepted

## 2026-10-03 — Foundation — Health and browser transport
**Decision:** Expose GET /api/health/live and /api/health/ready, with one-second storage checks and no-store responses. The frontend uses a server-side proxy with a two-second timeout and returns only validated readiness fields.
**Why:** Liveness and storage readiness answer different questions. The browser should not need a backend URL, CORS exceptions, or private error details.
**Status:** accepted
