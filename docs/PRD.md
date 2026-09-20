# PRD: AI Mock Interviewer (working title)

|            |                                               |
| ---------- | --------------------------------------------- |
| **Status** | Draft v0.1                                    |
| **Owner**  | Aamir                                         |
| **Date**   | 21 Sep 2026                                   |
| **Type**   | Web app, local-first, free to run, deployable |

---

## 1. Summary

A browser-based mock interviewer for **DSA, system design, and low-level design (LLD)** rounds. It behaves like a real interviewer: gives or accepts a problem, runs a timed session, listens to your spoken reasoning, watches your code and whiteboard as you work, asks follow-ups and optimisation questions, and ends with an evidence-backed rubric report.

Built for personal prep first, and delivered as a sequence of single-feature batches (§15) so quality is verified at each step. Every component must be free to run, and the app must be deployable without paying for anyone else's usage (BYOK, see §12).

## 2. Problem

- Solo practice (LeetCode, TUF sheets) trains solving, not **interviewing**: thinking aloud, clarifying, handling follow-ups, managing time, recovering from being stuck.
- Human mock interviews (peers, paid platforms) are limited by scheduling and cost, and quality varies.
- Existing AI mock tools tend to act like chatbots: they don't react to what you type, can't verify correctness, can't hold a consistent bar, and don't enforce interview structure.

## 3. Goals and non-goals

### Goals

- G1. Recreate the **structure and pressure** of a real round: phases, timer, follow-ups, limited hints.
- G2. **Correctness judged by execution**, never by an LLM reading code.
- G3. Feedback grounded in evidence from the session (quotes, code moments, timings), scored on a fixed rubric.
- G4. Voice-first interaction with natural turn-taking and barge-in.
- G5. Zero mandatory recurring cost. Deployable on free tiers.
- G6. A clean, minimal, distraction-free UI.

### Non-goals (v1)

- Multi-user features, social, leaderboards, payments, accounts (optional later).
- Scraping LeetCode/TUF or any site against its terms.
- Behavioural/HR rounds.
- Native mobile apps.
- Guaranteeing the LLM's system-design grading matches a human's (mitigated by rubric, see §8).

## 4. User and use cases

**Primary user:** a student/early-career engineer preparing for SDE interviews at product companies.

| #   | Use case                                                                                          |
| --- | ------------------------------------------------------------------------------------------------- |
| UC1 | "Give me a random medium graph problem, 45 minutes."                                              |
| UC2 | "I'm on problem N of my sheet. Interview me on it." (paste statement or pick from imported sheet) |
| UC3 | "Run a system design round: design a URL shortener."                                              |
| UC4 | "LLD round: design a parking lot."                                                                |
| UC5 | "What did I do badly across my last 10 sessions?"                                                 |
| UC6 | "Replay where I got stuck yesterday."                                                             |

## 5. Product principles

1. **Interview, not chat.** A state machine drives the session; the LLM fills in the words.
2. **Ground truth first.** Anything checkable (tests, complexity claims against a reference) is checked by code, not by model opinion.
3. **Don't leak the answer.** Hint ladder, spoiler guard, hidden reference context.
4. **Speak only when it adds signal.** Silence while thinking is normal.
5. **One screen, one task.** No sidebars, feeds, or clutter during a session.
6. **Local-first and private.** Audio, code, and transcripts stay on-device by default.

## 6. User flows

### 6.1 Session lifecycle

```
Setup → Briefing → Live interview (phases) → Wrap-up → Report → History/Progress
```

1. **Setup:** choose round type, problem source (random / pick / paste), difficulty, language, persona, duration, voice on/off.
2. **Briefing:** interviewer introduces the round, states the rules (time, hints, run limits). Timer starts on the first problem reveal.
3. **Live interview:** phase-driven (§6.2). Interviewer reacts to speech, code, run results, whiteboard, and silence.
4. **Wrap-up:** final complexity/tradeoff questions; candidate can ask the interviewer questions.
5. **Report:** rubric scores with evidence, timings, speech metrics, "what a strong answer looked like", next-step recommendations.
6. **History/Progress:** stored locally, exportable.

### 6.2 Round types and default phases

| Round               | Default length | Phases (default budget)                                                                                                         |
| ------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **DSA**             | 45 min         | Clarify (4) → Approach (10) → Code (18) → Dry run/test (5) → Complexity + follow-ups (8)                                        |
| **System design**   | 50 min         | Requirements (5) → Estimation (5) → API + data model (8) → High-level design (12) → Deep dive (12) → Bottlenecks/curveballs (8) |
| **LLD/OOD**         | 45 min         | Requirements (5) → Entities/classes (10) → Core code (20) → Extensibility follow-ups (10)                                       |
| **CS fundamentals** | 20 min         | Rapid-fire Q&A across OS/DBMS/CN/OOP with follow-up depth                                                                       |

Budgets are targets shown as soft guidance; the interviewer nudges when a phase overruns, it doesn't hard-cut.

---

## 7. Functional requirements

Priority: **P0** = core, **P1** = important, **P2** = later. Each requirement has an acceptance criterion (AC).

### 7.1 Session setup

| ID   | Pri | Requirement                                                                                                                                  | AC                                                                                                         |
| ---- | --- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| FR-1 | P0  | Choose round type (DSA / SD / LLD / CS).                                                                                                     | Selecting a type loads its phase template and rubric.                                                      |
| FR-2 | P0  | Problem source: **random** (filter by topic, difficulty, company tag), **pick from bank**, or **paste/type own problem**.                    | Each path yields a valid Problem object (Appendix A).                                                      |
| FR-3 | P1  | Import a problem sheet (CSV/JSON: name, link, topic, difficulty) and map names to the bank; unmapped items prompt paste-in of the statement. | Import of a 100-row sheet completes; unmapped rows listed.                                                 |
| FR-4 | P0  | Configure timer/duration, language, persona, hint policy, voice on/off.                                                                      | Settings persist per profile; session snapshot stores what was used.                                       |
| FR-5 | P1  | Persona presets: friendly, neutral, strict. Pressure mode = no hints, limited runs.                                                          | Persona changes speaking style, hint availability, and interruption thresholds measurably (config-driven). |

### 7.2 Interview engine (the core)

