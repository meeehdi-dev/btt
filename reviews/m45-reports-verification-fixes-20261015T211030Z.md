# Workflow review report

> M46 relocation: `.pi/reviews/m45-reports-verification-fixes-20261015T211030Z.md` → `reviews/m45-reports-verification-fixes-20261015T211030Z.md`. Repository references (including historical inventories) now use relocated homes; observations, commands, verdicts, timestamps, and approvals retain their historical meaning. Embedded hashes describe pre-relocation bytes, not current checksums. No historical checks were rerun.

- Created: 2026-10-15T21:12:23.702Z
- Project: /Users/mehdi/code/btt
- Plan reference: /Users/mehdi/code/btt/plans/m45-reports-verification-fixes.md
- Scope: Uncommitted staged, unstaged, and untracked changes against the supplied plan

# M45 Reports verification fixes — independent review

## What this change does

The uncommitted M45 work adds owner-scoped time-allocation Reports. This corrective amendment changes the retained-label race test to use the enabled Year control, shares three repeated browser workflows, and normalizes two expressly authorized historical Markdown inputs without changing production behavior.

## Summary and verdict

**No actionable findings within the reviewed scope.**

The prior R2 disabled-navigation deadlock is addressed without serializing the overlapping requests or changing application navigation. R3 is addressed through focused helper reuse; the unchanged duplication gate passes. The historical formatting exception is auditable and presentation-only.

This is a bounded review, not human code acceptance or an assertion that all behavior is correct. Independent static checks, database-free unit tests, both typechecks, and an isolated production build passed. Database-backed/browser tests were not rerun in this Review; the saved Build browser report was inspected separately and records 68 passes without skips or retries.

## Inputs and reproducible scope

- Repository: `/Users/mehdi/code/btt`.
- Observation window: 2026-10-15, approximately 21:02–21:10 UTC; report timestamp: **2026-10-15T21:10:30Z**.
- Branch: `main`; observed HEAD: `57a8f7f10bf1ded6cc694af1d280a5b825fa75bc`.
- Default worktree scope: **14 unstaged tracked files, no staged changes, and 28 untracked files/inputs**, before this report. Both tracked and staged diffs were inspected; every listed new file was read. No branch/base comparison replaced the worktree review.
- Primary reference, read completely: `plans/m45-reports-verification-fixes.md`.
- Other complete planning/handoff inputs: `plans/m45-reports-response-range-fix.md`, `plans/m45-reports-review-fixes.md`, `plans/reports-discovery.md`, `docs/milestones/m45-reports-time-allocation.md`, `reviews/m45-reports-response-range-20261015T193923Z.md`, and `reviews/m45-reports-time-allocation-20261015T151738Z.md`.
- Context: `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`, milestone/ADR conventions, relevant date/history, client-boundary, ordering, navigation, desktop, verification, invalidation, quality-gate, presentation, and Settings ADRs, and Proposed ADR 0061.
- Expected workload: the repository's solo-user work tracker; this was not a load/performance audit.

### Tracked files reviewed

```text
PLAN.md
app/composables/useHierarchyFilters.ts
app/layouts/dashboard.vue
app/utils/agenda-week.ts
app/utils/entity-icons.ts
docs/decisions/0035-three-block-header-navigation.md
docs/decisions/README.md
shared/agenda-week.ts
tests/e2e/agenda-week.test.ts
tests/e2e/auth-shell.test.ts
tests/e2e/client-effect-failures.test.ts
tests/e2e/data-invalidation.test.ts
tests/e2e/helpers/modal-actions.ts
tests/e2e/search.test.ts
```

### Untracked files and inputs reviewed

