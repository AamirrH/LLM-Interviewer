# Project Map

## Purpose
Practice debugging and extending verified codebases with an AI assistant; see context/PRODUCT-DOCUMENT.md.

## Requirements
PRD specifies local-first solo use and preverified scenario content. STATE.md records interest in future growth and a pending SQLite versus Postgres discussion; migration is not decided.

## Components
- Go backend: backend/internal/httpapi/, backend/internal/config/.
- SQLite persistence: backend/internal/storage/storage.go; verified embedded SQL driver, one connection, WAL, versioned initialization of app_metadata.
- Next.js UI: frontend/src/app/ and frontend/src/components/connection-status.tsx.
- Readiness proxy: frontend/src/app/api/readiness/route.ts and frontend/src/lib/readiness.ts.
- STATE.md reports Feature 001 foundation completed. Scenario bank and container/session features remain future work.

## Main Flow
Verified route: Next.js readiness GET calls readReadiness with ORCHESTRATOR_URL and returns readiness JSON. Backend connection and migration initialization use SQLite workbench.db.
Full session flow is specified in the PRD, not implemented in the foundation.

## Data and Trust Boundaries
Embedded database under the configured data directory. Further session, container, and AI boundaries require inspection when scoped.

## Build and Deployment
Root package.json defines npm run dev, npm test, npm run lint, npm run build, npm run check, and npm run test:e2e.
No checks rerun during onboarding; prior passing results are recorded in STATE.md.

## Unknowns
- Today's task and learning focus.
- Whether to retain SQLite or separately scope a Postgres migration.
- Learner familiarity with the codebase and relevant technologies.
