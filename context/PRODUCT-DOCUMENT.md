# Product Document: AI-Assisted Coding Round Prep Platform

| | |
|---|---|
| **Status** | Draft v1 |
| **Date** | 3 Oct 2026 |
| **Type** | Personal-use tool, local-first, free to run |
| **Core bet** | Practice the actual new interview format — debugging/extending a real codebase with an AI pair-programmer watching you — not LeetCode. |

---

## 1. What this is, in one paragraph

You open the app, pick a tech stack and a scenario, and it drops you into a real, running codebase inside a browser-based VS Code (not a toy editor) with a terminal, a git history, a test suite, and a chat panel to an AI assistant that will help you but will not hand you the answer. Something in the codebase is broken (or missing). You investigate like you would at a job — read code, check git blame, run tests, ask the AI targeted questions, apply and verify its suggestions — until it's fixed or time runs out. At the end you get a report: did it work, how fast, and — the part nobody else measures — **how you used the AI**: did you verify its suggestions or paste them blindly, did you catch it when it was wrong, did your fix break something else.

Every codebase and bug is **generated and verified once, offline, into a bank**, never generated live during your session. Your session only ever touches known-good, pre-checked content. This is the single most important engineering decision in this document — see §4.

---

## 2. Why this, why now

- Big tech is adding an "AI-assisted coding" interview round: you get a real(ish) codebase, an AI tool, and a task — debug, extend, review. This is new enough that no prep tool is built for it specifically.
- DSA prep tools are saturated. This format is not.
- The skill being tested isn't "can you code" — you already can. It's: can you orient in unfamiliar code fast, form a hypothesis, use an AI tool as a force-multiplier without being misled by it, and verify before you trust. That's a different muscle, and it's the one this tool trains.
- It reuses almost everything you already validated conceptually in the earlier DSA-interviewer design (hint ladders, evidence logs, phase-aware reporting) and points it at a problem that's actually easier to get *correct*, because "do the tests pass" is a much simpler ground truth than "is this O(n) proof convincing."

---

## 3. Goals and non-goals

### Goals
- G1. Feel like real debugging work, not a quiz: a real IDE, a real terminal, a real git history, real test runs.
- G2. Every codebase/bug combination is **verified correct** before a human ever sees it — no live generation during a session.
- G3. The AI assistant helps like a real pair-programmer would: capable, sometimes wrong, never a spoiler.
- G4. Measure **how** the candidate worked with AI, not just whether the bug got fixed.
- G5. Zero recurring cost for solo use. BYOK if ever shared.
- G6. One stack built deep (Spring Boot) before adding breadth (Node/Go/React).

### Non-goals (v1)
- Live, on-demand codebase generation inside a candidate's session.
- Multi-user accounts, payments, leaderboards against other people.
- Kubernetes, multi-node orchestration — this runs on one machine.
- Full microservice systems as the first content type — start monolith, go multi-service later.
- Mobile app.

---

## 4. The core engineering decision: factory vs. live generation

This shows up everywhere in the design, so it's worth stating once, clearly.

**The wrong way:** candidate picks "Spring Boot, e-commerce, medium," and the LLM generates a codebase and injects a bug *right then*, live, into their session.

Why this fails: generating a coherent multi-file codebase is unreliable. The LLM will produce incidental bugs you didn't ask for, inconsistent interfaces, flaky or wrong tests, broken builds — on top of the bug you *meant* to inject. Now you cannot tell "the candidate struggled because of the real seeded bug" from "the candidate struggled because the LLM's scaffolding was garbage." Your signal is destroyed, and you find out only after burning the candidate's (your) time.

**The right way: a factory, run offline, that stocks a bank.**

```
OFFLINE (run whenever, no time pressure, failures are cheap)
┌──────────────────────────────────────────────────────────────┐
│  1. Generate codebase (LLM, given stack+domain+size spec)     │
│  2. Build it, run full test suite → MUST be 100% green        │
│  3. Seed a plausible git history (see §7.6)                   │
│  4. Inject bug(s) via targeted mutation                       │
│  5. Re-run tests → exactly the expected tests now fail,       │
│     nothing else does                                         │
│  6. Package as a container image + metadata                   │
│  7. Store in the BANK, tagged (stack, domain, difficulty,     │
│     bug archetype, verified=true)                             │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
LIVE (candidate session — fast, cannot fail on correctness)
┌──────────────────────────────────────────────────────────────┐
│  Pick a verified bank entry matching the candidate's choice   │
│  → spin up a container from its pre-built image → done        │
└──────────────────────────────────────────────────────────────┘
```

