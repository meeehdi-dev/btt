# M27 — Simplify CI E2E timeout failures

**Status: Approved by the human via chat on 2026-10-06. The CI-driven fixes and subsequent agenda-readiness/hierarchy-test follow-up are locally verified; the latest complete E2E run passed 39/39. Human code review and hosted CI confirmation remain pending; no new remote run is authorized.**

## Context and diagnosis

GitHub Actions run [37327207436, job 111820882460](https://github.com/meeehdi-dev/nxmr/actions/runs/37327207436/job/111820882460) ran 31 tests with two workers: 24 passed and seven failed at Playwright's 30-second per-test deadline. Install, migration, formatting, lint, typechecks, and unit tests passed.

The strongest source-level cause is test design, not a demonstrated application/API defect or proven runner contention:

- `playwright.config.ts` does not override Playwright's 30-second test timeout.
- `tests/e2e/agenda-drag.test.ts` is one 285-line test combining desktop creation/move/conflict/resize, mobile correction/deletion, archived-parent correction, and top-edge resize. It contains six `networkidle` waits.
- Its retained trace records five of those waits consuming 18.71 seconds total; the fifth was interrupted by the overall 30-second test deadline during the archived-entry reload. The test therefore timed out before reaching the archived top-resize interaction it was meant to verify. The resize gesture was not the failing operation in this run.
- For the six failures with readable traces, explicit `networkidle` waits consumed 13.13–22.00 seconds per test. Several failures occurred on whatever action was in progress when the overall test deadline expired (including an API patch and a locator click); this does not establish that those individual operations or the backend took 30 seconds.
- The suite contains 105 `waitForLoadState('networkidle')` calls. The hierarchy-card-metrics failure's trace archive is malformed, so its exact wait time is unavailable; its test file contains 12 such waits.
- The completed browser-network API requests visible in the available traces were generally fast. There is no runner CPU/memory evidence.

**Conclusion:** repeated whole-page idle barriers and oversized end-to-end scenarios are the best-supported explanation for these deadline failures. Do not raise timeouts or serialize CI as a substitute; those would leave the source design intact. Keep browser coverage for real pointer behavior, but make the archived top-resize case small and independent.

## Proposed scope

- Refactor only the seven currently failing E2E scenarios in `agenda-drag`, `auth-shell`, `hierarchy-breadcrumbs`, `hierarchy-card-metrics`, `ticket-context-popovers`, `ticket-navigation`, and `ticket-status-moves`.
- Replace `networkidle` barriers in those scenarios only where a following meaningful locator/assertion or explicit application-ready condition can express the required state. Do not mechanically remove all 105 waits.
- Split the agenda drag omnibus test into focused scenarios. Keep a small dedicated browser test for archived-parent top-edge resize that asserts the handle hit, preview, and persisted clamped interval.
- Preserve distinct product-behavior assertions; first map them against existing unit/API/E2E coverage and avoid redundant flows rather than deleting coverage wholesale.
- Keep test timeouts, worker count, retries, application code, and workflow unchanged. Retain the first-failure diagnostics and CI gate.

## Out of scope

- Raising timeouts, reducing workers, retries, skipped tests, assertion weakening, product/API changes, and broad rewrites of all 105 waits.
- Pushing changes or triggering a remote run; obtain human review and authorization before CI is triggered.

## Files to modify

- `tests/e2e/agenda-drag.test.ts`
- `tests/e2e/wait-for-client-mount.ts` — narrow client-mount readiness condition used in affected browser tests.
- `tests/e2e/auth-shell.test.ts`
- `tests/e2e/hierarchy-breadcrumbs.test.ts`
- `tests/e2e/hierarchy-card-metrics.test.ts`
- `tests/e2e/ticket-context-popovers.test.ts`
- `tests/e2e/ticket-navigation.test.ts`
- `tests/e2e/ticket-status-moves.test.ts`
- `docs/milestones/m27-ci-browser-test-reliability.md`
- `PLAN.md` — concise M27 status update, if needed after evidence.

## Reuse

- Reuse the existing pure interval geometry tests in `tests/unit/agenda-drag.test.ts` for snap/clamp rules.
- Reuse existing API setup/auth helpers and existing `expect` locator auto-wait patterns; add no dependencies or general test framework.
- Preserve ADR 0041's no-retry policy and existing trace/report artifact upload.

## Steps and verification

1. Obtain human approval before test changes.
2. Map assertions in the seven failing scenarios to existing unit/API/E2E coverage and identify only redundant work.
3. Refactor the agenda gesture case into focused scenarios; ensure the archived top-resize test reaches and verifies the pointer preview and persisted interval within the existing timeout.
4. Replace the 56 idle barriers in the seven failing test files with a narrow Vue-root mount condition where client interaction must be ready, or existing locator/assertion auto-waits where the rendered state is sufficient. In the mobile board test, wait for the collapsible's actual opening animation to finish instead of using a fixed delay. Preserve all meaningful behavior checks.
5. Run the focused archived-resize case repeatedly, the seven affected tests with the existing two-worker setup, then the full E2E suite with the existing CI settings. Do not change retry, timeout, or worker policy.
6. Run formatting, lint, typecheck, unit, build, and workflow-doc checks; record evidence and review the diff.
7. After human code review and explicit authorization to trigger CI, verify the first-attempt GitHub Actions result and diagnostic artifact. Record remaining failures without automatic retries.

## Approval

The human said “go” on 2026-10-06, approving this plan and authorizing implementation within the stated scope. Human code review is required before accepting the changes; explicit authorization is required before triggering CI.
