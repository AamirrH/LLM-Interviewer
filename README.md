# LLM-Interviewer

A local-first mock interview workspace, built in small, verified feature batches from the [PRD](docs/PRD.md).

**Current release: B0 — Project skeleton and settings.** Interview sessions and model calls begin in later batches.

## Run locally

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite (normally `http://127.0.0.1:5173`).

## Available now

- Responsive workspace and settings pages with hash routing.
- Dark, light, and system themes; saved language, editor font size, and autocomplete defaults.
- Local API-key storage for Gemini, Groq, and OpenRouter; masked entry, replacement, and removal. Saving does **not** validate a key or call a provider.
- JSON preference backups with validation, a restore preview, and transactional replacement.
- Confirmed deletion of all application records, including provider credentials.
- Loading, storage-error, empty, unknown-route, and offline states; keyboard navigation and focus-managed deletion dialog.

## Privacy and storage

Preferences and keys live in IndexedDB in this browser, scoped to this site's origin. B0 sends no app data to external services. Provider key-management links open the provider's website only when you follow them. Fonts are bundled locally.

Keys are **not encrypted** in browser storage. Use a trusted device and appropriately restricted credentials. Backups never contain API keys; restoring a backup preserves the keys already in this browser. Enter keys again when moving to a new device.

Delete-all clears every table in the application database; preferences then return to defaults. It does not delete a previously downloaded backup. Clearing browser site data also removes your local app data. Private browsing and storage restrictions can prevent persistence.

Already-loaded settings work offline. Offline page reload/PWA caching is planned for B26. Keep the same host and port to access the same stored workspace (`localhost` and `127.0.0.1` are different origins).

## Verify

```sh
npx playwright install chromium
npm run check
```

The gate runs ESLint, Vitest storage tests, TypeScript checking, a Vite production build, and Playwright against that build. On Linux CI, install browser system dependencies with `npx playwright install --with-deps chromium`.

```sh
npm test                  # storage tests
npm run test:watch        # watch storage tests
npm run build             # type check + static bundle in dist/
npm run test:e2e           # browser tests; build first
npm run format:check       # formatting validation
```

Playwright uses port 4173. The dev server uses 5173. Test browser profiles are isolated from your regular browser data; destructive tests only erase test fixtures. Responsive screenshots and failure traces are written to the ignored `test-results/` directory.

## Build and host

`npm run build` produces a static `dist/` directory. Preview with `npm run preview`. Hash routing and relative asset paths support static hosts and subdirectories without a server-side router. Public deployment hardening is tracked in B26.

## Delivery workflow

One batch at a time: freeze its scope, record the plan and test list, write tests for deterministic behavior, implement with descriptive micro-commits, and run the gate. Merge a passing batch without squashing its history and tag its completion. Give a feature summary after each completed feature. Scope additions go into [BACKLOG.md](BACKLOG.md).

Examples: `feat(settings): add masked provider key entry, replacement, and removal` and `fix(storage): preserve preferences when a restore write fails`.

See [B0 scope and gate](docs/batches/B0.md) and the [decision log](docs/DECISIONS.md). Next: **B1 — LLM provider layer**, including schema validation, fallback, usage counters, and live provider benchmarks.

## Implementation references

The foundation follows the official [Vite guide](https://vite.dev/guide/), [Dexie React documentation](https://dexie.org/docs/Tutorial/React), and [Playwright setup documentation](https://playwright.dev/docs/intro).
