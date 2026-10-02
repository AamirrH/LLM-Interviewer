# Feature 001: local application foundation

Status: in progress. Source: PRODUCT-DOCUMENT sections 5–6.

## Frozen scope

Build a runnable Go HTTP service, persistent SQLite initialization, and a Next.js
application that reports backend/storage readiness honestly. Bind development
servers to loopback. Provide reproducible install, test, lint, and build commands.
No bank entries, sessions, containers, AI calls, scoring, or simulated activity.

## Plan

1. Establish repository conventions and pinned tool dependencies.
2. Test and implement configuration, SQLite initialization, and HTTP health routes.
3. Wire process startup and shutdown.
4. Test and implement frontend status transport and an accessible foundation screen.
5. Run checks and review the production build in a browser; record evidence.

## Acceptance tests

- Safe loopback defaults; reject invalid/nonlocal listen addresses.
- SQLite creates missing data directories, migrates idempotently, persists schema,
  and returns initialization failures.
- Liveness is independent of storage; readiness returns 503 when storage fails,
  without exposing filesystem paths or internal errors. Unknown routes return 404.
- Frontend handles ready, unavailable, malformed, and timed-out backend responses.
- Browser displays real readiness and a truthful empty practice state; keyboard
  navigation and narrow-screen layout work; unavailable backend is recoverable.
- Go tests/vet/build, frontend tests/lint/typecheck/production build all pass.

## Evidence

Pending.
