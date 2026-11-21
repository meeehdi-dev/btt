# ADR 0052: Code-quality gates for duplication and unused code

- Status: Accepted
- Date: 2026-10-10
- Supersedes: None
- Superseded by: None

## Context

Formatting, lint, typecheck, test, and build checks did not catch newly introduced exact code clones or unused files, exports, and dependencies. Existing duplication was too large to remove before enabling a gate, and code importing a package it did not declare was only working through a transitive dependency.

## Goal

Local and CI checks block new duplication and unused code or dependencies. Changes to the accepted baseline and exceptions are explicit and reviewed, never automatic.

## Decision

- Exact clone detection covers application, server, shared, script, and test sources with a fixed minimum clone size. Existing clones live in a committed, reviewed baseline; only newly introduced clones fail the check. Baseline updates happen only after reviewing the clone report and the proposed diff, never automatically in CI.
- Unused-code analysis covers files, exports, and dependencies, with explicit entry points for code run outside the framework (such as the migration script). Exceptions are few, narrow, and documented where configured; broad suppressions are not allowed.
- Code must declare every package it imports directly, rather than suppress the finding.
- Both checks run through package scripts and the single existing CI quality job. No global duplication percentage, retries, or second workflow.

## Consequences

Existing duplication is documented baseline debt; new clones fail. Exceptions should be revisited when framework integrations change. The checks add local and CI runtime, and framework or test setup changes may need narrowly scoped entry or exception updates. The placeholder database URL used by the unused-code script is configuration-only and must never be used for migrations or running the app.

## Implementation notes (non-binding)

- Tools: jscpd (`.jscpd.json`, `.jscpd-baseline.json`, `pnpm check:duplicates`) and Knip (`knip.json`, `pnpm check:unused`, which supplies a placeholder `DATABASE_URL` so Drizzle config loads). Current Knip exceptions are the Lucide icon collection and tooling invoked indirectly; the CI job is `.github/workflows/check.yml`.
- Baseline quality checks (format, lint, typecheck, tests, build) also run in that job, with frozen-lockfile installs. Canonical Nuxt/Vue typechecking stays mandatory; native TypeScript checking cannot replace it.

## Alternatives considered

- Global duplication percentage: does not separate new clones from old, and fluctuates with source size.
- Compare against Git history in CI: needs deeper history and complicates the workflow.
- Remove all existing clones first: turns a tooling change into broad refactoring.
- Broad Knip ignores: would hide real unused code or undeclared dependencies.
- Second CI workflow: the existing quality job stays the single gate.

## Revisions

- 2026-11-21: Rewritten to goal-level form; absorbed quality-baseline intent from ADR 0002; removed the `h3` version pin, finding counts, and tool-specific cleanup details from binding text.
