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

## 2026-10-03 — Foundation — Process lifetime
**Decision:** Initialize storage before binding HTTP, use bounded HTTP timeouts, and shut down on interrupt or termination with a five-second grace period.
**Why:** Startup must fail clearly for unusable storage or occupied ports, and normal shutdown should release the listener and database.
**Status:** accepted

## 2026-10-03 — Foundation — Shared developer commands
**Decision:** Root npm scripts orchestrate both runtimes. A small Node runner chooses project-local Go or PATH, keeps caches under .cache, and builds to artifacts/. Concurrently manages both development processes.
**Why:** One documented command surface works on Windows and Unix without requiring a global task runner. Go 1.26 is the minimum; this environment uses the verified current Go 1.27.1 archive.
**Status:** accepted

## 2026-10-03 — Foundation — Readiness interaction and browser checks
**Decision:** Check readiness on page load and manual retry, abort superseded requests, and label unavailable storage as unverified. Use Playwright against production servers with separate .cache/e2e-data storage.
**Why:** A stale response must not overwrite a newer check, and connectivity failures must not imply data loss. Automatic tests cover desktop, mobile, keyboard access, and recovery; screenshots support visual review.
**Alternatives considered:** Continuous polling is unnecessary for a foundation screen. Real session lifecycle events can drive updates later.
**Status:** accepted

## 2026-10-03 — Foundation — Formatting and build root
**Decision:** Add Prettier to frontend lint checks and set the Next.js Turbopack root explicitly to frontend/.
**Why:** JSX/CSS should remain reviewable and consistently formatted. Root and frontend npm lockfiles serve different runtimes and must not make Next infer an unintended build root.
**Status:** accepted

## 2026-10-04 — Foundation — Isolated browser-test ports
**Decision:** Start browser-test production services on loopback ports 13000 and 18080, explicitly connect the frontend to that backend, and never reuse existing servers.
**Why:** The acceptance run failed because another service occupied port 8080. Dedicated ports let checks coexist with normal development services and ensure they exercise this build and its test database.
**Alternatives considered:** Stopping an unrelated service would disrupt other work; reusing it could validate the wrong application or storage.
**Status:** accepted
