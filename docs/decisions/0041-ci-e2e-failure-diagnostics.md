# ADR 0041: Keep CI E2E failures visible and diagnosable

- Status: Accepted
- Date: 2026-10-06
- Supersedes: None
- Superseded by: None

## Context

GitHub Actions has repeatedly failed on an intermittent Playwright drag-resize test. The current configuration uses `trace: 'on-first-retry'` without configuring retries, and the failed run had no uploaded artifacts. Raising timeouts would not address the observed unchanged persisted value. The human directed that tests should be stable and that any Playwright-only instability should be handled with a manual rerun, not an automatic retry.

## Decision

- Do not configure Playwright retries in CI. A failed first attempt fails the quality job; any rerun is manual.
- On CI, retain Playwright traces for failed tests and produce the HTML report.
- When the E2E step fails, upload `playwright-report/` and `test-results/` as a GitHub Actions artifact with a seven-day retention. Give the artifact a run-and-attempt-specific name.
- Preserve the existing single quality workflow and do not increase job/assertion timeouts to mask failures.

## Consequences

A flaky browser test remains visible as a failed quality gate and cannot turn green through a retry. A human can inspect the test report, trace, and error context before deciding whether to fix or manually rerun. Trace recording adds some CI overhead; artifacts are retained only for seven days and are produced for E2E failures. No application dependency, app behavior, or API/schema changes are required by this policy.

## Alternatives considered

- Automatically retry a failed browser test once: rejected by the human; stabilize the test and keep any rerun deliberate.
- Increase Playwright or GitHub Actions timeouts: rejected because the observed failure is a missed state update, not an expired CI job.
- Keep only the plain log output: rejected because it does not preserve a browser trace or report for first-attempt diagnosis.

## Links

- [`docs/milestones/m27-ci-browser-test-reliability.md`](../milestones/m27-ci-browser-test-reliability.md)
- [`playwright.config.ts`](../../playwright.config.ts)
- [GitHub Actions quality workflow](../../.github/workflows/check.yml)
- [Playwright trace documentation](https://playwright.dev/docs/trace-viewer)
- [actions/upload-artifact](https://github.com/actions/upload-artifact)
