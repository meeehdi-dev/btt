# Workflow review report

> M46 relocation: `.pi/reviews/reports-filter-loading-layout-stability-20261016T142702Z.md` → `reviews/reports-filter-loading-layout-stability-20261016T142702Z.md`. Repository references now use relocated homes; observations, commands, verdicts, timestamps, and approvals retain their historical meaning. Any embedded hashes describe pre-relocation bytes, not current checksums. No historical checks were rerun.

- Created: 2026-10-16T14:28:04.141Z
- Project: /Users/mehdi/code/btt
- Plan reference: /Users/mehdi/code/btt/plans/reports-filter-loading-layout-stability.md
- Scope: All current uncommitted staged, unstaged, and untracked changes on main at HEAD 57a8f7f10bf1ded6cc694af1d280a5b825fa75bc, evaluated primarily against plans/reports-filter-loading-layout-stability.md and the active M45 approval/amendment records. Observed 14 modified tracked files, no staged changes, and 31 untracked files. No branch/base override.
- Verdict: no-findings
- Comparison: uncommitted

No actionable findings within the reviewed scope.

# M45 Reports filter-loading layout stability — independent review

- Created: 2026-10-16T14:27:02Z
- Project: `/Users/mehdi/code/btt`
- Branch / HEAD: `main` / `57a8f7f10bf1ded6cc694af1d280a5b825fa75bc`
- Primary plan: `plans/reports-filter-loading-layout-stability.md`
- Scope: all current uncommitted staged, unstaged, and untracked changes

## What this change does

The M45 work adds an authenticated Reports page and owner-scoped time-allocation API. The focused layout amendment reserves the prior summary and results heights while a real filter request is pending, while continuing to hide old report values. It adds a browser regression for held and superseding requests; M45's earlier implementation, tests, and records are also part of this uncommitted review scope.

## Summary and verdict

**No actionable findings within the reviewed scope.**

The layout reservations are captured before filter, period, or grouping changes, remain in place while the request is pending, and are released when a read settles. The regression holds real owner-scoped responses and checks both stable geometry and stale-value suppression. This is a bounded no-findings result, not human code acceptance or a claim that every behavior is independently verified.

## Inputs and reproducible scope

- Review timestamp: **2026-10-16T14:27:02Z**.
- Observed branch/HEAD: `main` at `57a8f7f10bf1ded6cc694af1d280a5b825fa75bc`.
- Worktree: **14 modified tracked files, no staged changes, and 31 untracked files**. Git status, tracked diff, staged diff, and untracked paths were inspected at the start and after checks; the non-ignored scope stayed unchanged. No branch comparison replaced this uncommitted review.
- Primary reference, read completely: `plans/reports-filter-loading-layout-stability.md`. The plan describes itself as proposed; the M45 journal records that the user selected it for Build and authorized implementation, without inferring a separate Plannotator approval or human code acceptance.
- Governing and related inputs read: `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`, `docs/milestones/m45-reports-time-allocation.md`, Proposed `docs/decisions/0061-reports-time-allocation.md`, `plans/m45-reports-review-fixes.md`, `plans/m45-reports-response-range-fix.md`, `plans/m45-reports-verification-fixes.md`, `plans/reports-discovery.md`, `plans/dev-server-cache-recovery.md`, and the three prior M45 review reports under `reviews/`.
- Reviewed implementation and test files: `app/pages/reports.vue`, `app/utils/reports.ts`, `app/utils/calendar-date.ts`, `app/composables/useHierarchyFilters.ts`, `server/api/reports/index.get.ts`, `server/domain/reports.ts`, `shared/date-only.ts`, `shared/report-period.ts`, `shared/reports.ts`, `shared/agenda-week.ts`, `tests/e2e/reports-loading/interactions/boundary/period-state coverage and helpers`, all four report unit-test files, and the changed Agenda/auth-shell/search/invalidation test sections. Also inspected the relevant dashboard, invalidation resource map, Settings modal callers, and date-only interfaces.
- The remaining untracked plans/reports are intentional workflow handoff inputs, not application code to ship. The expected workload is the project's solo-user tracker; this was not a load audit.
- No browser server was listening on the checked local ports during Review. No unrelated committed history, production deployment, live OAuth, or production data was reviewed.

## Plan compliance