A session never depends on an LLM behaving well in real time for *content correctness*. The only thing happening live is the AI *assistant* conversation, which is allowed to be imperfect — that's the point (§8).

---

## 5. High-level architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                           BROWSER (candidate)                       │
│  ┌───────────────┐  ┌────────────────┐  ┌───────────────────────┐  │
│  │ Setup / Report│  │ IDE pane        │  │ AI chat + timer +     │  │
│  │ screens       │  │ (code-server,   │  │ "Run Checks" panel    │  │
│  │ (Next.js)     │  │ iframe)         │  │ (Next.js)             │  │
│  └───────┬───────┘  └────────┬────────┘  └───────────┬───────────┘  │
└──────────┼───────────────────┼───────────────────────┼──────────────┘
           │ REST              │ proxied HTTP/WS        │ WebSocket
           ▼                   ▼                        ▼
┌────────────────────────────────────────────────────────────────────┐
│                     GO ORCHESTRATOR (backend)                       │
│  ┌───────────┐ ┌──────────────┐ ┌────────────┐ ┌─────────────────┐ │
│  │ Session   │ │ Docker        │ │ AI Gateway │ │ Evaluation /    │ │
│  │ Manager   │ │ Controller    │ │ (guard +   │ │ Scoring Engine  │ │
│  │           │ │ (Docker SDK)  │ │ providers) │ │ (evidence log)  │ │
│  └─────┬─────┘ └──────┬───────┘ └─────┬──────┘ └────────┬────────┘ │
│        │              │               │                 │          │
│  ┌─────┴──────────────┴───────────────┴─────────────────┴───────┐  │
│  │                      Bank Manager + SQLite                   │  │
│  │     (verified codebase/bug entries, sessions, reports)        │  │
│  └────────────────────────────────────────────────────────────┘  │
└───────────────────────────┬──────────────────────────────────────┘
                             │ Docker Engine API
                             ▼
┌────────────────────────────────────────────────────────────────────┐
│                  PER-SESSION DOCKER CONTAINER                       │
│  ┌───────────────┐  ┌────────────┐  ┌───────────────────────────┐  │
│  │ code-server    │  │ the        │  │ test runner / build tool  │  │
│  │ (browser IDE)  │  │ codebase   │  │ (mvn/npm/go test, per     │  │
│  │                │  │ + git repo │  │ stack)                    │  │
│  └───────────────┘  └────────────┘  └───────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘

                 OFFLINE, separate from the above
