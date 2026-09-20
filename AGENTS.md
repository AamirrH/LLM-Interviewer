# Project working agreements

- Follow the feature batches in `docs/PRD.md`, one batch in progress at a time.
- Before implementation, record the frozen scope, short plan, and test list in `docs/batches/`.
- Use small, descriptive micro-commits: `type(area): concrete behavior`. Keep independently reversible concerns in separate commits. Preserve the detailed history when merging.
- Write tests first for deterministic logic. Run `npm run check` for a completed batch; review the production UI and record actual evidence and limitations.
- Refine within the current batch until its gate passes. Put unrelated ideas in `BACKLOG.md`.
- Update the README, batch record, and decision log. Provide the user a summary after each completed feature.
- Keep credentials out of commits, logs, fixtures, backups, and screenshots. Use obviously fake keys in tests.
- Do not claim later PRD features are available before they are implemented and verified.