```text
reviews/m45-reports-response-range-20261015T193923Z.md
reviews/m45-reports-time-allocation-20261015T151738Z.md
app/pages/reports.vue
app/utils/calendar-date.ts
app/utils/reports.ts
docs/decisions/0061-reports-time-allocation.md
docs/milestones/m45-reports-time-allocation.md
plans/m45-reports-response-range-fix.md
plans/m45-reports-review-fixes.md
plans/m45-reports-verification-fixes.md
plans/reports-discovery.md
server/api/reports/index.get.ts
server/domain/reports.ts
shared/date-only.ts
shared/report-period.ts
shared/reports.ts
tests/e2e/helpers/api-records.ts
tests/e2e/helpers/current-date.ts
tests/e2e/helpers/reports.ts
tests/e2e/helpers/test-owner.ts
tests/e2e/reports-boundaries.test.ts
tests/e2e/reports-interactions.test.ts
tests/e2e/reports-period-state.test.ts
tests/e2e/reports.test.ts
tests/unit/report-filters.test.ts
tests/unit/report-format.test.ts
tests/unit/report-navigation.test.ts
tests/unit/report-period.test.ts
```

Plans/reports are handoff inputs, not application code to ship; their intentional untracked presence is not a defect.

Final status and tracked/staged diffs matched the initial scope. A repeated SHA-256 over the ordered 42 listed paths and their bytes remained `0fcacbfe98987e3d12bb5b289bd3e987aebd80ff4283ffb1fdbc1832af02be76` across verification.

### Amendment isolation and source equivalence

Read-only byte comparisons found identical `app/`, `server/`, `shared/`, `tests/`, package/lockfile, Playwright/Vitest/TypeScript/Knip/Oxc configuration, and duplication configuration/baseline between the worktree and both existing Build copies under:

```text
/var/folders/m3/t2gw7yt164v3ftd8w84yzztc0000gn/T/btt-m45-verify-f567ad6m
```

Those copies are `source/` and `checks/`. The documented scratch-only differences are the disposable environment, explicit real-path Nuxt build directory, and `verifyDepsBeforeRun: false`. Their dependency parent/cache is a real directory, not a whole-directory dependency symlink.

Comparison with the earlier `/tmp/btt-m45-range-nJjwGo/source` found differences in only the three authorized Reports test/helper files within application/server/shared/test sources. The production implementation and inspected manifests/configuration/baseline matched. This older scratch snapshot is supporting evidence, not a Git commit or an approval receipt.

Excluded from independent execution: database migrations, the real-database auth-session unit test, Reports API/browser tests, standalone Settings/invalidation browser suites, the full repository browser suite, live visual/keyboard interaction, hosted CI, OAuth, deployment, and production data. Unrelated committed application behavior was not audited.

## Plan compliance

- **VF-01 — Real overlapping label race:** `tests/e2e/reports-interactions.test.ts:179–270` first establishes a successful October Month response, holds the fixture-client Month response, and waits for the actual release callback before selecting Year. The failure decision is captured before waiting. The selected-client Year response fails while Month remains held. Readable/clearable selection assertions remain explicit. The inspected saved full-run stdout records `month loaded → month held → failed year → failed year → month settled`; the saved result passed in 1.964 seconds with retry 0. This is historical execution evidence, not a fresh browser run by this reviewer.
- **VF-02 — Unavailable-state behavior:** the race explicitly checks disabled Previous/Next during the held Month and failed Year states, safe unavailable text, hidden loaded totals/rows after failure, and no private error detail. `reports-period-state.test.ts` retains loading-state hidden-value assertions. No forced click or application navigation change was introduced.
- **VF-03 — Recovery/reconciliation:** `reports-interactions.test.ts:271–320` observes old-route settlement and preserves Year/error/label assertions before recovery. Real API rename/archive operations are followed by successful reads checked against 2026, 2025, and 2024 year starts. Archived/unavailable labels, no UUID display, clear behavior, and unconditional cleanup release remain covered.
- **VF-04 — Genuine reuse:** `tests/e2e/helpers/reports.ts:78–103` owns allocation-list-scoped release selection, Settings weekday choice returning before save, and parent-client clearing with all three placeholder assertions. Corresponding callers in both browser files preserve their distinct failure flags, tab handles, read/write counters, barriers, and individual child-clear coverage. Independent `pnpm check:duplicates` passes: 96 existing clones, zero new; no baseline/configuration change.
- **VF-05 — Auditable formatting exception:** both original archives exist, their hashes match the milestone, and direct before/after diffs change only Markdown table alignment/separator widths. Independent full formatting passes, including the immutable selected plan and current records. Details follow below.
- **VF-06 — No scope expansion/regression weakening identified:** production sources match the preceding scratch snapshot. Reports still uses response-authoritative display/navigation, success-only label reconciliation, mounted grouping controls, all four invalidation resources, and Settings-owned recovery. Unit/resource checks pass independently; API/browser assertions remain present and the saved complete Build report records their passing execution. No fresh SQL/browser execution is claimed.
- **VF-07 — Complete final verification evidence:** the current milestone records final non-browser gates, focused race, all 16 Reports scenarios, 10 Settings/invalidation scenarios, and the full 68-test suite. The saved `playwright-report/index.html` was decoded read-only: its report starts at `2026-10-15T20:54:50.473Z`, lasts 256.200524 seconds, contains 68 individual results all marked passed/retry 0, and has no skipped/flaky/unexpected tests or report errors. Independent checks below corroborate the non-database gates. This Review does not reproduce the entire Build sequence.
- **VF-08 — Honest handoff:** the M45 journal preserves initial failures and diagnostic attempts, archives/hashes, source/cache isolation, final results, cleanup ownership, and pending human acceptance. Ports 3005/55436 are independently observed released; the named disposable container is absent from running containers. Historical listener 3004 and user/unknown services were not changed. ADR 0061 remains Proposed and M45 remains open.

