# ADR 0052: jscpd and Knip code-quality gates

- Status: Accepted
- Date: 2026-10-10
- Supersedes: None
- Superseded by: None

## Context

The existing local and CI quality checks did not detect newly introduced exact code clones or unused files, exports, and dependencies. M39 adds both checks to the existing quality workflow without broad refactoring or a new workflow.

The initial jscpd scan found 119 exact-clone findings in the selected source directories, represented by 117 unique fingerprints in the baseline. Knip also identified a small set of clearly unreferenced code and dependencies, plus a direct `h3` import that was only available transitively through Nuxt/Nitro.

## Decision

- Use exact clone detection through jscpd, scanning `app/`, `server/`, `shared/`, `scripts/`, and `tests/` for JavaScript, JSX, TypeScript, TSX, and Vue. Keep the 50-token and 5-line minimums. Commit a reviewed `.jscpd-baseline.json` and fail on newly introduced clones; baseline updates are explicit and reviewed, never automatic in CI.
- Use Knip's comprehensive analysis and detected Nuxt, Vitest, and Playwright integrations. Explicitly include `scripts/migrate.mjs`, which is invoked by the Docker runtime. Keep the exact `ignoreDependencies` exceptions in `knip.json`: `@iconify-json/lucide` is consumed through Nuxt Icon's local icon collection, and `vue-tsc` is invoked through `nuxt typecheck`.
- Declare `h3@1.15.11` as a direct runtime dependency rather than suppressing Knip's finding, because application server modules import it directly. This exact version was already resolved transitively by Nuxt/Nitro; the user approved this scope amendment on 2026-10-10.
- Supply a placeholder `DATABASE_URL` to the Knip script so Drizzle configuration can load without connecting to a database.
- Run both checks through package scripts and the existing GitHub Actions quality job. Do not add a global duplication threshold, broad Knip suppressions, retries, or another workflow.

## Consequences

- Existing duplication is documented as baseline debt; new exact clones fail the check. The current baseline should be changed only after reviewing the clone report and proposed diff.
- Knip catches unused code and undeclared dependencies while retaining two exact, documented framework exceptions. Revisit these exceptions if Nuxt's integration changes.
- Knip's placeholder database URL is configuration-only and must not be used for migrations or application execution.
- Removing the unused `TicketEstimate.vue`, unreferenced schema type aliases, and unused exports does not alter application behavior. `@nuxt/test-utils` was removed because it was not used by the current test setup.
- New checks add local and CI runtime; future framework/test setup changes may require narrowly scoped Knip entry or exception updates.

## Alternatives considered

- Use a global jscpd percentage: not chosen because it would not distinguish newly introduced clones from existing duplication and would fluctuate with source size.
- Compare against Git history at CI runtime: not chosen because it would require deeper history and complicate the existing workflow.
- Remove all existing clone findings before enabling the gate: not chosen because it expands this tooling milestone into broad refactoring.
- Broadly ignore Knip findings or ignore `h3`: not chosen because this would hide real unused code or an undeclared direct dependency.
- Add a second CI workflow: not chosen; the existing quality job remains the single CI gate.

## Links

- [M39 milestone plan and implementation evidence](../milestones/m39-jscpd-knip-code-checks.md)
- [Repository roadmap](../../PLAN.md)
- [`jscpd` configuration](../../.jscpd.json) and [baseline](../../.jscpd-baseline.json)
- [Knip configuration](../../knip.json)
- [Package scripts and dependencies](../../package.json)
