# M27 — CI browser-test reliability and diagnostics

## Context

The user asked for a durable fix for the recurring failure and clarified that the test should be stable; manual reruns are acceptable if Playwright itself remains unstable. The plan was approved via chat on 2026-10-06, and implementation is authorized within its scope.

### Observed facts

- GitHub Actions run [37311141068, job 111766580091](https://github.com/meeehdi-dev/nxmr/actions/runs/37311141068/job/111766580091) completed in about 4m9s. Install, migration, format, lint, typecheck, tsgo, and unit-test steps passed. The E2E step failed; build and workflow-doc checks were skipped afterward.
- Playwright ran 31 browser tests: 30 passed. `tests/e2e/agenda-drag.test.ts` failed at its final archived-entry top-resize assertion. The persisted API value stayed at `720`, while the test expected `660`; Playwright's default `expect.poll` wait ended after 5 seconds. This is not a GitHub job timeout.
- The same test and `Expected: 660 / Received: 720` failure occurred in [run 36570833040](https://github.com/meeehdi-dev/nxmr/actions/runs/36570833040), with an earlier 30-second test timeout. Later runs 36576061758, 36634714478, 36760828744, 36880531467, 36927216264, and 37139236957 passed, so the failure is intermittent.
- Before M27, the test performed the final drag by calculating a point from the entry bounding box (`y + 3`), moving to another calculated timeline point, releasing, and polling only the persisted API value; it did not assert that the resize preview appeared before release.
- At the time of the failing run, `playwright.config.ts` used `trace: 'on-first-retry'` without configuring retries. That run had no uploaded GitHub Actions artifacts (`gh api repos/meeehdi-dev/nxmr/actions/runs/37311141068/artifacts` returned `total_count: 0`), so there was no retained trace/report to inspect.
- M6 defines that archived-parent entries remain correctable and all owned entries continue to block overlapping work. Its geometry unit test already covers resize clamping.

### Analysis and open hypothesis

This is an intermittent browser gesture/assertion failure, not evidence that the overall workflow's timeout is too short. Source inspection found a specific likely race: `changeEntry` keeps Today busy until its agenda refresh finishes, and `TodayAgenda.initialPointer` ignores input while busy. The test polls persistence through `page.request` (a separate API request context), which may observe the PATCH commit before the page refresh clears that guard; it then immediately begins another drag. This is a hypothesis, not yet confirmed against a failing trace. Targeting the resize handle and asserting the preview will distinguish a missed gesture from persistence failure. Increasing timeouts would not fix this race.

## Approved scope

**Approved by the human in chat on 2026-10-06.**

- Stabilize and clarify the failing archived-parent top-resize browser coverage in `tests/e2e/agenda-drag.test.ts`. Target the actual resize handle deliberately, assert the expected preview before pointer release, and verify the persisted date/start/duration afterward.
- Reproduce the failure and make the smallest necessary correction. If evidence shows a component hit-target/gesture bug, allow a focused fix in `app/components/TodayAgenda.vue` without changing agenda data, overlap rules, or user-facing gesture semantics. Pause for renewed approval if investigation points to a broader product behavior change.
- Preserve Playwright failure diagnostics in GitHub Actions: retain traces/reports and upload test artifacts so a future failure can be investigated without first rerunning CI.
- Do not configure automatic Playwright retries. The human prefers stable tests and accepts manually rerunning CI if Playwright instability remains; preserve failure diagnostics to make investigation useful.
- Update this milestone and the concise M27 roadmap record with implementation and verification evidence after approval.

## Out of scope

- Increasing the GitHub job timeout or Playwright assertion timeout as a substitute for fixing the missing resize.
- Changing agenda persistence, overlap rules, archived-entry policy, or other product behavior except for a focused, verified resize hit-target correction.
- Broad test-suite rewrites, dependency upgrades, or unrelated GitHub Actions modernization.
- Adding automatic Playwright retries. A failed run remains failed; any rerun is manual.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- `docs/milestones/m6-agenda-drag-blocks.md` — approved gesture and archived-entry behavior
- `docs/milestones/m26-today-current-day-and-time-indicators.md` — latest local full E2E verification
- `docs/decisions/0001-llm-assisted-development-workflow.md`, `docs/decisions/0036-coolify-source-build-deployment.md`, `docs/decisions/0041-ci-e2e-failure-diagnostics.md`
- [Playwright trace documentation](https://playwright.dev/docs/trace-viewer), [Playwright configuration documentation](https://playwright.dev/docs/test-configuration), and [actions/upload-artifact](https://github.com/actions/upload-artifact)
- `.github/workflows/check.yml`, `playwright.config.ts`
- `tests/e2e/agenda-drag.test.ts`, `tests/unit/agenda-drag.test.ts`
- `app/components/TodayAgenda.vue`, `app/utils/agenda-drag.ts`
- GitHub Actions runs [37311141068](https://github.com/meeehdi-dev/nxmr/actions/runs/37311141068) and [36570833040](https://github.com/meeehdi-dev/nxmr/actions/runs/36570833040)

## Approach

1. Reproduce or instrument the final pointer gesture to determine whether the top-edge handle receives pointer-down, whether the expected preview is produced, and whether the PATCH request succeeds. Use the API result and alert state to distinguish gesture miss from persistence failure.
2. Replace ambiguous coordinate assumptions with a targeted resize-handle interaction and an explicit preview assertion. Keep the expected 660-minute clamp grounded in the fixture's actual occupied intervals. Add or adjust focused geometry coverage only if it closes a demonstrated gap.
3. If the evidence identifies a component hit-target issue, make the smallest accessible, pointer-safe correction and cover it in the browser test. Do not weaken overlap checks.
4. Configure trace retention and artifact upload in the existing CI workflow without automatic retries. Preserve the first failed attempt's evidence for diagnosis; CI must remain failed until a human manually reruns it successfully.
5. Run the focused browser case repeatedly, then the full browser suite and standard local quality gates. Verify the artifact-upload step on a GitHub Actions run before closeout; do not trigger a push or rerun solely for this verification.

## Files to modify

- `tests/e2e/agenda-drag.test.ts` — reliable top-edge input, preview and persistence assertions.
- `playwright.config.ts` — retain traces for failures; do not configure retries.
- `.github/workflows/check.yml` — upload E2E diagnostics; preserve a failing conclusion on the first failed attempt.
- `app/components/TodayAgenda.vue` — only if reproduction proves a focused hit-target/gesture correction is needed.
- `PLAN.md` — concise M27 goal/status after plan approval.
- `docs/milestones/m27-ci-browser-test-reliability.md` — approved scope, journal, verification, review and closeout.
- `docs/decisions/README.md` and a new ADR — record the durable CI policy of no automatic retries and retained failure diagnostics.

No application dependency changes are proposed.

## Reuse

- Reuse M6's pointer-captured gesture implementation and existing pure `resizeRange` geometry; preserve its archived-history and no-overlap rules.
- Reuse the existing Playwright test suite, `test-results` output, GitHub Actions quality job, and Dependabot Actions ecosystem. Do not create a second CI workflow.
- Reuse the current end-to-end API checks to verify persisted intervals rather than relying on visual state alone.

## Decisions and ADR links

- ADR 0001 requires plan approval before implementation, review, and recorded evidence.
- ADR 0036 keeps GitHub Actions as the quality gate.
- Human decision (2026-10-06): do not add automatic retries; tests should be stable, and manual reruns are acceptable if Playwright instability remains. The proposed implementation fixes the underlying E2E interaction rather than enlarging timeouts and retains failure diagnostics in CI.

## Implementation checklist

- [x] Human approves the overall M27 plan before implementation; the no-automatic-retry policy is settled.
- [x] Inspect and instrument the gesture/persistence path; record the likely busy-refresh race. The original CI failure was not reproduced locally, so its precise event remains unconfirmed.
- [x] Stabilize the top-edge browser interaction and assert preview plus persisted result.
- [x] No application component change was needed; the evidence points to a test synchronization race, not a demonstrated user-facing hit-target bug.
- [x] Retain Playwright traces/reports and add failure-only E2E artifact upload to the existing CI job, with no automatic retries.
- [x] Repeat the focused browser test and run the full E2E and project quality gates.
- [x] Verify artifact upload on GitHub Actions; confirm failures remain failures without automatic retries and record the run/artifact link.
- [x] Add the M27 roadmap entry and accepted ADR 0041; original and follow-up code reviews are accepted. The completion declaration remains pending.

## Journal

### 2026-10-05 — CI failure investigation and plan draft

- Fact: read the failed run with `gh run view 37311141068 --repo meeehdi-dev/nxmr --job 111766580091 --log`; the E2E step failed after 30/31 tests passed. The test observed start minute 720 rather than expected 660 at `tests/e2e/agenda-drag.test.ts:247`; `expect.poll` reported its 5-second timeout. Other quality steps before E2E passed.
- Fact: `gh run view 36570833040 --repo meeehdi-dev/nxmr --log-failed` showed the same test/expected/actual pair on 2026-09-29. Queried workflow history showed six later successful runs through run 37139236957 before the repeat failure in 37311141068.
- Fact: inspected `playwright.config.ts`, the failing test, `TodayAgenda.vue`, `app/utils/agenda-drag.ts`, the M6 milestone, and the existing resize geometry unit test. The test uses calculated mouse coordinates and checks only final API state after the last drag. Trace is configured only on retry, no retry count is configured, and the failed run has zero uploaded artifacts.
- Fact: `app/pages/today.vue` holds `busy` true through the agenda refresh in `changeEntry`; `TodayAgenda.initialPointer` returns without beginning a gesture when `props.busy` is true. The test's `page.request.get` poll uses a separate API request context and can see the database commit before the browser refresh is finished.
- Hypothesis: after the first archived-entry move, the test can start its top-resize while the page is still busy, so that pointer-down is ignored. This fits the intermittent unchanged value; it is not yet confirmed by a failing trace.
- Evidence: before changes, `CI=true pnpm exec playwright test tests/e2e/agenda-drag.test.ts --workers=1 --repeat-each=5` passed 5/5 against a newly created disposable PostgreSQL 17 container. This did not reproduce the CI-only intermittent failure.
- Fact: after adding an idle wait, a direct top-handle hit check, and a preview assertion, the same focused command passed 5/5 against a fresh disposable PostgreSQL 17 container. The test now has a deterministic synchronization point and reports a missing gesture before checking persistence.
- Decision proposed: do not increase timeouts as the primary fix. Stabilize and assert the gesture, then retain CI diagnostics.
- Evidence: local repository was clean before this plan draft (`git status --short --branch` showed `main...origin/main`). No application code, tests, workflow, or other existing file has been changed, and no local test or remote rerun was initiated.

### 2026-10-06 — Plan approval and retry policy

- Decision (human): no automatic Playwright retries. Tests should be made stable; if Playwright itself remains unstable, manually rerunning CI is acceptable.
- Decision (human): the user said “go” after the retry policy was clarified. Treat this as approval of the M27 plan and authorization to implement its proposed scope.
- Consequence: M27 keeps the CI quality gate strict on the first attempt. Retained traces/artifacts will support diagnosing the failure before any manual rerun.
- Evidence: direct user instruction in chat on 2026-10-06.

### 2026-10-06 — Research and focused E2E verification

- Fact: official Playwright documentation confirms `trace: 'retain-on-failure'` retains traces without configuring retries. The official GitHub `actions/upload-artifact` documentation supports explicit artifact retention. The `v7` action ref exists; Dependabot already monitors the GitHub Actions ecosystem.
- Fact: introduced a dedicated disposable `postgres:17-alpine` container, applied migrations, and removed only that temporary container through a shell cleanup trap. Existing development containers were not touched.
- Verification: before editing the test, the original failing test passed five repetitions, so the failure was not reproduced locally. After adding the network-idle barrier, direct top-handle hit check, preview assertion, and persisted duration assertion, the focused test passed five repetitions and then passed once more after a lint-only variable rename. The complete E2E suite passed all 31 tests with two workers. All runs used a disposable migrated PostgreSQL 17 database. Playwright logged the existing non-fatal `ResizeObserver loop completed with undelivered notifications` message during some runs.
- Hypothesis: the synchronization race is addressed by waiting for the page to become network-idle after the persisted move before starting the next gesture; the explicit preview assertion confirms the next top-resize gesture actually began. The original intermittent failure was not reproduced, so this cause is plausible rather than proven.
- Fact: with `CI=true`, Playwright generated `playwright-report/index.html` locally. The first-failure GitHub artifact-upload step cannot be verified locally; no push or remote rerun was made. The workflow YAML parsed with Ruby's YAML parser; `actionlint` is not installed.
- Fact: the full project gates passed: `pnpm db:migrate`, `pnpm format:check` (278 files), `pnpm lint` (no warnings/errors), `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (13 files / 72 tests), `pnpm build`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and `git diff --check`. The build emitted its non-fatal Vite `PLUGIN_TIMINGS` advisory. The local HTML report and test-results directories are ignored by Git.

### 2026-10-06 — Human code review

- Decision (human): full-diff code review accepted with no changes requested.
- Evidence: direct user review in chat on 2026-10-06.
- Status: M27 remains open until the latest CI E2E failures are diagnosed/resolved and the human completion declaration is recorded.

### 2026-10-06 — GitHub artifact verification and follow-up E2E failures

- Fact: [GitHub Actions run 37318392159](https://github.com/meeehdi-dev/nxmr/actions/runs/37318392159) ran the E2E suite with two workers; 24 of 31 tests passed and seven failed. Install, migration, format, lint, typecheck, tsgo, and unit-test steps passed. Build/workflow checks were skipped after E2E failed.
- Fact: the diagnostic-upload step succeeded and uploaded [`playwright-diagnostics-37318392159-1`](https://github.com/meeehdi-dev/nxmr/actions/runs/37318392159/artifacts/11348354740) (about 53.8 MB; seven-day retention). The run stayed failed on its first attempt and no automatic retry occurred, verifying ADR 0041's artifact and no-retry behavior.
- Fact: the archived-entry conflict assertion in `tests/e2e/agenda-drag.test.ts` expected `Time entries cannot overlap`; the retained page snapshot already contains the `Concurrent blocker` in the agenda and shows the local friendly conflict alert, `Could not move time entry` / `This time slot conflicts with another entry or the visible hours. The entry was not moved.` Thus the test's intended stale-UI/API-conflict path was not the path taken, and the following persisted-state assertion did not run.
- Fact: six other E2E cases ended in 30-second test timeouts or related trace/context errors: client hierarchy archival, hierarchy breadcrumbs, hierarchy-card metrics, ticket context popovers, ticket navigation, and ticket status moves. Failures include a timed-out API request, a timed-out `networkidle` wait, a browser-context close protocol error, and a malformed trace archive.
- Hypothesis: the unrelated timeouts and trace/context errors may indicate CI resource pressure with two workers; this is not established by the artifact. The exact failure cause needs focused reproduction before changing CI concurrency or timeouts.
- Evidence: inspected `gh run view 37318392159 --repo meeehdi-dev/nxmr --job 111790867548 --log-failed`, queried the run/artifact metadata with `gh api`, downloaded the artifact with `gh run download`, and read its HTML report, error snapshots, and traces. No source-code changes or remote reruns were made.
- Status: artifact-upload verification is complete. M27 remains open because the new CI E2E failures need diagnosis and resolution before completion.

### 2026-10-06 — Conflict assertion correction and local E2E verification

- Decision: make the agenda conflict assertion accept the user-visible conflict wording whether validation happens in the browser or at the API boundary (`/conflict|overlap/i`). The retained trace proves that the concurrent blocker had already appeared in the page, so requiring only the server's `Time entries cannot overlap` text was race-sensitive. No application behavior changed.
- Verification: `CI=true pnpm exec playwright test tests/e2e/agenda-drag.test.ts --workers=1` passed; then `CI=true pnpm test:e2e --workers=2` passed all 31 tests in 1.9 minutes against a disposable PostgreSQL 17 container. The temporary database container and `.env.development` override were removed by a cleanup trap.
- Hypothesis: the six unrelated CI timeouts/trace failures were not reproduced locally, even with two workers. This makes a CI-runner/resource interaction plausible, but does not establish the remote cause.
- Evidence: local test commands and output from 2026-10-06; `tests/e2e/agenda-drag.test.ts` contains the only application/test code change. No remote rerun was started.
- Status: agenda conflict assertion is corrected and the local E2E suite passes. The six CI-only timeout/trace failures still need diagnosis and a successful GitHub Actions verification before M27 can close.

### 2026-10-06 — Human review of follow-up correction

- Decision (human): review of the agenda conflict-assertion correction and its documentation completed with no changes requested.
- Evidence: direct user review in chat on 2026-10-06.
- Status: the follow-up code review is accepted. M27 remains open while the six CI-only failures are investigated and until the human completion declaration.

## Verification

Planning checks:

- [x] `node scripts/check-workflow-docs.mjs` — passed before plan approval.
- [x] `pnpm exec oxfmt --check docs/milestones/m27-ci-browser-test-reliability.md` — passed before plan approval.
- [x] `git diff --no-index --check /dev/null docs/milestones/m27-ci-browser-test-reliability.md` — passed before plan approval (the milestone was then untracked).
- [x] Human approval of the overall M27 plan recorded before implementation; no automatic retry is part of the plan.

Implementation verification (authorized):

- [x] `CI=true pnpm exec playwright test tests/e2e/agenda-drag.test.ts --workers=1 --repeat-each=5` — 5 passed against an isolated PostgreSQL 17 database; a final focused run after a variable-only rename also passed.
- [x] `CI=true pnpm test:e2e --workers=2` — all 31 tests passed against the isolated database; after the conflict-assertion correction, a fresh disposable PostgreSQL 17 run again passed all 31 in 1.9 minutes.
- [x] After the correction, `CI=true pnpm exec playwright test tests/e2e/agenda-drag.test.ts --workers=1`, `pnpm lint`, `pnpm exec oxfmt --check PLAN.md docs/milestones/m27-ci-browser-test-reliability.md tests/e2e/agenda-drag.test.ts`, `node scripts/check-workflow-docs.mjs`, and `git diff --check` passed.
- [x] `pnpm db:migrate`, `pnpm format:check` (278 files), `pnpm lint` (clean), `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (13 files / 72 tests), `pnpm build`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and `git diff --check` — passed. Build emitted only the non-fatal Vite `PLUGIN_TIMINGS` advisory.
- [x] Playwright CI HTML reporter generated `playwright-report/index.html`; no `retries` setting exists. Workflow YAML parsed successfully; `actionlint` is not installed.
- [x] GitHub Actions run 37318392159 uploaded the failure report/trace artifact and remained red on the first attempt; no automatic retry was configured.

## Review status

- Plan review: Approved by the human via chat on 2026-10-06; implementation authorized.
- Code review: Original M27 implementation and the follow-up conflict-assertion correction/documentation accepted by the human on 2026-10-06; no changes requested.
- Milestone completion declaration: Pending.

## Follow-ups

- Artifact upload and no-automatic-retry behavior were verified on run 37318392159. The agenda conflict assertion was corrected and the complete E2E suite passes locally; diagnose the six unrelated CI timeout/trace failures and verify a successful GitHub Actions run before declaring M27 complete.
- No automatic retry is planned. If Playwright instability persists after the test is stabilized, reruns will be manual, as directed by the human.
- Do not classify runner/action deprecation notices as the cause of this failure; handle action-version maintenance separately.

## Closeout checklist

- [ ] Approved scope complete or explicitly deferred.
- [ ] Verification evidence recorded.
- [x] Human code review accepted.
- [ ] Human completion declaration recorded in the journal and review status.
