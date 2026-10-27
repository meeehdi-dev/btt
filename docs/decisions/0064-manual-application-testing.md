# ADR 0064: Human manual application testing instead of E2E

- Status: Accepted
- Date: 2026-10-27
- Supersedes: [ADR 0041](0041-ci-e2e-failure-diagnostics.md), [ADR 0050](0050-e2e-verification-and-server-handoff.md), and browser-verification/verification-server clauses only of [ADR 0062](0062-pi-workflow-modes-and-artifact-locations.md).
- Superseded by: None

## Context

The human requested removal of all E2E tests and supporting tooling, choosing to test application behavior manually from now on. The cleanup and workflow/dependency/CI changes were explicitly approved in Plannotator `pn-471e98` through the linked plan. This accepts the testing-policy decision, not the implementation diff or milestone completion.

## Decision

- Remove the entire E2E suite, Playwright configuration and direct dependencies, browser CI installation/execution/diagnostic steps, and obsolete E2E-only configuration. Do not introduce a replacement browser framework.
- Preserve unit/component tests, shared Better Auth test utilities, database migrations and CI database support, format/lint, duplication/unused-code checks, both typechecks, build, and workflow checks. All approved retained automated checks must pass on the final worktree before review handoff.
- The human owns manual application testing. Agents record only actual human-reported results and leave unperformed cases pending; automated checks and optional agent UI observations do not establish human manual acceptance.
- No automated browser suite or agent-owned verification app server is required. Track and clean up agent-owned verification resources and verify released ports. Never manage a user-owned server without permission; optional UI continues using a separately user-managed running app.
- Preserve approval gates, first-failure evidence, and all other workflow governance. Do not conceal failed retained checks through retries or timeout increases. Human code acceptance and explicit milestone completion remain separate decisions.
- Earlier plans, milestone records, reports and ADR bodies retain their original requirements/results as history. This policy governs future work, including future changes to features documented in those records; it does not retroactively claim their browser gaps were verified.

## Consequences

CI becomes smaller and faster, and browser fixtures/readiness maintenance disappears. Browser integration, authentication flow, routing, pointer gestures, accessibility, and visual regressions lose automated coverage and depend on human manual testing. Unit/component coverage remains, including database-backed authentication tests. No runtime safeguards or application behavior are removed merely because browser coverage is gone.

## Alternatives considered

- Keep or stabilize the browser suite: not selected; the human explicitly chose manual application testing.
- Remove all automated tests: outside scope; unit/component tests and other quality gates remain.
- Remove shared auth/database fixtures with the E2E helpers: rejected because retained unit tests still require them.

## Links

- [Approved cleanup plan](../../plans/remove-e2e-tests.md)
- [M48 implementation and verification](../milestones/m48-remove-e2e-tests.md)
- [Canonical workflow](../llm-workflow.md)
- [Agent instructions](../../AGENTS.md)
