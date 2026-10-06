# CI E2E worker-contention experiment

**Status: Superseded before approval — do not implement.** The human redirected investigation to test design; see [`m27-e2e-test-simplification.md`](m27-e2e-test-simplification.md).

## Context

M27's test assertion correction is accepted, but GitHub Actions run [37327207436, job 111820882460](https://github.com/meeehdi-dev/nxmr/actions/runs/37327207436/job/111820882460) still failed. The E2E step ran 31 tests with two workers: 24 passed and seven failed after about 5m20s. The preceding install, migration, format, lint, typecheck, tsgo, and unit-test steps passed. The run uploaded its diagnostics artifact (`playwright-diagnostics-37327207436-1`).

The failures include 30-second timeouts in unrelated areas: a direct API `PATCH`, navigation/load-state waits, and a click on an option present in the error snapshot. The agenda test snapshot remained in “Loading agenda…”. Completed browser-network API requests in the traces were generally fast, but the direct API request is not captured there. One trace archive is malformed. The artifact does not include runner CPU or memory measurements.

**Hypothesis, not established:** parallel E2E work may be overloading the shared Nuxt dev server, Chromium processes, or database on the hosted runner. Prior local two-worker runs passed, so the current evidence does not prove worker contention or rule out another CI-specific cause.

## Proposed scope

- Run the full existing E2E suite serially in CI by setting Playwright to one worker when `CI` is set. Preserve the normal local worker default.
- Keep all tests and the 30-second test timeout unchanged. Do not add retries, skip tests, or weaken assertions.
- Preserve the existing first-failure trace/report artifact upload and failed-job behavior.
- Compare the next CI result and runtime with run 37327207436. A successful serial run would support (but not by itself prove) the contention hypothesis; if failures persist, retain the diagnostics and reassess rather than increasing timeouts.

## Out of scope

- Product/API behavior changes, test deletion or broad test rewrites, dependency upgrades, retry policies, timeout increases, and workflow modernization.
- Pushing code or triggering a GitHub Actions run; remote verification should happen only after human review and authorization to trigger it.

## Files to modify

- `playwright.config.ts` — set one worker only for CI; leave local defaults unchanged.
- `docs/milestones/m27-ci-browser-test-reliability.md` — record this run, the approved experiment, its verification and outcome.
- `PLAN.md` — update the concise M27 status/link if the experiment is approved and changes the active follow-up.

## Reuse

- Keep M27's accepted no-retry policy and existing trace/report/artifact setup (`playwright.config.ts`, `.github/workflows/check.yml`, ADR 0041).
- Reuse the existing E2E suite and the isolated PostgreSQL verification method recorded in M27; do not create another workflow or change the database fixture.

## Steps and verification

1. Obtain human approval of this plan before code/config changes.
2. Set `workers` to one only in CI; make no other CI or application changes.
3. Run the complete E2E suite locally with `--workers=1` against a disposable PostgreSQL database; confirm all tests still execute and pass.
4. Run relevant formatting/lint/workflow-doc checks and inspect the diff. Do not push or start a remote run.
5. After human code review and explicit authorization to trigger CI, inspect the first-attempt result, runtime, and any uploaded failure artifact. Keep CI red if a test fails; do not configure automatic reruns.
6. Record actual evidence and remaining uncertainty in M27; do not declare M27 complete without its existing review and completion gates.

## Open question

Approve or reject the CI-only one-worker experiment. No implementation is authorized until approval is recorded.