### Broader M45 integration inspected

The full uncommitted feature was inspected, not just the corrective test lines:

- Dashboard navigation/auth integration and `g r`; optional ticket fields preserve the existing Agenda/Board hierarchy-filter callers.
- Required query validation, signed-in ownership through `client.userId`, aggregate-only responses, bounded owned selected metadata, archived history, deterministic ranking, previous-only/cohort-only rows, and current/prior summary construction.
- Date-only period arithmetic, independently zoned inclusive/exclusive completion bounds, explicit UTC-normalized SQL predicates, and lifetime tracked/estimate aggregation distinct from period totals.
- Response-derived date labels/navigation, pending/error value suppression, retained labels/clear/cascade behavior, mounted grouping tabs, Settings independence, and actual read-resource registration.
- API boundary/ownership, interaction, response-state, SPA mutation, shell, and sibling regression assertions. Their source presence is not treated as proof of fresh browser execution.

No additional confirmed omission was identified in this inspection. The execution limitations below qualify that result.

### Historical-input formatting audit

Archive directory:

```text
/var/folders/m3/t2gw7yt164v3ftd8w84yzztc0000gn/T/btt-m45-verify-f567ad6m/archive
```

`plans/m45-reports-response-range-fix.md`:

- Archived original SHA-256: `80e6868f826906f945a344cca72a3b93b38d6a2b8a9fae7cfc6ac572074082af`.
- Current SHA-256: `1ff0d61fca4d1d7826ebdb8b982fff7c1b30132b320d0756192e23a6b03f6d3a`.

`reviews/m45-reports-time-allocation-20261015T151738Z.md`:

- Archived original SHA-256: `4ccb42ba7480e0f48b506131e13d7d63fa7356c06f1e94ca54b0773cb6ab3c7e`.
- Current SHA-256: `5ee0dffcffa2df7c3967b7c192e31e67c8a24b5c35029353b38ace0f23bfe3f7`.

Unified diffs and a comparison of stripped table cells/non-table wording agree: wording, commands, findings, links, and recorded outcomes are unchanged. No broader permission to modify historical inputs is inferred.

## Prioritized actionable findings

None. Prior R2/R3 are addressed in the inspected implementation and corroborating evidence; they are not reissued as unresolved findings.

## Possible remedies and regression checks

No corrective code remedy is proposed by this review. Preserve the current tests and unchanged strict gates rather than adding abstractions, retries, timeouts, or baseline exceptions.

