## Current status
**Last updated:** 2026-10-03 — foundation paused at user's request
**Done:** Repository workflow; Go configuration, SQLite initialization, health API, process lifecycle, and frontend readiness transport implemented with passing unit tests. Their implementation/test checkpoints are pushed.
**In progress:** Feature 001 — local application foundation. UI, developer commands, and browser tests are checkpointed; feature gate is NOT complete.
**Next up:** Resume this feature: run `npm run check`, then production browser tests and visual review. Do not begin bank/session work yet.
**Known issues / broken state:** Latest check passed ESLint and was stopped as TypeScript checking began for this pause. Earlier lint caught Next navigation and React effect issues; those fixes passed ESLint, but the final check/build gate has not passed. Browser tests failed as expected against the initial placeholder; they have not yet passed against the implemented screen. Docker daemon is stopped and is not needed for this feature.

## Resume notes
- Branch: `feat/foundation`; root workflow files are canonical. PRD remains `context/PRODUCT-DOCUMENT.md`.
- Go 1.27.1 is installed in ignored `.tools/go/`; root scripts use it automatically. Module minimum is Go 1.26. Dependencies are installed; Go caches are in `.cache/`.
- Run `npm run check`. If an execution fails because of sandbox permissions/network access, use escalation rather than waiting on a stalled process indefinitely.
- Run browser tests in PowerShell with `$env:PLAYWRIGHT_CHANNEL='chrome'; $env:CI='1'; npm run test:e2e` after a successful build. Chrome is installed. Windows process cleanup required escalation during the first failing browser run.
- Browser tests start production frontend/backend, use `.cache/e2e-data`, and write desktop/mobile/unavailable screenshots under ignored `artifacts/`. Inspect these images before declaring the feature complete.
- Review the final diff, update `docs/features/001-foundation.md` with actual evidence, update this state, commit and push, then hand back. No merge or release has been performed.
