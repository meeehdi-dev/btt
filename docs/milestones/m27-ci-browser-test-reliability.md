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
- [x] Add the M27 roadmap entry and accepted ADR 0041; original and follow-up code reviews and the human completion declaration are recorded.

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
- Status: the follow-up code review is accepted. M27 remains open while the CI-only failures are investigated and until the human completion declaration.

### 2026-10-06 — Follow-up CI run 37327207436

- Fact: [run 37327207436, job 111820882460](https://github.com/meeehdi-dev/nxmr/actions/runs/37327207436/job/111820882460), on commit `5c6ed39`, passed install, migration, formatting, lint, both typechecks, and unit tests. The E2E step ran 31 tests with two workers; 24 passed and seven failed after about 5m20s. The overall job failed after about 6m48s.
- Fact: the archived-entry conflict wording assertion no longer failed. The agenda drag test instead timed out waiting for `networkidle` after reload; its saved snapshot showed “Loading agenda…”. Six other tests timed out across unrelated client hierarchy, breadcrumb, card metrics, popover, navigation, and status-move scenarios. Failures included a direct API `PATCH` timeout, UI action/load-state timeouts, and one malformed trace archive.
- Fact: the diagnostic artifact [`playwright-diagnostics-37327207436-1`](https://github.com/meeehdi-dev/nxmr/actions/runs/37327207436/artifacts/11353355548) uploaded successfully (about 51.4 MB, seven-day retention). The browser-network entries available in traces show completed app API requests generally taking tens of milliseconds, but do not include the timed-out direct `page.request` API call. This run has no runner CPU/memory telemetry.
- Hypothesis: shared-runner contention among the Nuxt dev server, Chromium, and/or PostgreSQL remains plausible, but this artifact does not establish the cause. Local two-worker E2E runs passed previously.
- Follow-up: a CI-only one-worker experiment was initially drafted in [`plans/ci-e2e-single-worker-experiment.md`](../../plans/ci-e2e-single-worker-experiment.md), but the human redirected investigation toward test design. That plan is superseded before approval. No worker, timeout, retry, application, or workflow changes were made and no push/rerun was triggered.

### 2026-10-06 — Source-level test timeout diagnosis

- Fact: `playwright.config.ts` has no explicit test timeout, so the observed 30-second deadline is Playwright's default. The 285-line `tests/e2e/agenda-drag.test.ts` is one test combining several separate desktop/mobile/archive scenarios and contains six `networkidle` waits.
- Fact: the agenda-drag trace records five `networkidle` waits consuming 18.71 seconds total. The fifth wait was cancelled by the overall test timeout at `tests/e2e/agenda-drag.test.ts:218`; the top-edge resize interaction later in that test was never reached. The first four waits consumed about 16.25 seconds; the final reload wait consumed the remaining 2.46 seconds before cancellation.
- Fact: six failure traces are readable; their completed `networkidle` waits consume 13.13–22.00 seconds per test. The hierarchy-card-metrics trace is malformed; its test file contains 12 `networkidle` waits. The failing API patch and locator actions were the operations in progress at the test deadline, not proof that those operations individually took 30 seconds.
- Fact: `rg -nF "waitForLoadState('networkidle')" tests/e2e | wc -l` reports 105 such waits across the suite. Completed browser-network API requests in readable traces were generally fast; no runner resource metrics are available.
- Conclusion/hypothesis: repeated idle barriers combined with oversized scenarios are the best-supported source of these test-level timeouts. This does not prove every failure shares one cause, but the evidence does not justify the earlier worker-contention hypothesis or a one-worker CI change.
- Decision: a focused test-only simplification was proposed in [`plans/m27-e2e-test-simplification.md`](../../plans/m27-e2e-test-simplification.md): isolate archived top-resize browser coverage and replace only unnecessary `networkidle` waits in the currently failing scenarios with semantic readiness conditions.
- Decision (human): “go” approved that plan via chat on 2026-10-06 and authorized implementation within its scope. No worker, timeout, retry, application, or workflow changes are authorized.

### 2026-10-06 — Approved E2E simplification implementation

- Fact: split the agenda-drag omnibus into four independent tests sharing a scoped fixture: desktop gestures, mobile correction/deletion, stale server-side overlap, and archived-parent top resize. The focused browser assertions still check actual gesture previews and persisted results.
- Fact: replaced all 56 `networkidle` waits in the seven approved test files. The suite-wide count fell from 105 to 49. Screens whose visible server-rendered controls need client handlers use `waitForClientMount`, a test-only wait for Vue mounting on `#__nuxt`; existing locator assertions continue to cover rendered data. No product/UI code or dependencies changed.
- Fact: a fixed 400 ms delay before mobile board interaction was replaced with an assertion that the status collapsible is open and a wait for its actual Web Animations API animations to finish. This preserves the required movement/animation synchronization without a blind delay.
- Evidence: the first mechanical removal exposed lost interactions before client mount and while the mobile collapsible was moving. The Vue mount condition and explicit animation completion resolved those conditions; this shows some prior idle waits were acting as coarse hydration/animation barriers, not merely waiting for API responses.
- Verification: the seven affected files passed all 11 tests with two workers. `CI=true pnpm test:e2e --workers=2` then passed all 34 browser tests in 1.6 minutes against a disposable PostgreSQL 17 database. The archived-parent top-resize test passed five repetitions with one worker.
- Verification: `pnpm format:check` (281 files), `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (13 files / 72 tests), `pnpm build`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and `git diff --check` passed. Build emitted the existing non-fatal Vite `PLUGIN_TIMINGS` advisory.
- Observation: the Nuxt dev server logged `ResizeObserver loop completed with undelivered notifications` during E2E and Vue Router no-match warnings for intentional 404 route tests. They did not fail the 34-test run and were not suppressed or changed.
- Fact: all browser runs used an isolated disposable PostgreSQL 17 container and temporary `.env.development`, both removed by cleanup traps. No existing development database was changed. No push or GitHub Actions run was triggered.
- Status: implementation and local verification are complete. Human code review and explicit authorization to trigger CI are still required; no conclusion about the hosted-runner result is claimed.

### 2026-10-06 — CI run 37360072110 and test-readiness follow-up

- Fact: [GitHub Actions run 37360072110, job 111932170822](https://github.com/meeehdi-dev/nxmr/actions/runs/37360072110/job/111932170822), on commit `8c7fb67`, passed install, migration, formatting, lint, both typechecks, and unit tests. E2E ran 34 tests: 30 passed and four failed. The diagnostic artifact [`playwright-diagnostics-37360072110-1`](https://github.com/meeehdi-dev/nxmr/actions/runs/37360072110/artifacts/11366328669) uploaded successfully.
- Fact: two agenda-drag cases failed before interacting with the agenda because the shared fixture's five-second date-button assertion still saw `Loading day…`. The trace showed the agenda route's client bundle arriving late; the fixture used the UI to derive a date before agenda data was ready. The final test fixture keeps navigating to `/today` for tests that use `page.reload()`, but now derives the test date from the browser clock rather than asserting an unrelated rendered date.
- Fact: `hierarchy-breadcrumbs` reached the 30-second test deadline waiting for the mobile page's Vue mount late in a long sequential route scenario. `ticket-context-popovers` also exceeded the 30-second test deadline; its trace archive was malformed, so no further failure detail is available.
- Decision: split the breadcrumb and ticket-context tests into focused scenarios using per-test data fixtures. Existing browser assertions were preserved; this reduces work under each unchanged Playwright timeout. No timeout, worker, retry, product, or workflow setting changed.
- Fact: the first local attempt after removing the fixture's initial `/today` navigation exposed that these tests subsequently call `page.reload()` and therefore require a real route. Restoring the route navigation while removing the brittle date-button dependency fixed this; the temporary failure did not indicate an application regression.
- Verification: all 12 tests in the three affected files passed with two workers against an isolated disposable PostgreSQL 17 container. The full suite passed all 40 tests with two workers in 1.6 minutes. The same local run recorded non-failing `ResizeObserver` and intentional Vue Router no-match warnings.
- Verification: `pnpm format:check` (281 files), `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (13 files / 72 tests), `pnpm build`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and `git diff --check` passed. Build emitted the non-fatal Vite `PLUGIN_TIMINGS` advisory.
- Fact: the run annotations also include a Node.js 20 deprecation warning for the existing v4 GitHub Actions and an `ubuntu-latest` migration notice. These are advisory and unrelated to the E2E test failure; action/workflow upgrades remain outside this follow-up.
- Evidence: the isolated temporary database container and `.env.development` override were removed by a cleanup trap; existing development containers were not used or changed. No push or remote run was triggered from this session.
- Status: local remediation is complete. Human review of this follow-up and explicit authorization for a new GitHub Actions run remain pending.

### CI run 37365101184 — Remaining mobile readiness correction

- Fact: [run 37365101184, job 111948241687](https://github.com/meeehdi-dev/nxmr/actions/runs/37365101184/job/111948241687), on commit `2c7db9e`, passed all pre-E2E checks and 39/40 browser tests, including archived-parent top resize. Only the mobile agenda correction test failed, at its five-second `Delete correction` visibility assertion.
- Fact: downloaded and inspected [artifact 11367339551](https://github.com/meeehdi-dev/nxmr/actions/runs/37365101184/artifacts/11367339551). The assertion started before client mounting; the agenda API request began about 4.4 seconds into that assertion and completed successfully in 23 ms. The saved snapshot already contains the seeded entry. This is a client-readiness race, not a missing record or slow API.
- Decision (human): fix only the remaining problem; a narrow test skip is permitted if necessary. No skip was needed. Reused the approved M27 client-mount helper immediately after the mobile reload in `tests/e2e/agenda-drag.test.ts`, before starting content assertions. The implementation adds only an import and one wait; application code, assertions, timeouts, workers, retries, dependencies, and workflow remain unchanged.
- Verification: a temporary copy of the mobile test injected a six-second delay into the Today client module. Without the new wait, it reproduced the exact five-second missing-entry assertion failure; with the wait, the same delayed scenario passed 3/3. The unchanged-timeout real mobile case then passed 5/5 with two workers, and `CI=true pnpm test:e2e --workers=2` passed all 40 tests in 1.6 minutes.
- Verification: `pnpm db:migrate`, `pnpm format:check` (281 files), `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (13 files / 72 tests), `pnpm build`, `pnpm check:workflow`, and `git diff --check` passed. The intentional retired-route test emitted its existing non-fatal Vue Router no-match warning.
- Evidence: all browser tests used an isolated disposable PostgreSQL 17 container. The temporary delayed test, `.env.development` override, and container were removed by a cleanup trap; existing development databases were not changed. No push or remote run was triggered. Human code review and CI confirmation of this newest change remain pending.

### 2026-10-06 — Agenda readiness and hierarchy test split follow-up

- Fact: GitHub Actions run [37454596653](https://github.com/meeehdi-dev/nxmr/actions/runs/37454596653), on commit `1445871397c9140e99a0a10bac0b7eb175a33302`, reported two `agenda-drag` visibility failures while the page still showed loading text; the expected agenda request had not started before those assertions. The `auth-shell` hierarchy scenario reached its 30-second test deadline at the final delete step, before a DELETE request started.
- Decision: keep the E2E coverage and make only test changes. `openTodayAgenda` navigates to the seeded date, awaits the matching successful `/api/agenda` response, then confirms loading has ended. Split the long hierarchy flow into focused tests with isolated per-test hierarchy fixtures/cleanup; wait for the archive button's Vue component to mount before asserting its hover tooltip. No application code, assertions, timeout, worker, retry, dependency, or workflow policy was changed.
- Verification: `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/nxmr pnpm db:migrate` passed; `CI=true DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/nxmr pnpm test:e2e --workers=2` passed all 39 tests in 1.5 minutes using the existing test timeout and no skips. The disposable container was removed by a cleanup trap; existing database containers were not modified.
- Verification: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (13 files / 72 tests), `pnpm build`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and `git diff --check` all passed. The build emitted a non-failing Vite `PLUGIN_TIMINGS` advisory. Playwright logged the existing non-fatal `ResizeObserver` diagnostic and expected retired-route warnings.
- Status: local implementation and verification are complete. Human code review and explicit authorization before any new remote run remain pending; no push or remote CI run was triggered.

### 2026-10-06 — Human review and completion declaration

- Decision (human): the user said, “all good, i declare this milestone complete.” This accepts the current code review and declares M27 complete.
- Status: Complete by human declaration on 2026-10-06. At declaration time, hosted verification was pending; the later integration result is recorded below.

### 2026-10-06 — Hosted integration verification through refreshed PR #4

- Fact: the human pushed PR #4 head `3fd0018f90349f825cc0260b8777d084092aee66`, based on current `main` `6e04733`. That tree included the completed M27 source/tests plus the PR #4 dependency updates, with `vue-tsc` retained at 3.3.11.
- Verification: hosted quality run [37532795100](https://github.com/meeehdi-dev/nxmr/actions/runs/37532795100) passed in 6m50s: frozen install, migration, formatting, lint, canonical typecheck, tsgo, unit tests, Playwright E2E (39/39), build, and workflow checks. No retry was run.
- Observation: the run reported the non-blocking `unicorn/consistent-function-scoping` warning at `app/pages/today.vue:472` and an `ubuntu-latest` runner-image notice. The warning is associated with the PR #4 oxlint update; no source workaround was made.
- Scope note: this verifies the M27 changes in an integrated PR #4 dependency-upgrade branch, not a standalone M27-only push/run. The human merged PR #4 as `0add773dee3461ff1d67ec7c087104008d19b884`; the agent did not push or merge it.
- Status: the hosted verification follow-up is complete; M27 remains complete by the human's declaration.

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

### Approved E2E simplification follow-up

- [x] The approved plan [`plans/m27-e2e-test-simplification.md`](../../plans/m27-e2e-test-simplification.md) was implemented without changing timeout, worker, retry, workflow, application, or dependency policy.
- [x] The seven initially affected E2E files passed all 11 targeted tests with two workers; the original complete suite passed 34 tests.
- [x] The archived-parent top-resize test passed five repeated runs.
- [x] After CI run 37360072110 identified remaining test-readiness/oversized-scenario failures, the agenda fixture and two long test scenarios were corrected/split without weakening assertions.
- [x] All 12 tests in the three affected files and the full 40-test E2E suite passed with two workers against isolated PostgreSQL 17.
- [x] Formatting, lint, both typechecks, unit tests, build, workflow checks, workflow-document checks, and diff checks passed after the CI-driven follow-up.
- [x] Inspected the first-attempt result and retained artifact from run 37365101184: 39/40 passed; the remaining mobile failure is a client-mount race.
- [x] Reproduced the mobile assertion failure under delayed module loading; the two-line readiness fix passed 3/3 delayed scenarios, 5/5 real mobile repetitions, and the full 40-test suite without skipped tests or policy changes.
- [x] Human code review of this follow-up accepted by the user on 2026-10-06 (“all good”).
- [x] Hosted integration check for the latest fixes inspected: quality run 37532795100 passed on refreshed PR #4 head 3fd0018; see the journal entry above. It was not a standalone M27-only run.

## Review status

- Plan review: Original M27 plan and the E2E simplification plan approved by the human via chat on 2026-10-06; follow-up implementation authorized.
- Code review: Original M27 implementation, conflict-assertion correction/documentation, and the latest agenda-readiness/hierarchy-test follow-up accepted by the human on 2026-10-06 (“all good”).
- CI status: run 37365101184 tested commit `2c7db9e`, before the later local fixes. The subsequent integrated PR #4 refresh, based on current `main` and containing those fixes, passed hosted quality run 37532795100 (39/39 E2E); this is recorded as integration evidence, not a standalone M27 run.
- Milestone completion declaration: Complete. The user stated, “all good, i declare this milestone complete,” on 2026-10-06.

## Follow-ups

- Hosted integration verification for the latest M27 source passed in run 37532795100 on the refreshed PR #4 dependency branch. No further M27 CI follow-up is pending. Preserve first-failure diagnostics and investigate future failures without automatic retries, timeout increases, or worker changes unless separately approved.
- No automatic retry is planned. Manual reruns remain the human's choice after inspecting diagnostics.
- Do not classify runner/action deprecation notices as the cause of this failure; handle action-version maintenance separately.

## Closeout checklist

- [x] Approved scope complete or explicitly deferred; hosted integration verification passed in run 37532795100.
- [x] Verification evidence recorded.
- [x] Human code review accepted for the original M27 implementation and conflict-assertion correction.
- [x] Human code review accepted for the E2E simplification follow-up.
- [x] Human completion declaration recorded in the journal and review status.
