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
