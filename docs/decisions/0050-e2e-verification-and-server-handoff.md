# ADR 0050: Require complete local verification before server handoff

- Status: Accepted
- Date: 2026-10-08
- Supersedes: None
- Superseded by: None

## Context

M34 and M35 were completed with full browser verification explicitly deferred. Subsequent GitHub Actions runs exposed test/fixture mismatches and two tests reaching Playwright's 30-second per-test limit. The human now requires full local checks to pass before an agent stops its app server and hands the work back for review. ADR 0041's strict CI policy remains important: no automatic retries and no timeout increases that mask a failure.

## Decision

- Do not hand implementation work to human code review as verified until every check required by the approved milestone passes on the final worktree. This includes the full Playwright suite; do not skip it because the local server is stopped or unavailable.
- Run non-browser gates before browser tests. For browser tests, use an agent-owned local app server and Playwright's existing `PLAYWRIGHT_SKIP_DEV_SERVER`/`PLAYWRIGHT_BASE_URL` support so the server remains available for diagnosis after failures.
- On any failing check, leave the agent-owned server running while investigating and retesting. After every required check passes, stop only the server owned by the agent, verify it exited/released its port, then hand off for human review. Never stop an existing user-owned process without permission.
- Do not add automatic Playwright retries or raise global assertion/test/job timeout defaults to conceal failures. A targeted per-test timeout may be justified only by repeated runtime evidence near or above 20–25 seconds and trace evidence that the intended work is progressing. Add bounded headroom to the specific test, explain the chosen value, and record the evidence. Do not use timeouts to compensate for missing UI state, stale/detached locators, incorrect expectations, or bad fixtures.
- Keep GitHub Actions as the strict first-attempt quality gate. Any remote run/rerun still requires explicit human authorization.

## Consequences

- Human review begins only after a green full local verification set and the agent-owned server is stopped and its port released.
- A failed E2E run leaves the server available for diagnosis rather than forcing a fresh startup; the agent must explicitly track ownership and later stop only its own process after success.
- This adds local verification time, but reduces reviews of changes that have not passed browser tests.
- Evidence-based per-test budgets can accommodate genuinely long scenarios while keeping default assertion/job budgets, first-attempt failure visibility, and no-retry policy intact.

## Alternatives considered

- Skip full E2E when no app server is running: rejected because M34/M35 showed that deferred browser verification can leave stale selectors, fixture errors, and runtime issues undiscovered.
- Let Playwright start and automatically stop the app server before diagnosis: rejected because the server must remain available after a failure and be released only after all checks pass.
- Raise the global Playwright timeout or add automatic retries: rejected because this can hide stale states and makes CI's first result less informative.
- Never increase any test timeout: rejected as too rigid when measured test bodies repeatedly approach the 30-second limit and traces show legitimate progress; use only a justified per-test override.

## Links

- [`docs/milestones/m36-e2e-verification-and-server-handoff.md`](../milestones/m36-e2e-verification-and-server-handoff.md)
- [`docs/llm-workflow.md`](../llm-workflow.md)
- [`AGENTS.md`](../../AGENTS.md)
- [ADR 0041: CI E2E failure diagnostics](0041-ci-e2e-failure-diagnostics.md)
- [`playwright.config.ts`](../../playwright.config.ts)
