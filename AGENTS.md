# AGENTS.md

Instructions for any coding agent (Codex, Claude Code, etc.) working in this repo. Follow this exactly — it defines the development process, not just code style.

---

## 0. Start of every session

Before touching any code, in this order:
1. Read `STATE.md` — what's done, what's in progress, what's next, any known broken state.
2. Read `DECISIONS.md` — at least the most recent entries, so you don't contradict a prior decision.
3. Read the PRD section (`PRODUCT-DOCUMENT.md`) for the feature/batch you're about to start.
4. Check `BACKLOG.md` for anything already flagged as relevant to this feature.
5. Confirm, in your own first message, what you're about to build and what batch/feature it is — one or two lines, not a restatement of the whole spec.

Treat this as a hard prerequisite, not optional context-gathering. Each feature should ideally be its own session/conversation rather than a continuation of a long thread — start fresh, re-establish context from these files rather than relying on scrollback memory, which degrades over a long session.

## 1. Core workflow: one feature at a time

- Work **feature by feature**, never multiple features in parallel.
- Before starting a feature, confirm you understand its scope from the spec/issue/PRD section given to you. If scope is ambiguous, make the smallest reasonable assumption and state it in your first commit message or a short note — don't stall waiting for clarification unless it's a real blocker (see §4).
- **Do not start the next feature until the current one is stopped and handed back** (§3). This is a hard rule, not a suggestion.
- A "feature" is whatever unit was scoped to you (a batch, a ticket, a checklist item). If a feature is clearly too large for one pass, say so before starting and propose a split — don't silently build half of it and call it done.

## 2. Commit discipline