| ID    | Pri | Requirement                                                                                                                                                                                                       | AC                                                                                                     |
| ----- | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| FR-10 | P0  | Session runs a **phase state machine** per round type; every interviewer utterance is tagged with phase and intent.                                                                                               | Transcript shows phase and intent per turn; illegal transitions are blocked.                           |
| FR-11 | P0  | Interviewer reacts to events: candidate speech, code change, run result, whiteboard change, silence, time thresholds, explicit hint request.                                                                      | Each event type reaches the engine and can trigger a response (§9).                                    |
| FR-12 | P0  | **Follow-up generator:** after each phase, asks approach probes ("why this data structure?"), optimisation questions ("can you do O(1) space?"), and variations ("what if the input is a stream?").               | Follow-ups reference the candidate's actual solution, not generic prompts (checked in audit sessions). |
| FR-13 | P0  | **Hint ladder:** L0 clarifying question → L1 nudge → L2 directional hint → L3 partial approach → L4 full approach (only after timeout or explicit give-up). Each hint level used is logged and affects the score. | The interviewer never skips levels; final report lists hints used.                                     |
| FR-14 | P0  | **Spoiler guard:** utterances below L3 must not name the target algorithm/data structure or contain code.                                                                                                         | A second check (rule-based + small LLM classifier) blocks or rewrites violating utterances.            |
| FR-15 | P0  | Interviewer has hidden context: reference solution, optimal complexity, common pitfalls.                                                                                                                          | Used for judging and steering; never appears in output.                                                |
| FR-16 | P1  | Interviewer verifies candidate **complexity claims** against reference and observed test timing, and challenges mismatches.                                                                                       | Wrong claim ("this is O(n)") triggers a probing question.                                              |
| FR-17 | P1  | Candidate can ask the interviewer clarifying questions; interviewer answers consistently with the problem's hidden spec (constraints, edge-case rulings).                                                         | Answers never contradict earlier ones (spec stored, consulted).                                        |

### 7.3 Interruption policy

Voice interviews live or die here. Defaults below are starting values, tuned in use. All configurable.

| ID    | Pri | Requirement                                                                                                                                                           |
| ----- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-20 | P0  | **Never talk over the candidate.** Use VAD; interviewer waits `min_silence` (default 1.5–2.5 s) after speech ends before responding.                                  |
| FR-21 | P0  | **Barge-in:** if the candidate starts speaking, TTS stops within ~200 ms and the partial interviewer utterance is marked "interrupted" in the transcript.             |
| FR-22 | P0  | **Stall nudge:** no speech and no code change for `stall_threshold` (default 90 s) → a Level-0/1 nudge.                                                               |
| FR-23 | P0  | **Wrong-claim interrupt:** if the candidate states something demonstrably wrong (against reference/tests), interrupt with a short probing question, not a correction. |
| FR-24 | P1  | **Rate limits:** cooldown after each interviewer utterance (default 30–45 s) and a max interventions per 10 minutes.                                                  |
| FR-25 | P1  | **Coding-time questions:** while coding, ask at natural pauses (function complete, run result) rather than mid-line.                                                  |

### 7.4 IDE and code execution

| ID    | Pri | Requirement                                                                                                                                           | AC                                                                                                               |
| ----- | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| FR-30 | P0  | Built-in editor (Monaco): syntax highlighting, basic autocomplete off by default (real interviews), configurable.                                     | Autocomplete/snippets toggle in settings.                                                                        |
| FR-31 | P0  | Languages: Python, JavaScript, Java, C++ (order of delivery).                                                                                         | Each runs a "hello + tests" smoke test.                                                                          |
| FR-32 | P0  | **Run** against sample tests; **Submit** against full hidden set including edge and stress cases. Show per-test verdict (pass/WA/TLE/RE) and runtime. | Failing test output shows input/expected/actual for samples only; hidden test inputs revealed at most partially. |
| FR-33 | P0  | Sandboxed execution with time and memory limits.                                                                                                      | Infinite loops and huge allocations are terminated cleanly.                                                      |
| FR-34 | P1  | Code snapshot events: debounced, diff-based, sent to the engine only on meaningful change or pause (§9.2).                                            | No LLM call on raw keystrokes.                                                                                   |
| FR-35 | P1  | Pressure-mode limits (e.g., max N runs).                                                                                                              | Enforced and shown in UI.                                                                                        |

**Execution options (free):**

- Python/JS **in-browser** (Pyodide; Web Worker sandbox), which needs no server and is safe to deploy publicly.
- Java/C++: **Judge0 CE or Piston** in Docker (local, or on a free-tier VM), or WASM toolchains if they prove viable. Public deployment of a server-side runner is an RCE surface, so gate it (§16).

### 7.5 Test-case pipeline (ground truth)

Goal: never mark a wrong solution "accepted" because the tests were bad.

| ID    | Pri | Requirement                                                                                                                                                                                                                                      |
| ----- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FR-40 | P0  | For each problem, produce: statement (normalised), constraints, **reference solution**, **brute-force solution**, **input generator**, **checker type**, tests.                                                                                  |
| FR-41 | P0  | **Cross-validation:** run reference vs brute force on N random small inputs (default 200). Any disagreement → repair loop (max k tries) → else mark problem `unverified` and show a warning in the session.                                      |
| FR-42 | P0  | **Checker types:** exact match, unordered/multiset compare, floating tolerance, and **special judge** for problems with multiple valid answers (paths, orderings). Classification is part of generation; unclear cases are flagged `unverified`. |
| FR-43 | P0  | Test classes: `sample` (visible), `edge` (empty, single, duplicates, extremes, negatives), `random`, `stress` (max constraints to catch TLE, timed against the reference).                                                                       |
| FR-44 | P1  | Pasted problems go through the same pipeline before the session starts (with a progress indicator), or the session starts in a degraded "unverified" mode.                                                                                       |
| FR-45 | P1  | Seed the bank from open datasets (e.g., CodeContests, TACO, LiveCodeBench) with licence tracking. **No scraping of coding sites.**                                                                                                               |
| FR-46 | P1  | Cache verified problems locally; store verification metadata (date, N tests, agreement rate).                                                                                                                                                    |

Time limits are **relative to the reference solution** with a per-language multiplier (Pyodide and JS in a worker are slower than native C++).

### 7.6 Voice

| ID    | Pri | Requirement                                                                                      | AC                                                                 |
| ----- | --- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| FR-50 | P0  | Speech-to-text with streaming partials and final segments.                                       | Words appear in the transcript within ~1 s of being spoken.        |
| FR-51 | P0  | Text-to-speech, sentence-streamed (start speaking the first sentence while generating the rest). | Time to first audio after the engine decides to speak ≤ 1.5 s p50. |
| FR-52 | P0  | Push-to-talk **and** open-mic (VAD) modes.                                                       | Switchable in-session.                                             |
| FR-53 | P1  | Transcript always visible on demand; captions optional.                                          | Toggle in UI.                                                      |
| FR-54 | P1  | Text fallback when mic/permissions fail: full interview still works by typing.                   | No feature is voice-only.                                          |