If independent database/browser reproduction is required before human acceptance, it needs a safely provisioned disposable database and source-matched owned server. The existing focused race, four Reports files, Settings/invalidation files, and full suite are the appropriate checks; no new test framework or production change is implied.

## Separate out-of-scope concerns

- The two existing `consistent-function-scoping` warnings in `tests/e2e/ticket-context-popovers.test.ts:254,257` remain unchanged warnings, not findings about this amendment.
- The accepted `ticket.updatedAt` completion-proxy limitation remains visible; later ticket edits/archive operations can move the inferred completion period. This approved limitation is not reopened.
- The older listener on 3004 is not the final verified server and its recorded database is unavailable. No lifecycle action was taken on it. This is environment context, not an application defect or permission to stop it.
- Compilation emitted dependency/generated-code warnings described below. No new runtime defect was established from them.

## Independent verification

Node `v24.21.0`; pnpm `12.8.1`. All tests/typechecks/build/lint gates below ran through `workflow_check`, with tool cwd `/Users/mehdi/code/btt`. Scripts/configuration were inspected and their purposes stated before execution. No installs, fixes, snapshot updates, source/config changes, or database migrations ran.

### Executed repository checks

- `pnpm format:check` — **exit 0**, 391 matched files formatted.
- `pnpm lint` — **exit 0**, only the two existing warnings identified above.
- `pnpm check:duplicates` — **exit 0**, 96 baseline clones and zero new clones under the unchanged strict gate.
- `pnpm check:unused` — **exit 0**. Its placeholder `DATABASE_URL` permits configuration loading; no database fixture execution.
- `pnpm typecheck:tsgo` — **exit 0**. This is the existing plain-TypeScript configuration, not a replacement for the canonical Vue check.
- `pnpm exec vitest run --exclude tests/unit/auth-session.test.ts` — **exit 0**, 19 files / 108 tests passed. The inspected excluded test saves/deletes real Better Auth database fixtures. No full 109-test independent pass is claimed.
- `pnpm check:workflow` — **exit 0**, documentation structure complete.
- `/usr/bin/env TZ=UTC pnpm exec vitest run tests/unit/report-navigation.test.ts tests/unit/report-period.test.ts` — **exit 0**, 2 files / 18 tests passed.
- `/usr/bin/env TZ=America/Los_Angeles pnpm exec vitest run tests/unit/report-navigation.test.ts tests/unit/report-period.test.ts` — **exit 0**, 2 files / 18 tests passed.
- `git diff --check` — **exit 0**.
- Read-only Python whitespace/final-newline/conflict-marker inspection of all 42 modified/untracked inputs — **zero diagnostics**. Hash/archive/source comparisons above were also read-only inspections, not runtime tests.

### Executed isolated Nuxt checks

The installed CLI was inspected first: typecheck prepares types then runs the installed Vue checker; build compiles Nuxt/Nitro. Both were directed to the existing real-path `checks/` copy, avoiding the checkout's running-server caches. The selected checker and TypeScript dependencies were already installed; `CI=1` kept execution noninteractive.

Exact canonical typecheck command:

```bash
/usr/bin/env CI=1 node --env-file=/var/folders/m3/t2gw7yt164v3ftd8w84yzztc0000gn/T/btt-m45-verify-f567ad6m/checks/.env node_modules/nuxt/bin/nuxt.mjs typecheck --cwd /private/var/folders/m3/t2gw7yt164v3ftd8w84yzztc0000gn/T/btt-m45-verify-f567ad6m/checks --checker vue-tsc
```

**Exit 0.**

Exact production compilation command:

```bash
/usr/bin/env CI=1 node --env-file=/var/folders/m3/t2gw7yt164v3ftd8w84yzztc0000gn/T/btt-m45-verify-f567ad6m/checks/.env node_modules/nuxt/bin/nuxt.mjs build --cwd /private/var/folders/m3/t2gw7yt164v3ftd8w84yzztc0000gn/T/btt-m45-verify-f567ad6m/checks
```

