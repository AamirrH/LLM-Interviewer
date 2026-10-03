# Project questions and answers

Answers to questions raised while building this project: why we chose a tool,
what alternatives we considered, and how the setup works.

Append dated entries as these questions arise. Keep answers specific to this
project, link to the relevant spec or decision, and distinguish current behavior
from future plans. If an answer changes, append a correction referencing the
earlier entry. Formal implementation decisions still belong in [DECISIONS.md](DECISIONS.md).

## 2026-10-04 — Why SQLite instead of Postgres or MySQL?

**Question:** Why did we choose SQLite? Why not Postgres or MySQL?

**Answer:** The PRD explicitly chooses SQLite for a local, single-user application.
It provides persistent storage and transactions without a separate database
server, service, credentials, or network port to manage. The Go application opens
the database directly; no separate SQLite installation is required.

The planned database workload is scenario metadata, sessions, evidence logs,
reports, and settings. Codebases and container images live outside the database.
The current foundation only initializes an `app_metadata` table; those product
features are not implemented yet.

Postgres and MySQL would also work, but would add setup and administration that
the current scope does not need. Their support for many concurrent writers and
shared access across machines becomes more relevant for a hosted product.

**Tradeoff:** SQLite permits one writer at a time. Our foundation uses WAL mode
and a single pooled connection. A future multi-user version should reassess
concurrency requirements; the PRD identifies Postgres as the likely successor.
Migration would require schema, query, and data migration work, not just changing
a connection string.

**References:** [PRD, sections 5–6](context/PRODUCT-DOCUMENT.md#6-tech-stack-and-why);
[storage initialization decision](DECISIONS.md#2026-10-03--foundation--storage-initialization).

## 2026-10-04 — Do I need to install Go?

**Question:** Can I run the Go server without installing Go globally?

**Answer:** On the development machine used for the foundation, Go 1.27.1 was
already installed under the ignored `.tools/go/` directory. The project requires
Go 1.26 or newer. `npm run dev` and `npm run dev:backend` use the shared runner,
which selects that local installation if present and otherwise uses `go` on PATH.

A fresh checkout does not contain `.tools/go/`, so a new machine needs a Go
installation. The npm package named `go` is not required by this project and is
not how we install the Go toolchain.

**References:** [Go runner](scripts/go.mjs);
[local setup](README.md#run-locally).

## 2026-10-04 — Can we use global installations instead?

**Question:** I prefer global installations. What should I install?

**Answer:** Install Go 1.26 or newer using the official Windows x64 MSI, then open
a new terminal and check `go version` and `where.exe go`. Node.js with npm and Git
were already installed on this machine; the foundation was verified with Node
22.14.0. Docker Desktop is needed for future container features, not the current
foundation. SQLite is embedded and needs no separate installation.

**Preference and current behavior:** The user prefers global toolchain
installations. Global Go installation has not yet been confirmed in this log.
The runner still prefers `.tools/go/` when present; switching that preference is
pending and was not part of creating this document. Application packages such as
Next.js and React remain project dependencies managed by npm lockfiles.

**References:** [Official Go installation instructions](https://go.dev/doc/install);
[project prerequisites](README.md#run-locally).
