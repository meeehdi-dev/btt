# Upgrade all dependencies (November 2026)

## Context and references

Request: upgrade all dependencies. The previous upgrade (`30071fc`, PR #14) moved to Node 26 and set the 7-day release cooldown ([ADR 0065](../docs/decisions/0065-node-26-and-release-cooldown.md)). Related: [ADR 0060](../docs/decisions/0060-pnpm-dependabot-tracking.md) (pnpm as a tracked devDependency, exact `allowBuilds`), [ADR 0034](../docs/decisions/0034-pnpm-v12-package-manager.md), [ADR 0064](../docs/decisions/0064-manual-application-testing.md), and the history in [dependency-upgrade-review](dependency-upgrade-review.md).

**Facts** (`pnpm outdated`, `npm view <pkg> time`, 2026-11-20 ~20:45Z; the 7-day cutoff is 2026-11-13 ~20:45Z):

| Package                                        | Current | Target (newest ≥ 7 days old) | Newer, still in cooldown | Kind                   |
| ---------------------------------------------- | ------- | ---------------------------- | ------------------------ | ---------------------- |
| `better-auth` + `@better-auth/drizzle-adapter` | 1.7.14  | 1.7.22                       | 1.7.27                   | patch, auth            |
| `effect`                                       | 4.0.7   | 4.1.4                        | 4.1.5                    | **minor**, core        |
| `nuxt`                                         | 4.6.3   | 4.6.4                        | —                        | patch                  |
| `vue`                                          | 3.5.44  | 3.5.45                       | 3.5.46                   | patch                  |
| `vue-router`                                   | 5.4.0   | 5.5.1                        | —                        | minor                  |
| `vite`                                         | 8.3.5   | 8.3.8                        | —                        | patch                  |
| `@vitejs/plugin-vue`                           | 6.0.10  | 6.0.11                       | —                        | patch                  |
| `vitest`                                       | 5.0.5   | 5.1.0                        | 5.1.1                    | minor                  |
| `vue-tsc`                                      | 3.3.13  | 3.3.14                       | —                        | patch (typecheck risk) |
| `oxlint`                                       | 1.90.0  | 1.93.0                       | 1.94.0                   | minor (new rules)      |
| `oxfmt`                                        | 0.75.0  | 0.78.0                       | 0.79.0                   | pre-1.0 minor          |
| `knip`                                         | 6.43.0  | 6.45.1                       | 6.47.0                   | minor                  |
| `jscpd`                                        | 5.4.2   | 5.4.3                        | —                        | patch                  |
| `pnpm` (devDep, `packageManager`, CI, Docker)  | 12.16.1 | 12.20.0                      | 12.22.0                  | minor                  |
| `@types/node`                                  | 26.6.5  | 26.6.6                       | —                        | patch                  |
| `@iconify-json/lucide` (caret)                 | 1.2.148 | 1.2.154                      | 1.2.157                  | data                   |
| `@nuxt/ui`                                     | 4.12.0  | stays                        | 4.13.0 (2026-11-18)      | —                      |
| `@vue/test-utils`                              | 2.5.1   | stays                        | 2.6.0 (2026-11-15)       | —                      |
| `h3`                                           | 1.15.11 | stays (ADR 0065)             | 2.0.8                    | blocked                |
| `typescript`                                   | 6.0.3   | stays (ADR 0065)             | 7.0.2                    | blocked                |

Already latest: `drizzle-orm`, `drizzle-kit`, `pg`, `@types/pg`, `happy-dom`, `uuid`, `@internationalized/date`, `parse-duration-ms`, `@typescript/native-preview`.

**Decision (existing):** the 7-day cooldown and the h3 1.x / TypeScript 6.0.x holds from ADR 0065 stay in force. **Hypothesis:** all targets are drop-in; the Effect 4.0 → 4.1 minor and new oxlint rules are the most likely sources of check failures.

## Requirements and acceptance criteria

- R1: Every direct dependency listed above as a target is at that exact version (or a newer one that has aged past 7 days by Build time); exact-pin style is preserved (carets stay only where they already exist).
- R2: Transitive dependencies in `pnpm-lock.yaml` are refreshed within the cooldown; `pnpm install --frozen-lockfile` succeeds.
- R3: The pnpm version is identical in `package.json` (`devDependencies.pnpm` and `packageManager`), `.github/workflows/check.yml`, both `Dockerfile` install lines, and the `pnpm-workspace.yaml` `allowBuilds` entry (ADR 0060).
- R4: All retained automated checks pass on the final worktree without weakening tests, lint rules or baselines.
- R5: No application behavior change. Source edits are allowed only when a check fails because of an upgrade, and each one is recorded.

## Non-goals

- h3 2.x, TypeScript 7.x (blocked by ADR 0065).
- Versions still in cooldown (`@nuxt/ui` 4.13.0, `@vue/test-utils` 2.6.0, the newest patches listed above). Dependabot picks them up later.
- Overriding `minimumReleaseAge`, changing Node, Docker base image, Dependabot config, or GitHub Actions versions.
- Adding/removing dependencies, adopting new library features, refactors, or `.jscpd-baseline.json` growth.

## Approach

One branch, applied in small groups so a failing check points at one group. Use pnpm itself to choose versions so the cooldown is enforced by config, not by hand:

1. **pnpm first:** bump to 12.20.0 everywhere (R3), replace `pnpm@12.16.1: true` with `pnpm@12.20.0: true` in `allowBuilds`, install.
2. **Tooling:** `oxlint`, `oxfmt`, `knip`, `jscpd`, `vue-tsc`, `@types/node`, `@iconify-json/lucide`. Run format/lint/typecheck/unused/duplicates. If `oxfmt` reformats files, commit that formatting as its own reviewable change; if new oxlint warnings/errors appear, fix only trivial ones and list the rest for human decision instead of disabling rules.
3. **Framework/build:** `nuxt`, `vue`, `vue-router`, `vite`, `@vitejs/plugin-vue`, `vitest`. Run typechecks, tests, build.
4. **Runtime libs:** `effect` 4.1.4 (read its 4.1 changelog for breaking/deprecation notes first), then `better-auth` + adapter 1.7.22 together (read release notes for schema/migration notes).
5. **Transitive refresh:** `pnpm update` (no `--latest`) to refresh the lockfile within existing ranges and the cooldown.

Exact target versions are passed explicitly (`pnpm add -E <pkg>@<version>`), which keeps pins exact. If pnpm reports a build-script approval for a new package version (e.g. a new `esbuild`), stop and ask before adding it to `allowBuilds`.

## Files to modify

- `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`
- `.github/workflows/check.yml`, `Dockerfile` (pnpm version only)
- Source files only if a check requires it (R5), plus any `oxfmt` formatting output
- `docs/milestones/m50-dependency-upgrade.md` (new; plan link and evidence), `docs/milestones/README.md` / `PLAN.md` roadmap entry
- No new ADR expected; add one only if a hold or durable exception is decided.

## Reuse

Existing scripts and the CI contract in `.github/workflows/check.yml`; ADR 0060's exact-version `allowBuilds` pattern; the cooldown in `pnpm-workspace.yaml`.

## Steps

- [ ] Create M50 milestone file linking this plan.
- [ ] Re-run `pnpm outdated` and the age check; adjust targets only to versions that have aged in since this plan.
- [ ] Group 1: pnpm 12.20.0 (R3), install, `pnpm --version`.
- [ ] Group 2: tooling; run format/lint/typecheck/unused/duplicates.
- [ ] Group 3: framework/build; run typechecks, tests, build.
- [ ] Group 4: Effect 4.1.4, then Better Auth 1.7.22 pair; run full suite after each.
- [ ] Group 5: `pnpm update` transitive refresh; full suite.
- [ ] Review the lockfile diff for unexpected new packages or build scripts.
- [ ] Record commands, outcomes, deviations in M50; update roadmap.

## Verification

Automated, on the final worktree, against a disposable PostgreSQL container (agent-owned, removed afterwards; never the dev or production DB):

`pnpm install --frozen-lockfile`, `pnpm db:migrate`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm check:duplicates`, `pnpm check:unused`, `pnpm test`, `pnpm build`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, `git diff --check`. Optionally `docker build .` to confirm the Dockerfile pnpm line (only if Docker is available; image removed afterwards).

Manual (human-owned, pending): GitHub sign-in/sign-out and session persistence (Better Auth); board, ticket detail, agenda drag, and reports pages load and save (Effect/Nuxt/Vue); CI run on the PR passes.

## Risks and stop conditions

- **Effect 4.1:** API or type changes in the server HTTP boundary / client fetch boundary (ADRs 0023, 0024). Stop if the fix is more than mechanical.
- **Better Auth:** a release requiring a schema migration or auth config change → stop (schema/auth are high-impact).
- **vue-tsc:** previous patch regressions (3.3.12). If 3.3.14 breaks typecheck with no app error, hold at 3.3.13 and record it instead of changing templates.
- **oxlint/oxfmt:** new rules or formatting churn. No rule disabling without approval.
- **pnpm:** new `allowBuilds` requirements, or Docker/CI pin drift.
- Any check failure not clearly caused by one package → hold that package at current version, record, and ask.

## Finding disposition and open questions

No input findings.

- Q1: Include the minor `effect` 4.0 → 4.1 upgrade here, or split it into its own change? Recommendation: include, as group 4, with the hold-on-failure rule above.
- Q2: Wait for `@nuxt/ui` 4.13.0 and `@vue/test-utils` 2.6.0 to age in (2026-11-25 / 2026-11-22) and include them? Recommendation: no; leave them to Dependabot.

## Approval and fresh-session handoff

- Human plan approval: Approved in Plannotator session `pn-bf45c7` (2026-11-20), with no annotations; Q1 and Q2 therefore follow the recommendations above.
- Next mode: Build after approval. Build done; evidence in [M50](../docs/milestones/m50-dependency-upgrade.md).
- Absolute input: `/Users/mehdi/code/btt/plans/dependency-upgrade-2026-11.md`.
- Context: dependency-only upgrade under ADR 0065's 7-day cooldown and h3/TS holds; milestone M50; Git writes stay human-owned.