**Exit 0; Nuxt/Nitro build complete.** Warnings: Rolldown `PLUGIN_TIMINGS` and two generated `Button` bundle BigInt/es2019-target warnings. The supported runtime is Node 24; no corresponding runtime failure was verified. Console output was clipped by the tool; its complete 453-line result, including exit code, is preserved at:

```text
/var/folders/m3/t2gw7yt164v3ftd8w84yzztc0000gn/T/pi-workflow-89a3301e-f5af-4ed2-80a7-5771d3694524.log
```

These checks regenerated only the existing scratch copy's generated types/build/cache output. Post-build application/server/shared/test byte comparisons still matched the worktree.

### Saved Build evidence inspected, not rerun

- `playwright-report/index.html`: decoded its embedded ZIP/JSON in memory, inspected complete suite statistics and all individual status/retry values, plus Reports scenario results and race stdout. It records 68/68 passes, including all 16 Reports and 10 Settings/invalidation scenarios; every individual result has retry 0.
- External `final-race-results/.last-run.json` and `final-full-results/.last-run.json`: passed with no failed tests.
- External `final-typecheck-prepared.log`, `final-test-prepared.log`, and manual walkthrough source/configuration/`manual-final.log`: corroborate the recorded Build checks. The saved full unit run records 109 passes; this is not this reviewer's independent unit result.
- Inspected saved `manual-loaded.png`, `manual-sunday-loaded.png`, `manual-report-error.png`, and `manual-settings-failed.png` at 1280×900. They show readable loaded Reports, Sunday dates/totals, hidden values during report failure, and independent Settings failure over successful Reports. This is screenshot inspection, not a new live keyboard/visual pass.

### Limitations, ownership, and side effects

The final disposable container/database has been removed, and independent listener inspection found no listener on 3005 or 55436. Only normal/unknown database services remain running. Review did not create/reset a database, change Docker services, attach database-backed tests to normal services, or reuse the stale 3004 server.

Accordingly, no fresh database-backed auth unit, SQL/API, focused/full Playwright, migration, or live manual result is claimed. Historical Build evidence is explicitly separated above. Remote/production checks were not required or performed.

No executed check failed, timed out, or reported a fingerprint-verification warning. No non-ignored worktree side effect was observed; final status/diffs and the 42-file content snapshot were unchanged. Scratch generated output changed as expected and is outside the repository fingerprint. No server/container was started, stopped, or reconfigured, and no database fixture was written by this Review.

Inspection traced all new files and tracked changes through hierarchy-filter callers, relevant sibling Agenda/Board controls, Settings modal, invalidation registration/resource map, auth/request/error boundaries, schema/timestamp semantics, and installed Nuxt reactive-key/status/cancellation behavior. Relevant local skills, installed Effect examples, and official Nuxt UI/Oxc references were consulted. This is not a whole-repository audit.

## Next Plan handoff

No corrective Plan is required by confirmed findings in this report. Human code acceptance, ADR 0061 acceptance, and the milestone completion declaration remain separate pending decisions.

A fresh planning agent, if further work is requested, should:

1. Recheck the then-current HEAD/worktree and revalidate this report rather than assuming the snapshot or temporary paths still exist.
2. Preserve response-authoritative Reports behavior, disabled unavailable-state navigation, mounted grouping, retained-label reconciliation, four invalidation resources, ownership/archive/date/estimate contracts, and Settings read-only recovery.
3. Preserve the real held-Month/failed-Year ordering and focused helper contracts. Prior R2/R3 are resolved in the inspected source; do not re-enable navigation or weaken overlap assertions to address a later failure.
4. Treat the two archived-input normalizations as a one-time approved formatting exception, not a durable workflow change.
5. If more independent browser verification is requested, establish disposable database/server ownership under the applicable authorization, use the same environment for app and fixtures, run the existing focused and full suites without retries, retain first failures, and follow the owned-server cleanup policy. Do not use normal databases or historical PIDs by assumption.

Not independently rerun: database-backed tests, browser suites, or live interaction; saved Build results are supporting evidence only.
Risk/acceptance boundary: this bounded no-findings result does not replace human acceptance or the accepted completion-proxy limitation.