**Provider options (free), to benchmark before committing:**

- Browser Web Speech API (STT) and `speechSynthesis` (TTS): easiest, Chrome/Edge-centric, robotic voice, cloud-backed STT.
- Local/in-browser Whisper (faster-whisper/whisper.cpp or transformers.js) for STT; Kokoro or Piper for TTS: better quality and private, at the cost of latency and CPU/GPU.
- A realtime multimodal API (e.g., Gemini's Live API): integrated STT + LLM + TTS with barge-in. **Verify free-tier coverage and limits at build time.**

Provider is behind an interface so it can be swapped (§10).

### 7.7 System design whiteboard

| ID    | Pri | Requirement                                                                                                                                                                                                   | AC                                                                     |
| ----- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| FR-60 | P0  | Embedded Excalidraw canvas alongside a notes/requirements pane.                                                                                                                                               | Diagram and notes autosave to the session.                             |
| FR-61 | P0  | Engine receives the **scene JSON** (elements, labels, arrows) converted into a compact graph description (components, connections, annotations), not screenshots. Screenshots optional as a secondary signal. | A test diagram of ≥ 8 components yields a correct component/edge list. |
| FR-62 | P0  | Phase checklist: requirements → estimation → API → data model → HLD → deep dive → bottlenecks. The interviewer prompts for skipped phases.                                                                    | Skipping "requirements" triggers a prompt within the phase timeout.    |
| FR-63 | P1  | **Curveballs:** "10x traffic", "primary DB fails", "add multi-region", "strict consistency for payments". Chosen based on the candidate's design.                                                             | Each curveball references a component the candidate actually drew.     |
| FR-64 | P1  | Back-of-envelope calculator (QPS, storage, bandwidth) with a scratchpad.                                                                                                                                      | Standard conversions built in.                                         |
| FR-65 | P2  | Design "template" hints for common components (cache, queue, CDN) as a post-session reference, not during the round.                                                                                          | Shown only in the report.                                              |

### 7.8 LLD / OOD round

| ID    | Pri | Requirement                                                                                                                                                                                                                            |
| ----- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-70 | P1  | Problem bank of classic LLD prompts (parking lot, elevator, LRU cache, chess, BookMyShow-style booking, rate limiter).                                                                                                                 |
| FR-71 | P1  | Flow: requirements → entities/classes (whiteboard or text UML) → core code in the IDE → extension requests ("add a new vehicle type", "add pricing rules").                                                                            |
| FR-72 | P1  | Grading on class design, use of principles/patterns **where appropriate** (penalise pattern name-dropping), extensibility, and code quality. Behavioural tests where feasible (a scripted harness calling the candidate's public API). |

### 7.9 CS fundamentals round

| ID    | Pri | Requirement                                                                                                                               |
| ----- | --- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| FR-75 | P2  | Rapid-fire Q&A on OS, DBMS, CN, OOP, with adaptive depth (follow up until the candidate's knowledge boundary is found). Scored per topic. |

### 7.10 Report and rubric

| ID    | Pri | Requirement                                                                                                                    | AC                                                       |
| ----- | --- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| FR-80 | P0  | Per-round rubric with 1–4 scores per dimension (§8).                                                                           | Every score has ≥ 1 evidence item.                       |
| FR-81 | P0  | **Evidence-linked feedback:** quotes from the transcript, code snapshots, run results, timestamps.                             | Clicking evidence jumps to that moment in replay.        |
| FR-82 | P0  | Timeline: phases with durations vs budget, hints used, runs and their results.                                                 | Rendered as a single compact timeline view.              |
| FR-83 | P1  | "What a strong answer looked like": approach summary, optimal complexity, edge cases missed.                                   | Shown only after the session (no spoilers during).       |
| FR-84 | P1  | Speech metrics: filler rate, talk/silence ratio, time to first approach, time to first working code, average response latency. | Computed from transcript/VAD timestamps, not by the LLM. |
| FR-85 | P1  | Export report as Markdown (also suitable for pasting into note tools).                                                         | One-click download/copy.                                 |

### 7.11 Progress and spaced repetition

| ID    | Pri | Requirement                                                                                            |
| ----- | --- | ------------------------------------------------------------------------------------------------------ |
| FR-90 | P1  | Track scores by topic/pattern and by rubric dimension over time.                                       |
| FR-91 | P1  | Weak-topic detection and **resurfacing**: failed or hint-heavy problems reappear on a spaced schedule. |
| FR-92 | P2  | Adaptive difficulty for "random" mode based on recent performance.                                     |

### 7.12 Session replay

| ID    | Pri | Requirement                                                                                                                   |
| ----- | --- | ----------------------------------------------------------------------------------------------------------------------------- |
| FR-95 | P1  | Replay: synced transcript, code-snapshot scrubber, whiteboard states, run results, and optional audio recording (local only). |
| FR-96 | P2  | Bookmark moments ("here I froze") and add personal notes.                                                                     |

### 7.13 Settings, keys, privacy

| ID     | Pri | Requirement                                                                                      |
| ------ | --- | ------------------------------------------------------------------------------------------------ |
| FR-100 | P0  | **BYOK:** users enter their own LLM API key(s); stored locally, never sent to any server we run. |
| FR-101 | P0  | Provider selection with fallback order (e.g., primary → secondary → local).                      |
| FR-102 | P0  | Local-first storage; export/import/delete all data.                                              |
| FR-103 | P1  | Clear disclosure of which components send data off-device (LLM provider, cloud STT if used).     |
| FR-104 | P1  | Audio recording is **off by default**.                                                           |

### 7.14 Optional: screen and camera

| ID     | Pri | Requirement                                                                                                                                                                                                                                        |
| ------ | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-110 | P2  | **Screen/tab capture** (`getDisplayMedia`) for practising in external tabs (e.g., a sheet, another editor). Frames sampled every few seconds and sent only on visual change or pause. Not needed when using the built-in IDE (send text directly). |
| FR-111 | P2  | **Camera on** as a realism/pressure option. Default: no analysis, no upload, no recording. Optional local-only cues (eye contact, posture) are explicitly experimental.                                                                            |

---

## 8. Rubrics

Scores: **1 = Not ready · 2 = Borderline · 3 = Solid · 4 = Strong**. Each dimension has anchored descriptors (written during M1, with 2–3 example transcripts per level for calibration).

### DSA

1. Problem understanding and clarification
2. Approach and reasoning (brute force → optimise)
3. Optimisation ability
4. Code correctness and quality (from **test results**, not LLM opinion)
5. Testing, dry run, edge cases
6. Complexity analysis (checked against reference)
7. Communication (structure, thinking aloud)
8. Hint dependence (derived from the hint log)

### System design

1. Requirements scoping (functional + non-functional)
2. Estimation
3. API and data model
4. High-level architecture
5. Deep dive (chosen components)
6. Scalability, bottlenecks, tradeoffs
7. Reliability and failure handling
8. Communication

### LLD

1. Requirement clarification
2. Entities and relationships
3. Principles/patterns applied appropriately
4. Extensibility (reaction to change requests)
5. Code quality and correctness
6. Edge cases and concurrency awareness

**Calibration rule:** LLM-scored dimensions must cite evidence. Scores are produced by a second pass over the structured evidence log (§9.4), not by a single free-form "grade this" call. Run periodic self-calibration on saved sessions to check consistency.

---

## 9. Interviewer engine design

### 9.1 Architecture

```
            ┌────────── Event bus ──────────┐
 Speech ───▶│ speech_final / speech_partial │
 Editor ───▶│ code_snapshot / run_result    │──▶ Gate ──▶ Planner (LLM) ──▶ Guard ──▶ TTS/UI
 Whiteboard▶│ scene_changed                 │      ▲            │
 Timers ───▶│ silence / stall / phase_over  │      │            ▼
            └───────────────────────────────┘   Session state   Evidence log
                                              (phase, hints,   (for report)
                                               spec, summary)
```

- **Gate (rule-based):** decides whether an event _could_ warrant speech (silence thresholds, phase timers, failing test, wrong-claim flags, hint request). Most events end here, which saves quota and avoids over-talking.
- **Planner (LLM):** given state + latest events, returns a structured decision (§9.3).
- **Guard:** spoiler check, tone/length check, hint-level check.
- **Evidence log:** every decision and observation is recorded with timestamps for the report.

### 9.2 Event policy (quota-friendly)

| Event           | When it fires                                                               | LLM call?                     |
| --------------- | --------------------------------------------------------------------------- | ----------------------------- |
| `speech_final`  | End of a candidate utterance (VAD + min_silence)                            | Yes, if the gate allows       |
| `code_snapshot` | Pause ≥ ~20 s **and** meaningful diff, or on function completion, or on Run | Sometimes                     |
| `run_result`    | After every Run/Submit                                                      | Yes if failure, or first pass |
| `scene_changed` | Whiteboard idle ≥ ~20 s after change                                        | Sometimes                     |
| `stall`         | No speech/code change for stall_threshold                                   | Yes                           |
| `phase_over`    | Phase budget exceeded                                                       | Yes                           |
| `hint_request`  | Candidate asks                                                              | Yes                           |

Design target: **≤ ~5 LLM calls/min average** per live session so a free-tier cap isn't exhausted. Verify live provider limits at build time.

### 9.3 Planner output (structured)

```json
{
  "speak": true,
  "utterance": "string",
  "intent": "clarify_answer | probe | follow_up | curveball | nudge | hint_L1 | hint_L2 | hint_L3 | hint_L4 | phase_transition | wrap_up",
  "phase_next": "optional phase id",
  "hint_level": 0,
  "evidence": [
    { "dimension": "approach", "polarity": "+|-|0", "note": "short", "ref": "turn|snapshot|run id" }
  ],
  "flags": ["wrong_claim", "stuck", "off_topic"]
}
```

Outputs are validated (schema) and retried once on parse failure.

### 9.4 Scoring pass

At session end, a separate call receives: the rubric, the **evidence log**, run results, metrics, and timings, and returns per-dimension scores with cited evidence ids. Objective dimensions (tests passed, complexity vs reference, hint counts, timings) are computed **without** the LLM and injected as facts.

### 9.5 Context assembly

Each planner call includes: problem + hidden spec, phase and time left, hint level history, rolling summary of the transcript plus the last few turns verbatim, latest code (diff + full if short), latest run results, whiteboard graph (SD), persona/config. Long sessions use a rolling summary to control tokens.

### 9.6 Guardrails

- Hidden reference is included only in a "never reveal" section; the guard rejects utterances that leak it.
- No code written by the interviewer unless in L4 or in post-session review.
- Consistency: the "spec sheet" (constraints, edge-case rulings) is the only source for clarifying answers.
- Prompt-injection safety: candidate text, problem text, and pasted content are data, not instructions.

---

## 10. Architecture and stack

**Principle:** no mandatory backend. Everything in the browser; optional thin stateless proxy for CORS or provider quirks.

| Layer          | Choice (default)                                                                                  | Notes                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| UI             | React + TypeScript + Vite                                                                         | Minimal design system, dark/light.                                                                                  |
| State          | Zustand (or similar)                                                                              | Session state machine as an explicit module (XState is an option).                                                  |
| Storage        | IndexedDB (Dexie)                                                                                 | All sessions, problems, progress local.                                                                             |
| Editor         | Monaco                                                                                            | Language services trimmed.                                                                                          |
| Whiteboard     | Excalidraw                                                                                        | Scene JSON → graph converter.                                                                                       |
| Execution      | Web Worker + Pyodide (Py), Worker sandbox (JS); Judge0 CE/Piston (Java/C++)                       | See §7.4 and §16.                                                                                                   |
| LLM layer      | Provider interface: Gemini, Groq, OpenRouter free models, Ollama (local), other OpenAI-compatible | Structured output validated with a schema library (Zod).                                                            |
| Voice layer    | STT and TTS interfaces with pluggable providers                                                   | Web Speech, local Whisper/Kokoro/Piper, realtime API.                                                               |
| Hosting        | Static hosting on a free tier (Vercel/Cloudflare Pages/Netlify)                                   | PWA/offline shell optional.                                                                                         |
| Optional proxy | Stateless serverless function                                                                     | Never stores keys or content. Alternatively a small Spring Boot service if you prefer Java, at the cost of hosting. |

**Constraints to check early:**

- CORS for each LLM provider from the browser; fall back to the stateless proxy where needed.
- A deployed HTTPS site calling a **local Ollama** hits mixed-content/CORS rules (`OLLAMA_ORIGINS`); document the setup.
- Web Speech API STT support differs by browser (best in Chrome/Edge).

### Module boundaries

`session-engine` (state machine, gate, planner, guard) · `llm` (providers) · `voice` (stt/tts/vad) · `exec` (runners, checkers) · `problems` (bank, pipeline, import) · `whiteboard` (scene→graph) · `report` (scoring, metrics, export) · `store` (persistence) · `ui`.

---

## 11. Data model (sketch)

| Entity            | Key fields                                                                                                                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Problem**       | id, title, statement, constraints, tags, difficulty, source, licence, roundType, spec sheet, reference/brute-force refs, generator, checkerType, tests[], verification{date, agreement, status} |
| **Session**       | id, roundType, problemId, config (persona, duration, language, hint policy), startedAt, endedAt, status                                                                                         |
| **Turn**          | sessionId, t, speaker, text, phase, intent, interrupted?                                                                                                                                        |
| **CodeSnapshot**  | sessionId, t, language, code, diffFromPrev                                                                                                                                                      |
| **RunResult**     | sessionId, t, kind (run/submit), verdicts[], runtimeMs                                                                                                                                          |
| **SceneSnapshot** | sessionId, t, sceneJson, graphSummary                                                                                                                                                           |
| **Evidence**      | sessionId, t, dimension, polarity, note, ref                                                                                                                                                    |
| **Report**        | sessionId, scores[], objectiveMetrics, speechMetrics, recommendations                                                                                                                           |
| **ProgressStat**  | topic/pattern, dimension, rolling score, lastSeen, nextReview                                                                                                                                   |
| **Settings**      | providers/keys (local), voice prefs, thresholds, privacy toggles                                                                                                                                |

---

## 12. Free-tier operation and deployment

### Cost model

- **You (owner):** $0. Static hosting free tier; no server-side LLM spend.
- **Users of a deployed instance:** bring their own key (BYOK). A shared owner key would be exhausted immediately by multiple users.

### Quota budgeting

- Free LLM tiers are rate-limited (requests per minute/day) and change over time; live limits must be read from the provider dashboard at build time.
- Design budget: ~5 calls/min average, event-gated (§9.2), plus one scoring call and optional problem-generation calls per session. Problem generation is front-loaded and cached to avoid repeat cost.
- Multi-provider fallback: on a rate-limit response, downgrade to the next provider or to a local model, and tell the user.
- Free-tier terms may allow provider use of inputs for training; disclose this in the privacy panel (FR-103).

### Deployment checklist

- Static build to a free host; strict CSP; no third-party scripts beyond known CDNs.
- Keys in IndexedDB/localStorage only; warn about XSS risk and avoid injecting untrusted HTML.
- Public Judge0/Piston server is **not** recommended; run Python/JS client-side for the public build.
- Provide "Local mode" docs (Ollama + local Whisper/Kokoro + local Judge0) for fully offline use.

---

## 13. Non-functional requirements

| Area               | Target                                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| Voice turn latency | Candidate stops speaking → interviewer audio starts: **p50 ≤ 2.5 s, p95 ≤ 4 s** (provider dependent) |
| Barge-in           | TTS halts ≤ 200 ms after candidate speech onset                                                      |
| Test-run latency   | Sample run ≤ 2 s (client-side languages); ≤ 4 s (server languages)                                   |
| UI performance     | Editor typing never blocked by LLM/voice work (workers/async)                                        |
| Reliability        | Session state autosaved every few seconds; refresh/crash resumes the session                         |
| Privacy            | No audio or code leaves the device except to the chosen LLM/STT provider; recording off by default   |
| Accessibility      | Full keyboard flow, captions, text-only mode, adjustable font sizes                                  |
| Browser support    | Desktop Chrome/Edge (P0), Firefox/Safari (best-effort, text fallback)                                |
| Offline            | Shell + local mode work without network when local providers are configured                          |

---

## 14. Success metrics

Personal-use targets (adjust as needed):

| Metric              | Target                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| Usage               | ≥ 3 sessions/week sustained for 4 weeks                                                           |
| Test-pipeline trust | ≥ 90% of generated problems pass cross-validation; **0** known false "accepted" verdicts in audit |
| Spoiler leaks       | 0 in a 50-session audit (below hint L3)                                                           |
| Follow-up relevance | ≥ 80% of follow-ups judged specific to the candidate's solution (manual audit of 20 sessions)     |
| Voice quality       | p50 turn latency ≤ 2.5 s; ≤ 1 unwanted interruption per 10 minutes                                |
| Score consistency   | Re-scoring the same saved session varies by ≤ 0.5 points per dimension on average                 |
| Cost                | $0 recurring                                                                                      |
| Real-world signal   | Scores trend upward with practice, and self-rated "feels like a real interview" ≥ 4/5             |

---

## 15. Feature batches (one focus at a time)

The full scope stays. What changes is **how it's built**: as a sequence of small, single-feature batches, each finished and verified before the next starts. No batch begins until the previous one passes its gate.

### 15.1 Rules of engagement

1. **WIP limit = 1.** One batch in progress. Always.
2. **Scope freeze at batch start.** The batch's "Includes" list is fixed. New ideas go to a **parking lot** (a plain `BACKLOG.md`), never into the current batch.
3. **Gate before merge.** A batch merges only when its Definition of Done (§15.2) and its batch-specific gate pass.
4. **No half-features.** Anything unfinished is either finished, or removed from the branch. No stubs left behind flags that "work later".
5. **Fix forward inside the batch.** Bugs found while working on batch N are fixed in batch N. Bugs found in an earlier batch pause the current batch until fixed (regression rule).
6. **Dogfood before closing.** Use the feature in one real practice session (or the closest equivalent) before calling it done.
7. **One branch per batch**, tagged on merge (`b07-hint-ladder`).

### 15.2 Definition of Done (applies to every batch)

- [ ] Every acceptance criterion (AC) of the included FRs passes, checked one by one.
- [ ] **Automated tests** for all deterministic logic (state machine, checkers, scoring math, converters, schedulers).
- [ ] **Eval fixtures** for LLM-driven behaviour: a small saved set of prompts/sessions with property checks (valid JSON, no spoilers, follow-up specificity, latency). Re-run on every batch that touches prompts.
- [ ] **Regression run:** the end-to-end smoke test of the full flow built so far (Playwright or similar) passes.
- [ ] **Empty, loading, error, and offline states** exist for the new feature. Keyboard-usable.
- [ ] **Performance budget** for the feature checked against §13 where one applies.
- [ ] No open P0/P1 bugs from this batch. No `TODO` on a live code path.
- [ ] Decision log and README updated (what was chosen, what was rejected, known limitations).
- [ ] Dogfood note recorded: what felt wrong, filed to the parking lot.

### 15.3 AI-assisted workflow (per batch)

1. Copy the batch's section from this PRD as the **spec** (Includes, Not included, Done when).
2. Ask the AI for a short **plan** and a **test list** before any code. Review both.
3. Write or generate the **tests first** for the deterministic parts.
4. Implement in small steps; review every diff yourself; keep prompts and prompt changes in version control.
5. Run the gate. Failing gate means back to step 4, not on to the next batch.
6. Merge, tag, write the decision-log entry, then start the next spec from a clean context.

### 15.4 Batch list

Size is relative effort: **S** small, **M** medium, **L** large.

| Batch   | Feature                                        | Covers                     | Depends on | Size |
| ------- | ---------------------------------------------- | -------------------------- | ---------- | ---- |
| **B0**  | Project skeleton and settings                  | FR-100, FR-102 (part)      | none       | S    |
| **B1**  | LLM provider layer                             | FR-101                     | B0         | M    |
| **B2**  | Problem schema and starter bank                | FR-2 (part)                | B0         | S    |
| **B3**  | Code editor (IDE)                              | FR-30, FR-31 (UI)          | B0         | S    |
| **B4**  | Code execution (Python/JS, in-browser)         | FR-32, FR-33               | B2, B3     | M    |
| **B5**  | Session shell and timer                        | FR-1, FR-4                 | B0, B2     | M    |
| **B6**  | Interview engine v1 (text mode)                | FR-10, FR-11, FR-15, FR-17 | B1, B4, B5 | L    |
| **B7**  | Hint ladder and spoiler guard                  | FR-13, FR-14               | B6         | M    |
| **B8**  | Follow-ups and complexity challenge            | FR-12, FR-16               | B6         | M    |
| **B9**  | Report v1                                      | FR-80 to FR-83, FR-85      | B6, B7, B8 | M    |
| **B10** | Test-case pipeline (ground truth)              | FR-40 to FR-43, FR-46      | B1, B4     | L    |
| **B11** | Paste-a-problem, dataset seeding, sheet import | FR-3, FR-44, FR-45         | B10        | M    |
| **B12** | Speech-to-text and transcript                  | FR-50, FR-52 to FR-54      | B6         | M    |
| **B13** | Text-to-speech, streamed                       | FR-51                      | B12        | M    |
| **B14** | Interruption policy and barge-in               | FR-20 to FR-25             | B13        | L    |
| **B15** | Speech metrics                                 | FR-84                      | B12        | S    |
| **B16** | Personas and pressure mode                     | FR-5, FR-35                | B6, B14    | S    |
| **B17** | Whiteboard (Excalidraw)                        | FR-60                      | B5         | S    |
| **B18** | Scene-to-graph converter                       | FR-61                      | B17        | M    |
| **B19** | System-design interview flow and rubric        | FR-62                      | B6, B18    | L    |
| **B20** | Curveballs and estimation tool                 | FR-63, FR-64               | B19        | M    |
| **B21** | LLD round                                      | FR-70 to FR-72             | B6, B4     | L    |
| **B22** | CS fundamentals round                          | FR-75                      | B6         | M    |
| **B23** | Progress and spaced repetition                 | FR-90, FR-91               | B9         | M    |
| **B24** | Session replay                                 | FR-95, FR-96               | B9         | M    |
| **B25** | Java/C++ execution                             | FR-31                      | B4         | M    |
| **B26** | Privacy and deployment hardening               | FR-100 to FR-104           | most       | M    |
| **B27** | Screen capture (optional)                      | FR-110                     | B6         | M    |
| **B28** | Camera (optional)                              | FR-111                     | B5         | S    |
| **B29** | Adaptive difficulty (optional)                 | FR-92                      | B23        | S    |

### 15.5 Batch details

Each batch lists **Includes**, **Not included** (to prevent drift), and **Done when** (on top of §15.2).

#### B0: Project skeleton and settings

- **Includes:** React + TS + Vite app shell, routing, storage layer (IndexedDB), settings page, local key storage (BYOK), data export/import/delete-all, test runner and CI-style local check script, E2E harness.
- **Not included:** any LLM call, any interview UI.
- **Done when:** app runs locally and builds to a static bundle; settings survive reload; delete-all wipes everything; the smoke E2E runs green.

#### B1: LLM provider layer

- **Includes:** provider interface; two providers (e.g., Gemini + one of Groq/OpenRouter/Ollama); schema-validated structured output with one retry; rate-limit detection with fallback to the next provider and a visible notice; token/call counters.
- **Not included:** interview prompts, streaming to UI beyond a test page.
- **Done when:** both providers return schema-valid JSON on a 20-prompt fixture; a forced rate-limit triggers fallback; a short provider comparison (quality, latency, limits) is logged. This answers open question 1 in part.

#### B2: Problem schema and starter bank

- **Includes:** Appendix A schema and validator; 15 to 20 hand-authored problems with hand-written tests across topics; random and filtered picking; problem view UI.
- **Not included:** generated tests, paste-in problems.
- **Done when:** malformed problems are rejected by the validator; random pick respects topic and difficulty filters; each starter problem has a known-good solution passing its tests.

#### B3: Code editor

- **Includes:** Monaco integration, language switch (Python/JS first), per-language code preserved, autosave, autocomplete/snippets toggle (off by default), clean layout.
- **Not included:** running code.
- **Done when:** editor loads quickly; switching languages never loses code; autosave restores after refresh.

#### B4: Code execution (Python/JS, in-browser)

- **Includes:** Pyodide and JS worker runners, Run (samples) and Submit (all tests), verdicts (AC/WA/TLE/RE/MLE), time and memory limits, result panel, sandboxing.
- **Not included:** Java/C++, generated tests, checker types beyond exact match.
- **Done when:** a 10-solution fixture (correct, wrong, slow, crashing, infinite loop, memory hog) yields the right verdicts; infinite loops are killed; the editor stays responsive during runs.

#### B5: Session shell and timer

- **Includes:** setup screen (round type, problem source, duration, language), session lifecycle (start, pause, resume, end), timestamp-based timer, autosave of session state, session history list.
- **Not included:** interviewer behaviour.
- **Done when:** refresh mid-session resumes exactly; the timer stays accurate under tab throttling; ended sessions appear in history.

#### B6: Interview engine v1 (text mode)

- **Includes:** event bus, phase state machine (DSA), gate, planner (structured output), evidence log, hidden spec and reference context, consistent clarifying answers, typed chat panel.
- **Not included:** hint ladder, spoiler guard, follow-up generator, voice.
- **Done when:** state-machine unit tests cover legal and illegal transitions; a full typed session runs through all phases; replaying a 45-minute fixture averages ≤ 5 LLM calls/min; clarifying answers stay consistent across repeated questions.

#### B7: Hint ladder and spoiler guard

- **Includes:** levels L0 to L4, level tracking, hint request handling, guard (rules plus small classifier), hint log.
- **Not included:** follow-ups, scoring.
- **Done when:** levels are never skipped in scripted tests; a 30-utterance adversarial leak set is blocked at levels below L3; the hint log is stored for the report.

#### B8: Follow-ups and complexity challenge

- **Includes:** follow-up generation tied to the candidate's actual solution, optimisation and variation questions, complexity-claim verification against reference and observed timing, probing on mismatches.
- **Not included:** voice, report.
- **Done when:** in a 20-session fixture audit ≥ 80% of follow-ups reference the candidate's actual code or approach; a wrong complexity claim triggers a probe in a scripted test.

#### B9: Report v1

- **Includes:** DSA rubric scoring pass from the evidence log, objective metrics computed without the LLM, timeline, "what a strong answer looked like", Markdown export.
- **Not included:** speech metrics, progress tracking, replay.
- **Done when:** every score cites evidence; re-scoring 3 fixture sessions varies ≤ 0.5 points per dimension on average; export opens cleanly.

> **Checkpoint R1:** typed DSA interviewer usable end-to-end. Start using it for real practice here.

#### B10: Test-case pipeline (ground truth)

- **Includes:** generation of reference, brute force, input generator, checker classification; cross-validation with repair loop; test classes (sample, edge, random, stress); `unverified` flag and UI warning; caching.
- **Not included:** paste-in problems, dataset import.
- **Done when:** 20 problems verified; a suite of deliberately wrong solutions is rejected on every problem; multi-answer problems use special-judge checkers correctly; unverified problems are clearly labelled in-session.

#### B11: Paste-a-problem, dataset seeding, sheet import

- **Includes:** pasted statements through the B10 pipeline with progress UI, degraded "unverified" mode, dataset seeding with licence tracking, CSV/JSON sheet import and name mapping.
- **Not included:** scraping any site.
- **Done when:** a pasted problem gets verified or clearly flagged; a 100-row sheet imports with unmapped rows listed; licences recorded per source.

#### B12: Speech-to-text and transcript

- **Includes:** STT provider interface with at least two providers, streaming partials and finals, push-to-talk and open-mic modes, permission failure and typed fallback, transcript view, benchmark on your own speech.
- **Not included:** TTS, interruption policy.
- **Done when:** finals appear ≤ ~1 s after speaking; the mic-denied path leaves the interview fully usable by typing; the provider decision (browser API vs local Whisper vs realtime API) is logged with measurements.

#### B13: Text-to-speech, streamed

- **Includes:** TTS provider interface, sentence-level streaming, mute/skip controls, voice selection.
- **Not included:** barge-in.
- **Done when:** time to first audio ≤ 1.5 s p50 in a benchmark; long utterances stream without gaps; mute works instantly.

#### B14: Interruption policy and barge-in

- **Includes:** VAD, min-silence wait, barge-in (TTS stops fast, marked interrupted), stall nudge, wrong-claim interrupt, cooldowns and rate limits, coding-time question timing, tunable thresholds.
- **Not included:** personas.
- **Done when:** barge-in ≤ 200 ms; a 30-minute dogfood session has ≤ 1 unwanted interruption per 10 minutes; thresholds are adjustable in settings.

#### B15: Speech metrics

- **Includes:** filler rate, talk/silence ratio, time to first approach, time to first working code, response latency; shown in the report.
- **Not included:** any LLM-based speech judgement.
- **Done when:** metrics are computed from timestamps and unit-tested on synthetic transcripts.

#### B16: Personas and pressure mode

- **Includes:** friendly, neutral, strict presets driving thresholds and phrasing; pressure mode (no hints, run limit).
- **Not included:** company-specific styles.
- **Done when:** each persona measurably changes config values and utterance style in fixtures; pressure mode enforces its limits.

> **Checkpoint R3:** full voice-enabled DSA interviewer.

#### B17: Whiteboard (Excalidraw)

- **Includes:** embedded canvas, notes/requirements pane, autosave and restore, image export.
- **Not included:** feeding the diagram to the interviewer.
- **Done when:** diagram and notes survive reload; large diagrams stay responsive.

#### B18: Scene-to-graph converter

- **Includes:** convert Excalidraw scene JSON to a compact component/edge/annotation description, stable ordering, handling of groups, labelled arrows, and free text.
- **Not included:** interviewer prompts.
- **Done when:** unit tests on 5 fixture diagrams (including messy ones) produce correct component and edge lists.

#### B19: System-design interview flow and rubric

- **Includes:** SD phase state machine and checklist (with prompts for skipped phases), SD problem bank, SD interviewer prompts using the graph and notes, SD rubric and scoring.
- **Not included:** curveballs, calculator.
- **Done when:** skipping a phase triggers a prompt; 3 fixture sessions produce coherent, evidence-linked reports; the report labels SD scoring as advisory.

#### B20: Curveballs and estimation tool

- **Includes:** curveball generator tied to drawn components, back-of-envelope calculator and scratchpad.
- **Not included:** post-session reference templates (P2).
- **Done when:** every curveball in fixtures references a component that is actually in the diagram; calculator conversions are unit-tested.

> **Checkpoint R4:** system-design rounds usable.

#### B21: LLD round

- **Includes:** LLD problem bank (6+), flow (requirements → classes → code → extension requests), behavioural test harness against the candidate's public API, LLD rubric.
- **Not included:** UML auto-grading beyond LLM-plus-rubric.
- **Done when:** the harness runs candidate code on at least 3 problems; pattern name-dropping without justification is penalised in fixtures.

#### B22: CS fundamentals round

- **Includes:** question bank with depth ladders for OS, DBMS, CN, OOP; adaptive follow-ups; per-topic scoring.
- **Not included:** anything outside those four topics.
- **Done when:** depth ladders stop at a detectable knowledge boundary in scripted sessions; per-topic scores appear in the report.

#### B23: Progress and spaced repetition

- **Includes:** per-topic and per-dimension stats, weak-topic list, spaced resurfacing of failed or hint-heavy problems.
- **Not included:** adaptive difficulty.
- **Done when:** stats update after sessions; the schedule logic is deterministic and unit-tested.

#### B24: Session replay

- **Includes:** synced transcript, code scrubber, whiteboard states, run results, optional local audio; evidence links jump to moments; bookmarks and notes.
- **Not included:** sharing.
- **Done when:** every evidence item in a report jumps to the right moment; replay works on a 45-minute session without lag.

#### B25: Java/C++ execution

- **Includes:** Judge0 CE or Piston (local Docker) integration, same verdict model as B4, setup docs.
- **Not included:** public hosting of the runner.
- **Done when:** the B4 verdict fixture passes in Java and C++ with matching verdicts.

#### B26: Privacy and deployment hardening

- **Includes:** BYOK deploy, strict CSP, data disclosure panel, recording off by default, PWA/offline shell, local-mode documentation.
- **Not included:** accounts, servers storing user data.
- **Done when:** a static public build works end-to-end with a user-supplied key; CSP audit passes; local mode works with no network.

> **Checkpoint R7:** deployable.

#### B27 to B29: Optional batches

- **B27 Screen capture:** change-triggered frame sampling, tab capture, quota check. Done when frames are sent only on visual change or pause and quota use stays within budget.
- **B28 Camera:** local-only, no upload, experimental flag. Done when a network audit shows nothing leaves the device.
- **B29 Adaptive difficulty:** difficulty follows recent performance. Done when the selection logic is deterministic and tested.

### 15.6 Release checkpoints

| Release | After      | What you can do                                          |
| ------- | ---------- | -------------------------------------------------------- |
| **R1**  | B9         | Typed DSA interviews with hints, follow-ups, and reports |
| **R2**  | B11        | Trustworthy correctness on generated and pasted problems |
| **R3**  | B16        | Voice interviews with barge-in and personas              |
| **R4**  | B20        | System-design rounds with whiteboard and curveballs      |
| **R5**  | B22        | LLD and CS fundamentals rounds                           |
| **R6**  | B24        | Progress tracking and replay                             |
| **R7**  | B26        | Java/C++ and a deployable build                          |
| **R8**  | B27 to B29 | Optional extras                                          |

Start using each release for real practice as soon as it ships; the parking lot fills from that use and shapes the next batch's spec.

### 15.7 Ordering rationale

- **Correctness before voice:** ground truth (B10, B11) comes before voice so the interviewer's judgements are trustworthy before polish is added.
- **Text before voice:** the interviewer's logic is validated without speech noise; voice batches only add I/O.
- **Voice split three ways:** input, output, and interruption policy are separate batches because each has its own latency and quality risks.
- **SD after voice:** system design has the softest grading; it benefits from a stable engine and metrics.
- **Deploy hardening last:** by then the surface area is known and security review is meaningful.

---

## 16. Risks and mitigations

| Risk                                              | Impact                         | Mitigation                                                                                    |
| ------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------- |
| LLM misjudges correctness                         | Wrong feedback                 | Execution-based verdicts; cross-validated tests; `unverified` flag                            |
| Bad generated tests or references                 | False accept/reject            | Brute-force cross-check; checker classification; audit set                                    |
| Voice feels awkward (interrupts, lag)             | Product feels fake             | Gate + tunable thresholds; sentence-streamed TTS; text fallback                               |
| Free-tier limits change or tighten                | Feature outage                 | Provider abstraction; fallback chain; local models; call budgeting                            |
| STT accuracy on the user's accent/technical terms | Bad transcript, bad follow-ups | Benchmark providers on real speech early; custom vocabulary/prompting; allow transcript edits |
| System design grading is subjective               | Unreliable scores              | Fixed rubric, evidence logging, calibration set; be explicit that SD scoring is advisory      |
| Spoilers leak through follow-ups                  | Defeats practice               | Hint ladder, guard, audits                                                                    |
| Public code-execution server abused               | Security                       | Client-side runners for public build; no public Judge0; rate limits if ever exposed           |
| API key theft (XSS)                               | Key loss                       | Strict CSP, no dynamic HTML, docs on scoped/restricted keys                                   |
| Copyright/ToS with problem content                | Legal                          | No scraping; open datasets with licences; user-pasted content stays local                     |
| Scope creep                                       | Never ships                    | One-batch-at-a-time rule, scope freeze, parking lot, and batch gates (§15)                    |

---

## 17. Open questions

1. Provider benchmark (started in B1): which free LLM gives the best judgement/latency for interviewing (run the same 5 saved sessions through each)?
2. Voice stack: browser APIs vs local Whisper/Kokoro vs a realtime API. Decide in batch B12 with latency measurements.
3. Java/C++ execution (B25): local Judge0 only, or a WASM path for in-browser?
4. Should hidden-test failures reveal input/expected (real interviews usually give less), or only the category (WA/TLE)?
5. Default persona and pressure level for "random" mode.
6. Company-style modes (e.g., different follow-up styles) as a later differentiator?
7. Product name.

---

## Appendix A: Problem schema (JSON)

```json
{
  "id": "string",
  "title": "string",
  "roundType": "dsa | sd | lld | cs",
  "statement": "markdown",
  "constraints": ["string"],
  "examples": [{ "input": "string", "output": "string", "explanation": "string" }],
  "tags": ["array", "two-pointers"],
  "difficulty": "easy | medium | hard",
  "source": { "type": "dataset | user | generated", "name": "string", "licence": "string" },
  "spec": {
    "clarifications": [{ "q": "Can the array be empty?", "a": "Yes, return 0." }],
    "optimal": { "time": "O(n)", "space": "O(1)", "approach": "string (hidden)" },
    "pitfalls": ["string (hidden)"]
  },
  "checker": "exact | unordered | float | special",
  "references": {
    "solution": "code",
    "bruteForce": "code",
    "generator": "code",
    "language": "python"
  },
  "tests": [
    {
      "id": "t1",
      "kind": "sample | edge | random | stress",
      "input": "string",
      "expected": "string",
      "hidden": true
    }
  ],
  "verification": {
    "status": "verified | unverified",
    "date": "ISO",
    "trials": 200,
    "agreement": 1.0
  }
}
```

## Appendix B: Phase state machine (DSA)

```
CLARIFY → APPROACH → CODE → DRY_RUN → COMPLEXITY_FOLLOWUPS → WRAP_UP
   ▲          │         │       │
   └──────────┴─────────┴───────┘  (allowed backward moves: re-clarify, re-approach after a failed run)
```

Transitions occur on candidate intent (detected), interviewer decision, or phase-budget expiry (with a nudge, not a forced move).

## Appendix C: Event types

`speech_partial`, `speech_final`, `code_snapshot`, `run_result`, `scene_changed`, `silence`, `stall`, `phase_over`, `time_warning`, `hint_request`, `candidate_question`, `session_pause`, `session_end`.