┌────────────────────────────────────────────────────────────────────┐
│                     BANK GENERATION PIPELINE                        │
│  LLM-driven codebase generation → verification → bug injection →    │
│  re-verification → image build → stored in Bank (§4, §9)            │
└────────────────────────────────────────────────────────────────────┘
```

### 5.1 Components and responsibilities

| Component | Responsibility |
|---|---|
| **Frontend (Next.js)** | All screens: setup, live session shell (IDE iframe + chat + timer + controls), report, admin dashboard. No business logic — it renders state the backend gives it. |
| **Go Orchestrator** | Single backend service. Owns session lifecycle, container lifecycle, the AI gateway, the evaluation engine, and the bank. Exposes REST (CRUD-ish actions) and WebSocket (live events) to the frontend. |
| **Session Manager** | State machine per session: `created → container_starting → active → evaluating → ended`. Tracks timers, enforces the chosen mode's rules (e.g., pressure mode run limits). |
| **Docker Controller** | Wraps the Docker Engine API (via the official Go SDK). Creates a container from a bank entry's image, execs commands inside it (run tests, git log), streams stdout/stderr back, tears it down on session end. |
| **AI Gateway** | The only thing allowed to call an LLM live. Wraps provider calls (Gemini/Groq/Ollama) behind one interface, applies the **guardrail/guard logic** (§8) to every assistant turn before it reaches the candidate, and logs every exchange to the evidence log. |
| **Evaluation Engine** | Runs the stack's CI-style pipeline inside the container (lint → build → test) on demand ("Run Checks") and at session end, parses results into pass/fail verdicts. This is the engine's ground truth — never an LLM opinion. |
| **Scoring/Evidence Engine** | Consumes the evidence log (every AI query, every suggestion applied/ignored, every test run, every git command, every file edit event) and produces the report (§12). |
| **Bank Manager** | CRUD over verified bank entries; serves the Session Manager a matching entry; used by the admin dashboard to review/approve/retire entries. |
| **SQLite** | Single-file DB: bank metadata, sessions, evidence logs, reports, settings (incl. BYOK keys, local only). |
| **Bank Generation Pipeline** | Offline Go CLI/job (§9) that produces new bank entries. Runs whenever you choose, not during a candidate session. |

### 5.2 How components talk to each other

| From | To | Protocol | What for |
|---|---|---|---|
| Frontend | Go Orchestrator | REST (HTTP/JSON) | Create session, fetch bank list, fetch report, admin actions |
| Frontend | Go Orchestrator | WebSocket | Live terminal/test-output streaming, AI chat streaming (token-by-token), timer ticks, container status |
| Frontend | code-server (in container) | HTTP, proxied through the orchestrator | The actual IDE — reverse-proxied so the candidate never needs direct container network access |
| Go Orchestrator | Docker Engine | Unix socket / Docker SDK (Go) | Create/start/stop/remove containers, exec commands, attach to output streams |
| Go Orchestrator | LLM provider | HTTPS REST | Codebase generation (offline pipeline) and AI-assistant replies (live, guarded) |
| Go Orchestrator | SQLite | Local file, Go SQL driver | All persistence |

Everything is local-process communication except the LLM provider call, which is the only thing that ever leaves your machine.

---

## 6. Tech stack (and why)

| Layer | Choice | Why |
|---|---|---|
| **Orchestrator** | **Go** | Managing many short-lived containers and streaming I/O is exactly Go's strength: goroutines per session are cheap, the Docker SDK is first-class, binaries start instantly, memory footprint per concurrent session is low. This is the part of the system where performance actually matters (you asked for max performance — this is where to spend that budget). |
| **Frontend** | **Next.js / React** | Fast enough, good SSR for report/dashboard pages, large ecosystem for embedding iframes and WebSocket clients. |
| **In-container IDE** | **code-server** | Real VS Code, browser-accessible, open source, drop-in — not a reimplementation. Gives you a real terminal, real file tree, real extensions if you want them later. |
| **Containers** | **Docker** (not Kubernetes) | Single machine, single user at a time (you) — Kubernetes is pure overhead here. Docker Compose if a bank entry is itself multi-service. |
| **DB** | **SQLite** | Zero ops, embedded, plenty for single-user metadata. Swap to Postgres only if this ever goes multi-user. |
| **Codebase bank storage** | Local disk (container images / tarballs) + SQLite metadata | No cloud storage needed solo. |
| **LLM** | Provider-agnostic interface; Gemini/Groq free tier or local Ollama | Same reasoning as the earlier DSA-interviewer design — keep it swappable, budget calls, have a fallback. |
| **CI simulation** | Run the stack's own tooling inside the container (`mvn test`, `npm test`, `go test`), optionally mirrored as a GitHub Actions workflow file if you want it to look authentic | No need for a separate CI service for personal use. |

**Stack-of-the-codebase vs. stack-of-the-tool:** don't confuse these. The *tool* (orchestrator, frontend) is Go + Next.js regardless. The *content* — the codebases candidates debug — starts as Spring Boot only (§3 non-goals), with Node/Go/React added later as separate bank content, not separate tool architectures.

---

## 7. Feature catalogue (what each thing does, in depth)

### 7.1 Stack and scenario selection
The candidate picks: **tech stack** (Spring Boot first; Node/Go/React later), **domain** (e-commerce, blog/CMS, booking system, etc. — reuses the "kind of system" framing from the earlier DSA-interviewer PRD), **task mode** (bug fix / feature addition / diff review — see 7.9), **difficulty**, and **duration**. This is purely a filter query against the **bank** (§9) — it does not trigger generation. If no verified entry matches, the UI says so and offers the closest available option; it never falls back to live generation.

### 7.2 The IDE environment
A Docker container is started from the matching bank entry's pre-built image. Inside it: the codebase at its seeded-bug state, a git repo with real history (§7.6), the project's normal build tooling already installed (Maven, npm, go toolchain — baked into the image per stack), and `code-server` serving a full VS Code instance. The frontend embeds this via an iframe, proxied through the Go orchestrator so the candidate's browser never talks to the container directly. This gives file tree, multi-file editing, integrated terminal, and git integration for free — the same primitives a real work environment has.

### 7.3 The AI pair-programmer (guarded assistant)
A chat panel docked beside the IDE. The candidate can ask it anything — "what does this function do," "why might checkout be slow," "write a test for X," "is this fix right." The assistant **can** read files you show it, explain code, suggest diffs, and write code when asked. What it **must not** do is state the root cause or hand over the fix outright, except after an explicit, logged "give up" past a time/attempt threshold (same hint-ladder philosophy as the earlier DSA-interviewer design, retargeted — see §8).

### 7.4 AI-reliance scoring *(high priority, unique)*
Every single AI interaction is logged: the question asked, the answer given, whether the candidate then applied a suggested change verbatim, modified it, ignored it, or asked a follow-up to verify it first. After the session, this becomes a scored dimension: *did you verify before trusting*. This is the single most distinctive feature of the whole product, because it's the actual thing the new interview round is evaluating and no existing tool measures it. See §12 for how it's scored.

### 7.5 Deliberately-wrong AI suggestions *(high priority, unique)*
On a configurable rate (e.g., 1 in 4 substantive suggestions, tunable by difficulty), the assistant is deliberately instructed to propose something **plausible but wrong** — confidently, with no tell. This mirrors reality: AI tools are sometimes wrong, and the interview round is partly testing whether you catch that. The report later reveals which suggestions were "traps" and whether the candidate caught each one (did they run tests after applying it, did they question it, did it make it into their final diff uncaught).

### 7.6 Seeded git history / "git archaeology" *(high priority, unique)*
Bank entries aren't just a snapshot of files — they ship with a realistic commit history, including the commit that introduced the bug, given an unrelated-sounding commit message (just like real life). `git log`, `git blame`, and `git bisect` become legitimate, useful investigation tools inside the session, not decoration. This is only possible because you own the generation pipeline — it's cheap to add once you're generating the codebase anyway, and no competitor building on "upload your own repo" can do this as cleanly, because they don't control the history.

### 7.7 Regression-trap bugs *(high priority)*
Some bank entries are built so that the "obvious" fix passes the directly-related test but breaks something else — another endpoint, a cache invalidation path, a different service. Tests this by checking the **full** suite after a fix, not just the test that was failing. Surfaces whether the candidate checked for side effects or just chased the red test to green.

### 7.8 Incident-style vague symptom framing *(high priority)*
Instead of "there's a bug in `OrderService.calculateTotal`," the candidate gets something like "customers report their cart total is sometimes wrong at checkout." No file, no line, no function name. This forces hypothesis formation and investigation — the actual skill — rather than pattern-matching a ticket to a location. Precision of the hint is itself a difficulty lever (§7.10).

### 7.9 Task modes
- **Bug fix (default):** find and fix one or more seeded bugs until the test suite is green.
- **Feature addition:** the codebase is intentionally missing a small, well-scoped piece of functionality (e.g., "add a discount-code field to checkout"); tests exist for the target behaviour and are red until it's implemented. Graded differently from bug-fix (design taste matters, not just correctness) — kept as a separate mode so its rubric doesn't contaminate debugging scores.
- **Diff review** *(moderate priority)*: the candidate is shown a PR that already "fixes" the bug, but badly or incompletely, and is asked to review it — using the AI assistant to help cross-check — rather than write code themselves. A different modality, cheap to build once the bank/container plumbing exists, and it's a real part of the AI-assisted-coding round at some companies (reviewing AI-generated changes).

### 7.10 Difficulty levels
A combination of: number of seeded bugs, how misleading/subtle they are (a typo vs. a race condition vs. a regression-trap bug), codebase size/number of files touched to find it, vagueness of the symptom description (7.8), and how often the assistant injects a wrong suggestion (7.5). Difficulty is a tag on the bank entry, set during generation/verification (§9), not computed live.

### 7.11 Multi-bug sessions *(moderate priority)*
Higher-difficulty entries can seed 2–3 independent bugs without telling the candidate the count. Tests triage under ambiguity — is this one bug with two symptoms, or two unrelated bugs — which is a step up from single-bug sessions and closer to a messy real backlog.

### 7.12 CI/CD-style checks
A "Run Checks" action execs the stack's normal pipeline inside the container: lint → build → test. This can be literally the same commands a real CI system would run, and can optionally be mirrored as an actual `.github/workflows/*.yml` file in the seeded repo so it *looks* like a real project with real CI, even though for a local session you're executing it directly inside the container rather than through actual GitHub Actions. If you want genuine CI runs later (e.g., pushing to a real GitHub repo per session), GitHub Actions' free tier covers it, but it's not required for the core loop.

---

## 8. The AI assistant's guardrail design (how it decides what to say)

This is conceptually the same "gate → planner → guard" pipeline from the earlier DSA-interviewer design, retargeted to a pair-programmer role instead of an interviewer role.

```
Candidate message / code event
        │
        ▼
     GATE  (rule-based: should the assistant respond now, and with how much help?)
        │
        ▼
   PLANNER (LLM call, given hidden context: what the real bug is, what's
            already been tried, how many hints given so far, whether this
            turn should be a "trap" per §7.5)
        │
        ▼
     GUARD  (rule-based + classifier: does this response name the exact
             root cause or hand over a full fix below the allowed hint
             level? If so, rewrite or block it.)
        │
        ▼
   Delivered to candidate, logged to evidence log
```

**Hint ladder for this context** (mirrors the DSA version's structure): L0 — answers factual questions about the code ("what does this function do"); L1 — points at a general area ("this probably involves the cart calculation path, not the payment path"); L2 — asks a leading question ("have you checked what happens when the discount is zero?"); L3 — proposes a concrete but incomplete direction; L4 — full fix, only after an explicit candidate "I give up" past a time/attempt threshold, logged as a hint-dependence signal.

**Hidden context the assistant has access to, the candidate doesn't:** the actual bug location and nature, the reference fix, and (per §7.5) whether this turn is scheduled to be a deliberate trap. The guard's job is making sure none of that leaks through an careless assistant response.

---

## 9. The bank generation pipeline, in depth

This runs **offline**, whenever you choose, completely separate from any candidate session.

```
INPUT: a spec — {stack: "spring-boot", domain: "ecommerce",
                  size: "medium", bugArchetype: "regression-trap"}

STEP 1 — Scaffold generation
  LLM generates the codebase to spec: entities, services, controllers,
  a test suite, build config. Written to disk as a normal project.

STEP 2 — Baseline verification
  Build it. Run the full test suite.
  Must be 100% green. If not → regenerate (bounded retries) or discard.

STEP 3 — Git history seeding
  Replay the codebase as a sequence of commits that looks like real
  development (feature by feature), ending with a commit that will
  later be identified as "the one that introduced the bug" — written
  with an innocuous, realistic message.

STEP 4 — Bug injection
  Apply a targeted mutation (not a full regeneration) to introduce the
  bug — e.g., swapped comparator, dropped null check, stale cache
  key, off-by-one, wrong transaction boundary. For regression-trap
  entries (§7.7), the mutation is chosen to also break a second,
  less obvious test path.

STEP 5 — Re-verification
  Run the full suite again.
  Must show EXACTLY the expected test(s) now failing, and nothing else.
  If injection caused unexpected breakage → repair or discard.

STEP 6 — Difficulty tagging
  Based on bug subtlety, number of files/functions involved, and
  symptom vagueness chosen for the incident description (§7.8).

STEP 7 — Packaging
  Build a container image (codebase + git history + toolchain +
  code-server) and store it. Record metadata (stack, domain,
  difficulty, archetype, verification trial count, date) in SQLite.

OUTPUT: a BANK ENTRY, status = verified, ready to be served to a session.
```

Entries that fail repeated verification are marked `needs_review` and surfaced in the admin dashboard (§13) for a manual look rather than silently discarded — useful for noticing systematic generation problems.

---

## 10. Exact candidate user flow (step by step)

1. **Launch.** Candidate opens the app (local web page). Lands on Setup.
2. **Setup screen.** Choose stack, domain, task mode, difficulty, duration. Click "Start."
3. **Matchmaking.** Backend queries the bank for a verified entry matching the filters. If none, it says so and suggests the nearest alternative (e.g., "no 'hard' entries for Node yet — showing 'medium'"). Candidate confirms or adjusts.
4. **Container boot.** Backend asks Docker to start a container from that entry's image. Because it's pre-built, this takes seconds. `code-server` comes up inside it. The backend opens a reverse-proxy route to it and a WebSocket channel for events.
5. **Briefing.** The session screen loads: IDE pane (the repo, ready to explore), a chat panel (AI assistant), a timer, an incident description (§7.8) instead of a bug pointer, and a "Run Checks" button. The timer starts now.
6. **Investigation.** Candidate reads code, checks `git log`/`git blame`, runs the app or tests locally in the terminal, asks the assistant questions. Every action (file open, git command, test run, AI query) is timestamped into the evidence log in the background — invisible to the candidate.
7. **AI assistance.** Candidate can ask anything. Assistant responds per the guardrail pipeline (§8), occasionally with a deliberate trap suggestion (§7.5). Candidate decides whether to apply a suggested change, verify it, modify it, or ignore it — all logged.
8. **Iteration.** Candidate edits code directly in the IDE, runs "Run Checks" as often as they like (or a capped number of times in pressure mode) to get real pass/fail feedback from the actual test suite running inside the container.
9. **Completion.** Session ends when: all required tests pass and the candidate clicks "Submit," or time runs out, or the candidate quits early. On timeout/quit, whatever state exists is still evaluated and scored (partial credit is possible).
10. **Teardown and scoring.** The container's final state (diffs, test results) is captured; the container itself is destroyed. The Scoring/Evidence Engine processes the full evidence log into a report.
11. **Report.** Candidate sees: pass/fail per test, time to fix, AI-reliance breakdown (§12), whether any trap suggestion got through uncaught, regression check result, a timeline of their session, and (where useful) "what efficient investigation looked like" for this entry. Exportable as Markdown.
12. **History.** The session is saved; candidate can revisit the report or replay the session (transcript + diff timeline) later.

---

## 11. Exact admin/interviewer-side flow

Same person (you), different mode — a dashboard for managing content and reviewing past sessions, separate from the candidate experience. Framed here as "admin" because the roles are genuinely different even when it's one person wearing both hats.

1. **Admin dashboard home.** A table of all **bank entries**: stack, domain, difficulty, bug archetype, verification status (`verified` / `needs_review` / `discarded`), last-used date, times-used count.
2. **Trigger generation.** Admin fills a small form (stack, domain, size, bug archetype, how many entries to generate) and kicks off the pipeline (§9) as a background job. Progress is visible (scaffold → verify → inject → re-verify → package), and failures at any stage are reported with the reason, not just "failed."
3. **Review a generated entry.** Before (or after) an entry is marked verified, the admin can open it in the *same* code-server IDE used by candidates, in an unrestricted "admin mode" — no guardrails, no timer — to read the seeded bug, check the git history reads naturally, and manually approve, edit, or reject the entry.
4. **Manage the bank.** Retire an entry (e.g., candidate has seen it too many times and it's no longer useful for practice), edit its metadata/difficulty tag, or bulk-regenerate a category.
5. **Review past sessions.** A list of completed candidate sessions. Opening one shows the full report plus the underlying evidence log and a replay (transcript, diff timeline, test-run history) — the same data the candidate saw, with nothing hidden, since admin and candidate are the same person here.
6. **Configure the AI assistant.** Adjust guardrail parameters globally or per difficulty: hint-ladder thresholds, trap-suggestion injection rate (§7.5), cooldowns between proactive nudges.
7. **Provider and key settings.** Manage BYOK keys for whichever LLM provider(s) are configured, set the fallback order, view call-count/quota usage so far.
8. **Data management.** Export or wipe all sessions/reports/keys — same local-first privacy stance as the earlier DSA-interviewer design.

If this is ever shared with other people, the admin dashboard is where the boundary would matter — e.g., restricting bank editing to you while candidates only see the setup/session/report flow. For solo use, both are just modes of the same local app with no access control needed.

---

## 12. The report and scoring, in depth

Unlike the earlier DSA-interviewer design (which needed an LLM to judge correctness of an algorithm), **correctness here is 100% objective**: test pass/fail from actually running the suite. The LLM is never asked "is this code correct" — only used to narrate/summarize evidence that's already been computed deterministically.

| Dimension | How it's computed | Who/what computes it |
|---|---|---|
| **Correctness** | Did the required tests pass by session end? | Test runner (deterministic) |
| **Regression safety** | Did the full suite stay green, not just the targeted test? | Test runner (deterministic) |
| **Time to fix** | Timestamp of first green run minus session start | Timer (deterministic) |
| **AI-reliance score** | Of all suggestions applied, what fraction were verified (tested/reviewed) before being kept vs. applied blindly | Evidence log analysis (deterministic counting) |
| **Trap-catch rate** | Of all deliberately-wrong suggestions (§7.5) offered, how many were caught vs. made it into the final diff | Evidence log, cross-referenced against which turns were tagged as traps (deterministic) |
| **Investigation quality** | Use of git log/blame, reading related files, forming a hypothesis before asking the AI vs. asking the AI to just find it | Evidence log pattern analysis; an LLM pass can narrate this qualitatively but the underlying counts are deterministic |
| **Hint dependence** | How far up the hint ladder (§8) the candidate needed to go | Evidence log (deterministic) |

The report is assembled as: objective metrics (computed, not judged) + a short narrative summary (one LLM call, grounded in the evidence log, same "cite the evidence" discipline as the earlier design) + a timeline view + an export.

---

## 13. What makes this different from existing tools (sanity check)

Existing debugging/AI-interview-prep tools tend to do one of: generic "debug this snippet" exercises, let you upload your own repo for AI-generated questions about it, or bolt an AI chat window onto a LeetCode-style problem. None of them, as far as surfaced in research, combine: a pre-verified generated codebase with seeded git history, a guarded assistant that sometimes deliberately misleads you, and scoring that measures your AI-reliance behaviour rather than just whether the bug got fixed. That combination — not any single piece — is the differentiation.

---

## 14. What's deliberately deferred

- Node/Go/React content (Spring Boot first).
- Full microservice bank entries (single-service/monolith entries first).
- Diff-review mode polish (7.9) beyond a basic version.
- Real GitHub Actions execution (local pipeline execution is enough to start).
- Any multi-user/auth/sharing concerns — irrelevant until this leaves your machine.

---

## Appendix A: Bank entry schema (sketch)

```json
{
  "id": "string",
  "stack": "spring-boot | node | go | react",
  "domain": "ecommerce | booking | cms | ...",
  "difficulty": "easy | medium | hard",
  "taskMode": "bug_fix | feature_add | diff_review",
  "bugArchetype": "typo | race-condition | regression-trap | stale-cache | off-by-one | ...",
  "bugCount": 1,
  "incidentDescription": "string (vague, user-facing symptom)",
  "image": "docker image ref",
  "gitHistorySummary": "string (for admin review)",
  "expectedFailingTests": ["string"],
  "verification": {
    "status": "verified | needs_review | discarded",
    "trials": 1,
    "date": "ISO"
  },
  "usage": { "timesUsed": 0, "lastUsed": "ISO" }
}
```

## Appendix B: Evidence log event types

`session_start`, `file_opened`, `file_edited`, `git_command` (log/blame/bisect/diff), `test_run` (run/submit, verdicts), `ai_query`, `ai_response` (tagged: normal | trap | hint_levelN), `ai_suggestion_applied` (verbatim | modified), `ai_suggestion_ignored`, `session_end`.