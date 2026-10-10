# M39 — Add jscpd and Knip code-quality gates

> **Plan status:** Complete. Plan approval: Plannotator `pn-9bdde1`; code review: Plannotator `pn-7db129`; human completion declaration recorded on 2026-10-10.

## Context

The user requested adding jscpd and Knip to the repository's code-checking workflow.

Observed repository facts:

- `package.json` has pnpm scripts for Oxc formatting/linting, Nuxt and tsgo typechecks, unit/E2E tests, build, and workflow documentation checks; it has no duplication or unused-code checks.
- `.github/workflows/check.yml` runs one existing `Check` quality job. It performs format, lint, both typechecks, tests, E2E, build, and workflow checks after a frozen pnpm install and database migration.
- `README.md` lists the same local quality commands. The package manager is pinned to pnpm 12.8.1; local Node/pnpm are 24.21.0/12.8.1.
- Knip's official Nuxt, Vitest, and Playwright plugins recognize this project's framework/test tools from `package.json` and provide default config/entry patterns. Start with those defaults; add project-specific configuration only for findings that demonstrate a real gap.
- jscpd v5 uses a Rust engine, reports exact clones by default, and offers a committed fingerprint baseline to fail only on newly introduced clones. This avoids both an arbitrary global duplication percentage and requiring a deeper Git checkout in the existing CI workflow.

