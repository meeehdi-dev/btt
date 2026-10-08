# M36 — E2E verification and server handoff

## Context

M34 and M35 were declared complete with browser E2E and live visual checks explicitly deferred; those omissions are preserved in their milestone records. The current `main` tree (`e518bc6`, M35) has not had a recorded local E2E run. GitHub Actions run [37831946583, attempt 3](https://github.com/meeehdi-dev/btt/actions/runs/37831946583) passed all pre-E2E checks, then failed 9 of 43 browser tests (34 passed). Its E2E step ran about 4m32s; the overall job failed after about 5m59s. Failure diagnostics were uploaded as [artifact 11577182145](https://github.com/meeehdi-dev/btt/actions/runs/37831946583/artifacts/11577182145).

Observed failures include two 30-second Playwright test timeouts involving detached/unstable DOM nodes; missing Agenda overlap/resize-preview assertions; week-control accessibility/label mismatches; a Ticket Board status-icon locator still nested under the title link after M34 moved the control; a theme test fixture receiving HTTP 409 because its seeded entries overlap; and a dark-mode compact-badge contrast assertion reporting 1.39:1. The contrast helper toggles the `dark` class and measures immediately, so whether this is a rendering defect or an in-transition measurement remains open. Runs 37819730767 and 37827879837 show several of the same non-timeout failures again.

The existing Playwright config starts and stops its own `pnpm dev` server unless `PLAYWRIGHT_SKIP_DEV_SERVER` is set; `PLAYWRIGHT_BASE_URL` supports an externally managed server. The user now explicitly directs that all tests/checks pass before the agent stops its local server, and that the server then be stopped to release it for the user's own review/run. This supersedes the earlier instruction not to start the local server for E2E verification.

## Approved scope

**Approved scope. Human approval was recorded through Plannotator on 2026-10-08.**

- Update the canonical collaboration workflow and concise agent instructions so implementation handoff requires all approved automated checks, including the full E2E suite, to pass on the final worktree. Browser tests must not be omitted because the app server is unavailable.
- Define server ownership and lifecycle: run non-browser checks before browser checks; start an agent-owned local server for E2E with Playwright configured to use that already-running server; leave it running on any test/check failure for diagnosis and fixes; only after all required checks pass, stop the agent-owned server, verify it exited/released its port, then hand off for human review. Never terminate a server that may be human-owned without asking.
- Diagnose and fix the current E2E failures on the M35 tree, keeping the fixes narrowly within existing approved product behavior and fixing stale test assumptions/fixtures where appropriate. Make an application behavior change only if retained traces/reproduction demonstrate a product bug; pause for new approval if a broader change is needed.
- Keep the CI gate strict and do not add automatic retries. Do not raise global assertion, test, or job timeouts to mask failures. Review actual test durations and retained traces; a narrowly scoped per-test timeout increase may be proposed when a test regularly takes over 20–25 seconds or approaches the 30-second default and evidence shows the intended interaction is still progressing. Add only measured headroom and record the reason. A timeout increase is not a remedy for a missing UI state, stale/detached locator, wrong expectation, or bad fixture. Do not push, dispatch, or rerun GitHub Actions without explicit authorization.
- Preserve M34/M35 historical closeout records; record this verification/follow-up in M36 rather than rewriting their completion claims.

## Out of scope

- Broad application behavior changes, API/data/schema/auth, dependencies, CI workflow policy, worker count, automatic retries, or global timeout defaults without separate approval. The approved scope permits only a narrow fix for an in-scope application bug demonstrated by retained traces or reproduction; broader behavior changes require separate approval. A global increase is out of scope; an evidence-based per-test timeout is only in scope under the criteria above.
- Reopening or rewriting the historical M34/M35 milestones or treating their previously deferred browser checks as passed retroactively.
- Stopping or killing a user-owned app server, changing deployment, or pushing/merging changes.
- Treating focused-test success as a substitute for the full project gates and complete E2E suite.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`, `docs/templates/adr-template.md`
- `docs/milestones/m27-ci-browser-test-reliability.md`, `docs/milestones/m34-agenda-board-status-icon-menus.md`, `docs/milestones/m35-nuxt-ui-color-theme.md`
- ADR 0001 (`docs/decisions/0001-llm-assisted-development-workflow.md`) and ADR 0041 (`docs/decisions/0041-ci-e2e-failure-diagnostics.md`)
- GitHub Actions runs [37831946583](https://github.com/meeehdi-dev/btt/actions/runs/37831946583), [37827879837](https://github.com/meeehdi-dev/btt/actions/runs/37827879837), and [37819730767](https://github.com/meeehdi-dev/btt/actions/runs/37819730767)
- `.github/workflows/check.yml`, `playwright.config.ts`, `package.json`
- `tests/e2e/agenda-drag.test.ts`, `tests/e2e/agenda-week.test.ts`, `tests/e2e/color-theme.test.ts`, `tests/e2e/filter-search.test.ts`, `tests/e2e/ticket-context-popovers.test.ts`, `tests/e2e/ticket-status-moves.test.ts`; `app/pages/agenda.vue` only for the reproduced, in-scope current-week hydration defect

## Approach

The latest attempt-3 logs show `agenda-progress` passing in 20.8s, `search` in 22.6s, and `ticket-navigation` in 23.0s. `filter-search` and `ticket-status-moves` passed in 21.7–22.6s and 25.4–27.9s on runs 37819730767/37827879837, but timed out at 30.4s and 31.2s on attempt 3. The latter failures include detached/unstable DOM actions, so compare traces before deciding whether an individual timeout needs headroom or whether the interaction must be stabilized.

1. Keep the plan and implementation within M36's approved scope. Inspect the retained attempt-3 diagnostics and source for each failure; classify it as a stale assertion/fixture, a timing/transition observation, or a reproduced product defect before editing.
2. Correct deterministic test defects first (including the overlapping time-entry seed and the status-icon locator). Normalize or update week-control assertions only after checking their intended accessible behavior. Reproduce the Agenda gestures and inspect their traces before touching interaction code; wait for Nuxt client mount before interactions when SSR markup alone can make a page appear ready. Measure theme styles/transitions only after they settle; correct the assertion or semantic styling according to the result. A narrowly scoped current-week behavior fix is allowed only for the reproduced hydration defect.
3. Add a focused “verification and server handoff” section to `docs/llm-workflow.md`; add a concise pointer/rule in `AGENTS.md`. Draft ADR 0050 for the durable local-verification/server-lifecycle policy and evidence-based targeted timeout criteria, then index it. ADR 0041 remains authoritative for no automatic retries and diagnostics; clarify that its rejection is of timeout increases that mask failures, not a narrowly justified per-test budget with recorded timing/trace evidence.
4. Update the M36 roadmap entry only after plan approval. Keep GitHub Actions configuration unchanged.
5. Run format, lint, both typechecks, unit tests, build, workflow checks, documentation checks, and diff checks before starting the local app server. Use an isolated disposable PostgreSQL database; do not use or modify the user's development database.
6. Start an agent-owned `pnpm dev --host 127.0.0.1` process, wait for `/api/health`, then run the focused browser cases followed by the full E2E suite against that server using `PLAYWRIGHT_SKIP_DEV_SERVER=1` (and the configured base URL). Keep the process alive on any failure while fixing/retesting. Do not use Playwright retries.
7. After every required check passes on the final worktree, stop only the server started by the agent, verify it has exited and released its port, record exact evidence, then submit the diff for human code review. If a required check cannot pass, do not stop the server or present the work as ready for review; report the blocker and ask for renewed scope approval where needed.

## Files to modify

- `docs/llm-workflow.md` — canonical verification and local server handoff policy.
- `AGENTS.md` — concise pointer/rule for the mandatory full-check and server lifecycle.
- `docs/decisions/0050-e2e-verification-and-server-handoff.md` (Accepted after Plannotator code review) and `docs/decisions/README.md` — durable decision and index.
- `PLAN.md` — M36 summary after plan approval.
- `docs/milestones/m36-e2e-verification-and-server-handoff.md` — implementation journal, evidence, review, and closeout.
- The six listed E2E test files; `app/pages/agenda.vue` for the reproduced current-week hydration defect. Other application component files only if an in-scope product defect is reproduced.

No change to `.github/workflows/check.yml`, `playwright.config.ts`, dependencies, or CI retry/timeout policy is currently proposed. If research shows the existing `PLAYWRIGHT_SKIP_DEV_SERVER` path cannot meet the server handoff requirement, stop and request approval before broadening implementation to tooling/configuration.

## Reuse

- Reuse Playwright's existing `PLAYWRIGHT_SKIP_DEV_SERVER` and `PLAYWRIGHT_BASE_URL` controls; do not add a second CI workflow or automatic retries.
- Reuse ADR 0041's retained first-failure diagnostics and the uploaded Playwright artifacts.
- Reuse the established disposable PostgreSQL test-database procedure documented in M27; never point E2E at the user's development database.
- Reuse existing browser helpers and assertions; preserve agenda overlap, archived-entry, status, theme, and accessibility behavior.

## Decisions and ADR links

- Direct user instruction (2026-10-08): all tests/checks must pass before stopping the agent's local server; stop it after success so the user can review and run the app. The previous request not to start the server for browser testing is superseded.
- Existing ADR 0041 remains authoritative: first-attempt CI failures stay red and diagnosable; no automatic retries or timeout increases to hide failures.
- Accepted ADR 0050 documents the local full-verification/server-handoff rule and evidence required for a targeted per-test timeout without changing global defaults or superseding ADR 0041. Plannotator code review pn-5cfb1d accepted the local changes with no changes requested.
- The approved M36 plan authorized implementation within this scope. The durable workflow, agent instructions, roadmap summary, and ADR 0050 are updated; test/application fixes and all approved local verification are complete. Human code review is accepted; the completion declaration remains pending.

## Implementation checklist

- [x] Human approved the M36 plan via Plannotator on 2026-10-08 after incorporating runtime/timeout feedback; implementation authorized within the revised scope.
- [x] Download/inspect retained diagnostics, compare per-test runtimes across recent runs, and record current failure classification/open questions.
- [x] Fix reproducible test/fixture issues and the narrowly scoped current-week hydration defect demonstrated by local reproduction.
- [x] Review the implementation diff and confirm no temporary diagnostics remain.
- [x] Review the timeout evidence; no per-test timeout change was justified. Keep global/assertion/job defaults and retries unchanged.
- [x] Update canonical workflow and AGENTS.md with required checks and server lifecycle.
- [x] Add/index ADR 0050 and the M36 roadmap summary after plan approval; ADR 0050 was accepted after code review.
- [x] Run focused browser coverage and all 43 E2E tests against the final application/test worktree; no retries or skipped tests.
- [x] Run all CI-equivalent local quality/documentation gates successfully.
- [x] Keep the agent-owned server running on failure; stop it only after all required checks pass and verify it is stopped before handoff.
- [x] Human code review accepted via Plannotator pn-5cfb1d on 2026-10-08; no changes requested.
- [ ] Record the human completion declaration before closing M36.

## Journal

### 2026-10-08 — Planning research

- Fact: run 37831946583, attempt 3, checked out `e518bc6`; all preceding CI steps passed, then E2E reported 34 passed and 9 failed. The E2E step took 4m32s and the workflow uploaded diagnostics artifact 11577182145.
- Fact: two failing tests reached Playwright's 30-second test timeout. The remaining failures are assertion/fixture failures with five-second expect deadlines or explicit value mismatches; the job itself did not time out.
- Fact: `tests/e2e/color-theme.test.ts` seeds entries at 540, 570, 600, and 630 minutes with durations 60, 90, 120, and 150 minutes. The first two entries overlap and the API rejects the second with HTTP 409.
- Fact: `tests/e2e/ticket-context-popovers.test.ts` still expects the Ticket Board status icon inside the title link, although M34 moved it to an adjacent status-menu button. Its compact badge dark-contrast assertion reported 1.39:1.
- Fact: `playwright.config.ts` supports external server use via `PLAYWRIGHT_SKIP_DEV_SERVER` and `PLAYWRIGHT_BASE_URL`; default Playwright-managed webServer cleanup would stop its server when the E2E command ends, including after failure.
- Hypothesis/open question: the compact badge contrast failure may be measuring mid-transition because the test toggles the `dark` class and immediately reads computed colors; inspect retained trace and verify after styles settle before changing semantic colors.
- Evidence: commands `gh run list --limit 10`, `gh run view 37831946583 --json ...`, `gh run view 37831946583 --log-failed`, `gh run view 37827879837 --log-failed`, and `gh run view 37819730767 --log-failed`; read the M27/M34/M35 records, ADR 0001/0041, `playwright.config.ts`, and the affected test sections. No local E2E run, app-server start, source edit, or CI rerun was performed in this planning session.
- Decision (human, scope still awaiting formal plan approval): all required checks must pass before stopping an agent-owned local server; after success, stop it so the user can review/run the app. Do not terminate a server the agent does not own.

### 2026-10-08 — Plannotator plan feedback and duration review

- Human feedback: “check again the github action logs, and if some tests take more than 20 or 25 secs, it might be useful to increase the timeout”. The first Plannotator review returned `decision: annotated`, not approval; implementation remains unauthorized.
- Fact: on run 37831946583 attempt 3, `agenda-progress` passed in 20.8s, `search` in 22.6s, and `ticket-navigation` in 23.0s. `filter-search` failed at 30.4s and `ticket-status-moves` at 31.2s on the 30-second Playwright default. In previous runs 37819730767 and 37827879837, `filter-search` passed in 21.7s/22.6s and `ticket-status-moves` in 25.4s/27.9s.
- Fact: the attempt-3 timeout details show `filter-search` waiting to fill an input that detached from the DOM, while `ticket-status-moves` waited on a related-ticket link reported unstable and then detached. Those failures do not by themselves prove that more time would allow the interactions to finish.
- Decision proposed: amend M36 to investigate per-test durations/traces and allow a narrowly scoped timeout increase only when the intended operation is demonstrably progressing and the ordinary duration leaves too little headroom. Keep global/test/job defaults and assertion timeouts unchanged; fix stale locators, missing state, wrong expectations, and fixtures instead of masking them. Keep no-retry CI policy.
- Evidence: `gh run view 37831946583 --log` and `gh run view 37831946583 --log-failed`, plus `gh run view 37819730767 --log-failed` and `gh run view 37827879837 --log-failed`. The uploaded attempt-3 traces were downloaded and inspected; no local browser test was started.

### 2026-10-08 — Revised plan approval

- Decision: the revised M36 plan, including a narrowly evidence-based per-test timeout option, was approved. Global/assertion/job timeout defaults and no-retry CI policy remain unchanged.
- Evidence: `plannotator annotate docs/milestones/m36-e2e-verification-and-server-handoff.md --gate --json --require-approval` returned `{"decision":"approved"}` after the timeout-duration feedback was incorporated. The workflow-doc structure, formatting, and no-index whitespace checks passed.
- Documentation: added the M36 roadmap summary and Proposed ADR 0050, indexed in `docs/decisions/README.md`.
- Status: implementation is authorized within the approved scope. No application tests or app server were started before plan approval.

### 2026-10-08 — Local browser diagnosis and focused pass

- Fact: started an isolated PostgreSQL 17 container `btt-m36-db-1791493439` on port 55432 and the agent-owned Nuxt dev server on port 3000. `/api/health` returned 200. Both stayed running throughout diagnosis; no process of unknown ownership was used or stopped.
- Fact: the Agenda drag-preview tests began pointer gestures from server-rendered cards before `openWeekAgenda` waited for client mount. Local traces showed pointer events but no gesture preview/pointer capture; both cases pass after the helper waits for `waitForClientMount`. No drag-interaction application code changed.
- Fact: in the frozen-browser current-week test (2024-09-18), the hydrated Agenda component reported `currentDate=2024-09-18` and `isCurrentPeriod=true`, while the current-week button remained neutral and had no `aria-current`. The server date was 2026-10-08. The previous fallback to server/local `today()` could produce different server and client first-render state. Changed the computed state to remain false until the browser-local `currentDate` is initialized; the targeted test now passes and the button updates to its intended active state.
- Fact: the localized settings test attempted to open a hydrated select immediately after navigation and a broad text locator matched both the current value and option text. It now waits for client mount and targets the option role. Hover-border checks now measure after the CSS transition settles instead of comparing transient colors.
- Fact: other focused failures were stale/unstable observations or setup: the filter-search helper left its menu open and then tried to fill a detached input; it now dismisses the menu and asserts the intended result. Ticket Board status movement uses the moved-to status-menu button with keyboard focus. The color fixture uses non-overlapping intervals and waits for contrast readings after the theme class settles. No timeout increase was made.
- Evidence: the initial six-file run exposed three additional local assertion failures (immediate Agenda hover color, duplicate German text, and transition-time comparison); a second run exposed the unhydrated settings interaction and transient hover-color comparison. After fixes, `CI=true DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/btt_m36 PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 pnpm exec playwright test tests/e2e/agenda-drag.test.ts tests/e2e/agenda-week.test.ts tests/e2e/color-theme.test.ts tests/e2e/filter-search.test.ts tests/e2e/ticket-context-popovers.test.ts tests/e2e/ticket-status-moves.test.ts --workers=1 --reporter=line` passed all 15 tests in 54.5s.
- Fact: the focused run used no retries and required no timeout changes. No GitHub Actions workflow was dispatched or rerun. At this point the complete suite and final-worktree non-browser gates remain outstanding; therefore the server remains running.

### 2026-10-08 — Full local verification

- Fact: `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/btt_m36 pnpm db:migrate` passed against the isolated PostgreSQL 17 database.
- Fact: `pnpm format:check`, `pnpm lint`, `DATABASE_URL=... pnpm typecheck`, `DATABASE_URL=... pnpm typecheck:tsgo`, and `DATABASE_URL=... pnpm test` passed; Vitest reported 14 files / 75 tests.
- Fact: `DATABASE_URL=... pnpm build` completed successfully. `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and `git diff --check` passed. The build emitted informational `PLUGIN_TIMINGS` warnings only.
- Fact: final browser command `CI=true DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/btt_m36 PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 pnpm exec playwright test --workers=1 --retries=0 --reporter=line` passed all 43 tests in 2.7 minutes. The server was agent-owned (pnpm PID 5280, Nuxt listener PID 5299); `/api/health` returned 200 before the run, and port 3000 remained bound by PID 5299 after it. The focused six-file run also passed 15/15 in 54.5s.
- Fact: no application/test edits, retries, timeout increases, remote CI runs, or skipped tests were made after the full suite passed. All listed local gates passed before server shutdown; the final journal-only update is followed by fresh formatting, workflow-documentation, and diff checks.
- Status: server shutdown and port-release evidence is recorded below. Human code review is accepted; the completion declaration remains pending.

### 2026-10-08 — Server handoff

- Fact: after the full suite and all approved checks passed, `kill -TERM 5280 5285 5286 5299` stopped the tracked agent-owned `pnpm`/Nuxt process tree. A prior `kill -INT 5280` alone did not stop the tree; no unrelated process was signalled.
- Fact: `ps -p 5280,5285,5286,5299 -o pid=,ppid=,pgid=,stat=,command=` returned no processes, and `lsof -nP -iTCP:3000 -sTCP:LISTEN` returned no listener. Port 3000 is released.
- Fact: `docker stop btt-m36-db-1791493439` stopped the isolated PostgreSQL test container; Docker reports it exited and `lsof -nP -iTCP:55432 -sTCP:LISTEN` confirms port 55432 is released.
- Fact: final-worktree `pnpm format:check`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and `git diff --check` all passed.
- Status: local verification and server handoff are complete. Code review is accepted; M36 remains open until the human completion declaration.

### 2026-10-08 — Plannotator code review

- Decision: Plannotator local changes `pn-5cfb1d` for `/Users/mehdi/code/btt` were approved. Code review completed with no changes requested.
- Status: code review is accepted. No implementation change was requested; the human completion declaration remains pending.

## Verification

Planning checks:

- [x] `node scripts/check-workflow-docs.mjs` — passed before revised Plannotator review: “Workflow documentation structure looks complete.”
- [x] `./node_modules/.bin/oxfmt --check docs/milestones/m36-e2e-verification-and-server-handoff.md` — passed before revised Plannotator review.
- [x] `git diff --no-index --check /dev/null docs/milestones/m36-e2e-verification-and-server-handoff.md` — passed with no whitespace diagnostics.
- [x] Human Plannotator plan approval before implementation.

Implementation checks (after approval):

- [x] `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/btt_m36 pnpm db:migrate` — passed against the isolated PostgreSQL 17 database.
- [x] `pnpm format:check`, `pnpm lint`, `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/btt_m36 pnpm typecheck`, `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/btt_m36 pnpm typecheck:tsgo`, and `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/btt_m36 pnpm test` — passed; unit tests: 14 files / 75 tests.
- [x] `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/btt_m36 pnpm build`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and `git diff --check` — passed. Build completed; only informational plugin-timing warnings were emitted.
- [x] Focused six-file Playwright run — 15/15 passed in 54.5s. Complete Playwright run: 43/43 passed in 2.7m using the isolated database and external agent-owned server, `--workers=1 --retries=0`; no skips or timeout changes.
- [x] Manual lifecycle check: agent-owned server stayed available during diagnosis and verification, then was stopped after all checks passed; port 3000 was verified released. The isolated database container was also stopped and port 55432 released. No user-owned/unknown process was stopped.
- [x] Human code review accepted via Plannotator pn-5cfb1d; no changes requested.
- [ ] Human completion declaration recorded.

## Review status

- Plan review: Approved via Plannotator on 2026-10-08 after the test-duration feedback was incorporated.
- Code review: Accepted via Plannotator pn-5cfb1d on 2026-10-08; no changes requested.
- Milestone completion declaration: Pending.

## Follow-ups

- None planned. Any broader app behavior fix, CI policy change, or need to change global/test/job timeouts requires separate human approval.

## Closeout checklist

- [ ] Approved checklist complete or explicitly deferred with human approval.
- [x] Verification evidence recorded.
- [x] Human code review accepted via Plannotator pn-5cfb1d.
- [ ] Human completion declaration recorded in the journal and review status.