- **RFL-01 — Stable vertical footprint:** `app/pages/reports.vue:99-118` measures separate summary/results heights only while a current successful response is displayed. Filter, period, row, and grouping handlers reserve before changing their key inputs. The new `tests/e2e/reports-interactions.test.ts` scenario compares summary, results, grouping, filter, and toolbar bounds before and during held reads, with a 1 CSS-pixel tolerance.
- **RFL-02 — No stale values:** `displayedReport` becomes null while pending or failed (`app/pages/reports.vue:93-97`), so the old summary/results subtree is removed rather than hidden in the accessibility tree. The regression checks `aria-busy`, the loading message, absent totals/rows/estimate text/shares, and a readable, searchable, clearable selected filter.
- **RFL-03 — Correct replacement:** the test uses `route.fetch()` to obtain actual API responses before holding browser delivery. It supersedes a selected-client response with a selected-project response, releases the earlier response first, then checks the active response's filtered total/row, absence of the outside fixture, and removal of both temporary `min-height` styles.
- **RFL-04 — First load and errors:** no reservation is captured unless `displayedReport` is successful, so initial loading retains its existing compact presentation. The page retains its current error/retry handling; the existing Reports error/retry and response-transition tests remain in scope. Browser execution was not repeated in this Review, as detailed below.
- **RFL-05 — Superseded reads:** the test proves the selected-client response is already held when the project-grouping response starts. When the earlier response settles while the project response remains pending, it checks that the busy state and original geometry reservation remain; final visible rows are from the current project response.
- **RFL-06 — No product/data changes:** the focused amendment changes the Reports page, its interaction regression, and the M45 journal; it does not change the Reports endpoint, SQL, response contract, schema, dependencies, or global loading behavior. The broader uncommitted M45 API and data model were reviewed as the previously approved feature scope, not mistaken for changes introduced by this layout amendment.
- **RFL-07 — Honest handoff:** the M45 journal records the amendment authorization, real-request geometry reproduction, exact Build verification and server/database cleanup. ADR 0061 remains Proposed and M45 remains open. The current amendment's human code review remains a separate gate.

## Prioritized actionable findings

None.

## Possible remedies and regression checks

No code remedy is proposed. Keep the real held-filter regression and separate summary/results reservations. The targeted test and complete final E2E suite remain the right browser checks after any later changes; do not weaken the assertions or reveal stale values to avoid layout movement.

## Separate out-of-scope concerns

- The accepted `ticket.updatedAt` completion-time proxy can move estimate cohorts after a later ticket edit/archive. This is a documented M45 limitation, not a new finding.
- `pnpm lint` still reports two existing `consistent-function-scoping` warnings in `tests/e2e/ticket-context-popovers.test.ts:254,257`; no new lint errors were found.
- The other Agenda test/helper changes in the uncommitted worktree are documented as earlier M45 verification fixes. This amendment does not change Agenda or Ticket Board loading behavior.

## Verification

All repository checks were run through `workflow_check` from the project directory. The non-fixing Oxfmt, Oxc lint, duplicate, unused-code, typecheck, and test commands were inspected as existing package scripts/configuration before execution.

- `pnpm format:check` — **exit 0**, all 394 matched files formatted.
- `pnpm lint` — **exit 0**, only the two existing warnings noted above.
- `pnpm check:duplicates` — **exit 0**, 96 existing clones, zero new clones under the unchanged strict baseline.
- `pnpm check:unused` — **exit 0**.
- `pnpm typecheck:tsgo` — **exit 0**.
- `pnpm typecheck` — **exit 0**, canonical Nuxt/Vue typecheck.
- `pnpm check:workflow` — **exit 0**.
- `pnpm exec vitest run --exclude tests/unit/auth-session.test.ts` — **exit 0**, 19 files / 108 tests. The excluded auth-session test creates/deletes real database fixtures; no isolated database was available, so it was not run.
- `/usr/bin/env TZ=UTC pnpm exec vitest run tests/unit/report-navigation.test.ts tests/unit/report-period.test.ts` — **exit 0**, 2 files / 18 tests.
- `/usr/bin/env TZ=America/Los_Angeles pnpm exec vitest run tests/unit/report-navigation.test.ts tests/unit/report-period.test.ts` — **exit 0**, 2 files / 18 tests.
- `pnpm build` — **exit 0**, Nuxt/Nitro production build completed. Rolldown emitted plugin-timing warnings; no build error occurred.
- `git diff --check` — **exit 0**.

**Not run:** the focused layout browser test, the Reports/Settings/invalidation suites, full Playwright, migrations, and live 1280px keyboard/visual review. Playwright requires an isolated database and a running app server; none was available, and Review did not start services or run migrations. The M45 journal reports a separate Build run of the focused regression (**1/1**), all Reports files (**17/17**), Settings/invalidation (**10/10**), and full Playwright (**69/69**, one worker, zero retries), plus agent visual checks. Those are historical Build evidence, not independent Review results.

No non-ignored worktree changes were observed after checks. `pnpm build` regenerated ignored Nuxt/build output under `.output` and `node_modules/.cache/nuxt/.nuxt`. No server, database, or container was started, stopped, or changed. No migration or database fixture write was performed. No check failure or fingerprint warning was reported.

## Next Plan handoff

No corrective Plan is required from these automated findings. The next gate is the separate human Plannotator review of this Git target; this report does not constitute approval. A fresh agent should recheck HEAD and the worktree, retain the response-authoritative report display and pending layout reservations, and rerun the existing focused/full browser checks against a safely owned server and isolated database if further implementation changes are made. Keep ADR 0061 Proposed and M45 open until their separate human decisions are recorded.

Not checked: fresh browser execution and live keyboard/visual behavior, because an isolated database/server was unavailable in Review.
