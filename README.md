# Coding Round

A local workbench for practicing AI-assisted coding interviews. The planned
experience uses real codebases, an IDE, verified scenarios, and evidence-based
feedback on how you work with AI.

**Complete: local application foundation.** The app provides a responsive overview
and live backend/SQLite readiness. Scenario generation, the bank, IDE containers,
practice sessions, AI assistance, and reports are not implemented.

## Run locally

Prerequisites: Node.js 22.14+ with npm, and Go 1.26+. Go may be on PATH or extracted
to `.tools/go/`. Docker is **not** needed for this foundation; future practice
containers will require a running Docker Engine.

```sh
npm ci
npm run setup
npm run dev
```

Open <http://127.0.0.1:3000>. The Go service listens on `127.0.0.1:8080`.
Ctrl+C stops the development processes. SQLite is created at `data/workbench.db`
and retained across restarts. Dependencies, runtime data, toolchains, caches, and
build outputs are ignored by Git.

To run a production build, run `npm run build`, then use two terminals:

```sh
npm run start:backend
```

```sh
npm run start:frontend
```

## Verify

| Command | Purpose |
| --- | --- |
| `npm test` | Go tests and frontend transport tests |
| `npm run lint` | Go formatting/vet, ESLint, route generation, TypeScript |
| `npm run build` | Go executable and Next.js production bundle |
| `npm run check` | All three checks above |
| `npm run test:e2e` | Production browser checks; run build first |

For browser checks, install Playwright Chromium once with
`cd frontend && npx playwright install chromium`, then return to the root.
Alternatively set `PLAYWRIGHT_CHANNEL=chrome` in your shell to use installed Chrome.
The tests start their own production services on loopback ports 13000 (frontend)
and 18080 (backend), use `.cache/e2e-data`, and save screenshots in `artifacts/`.
They never reuse existing servers; leave those two test ports free. Development
services on ports 3000 and 8080 can keep running.

## Configuration

Set environment variables in the shell that starts the services. The root
`.env.example` documents the values; it is not automatically loaded.

| Variable | Default | Meaning |
| --- | --- | --- |
| `APP_ADDRESS` | `127.0.0.1:8080` | Backend loopback IP and port; public binds are rejected |
| `APP_DATA_DIR` | `../data` | Storage directory, relative to `backend/` |
| `ORCHESTRATOR_URL` | `http://127.0.0.1:8080` | Server-side backend URL used by Next.js |

The default commands bind both services to loopback. No account or authentication
exists in this personal-use foundation. The frontend checks readiness on load and
on **Check connection**, rather than continuously polling.

Health routes: `GET /api/health/live` is process liveness; `GET /api/health/ready`
checks SQLite with a bounded timeout. The browser uses Next.js `/api/readiness`,
which validates the response and keeps backend error details off the page.

## Project map

- `backend/`: Go orchestrator, configuration, HTTP handlers, SQLite initialization.
- `frontend/`: Next.js application, transport tests, production browser tests.
- `scripts/`: shared local Go command runner.
- [Product document](context/PRODUCT-DOCUMENT.md): intended product and architecture.
- [State](STATE.md), [decisions](DECISIONS.md), [backlog](BACKLOG.md): current context.
- [Foundation scope and evidence](docs/features/001-foundation.md): this feature's gate.

Development follows [AGENTS.md](AGENTS.md): one feature at a time, tests first,
small commits, incremental pushes, and an explicit review checkpoint per feature.

Dependency references: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation),
[Go downloads](https://go.dev/dl/), and [SQLite driver](https://pkg.go.dev/modernc.org/sqlite).
