# ADR 0064: Human manual application testing instead of E2E

- Status: Accepted
- Date: 2026-10-27
- Supersedes: [ADR 0041](0041-ci-e2e-failure-diagnostics.md), [ADR 0050](0050-e2e-verification-and-server-handoff.md)
- Superseded by: None

## Context

The human chose to remove all E2E tests and supporting tooling and to test application behavior manually. The browser suite carried fixture and readiness maintenance cost and repeated CI instability.

## Goal

Agents run the retained automated checks; the human tests the running application manually. There is no E2E suite.

## Decision

- No E2E suite, browser-test tooling, browser steps in CI, or replacement browser framework.
- Keep unit/component tests (including database-backed auth tests), format/lint, duplication and unused-code checks, both typechecks, build, and workflow checks. All retained checks must pass on the final worktree before review handoff.
- The human owns manual application testing. Agents record only human-reported results and leave unperformed cases pending; automated checks and optional agent UI observations are not manual acceptance.
- No agent-owned verification app server is required. Any agent-owned resource is cleaned up and its port verified released; a user-owned server is never managed without permission. Optional UI uses a separately user-managed running app.
- Approval gates and first-failure evidence stay. Failed retained checks are not hidden by retries or timeout increases.
- Earlier plans, milestones, reports, and ADR bodies keep their original requirements as history; this policy governs future work and does not claim their browser gaps were verified.

## Consequences

CI is smaller and faster. Browser integration, auth flows, routing, pointer gestures, accessibility, and visual regressions lose automated coverage and rely on manual testing. Unit/component coverage remains. No runtime safeguard is removed.

## Alternatives considered

- Keep or stabilize the browser suite: not selected by the human.
- Remove all automated tests: out of scope; other gates remain.
- Remove shared auth/database fixtures with the E2E helpers: rejected; retained unit tests need them.

## Revisions

- 2026-11-21: Rewritten to goal-level form; removed the separate milestone-completion clause (completion = human code review accepted); plan and PR links dropped.