- **Micro-commits.** Each commit should represent one small, reviewable, working step — not a single giant diff at the end.
- **Target: at least 10 atomic commits per feature**, excluding test commits (tests are committed separately, see below). If a feature is small enough that 10 doesn't make sense, use judgment, but default to over-splitting rather than under-splitting. A reviewer should be able to read the commit log alone and understand how the feature was built, step by step.
- Each commit must:
  - Build/compile (don't commit broken intermediate states unless explicitly marked `wip:` and squashed later — prefer avoiding this entirely).
  - Have a clear, specific message: what changed and why, not "fix stuff" or "update code". Use conventional prefixes where they fit (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`).
- **Commit and push as you go**, not in one batch at the end. Push after each commit or in small batches — don't hoard a feature's entire history locally and dump it at the end.
- Tests get their own commit(s), separate from the implementation commits they verify, so the log clearly shows "implemented X" then "tested X".

## 3. Stop after each feature

- When a feature is complete (implemented, tested, committed, pushed), **stop. Do not proceed to the next feature automatically.**
- End with a short summary: what was built, what was committed (commit range or list), what was tested and how, and anything you assumed or deferred.
- Wait for explicit confirmation ("go ahead", "next", a review comment) before starting the next feature. This is so I can review independently between features — don't erode that checkpoint by bundling the next feature's first steps into the same turn.

## 4. Autonomy: solve it yourself by default

- You are expected to resolve, on your own, without asking:
  - Which dependencies/packages to install, and installing them.
  - Which git commands to run (branch, add, commit, push, rebase if needed).
  - Any other shell/build/test commands needed to get the feature working.
- **Only prompt me when something is genuinely high-stakes or irreversible-feeling** — e.g.:
  - A destructive git operation that could lose work (force-push to a shared branch, history rewrite, hard reset past uncommitted-but-important work).
  - Installing something with real system-level side effects, licensing concerns, or that significantly changes the project's architecture/stack.
  - A command that costs real money or touches external/production systems.
  - An ambiguity where guessing wrong would mean redoing significant work, not just a small fix later.
- Default assumption: routine dev commands (installing a library, running tests, standard git operations, scaffolding files) need **no confirmation**. Asking for these wastes the checkpoint model in §3 — don't.

## 5. Testing

- **The Iron Law: no implementation code without a failing test first**, wherever the feature has a testable acceptance criterion. Write the test, watch it fail for the right reason, then write the minimum code to pass it, then refactor. Where true test-first isn't practical (e.g., exploratory scaffolding, config, infra), tests still land before the feature is marked done — but prefer test-first by default rather than test-after.
- Every feature ships with tests that verify its acceptance criteria, not just a smoke test.
- **Run the tests yourself and confirm they pass** before declaring the feature done. Don't hand back a feature with untested or failing code and ask me to check it — "stop and let me check" (§3) means check the *result*, not debug *whether it works at all*.
- If a test can't be made to pass for a reason outside this feature's scope (e.g., a pre-existing issue elsewhere), say so explicitly in the handback summary — don't silently skip or weaken the test to make it pass.

## 6. Decision log (DECISIONS.md)

- Maintain a single `DECISIONS.md` at the repo root. Append to it — never rewrite or reorder past entries.
- Log **every decision that wasn't fully dictated by the spec**, however small. This includes:
  - System design choices (how a component is structured, why a pattern/library/approach was picked over alternatives).
  - UI/UX choices (layout, interaction behavior, naming, states shown).
  - Naming, schema, API shape, folder structure decisions.
  - Assumptions made to resolve an ambiguous spec (these must be logged here, not just mentioned in a commit message).
  - Anything you'd want to justify if asked "why did you do it this way?" three months from now — if you had to choose between two reasonable options, it goes here.
- **One entry per decision**, added at the time the decision is made, not batched at the end of a feature. Format:

  ```md
  ## 2026-10-03 — <feature/batch name> — <short decision title>
  **Decision:** what was chosen.
  **Why:** the reasoning, in 1–3 sentences.
  **Alternatives considered:** what else was an option, and why it wasn't picked (skip if there genuinely was no alternative).
  **Status:** proposed | accepted | superseded (if superseded, link/reference the entry that replaces it).
  ```

- If a later decision reverses or changes an earlier one, **add a new entry** marking the old one `superseded` — don't edit or delete the original. The log is a history, not a snapshot.
- This is separate from, and in addition to, commit messages (§2) and the handback summary (§3) — commit messages say *what* changed, `DECISIONS.md` says *why*, at a level someone could read on its own without the diff.
- A feature is not done (§7) until its decisions for that feature are logged, even if the feature itself required no ambiguous calls (in that case, note that explicitly isn't necessary — just don't skip logging ones that did happen).

## 7. State tracking (STATE.md)

- Maintain a single `STATE.md` at the repo root. This is the "where are we right now" file — short, current, overwritten in place (unlike `DECISIONS.md`, which only ever grows).
- Update it at the **end of every feature**, before stopping (§3). Keep it short — a snapshot, not a log:
  ```md
  ## Current status
  **Last updated:** <date> — <feature/batch just finished>
  **Done:** <batches/features completed so far, as a list>
  **In progress:** <current batch, or "none — awaiting next assignment">
  **Next up:** <the next batch per the PRD, unless told otherwise>
  **Known issues / broken state:** <anything left intentionally incomplete or failing, with why>
  ```
- Read this first, every session (§0). It replaces re-explaining project status at the start of each conversation.

## 8. Backlog / parking lot (BACKLOG.md)

- Maintain a single `BACKLOG.md` at the repo root. Append-only, like `DECISIONS.md`.
- Anything that comes up while working a feature that is **not in that feature's scope** — a good idea, a refactor temptation, a bug noticed in unrelated code, a "we should also..." — gets written here, not built. One line is enough: what it is, where it came from (which feature you were working when you noticed it).
- This exists specifically to protect the scope-freeze rule in §1: noticing something out of scope is not a reason to expand the current feature.
- Check it during §0's session start — something already flagged here might now be in scope for the feature you're about to start.

## 9. Forbidden practices

Never, under any circumstances, without exception:
- Commit secrets, API keys, tokens, or credentials — check for these before every commit, not just when you remember to.
- Force-push to the main branch, or rewrite history that's already been pushed and could be in use elsewhere.
- Edit or delete past entries in `DECISIONS.md` or `BACKLOG.md` — append only, always (§6, §8).
- Weaken, skip, or comment out a failing test to make a feature appear done (§5).
- Silently expand a feature's scope mid-build instead of logging the idea to `BACKLOG.md` (§8) and staying on task.
- Continue into the next feature without stopping and handing back (§3).

## 10. Standard commands

Run from the repository root. See README.md for prerequisites and browser setup.

| Purpose | Command |
|---|---|
| Install dependencies | `npm ci`, then `npm run setup` |
| Run the app locally | `npm run dev` |
| Run tests | `npm test`; production browser tests: `npm run test:e2e` |
| Run lint/format check | `npm run lint` |
| Build | `npm run build` |
| Full feature check | `npm run check` |

## 11. What "done" means for a feature

A feature is done, and ready to stop on, when:
- [ ] It matches its scoped spec (or the stated, reasonable assumption where the spec was ambiguous).
- [ ] It's built as a sequence of ≥10 atomic, pushed commits (implementation), excluding test commits.
- [ ] Tests exist (test-first per §5), are committed separately, and pass when you run them.
- [ ] Every design/UI/naming/assumption decision made along the way is logged in `DECISIONS.md` (§6).
- [ ] Anything noticed but out of scope is logged in `BACKLOG.md` (§8), not built.
- [ ] `STATE.md` is updated to reflect the new current status (§7).
- [ ] A short handback summary is given, and you've stopped — no silent continuation into the next feature.

## 12. General style

- When the user asks why a technology or approach was chosen, or asks about project setup, append the question and answer to root `QUESTION_ANSWER.md` in the same task. Include the date, rationale, relevant alternatives/tradeoffs, and links to source context. Append corrections rather than silently replacing earlier answers; keep formal decisions in `DECISIONS.md` too.
- Direct, terse commit messages and summaries — no filler, no hedging.
- Prefer working, incremental code over a large speculative rewrite.
- If you hit a real blocker (not covered by §4's "solve it yourself" default), say what it is and what you'd do by default if not told otherwise, rather than just stopping with a question and nothing else.

## 13. Keeping this file itself healthy

- If `AGENTS.md` grows past roughly 150–200 lines as rules accumulate, split it: keep this file as core process/workflow, and move deep domain-specific rules (e.g. testing conventions, git conventions) into separate files (`AGENTS-testing.md`, `AGENTS-git.md`) referenced from here. A bloated single file dilutes attention and rules start getting skipped over long sessions — don't let that happen.