Research: reviewed the official [jscpd v5 migration guide](https://jscpd.dev/project/migration), [configuration](https://jscpd.dev/reference/config-file), [baseline guide](https://jscpd.dev/guides/baseline), [Knip configuration](https://knip.dev/reference/configuration), [Nuxt plugin](https://knip.dev/reference/plugins/nuxt), [Vitest plugin](https://knip.dev/reference/plugins/vitest), [Playwright plugin](https://knip.dev/reference/plugins/playwright), and [Knip issue-handling guide](https://knip.dev/guides/handling-issues). The jscpd maintainer skill and Knip maintainer's configuration skill were also reviewed; no optional MCP server or agent-side service is proposed.

## Approved scope

**Approved via Plannotator session `pn-9bdde1`.**

- Add exact-pinned jscpd and Knip development dependencies, after rechecking compatibility with Node 24 and pnpm 12.8.1. The current research candidates are `jscpd@5.4.1` and `knip@6.41.0`; do not silently substitute newer major versions or change unrelated dependencies.
- Add a local `check:duplicates` command and configure jscpd to scan application, server, shared, script, and test source (`app/`, `server/`, `shared/`, `scripts/`, `tests/`), including TypeScript/JavaScript and Vue SFC code where supported. Use exact-clone detection only, with the documented 50-token/5-line minimums. Establish and commit `.jscpd-baseline.json` from the reviewed current code, then fail on any newly introduced clone. Do not add automatic baseline updates to CI.
- Add a local `check:unused` command using Knip's comprehensive default analysis, including test and configuration code. Use its Nuxt/Vitest/Playwright integrations and refine entry/project configuration only when findings demonstrate a missing framework convention. Do not mask findings with broad ignore patterns.
- Add both gates to the existing GitHub Actions quality job and list them in the README's local quality commands. Do not create a second workflow or alter retries, workers, timeouts, action versions, or application runtime behavior.
- Resolve only clearly verified configuration gaps and unambiguously unused code needed to make the initial checks pass. Pause for renewed human approval if a finding would require behavior-risking removals, broad cleanup, or a broad suppression policy.
- Record the durable gate/baseline policy in a proposed ADR 0052 and index it. Update `PLAN.md` with the M39 goal/status after plan approval and implementation; preserve prior milestone history.

## Approved scope amendment — direct h3 dependency (2026-10-10)

During implementation, Knip identified seven direct imports from `h3` as unlisted. `pnpm why h3` confirmed that Nuxt/Nitro already resolved `h3@1.15.11` transitively. Before adding it, the user approved declaring this exact version as a direct runtime dependency in chat. The lockfile resolution is unchanged; this makes the existing direct runtime imports explicit rather than suppressing Knip's finding.

## Out of scope

- Changes to product behavior, APIs, database schema/migrations, authentication, deployment, or Node/pnpm baselines.
- Broad refactoring, deleting code based only on a tool report, or suppressing findings with blanket ignore patterns.
- Enabling renamed/normalized/similar-code jscpd modes as CI gates; these are noisier and outside the requested exact-duplication gate.
- Installing `@knip/mcp`, other MCP servers, global CLIs, or additional CI workflows/actions.
- Triggering remote CI, pushing, or deploying.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- `docs/decisions/0001-llm-assisted-development-workflow.md` — plan approval, evidence, and human review.
- `docs/decisions/0034-pnpm-v12-package-manager.md` — exact pnpm baseline and strict build-script policy.
- `docs/decisions/0041-ci-e2e-failure-diagnostics.md` — preserve first-attempt CI failures and diagnostics.
- `docs/decisions/0017-release-usage-and-ticket-detail-polish.md` — Nuxt Icon package integration.
- `docs/decisions/0050-e2e-verification-and-server-handoff.md` — full local checks and server handoff.
- `docs/milestones/m0-project-bootstrap.md` — records why `@nuxt/test-utils` was not retained.
- `package.json`, `pnpm-lock.yaml`, `.github/workflows/check.yml`, `README.md`
- Official tool references linked in Context above.

## Approach

1. Recheck the proposed package versions, Node 24 compatibility, release notes, and install/build scripts. Add only the approved exact dev dependencies using pnpm 12.8.1; preserve the exact-version `allowBuilds` policy and ask before adding any new build-script permission. The separately approved `h3@1.15.11` direct runtime dependency is recorded above.
2. Run jscpd once against the selected tracked source directories and inspect its exact-clone report. Commit the initial fingerprint baseline only after reviewing the reported clone count/locations. Configure the regular command to use that baseline and fail on new clones; reviewers can then see deliberate baseline changes in diffs.
3. Run Knip in comprehensive mode. Start with its detected Nuxt/Vitest/Playwright defaults, use configuration hints and findings to validate entry/project coverage, and address the most foundational finding categories first (files, then exports/dependencies). Add only narrowly justified configuration exceptions; do not suppress whole source areas.
4. Add `check:duplicates` and `check:unused` scripts, invoke both in the existing CI quality job before the test suite, and document their local commands. Keep the existing workflow shape and failure-diagnostics behavior.
5. Add the proposed ADR and M39/roadmap evidence, then run all approved local checks—including the full E2E suite—on the final worktree. Submit the complete diff for human code review; do not report completion until the human declares M39 complete.

## Files to modify

- `package.json` — exact-pinned dev dependencies, direct `h3` runtime dependency, and local check scripts.
- `pnpm-lock.yaml` — only resolutions required for those additions.
- `.jscpd.json`, `.jscpd-baseline.json` — scoped exact-clone settings and reviewed initial baseline.
- `knip.json` — explicit Docker runtime entry and exact, documented dependency exceptions for Nuxt-managed uses.
- `.github/workflows/check.yml` — run both new gates in the existing quality job.
- `README.md` — document the two local checks.
- `PLAN.md` — add the approved M39 goal and final status.
- `docs/decisions/0052-jscpd-knip-quality-gates.md`, `docs/decisions/README.md` — record/index the accepted policy after code review.
- `docs/milestones/m39-jscpd-knip-code-checks.md` — implementation journal, verification, review, and closeout.
- `app/components/TicketEstimate.vue` — removed after Knip and repository-wide searches confirmed no use.
- `app/composables/useHierarchyFilters.ts`, `server/db/index.ts`, `server/domain/schemas.ts`, `server/domain/time-entries.ts`, `server/utils/effect-handler.ts`, and `shared/agenda-week.ts` — removed unused exports/type aliases while retaining their internal logic.

The approved plan anticipated no application-source changes. The initial Knip report justified these behavior-preserving removals of clearly unreferenced code; no broader cleanup was undertaken. The direct `h3` dependency was separately approved as recorded above.

## Reuse

- Reuse the existing `package.json` check-script conventions and the single `.github/workflows/check.yml` quality job.
- Reuse pnpm 12.8.1, frozen-lockfile installs, Node 24, and pnpm's strict version-specific build-script permissions from ADR 0034.
- Reuse Knip's auto-detected Nuxt/Vitest/Playwright integration before adding manual entries.
- Reuse the established local quality command list in `README.md`; do not create parallel CI or test infrastructure.

## Decisions and ADR links

- ADR 0001 requires human plan approval before implementation, evidence-backed verification, and human code review.
- ADR 0034 remains authoritative for package-manager and install-script policy; this plan proposes no broader allowance.
- ADR 0041 remains authoritative for no automatic E2E retries and failure diagnostics.
- Durable decision: the exact-clone jscpd baseline gate and comprehensive Knip gate are recorded in accepted ADR 0052.

## Implementation checklist

- [x] Human approves this M39 plan in Plannotator before implementation (`pn-9bdde1`).
- [x] Confirm exact candidate versions, Node compatibility, package metadata, and install scripts; no unapproved build-script permissions.
- [x] Add the scoped exact-clone check and review the initial baseline; verify it passes with no new clones.
- [x] Configure and pass comprehensive Knip analysis without broad issue suppressions.
- [x] Add both checks to package scripts, the existing CI job, and README.
- [x] Add proposed ADR 0052, update its index, and update the roadmap/M39 evidence.
- [x] Run frozen installation and all approved local gates, including full E2E and build, on the final worktree; all passed.
- [x] Submit the complete diff for human code review; Plannotator approved with no changes requested.
- [x] Record the human M39 completion declaration before closeout (`i declare this milestone complete.`; 2026-10-10).

## Journal

### Planning research

- Fact: `package.json`, `.github/workflows/check.yml`, `README.md`, pnpm configuration, project instructions, workflow, roadmap, and relevant package-manager/CI decisions were inspected. No implementation files were changed during planning.
- Fact: local `node --version` returned `v24.21.0`; `pnpm --version` returned `12.8.1`.
- Fact: official documentation describes jscpd v5 exact clone detection and fingerprint baselines; Knip documents automatic Nuxt, Vitest, and Playwright integrations when the corresponding packages are present.
- Fact: planning candidate package versions from registry research are jscpd 5.4.1 and Knip 6.41.0; versions and compatibility must be reconfirmed before installation.
- Decision proposed: use a committed clone fingerprint baseline to block newly introduced exact clones while allowing reviewed existing duplication; use Knip's comprehensive default mode with narrowly corrected framework configuration rather than a broad allowlist.
- Decision: the human approved the proposed baseline strategy and finding-cleanup boundary via Plannotator session `pn-9bdde1`.
- Evidence: `git status --short --branch` was clean before drafting; no dependency installation, test, CI run, or source edit was performed for planning.

### Plan approval

- Decision: M39's plan was approved via Plannotator session `pn-9bdde1`. Implementation began on 2026-10-10 after the user's instruction to proceed.
- Evidence: Plannotator approval message received in this conversation.

### Implementation — 2026-10-10

- Confirmed the exact `jscpd@5.4.1` and `knip@6.41.0` versions against npm metadata; both support Node 24.21.0 (`jscpd` requires Node >=18; Knip requires `^20.19.0 || >=22.12.0`). jscpd declares no npm lifecycle scripts and provides optional prebuilt platform binaries; Knip declares no install/postinstall script. jscpd 5.4.1's official release notes are dated 2026-10-09; no GitHub release page for Knip 6.41.0 was available in search, so its published package metadata was used to verify the exact version/engine/scripts. Installed both exact dev dependencies with pnpm 12.8.1 without adding a build-script permission. `pnpm remove --save-dev @nuxt/test-utils` removed an unused dev dependency; pnpm ran the already-authorized `vue-demi` postinstall.
- `pnpm add --save-exact h3@1.15.11` was run only after the user's scope approval. `pnpm why h3` showed Nuxt/Nitro already resolved this version; no new package version was introduced.
- Compared package name/version identifiers in `pnpm-lock.yaml` before and after: no existing package versions changed. Additions are the approved tools and their transitive/optional platform dependencies; removals are `@nuxt/test-utils` and its now-unused transitive packages. pnpm also refreshed peer-context snapshot keys.
- Configured `.jscpd.json` for the approved source paths, exact clone mode, 50-token/5-line minimums, and generated `.jscpd-baseline.json` from the initial scan. The initial report contained 119 clone findings (117 unique fingerprint entries, 1276 duplicated lines, 5.21%); the baseline is stored as an explicit source artifact and is not automatically regenerated by checks.
- Added the local `check:duplicates` script and confirmed `pnpm check:duplicates` passes against the baseline. A temporary pair of identical JavaScript files under `scripts/` caused the command to exit 1 with `Found 120 clones (1 new)`; after removing those probes, the command passed with the existing 119 clones and no new clone.
- Knip's first run identified `scripts/migrate.mjs` (referenced by Docker but not inferred as an entry), an unused component, unused export/type declarations, unused `@nuxt/test-utils`, two framework-provided dependencies, and direct undeclared `h3` imports. Added the Docker runtime entry to `knip.json`; retained only exact exceptions for `@iconify-json/lucide` (Nuxt Icon local collection) and `vue-tsc` (used through `nuxt typecheck`). Removed `app/components/TicketEstimate.vue`, unreferenced schema aliases, and unused export modifiers; removed `@nuxt/test-utils` per the M0 follow-up and absence of current use.
- Knip requires `DATABASE_URL` while loading `drizzle.config.ts`; `check:unused` supplies an inert local placeholder and does not connect to a database. After the approved `h3` dependency declaration, `pnpm check:unused` passes with no findings.
- Updated the existing CI job, README quality command list, roadmap, proposed ADR 0052, and ADR index. The user-approved Plannotator code review later accepted ADR 0052. No new workflow, app feature, schema change, or broad suppression was added.
- E2E evidence: the first local full run used Playwright's default 6 workers and passed 47/48 tests; the week-gesture test failed waiting for a `15:00–16:00` creation preview. The agent-owned server remained running. Trace/error-context inspection showed no preview element; server logs also contained hydration/ResizeObserver diagnostics, but no causal link was established. The same test passed in a focused one-worker run (4.6s), then the full suite passed 48/48 with `--workers=1 --retries=0` in 2.8 minutes, matching the documented M38 local verification mode. No E2E test, worker setting, retry, or timeout was changed. Hypothesis: the failure is sensitive to parallel load; this was not proven, so the original failure is preserved as evidence rather than dismissed as a confirmed flake.

## Verification

Planning-artifact checks before Plannotator submission:

- [x] `node scripts/check-workflow-docs.mjs` — passed.
- [x] `pnpm exec oxfmt --check docs/milestones/m39-jscpd-knip-code-checks.md` — passed.
- [x] `git diff --check` and `git diff --no-index --check /dev/null docs/milestones/m39-jscpd-knip-code-checks.md` — no whitespace findings; the no-index check returned its expected “files differ” status.

Implementation verification (after plan approval):

- [x] `pnpm install --frozen-lockfile` — passed under pnpm 12.8.1; the lockfile was up to date and supply-chain policy checks passed.
- [x] `pnpm check:duplicates` — passed with 119 existing findings; a two-file probe failed with one new clone as expected, and the clean rerun passed.
- [x] `pnpm check:unused` — passed comprehensive analysis with only exact, documented framework dependency exceptions.
- [x] `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/btt_m39 pnpm db:migrate` — passed against the agent-owned isolated PostgreSQL 17 container.
- [x] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, `pnpm build`, `pnpm check:workflow`, and `node scripts/check-workflow-docs.mjs` — passed; Vitest reported 15 files / 77 tests. Build completed with informational `PLUGIN_TIMINGS` warnings only.
- [x] Full E2E: `CI=true ... pnpm test:e2e --workers=1 --retries=0 --reporter=line` — 48/48 passed in about 3 minutes on the final implementation. The default six-worker run had one failure; see the journal above. The focused failing test passed separately with one worker.
- [x] Oxfmt's full-repository `pnpm format:check` parsed the modified GitHub Actions YAML; `pnpm check:workflow` and `node scripts/check-workflow-docs.mjs` passed. No remote CI was triggered.
- [x] E2E used isolated database `btt_m39` on port 55432 and agent-owned Nuxt dev server on port 3000 per ADR 0050. Both remained running through diagnosis/checks and were stopped only after all checks passed; port release is verified in the server-handoff journal below.

### 2026-10-10 — final verification and server handoff

- Fact: on the final implementation worktree, frozen installation, migration, formatting, lint, jscpd, Knip, both typechecks, unit tests, build, workflow checks, documentation checks, and the full 48-test E2E suite passed. E2E used one worker and zero retries; the separate default-six-worker failure is retained above.
- Fact: after all checks passed, sent `SIGTERM` to the agent-owned Nuxt process tree (PIDs 65832, 65834, 65835, 65848). `ps` showed no remaining processes and `lsof -nP -iTCP:3000 -sTCP:LISTEN` showed no listener.
- Fact: stopped only the agent-owned PostgreSQL container `btt-m39-postgres-20261010-pi`; `lsof -nP -iTCP:55432 -sTCP:LISTEN` showed no listener. User-owned services/tunnels on other ports were left untouched.
- Status: local verification and server handoff are complete. M39 remains open only until the human completion declaration.

### 2026-10-10 — Plannotator code review

- Decision: Plannotator session `pn-7db129` approved the changes with no changes requested.
- Status: human code review is accepted. M39 remained open pending the human completion declaration recorded below.

### 2026-10-10 — Human completion declaration

- Decision: the user declared, `i declare this milestone complete.`
- Status: M39 is complete; implementation evidence, required checks, code review, and human declaration are recorded.

## Review status

- Plan review: Approved via Plannotator session `pn-9bdde1`.
- Code review: Accepted via Plannotator session `pn-7db129` on 2026-10-10; no changes requested.
- Milestone completion declaration: Recorded on 2026-10-10 via the user's explicit declaration.

## Follow-ups

- No remaining follow-ups. The default six-worker E2E failure and successful full one-worker run are documented; no test, worker, retry, or timeout change was made.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in the journal and review status.
