# Feature 001: local application foundation

Status: paused in progress at the user's request. Source: PRODUCT-DOCUMENT sections 5–6.

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
- Initial Next.js production builds passed, including the first workbench screen.
  The final build after lint fixes and formatting is still pending.
- Browser tests failed as expected against the placeholder screen before the UI
  implementation; their final passing run and screenshot review remain pending.
- Lint caught raw internal navigation links and state updates in an effect. Links
  now use Next Link; state updates now run in a request-completion callback. The
  latest check passed ESLint and was stopped as TypeScript checking began for the
  user-requested pause. The newly added Prettier check still needs its final run.
- Root and frontend npm installs reported zero vulnerabilities at install time.
- Tested environment: Windows, Node 22.14.0, Go 1.27.1, Next.js 16.3.8. Docker is
  stopped; no container behavior was attempted or claimed.
- Feature is not complete. Resume instructions are in root STATE.md.
