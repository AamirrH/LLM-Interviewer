# Feature 001: local application foundation

Status: complete, ready for independent review. Source: context/PRODUCT-DOCUMENT sections 5–6.

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

- Test-first runs failed on the missing Go config/storage/HTTP/runtime functions
  and missing frontend readiness module before their implementations were added.
- Go tests passed in all four packages (config, storage, HTTP, orchestrator).
- Eight frontend readiness unit tests passed.
- On 2026-10-04, `npm run check` passed: Go tests in all four packages,
  eight frontend transport tests, Go formatting/vet, ESLint, Prettier, TypeScript,
  Go executable build, and the Next.js production build.
- Browser tests failed against the placeholder screen before UI implementation.
  The final production Chrome run passed all three tests in 7.9 seconds: real
  readiness and empty state, simulated unavailable response with recovery to the
  real backend, and narrow-screen layout with keyboard navigation.
- Inspected desktop (1280px), mobile (390px), and unavailable-state screenshots in
  artifacts/: text and controls fit, no horizontal overflow, and keyboard focus
  is visible. Mobile's skip-link overlay appears intentionally while focused.
- The first resumed browser run found port 8080 occupied by another service.
  Tests now own loopback ports 13000/18080 and never reuse existing servers.
  Frontend lint/format/typecheck passed again after this configuration change.
- Windows sandbox execution stalled during lint and browser-server cleanup.
  Elevated reruns completed successfully, including test-server cleanup. No
  assertions were skipped or weakened; the unrelated port-8080 service was left running.
- Root and frontend npm installs reported zero vulnerabilities at install time.
- Tested environment: Windows, Node 22.14.0, Go 1.27.1, Next.js 16.3.8. Docker is
  stopped; no container behavior was attempted or claimed.
- Reviewed the feature diff and checked whitespace and common secret patterns.
  Prior pushed pause checkpoints retain their `wip:` subjects; history was not
  rewritten. The completed checks above supersede their pending verification.
- Bank/session/container/AI functionality remains outside this feature's scope.
