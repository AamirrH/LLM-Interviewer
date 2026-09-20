# Decision log

## B0 — Local foundation

- Use React, TypeScript, Vite, and Dexie as specified in the PRD.
- Hash routes keep the static build portable without host-specific rewrite rules.
- Use one IndexedDB database; settings and credentials have separate tables.
- Export preferences without API keys. Imports preserve this browser's keys. Credentials are entered separately on a new device.
- Store BYOK credentials on this browser only. Browser storage is not encrypted; no claim of a secure vault.
- Use Vitest with fake IndexedDB for storage behavior and Playwright against the production bundle for the batch gate.
- Use explicit Save actions and visible status/error feedback for settings and credentials.
- PWA installation and offline reload caching belong to B26; already-loaded B0 settings work without network.
- Keep settings UI in focused provider, preference, and data components, with a small static route shell.
- Ship no backend and make no provider calls in B0. Provider status reads "Saved locally", not "Connected".
- Validate backup format and size before writes. Import uses a transaction, and a simulated failed write confirms rollback.
- Package the font locally; all B0 runtime resources come from the same origin.
- Review responsive production screenshots and use isolated Playwright profiles for destructive-flow testing.
