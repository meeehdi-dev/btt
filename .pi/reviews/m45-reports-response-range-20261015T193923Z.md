# Workflow review report

- Created: 2026-10-15T19:40:51.034Z
- Project: /Users/mehdi/code/btt
- Plan reference: See the plan references identified in the report below
- Scope: All current uncommitted M45 changes on main at HEAD 57a8f7f10bf1ded6cc694af1d280a5b825fa75bc: 14 unstaged tracked files, no staged changes, and 26 untracked files/inputs. Reviewed against plans/m45-reports-response-range-fix.md, the original M45 milestone, and plans/m45-reports-review-fixes.md. No branch/base override.

# M45 Reports response-range correction — independent review

## Summary and verdict

**Two actionable verification regressions; changes requested.** The response-authoritative correction addresses the previous report's R1 in the inspected source and independently passing browser scenarios. However:

- **R2, Medium:** the existing retained-label race regression deadlocks against the newly disabled Previous button.
- **R3, Low:** the new browser file introduces three clones that fail the required duplication gate.

The protected-input formatting conflict is also independently reproduced and still needs human direction. Full final verification is incomplete. This report is not readiness for human code acceptance or milestone completion.

## Inputs and reproducible scope

- Repository: `/Users/mehdi/code/btt`.
- Observation window: **2026-10-15, 19:25–19:39 UTC**.
- Branch: `main`; HEAD: `57a8f7f10bf1ded6cc694af1d280a5b825fa75bc`.
- Scope: **14 unstaged tracked files, no staged changes, and 26 untracked files/inputs**, before this report. Both tracked and staged diffs were inspected; all new files were read. No branch comparison substituted for the worktree review.
- Primary plan: `plans/m45-reports-response-range-fix.md`, read completely.
- Other complete inputs: `docs/milestones/m45-reports-time-allocation.md`, `plans/m45-reports-review-fixes.md`, `plans/reports-discovery.md`, and `.pi/reviews/m45-reports-time-allocation-20261015T151738Z.md`.
- Governance/context: `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`, milestone/ADR conventions, relevant ADRs, and Proposed ADR 0061. The milestone records authorization for the response-range amendment; its protected plan/input report were not edited.

### Reviewed file set

Tracked changes:

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

Untracked files/inputs:

```text
.pi/reviews/m45-reports-time-allocation-20261015T151738Z.md
app/pages/reports.vue
app/utils/calendar-date.ts
app/utils/reports.ts
docs/decisions/0061-reports-time-allocation.md
docs/milestones/m45-reports-time-allocation.md
plans/m45-reports-response-range-fix.md
plans/m45-reports-review-fixes.md
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

Plans/reports are handoff inputs, not application changes to ship; their intentional untracked presence is not a defect.

Final status and tracked/staged diffs matched the initial scope. Before and after browser execution, directory comparisons found identical `app`, `server`, `shared`, and `tests` sources between this worktree and `/tmp/btt-m45-range-nJjwGo/source`; package/lockfile and test configurations also matched. The disposable copy intentionally has its own Nuxt build directory and dependency-cache parent, as inspected in its configuration.

Excluded from execution: the full repository browser suite, standalone Settings/data-invalidation suites, canonical Nuxt typecheck/build, migrations, live visual inspection, hosted CI, OAuth, deployment, and production databases. Their absence limits the verdict; historical Build results are not independent verification.

## Plan compliance

- **RNG-01, accurate labels/results:** `displayedReport` requires initialization, public success status, no pending state, and no report error. Both date-label locations use its returned period/range; summary, rows, comparisons, and estimate explanation use that snapshot. New response-state browser scenarios passed independently.
- **RNG-02, independent Settings failure:** both fixed-clock Sunday-setting scenarios passed, including actual failed Settings GETs, real Sunday report ranges/totals, and unchanged document time origin. Previous R1 is addressed in this coverage.
- **RNG-03, no redundant read:** Reports has no settings fetch or settings retry; `retryReport` only refreshes Reports. Browser assertions for no additional Reports-owned settings traffic passed.
- **RNG-04, navigation:** `getAdjacentReportDate` shifts weeks from returned starts and delegates calendar month/year shifts. Navigation/period tests passed under UTC and Los Angeles host zones; Sunday Previous/Next/Current browser checks passed.
- **RNG-05, unavailable states:** source inspection covers preparation/initialization gates. The new held/superseded/error scenario passed its loading/unavailable-label, hidden-values, disabled-navigation, and report-only retry assertions.
- **RNG-06, mounted controls and retained selections:** tabs remain outside conditional results. The focused automatic keyboard grouping scenario passed. Mounted Settings/filter preservation also passed. **The older selected-label race/reconciliation regression cannot finish: R2.**
- **RNG-07, settings invalidation:** the actual read still uses all four resources, including `settings`; the resource-matrix unit coverage passed. The real mounted Settings save with failed settings refresh passed, including interval/total changes and exactly one PATCH through retry. The existing report-refresh-failure scenario also passed individually in the initial combined run.
- **RNG-08, transitions:** the new delayed Month/successful Year/superseded response and report error/retry scenario passed. The older delayed-selection race coverage remains blocked by R2; do not equate the new grain test with all retained-label coverage.
- **RNG-09/S6, verification:** unmet. Formatting fails on protected inputs; duplication fails on newly added tests; an existing browser regression fails. No complete final all-Reports or repository-browser pass is established. ADR 0061 remains Proposed and M45 remains open.

Original M45 integration was also inspected: authenticated navigation, hierarchy cascading, owner-scoped aggregate/selected-metadata queries, archived history, date-only bounds, UTC-normalized completion predicates, lifetime estimates, and invalidation registration. The four API boundary/ownership scenarios passed individually before the combined browser run was interrupted; the four original Reports allocation/SPA scenarios later passed in a completed run.

## Prioritized actionable findings

New IDs continue after the input report's R1.

### R2 — Medium: retained-label race regression waits forever on intentionally disabled navigation

- **Locations:** `tests/e2e/reports-interactions.test.ts:182–219`, especially **214**; supporting implementation: `app/pages/reports.vue:93–96,245–247`.
- **Origin:** the response-range amendment introduces an incompatibility with the existing regression; this also leaves RNG-06/RNG-08/RNG-09 verification incomplete.
- **Confidence:** high; independently reproduced and traced.

**Trigger:** run “Reports keeps selected labels on failure and reconciles renamed, archived, and unavailable metadata.” It deliberately holds the selected-client request, then tries to click Previous month before releasing that request.

**Effect:** the new, correctly planned unavailable-state gate disables Previous while that request is pending. Playwright cannot perform the click. The request is released only after the unreachable error assertions or in `finally`, so the test times out rather than exercising retained labels, error recovery, renamed/archive metadata, and unavailable selections. It blocks the required browser gate.

**Evidence:** the isolated command exited 1 after the default 30-second test timeout. Its trace records `locator.click` at line 214 repeatedly resolving to `<button disabled ... aria-label="Previous month">`. The final console error points at fixture cleanup because the exhausted test budget also prevents its DELETE; the trace establishes the earlier cause. The same disabled-button failure appeared in the initial combined run.

Trace: `/tmp/btt-m45-range-nJjwGo/review-label-test-results/reports-interactions-Repor-64fdc-ed-and-unavailable-metadata-chromium/trace.zip`.

**Possible remedy and regression checks:** obtain a narrow plan amendment for adapting this existing test. Preserve the approved disabled Previous/Next behavior. Induce the superseding failed request through a control intentionally usable while pending, such as grain selection, and adjust subsequent navigation expectations accordingly. Keep the original delayed-selection/retained-label race and metadata-reconciliation assertions; merely waiting for or releasing the selection first would weaken that coverage. Re-run this scenario, all Reports files, and the full suite without forced clicks, retries, or timeout increases.

### R3 — Low: new browser scenarios fail the strict duplication gate

- **Locations:** `tests/e2e/reports-period-state.test.ts:148–164,257–263,326–332`; matching existing blocks in `tests/e2e/reports-interactions.test.ts:152–158,287–292`.
- **Origin:** introduced by the new browser file; violates the explicit S6/V5 quality gate, not a subjective style preference.
- **Confidence:** high; directly reported by the unchanged required check.

**Trigger/effect:** `pnpm check:duplicates` exits 1 with **three new clones**, while the allowed new-clone count is zero. Resolving the input-only formatter conflict will therefore not make the final quality sequence green.

The reported pairs are:

1. `reports-period-state.test.ts:326–332` with `reports-interactions.test.ts:152–158`.
2. `reports-period-state.test.ts:159–164` with `reports-interactions.test.ts:287–292`.
3. `reports-period-state.test.ts:148–154` with `reports-period-state.test.ts:257–263`.

**Possible remedy and regression checks:** plan small Reports-specific setup/interaction helpers for the repeated sequences, preserving their assertions and fixture isolation. Re-run the unchanged duplication check against the existing baseline, then focused/full browser verification. Updating the baseline, adding suppressions, or cosmetic token changes would not address the planned reuse/strict-gate requirement.

## Separate blockers, concerns, and open questions

- **Protected-input formatting conflict:** independent `pnpm format:check` reports only `plans/m45-reports-response-range-fix.md` and `.pi/reviews/m45-reports-time-allocation-20261015T151738Z.md`. The selected plan explicitly forbids changing these inputs during Build. This is a human scope/workflow decision, not an additional application defect or permission to bypass the gate. No inputs or formatter configuration were changed here.
- **Initial browser timeouts:** the first combined run also timed out before client mount in the keyboard test and during the Sunday-clock Settings click. Both scenarios subsequently passed unchanged in deliberate diagnostic runs. Their initial failures remain evidence; no root cause was established, and no timeout/retry adjustment is proposed on this evidence alone.
- **Pre-existing/out-of-scope:** lint's two `consistent-function-scoping` warnings in `tests/e2e/ticket-context-popovers.test.ts:254,257` are unchanged warnings, not M45 findings. The accepted `updatedAt` completion-proxy limitation is not reopened.

## Independent verification

All executed tests/lint/typechecks used `workflow_check`. Working directory was `/Users/mehdi/code/btt` unless explicitly noted. Node was `v24.21.0`.

### Non-browser checks

- `pnpm format:check` — **exit 1**; the two protected inputs above, 389 matched files. No fixing command run.
- `pnpm lint` — **exit 0**; only the two existing warnings above.
- `node scripts/check-workflow-docs.mjs` — **exit 0**. Inspected beforehand: reads required files/headings only.
- `node --env-file=/tmp/btt-m45-range-nJjwGo/source/.env node_modules/pnpm/bin/pnpm.mjs test` — **exit 0**, **20 files / 109 tests passed**. The env file supplies the disposable connection for the existing DB-backed auth-session fixture.
- `pnpm typecheck:tsgo` — **exit 0**. Its configuration includes server utilities/unit tests and their imports, not a canonical Vue/browser typecheck.
- `pnpm check:duplicates` — **exit 1**, 99 clones total, **3 new**: R3. Existing console/baseline configuration inspected first; no baseline change.
- `pnpm check:unused` — **exit 0**. Existing Knip configuration/package script inspected first; no fixing/install command.
- `/usr/bin/env TZ=UTC pnpm exec vitest run tests/unit/report-navigation.test.ts tests/unit/report-period.test.ts` — **exit 0**, **18 tests passed**.
- `/usr/bin/env TZ=America/Los_Angeles pnpm exec vitest run tests/unit/report-navigation.test.ts tests/unit/report-period.test.ts` — **exit 0**, **18 tests passed**.
- `git diff --check` — **exit 0**.
- Read-only Python inspection of all 26 listed untracked files/inputs for trailing whitespace, conflict markers, and missing final newline — **zero diagnostics**. This is not a formatter pass.

An initial request to run `node --env-file=.env node_modules/pnpm/bin/pnpm.mjs test` with cwd `/tmp/btt-m45-range-nJjwGo/source` was **refused before execution** because check working directories must remain inside the project. The successful unit/browser commands instead ran the project's identical sources with the disposable env file explicitly loaded. Installed Vite's `loadEnv` implementation was checked to confirm explicitly supplied process environment values take precedence over checkout dotenv values.

### Browser commands and results

Initial all-Reports command:

```bash
/usr/bin/env CI=1 PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3004 node --env-file=/tmp/btt-m45-range-nJjwGo/source/.env node_modules/@playwright/test/cli.js test tests/e2e/reports.test.ts tests/e2e/reports-boundaries.test.ts tests/e2e/reports-interactions.test.ts tests/e2e/reports-period-state.test.ts --workers=1 --retries=0
```

**Incomplete:** the check's 180-second execution budget interrupted the run. Although the wrapper displayed exit 0, it explicitly marked the result aborted/timed out; this is not success. Output recorded seven passes and three failures, followed by an interrupted scenario; the remaining five had not run. First-failure traces/error contexts remain in the project's ignored `test-results/` directory. R2 was trace-confirmed; the other timeouts are distinguished above.

Isolated R2 validation:

```bash
/usr/bin/env CI=1 PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3004 node --env-file=/tmp/btt-m45-range-nJjwGo/source/.env node_modules/@playwright/test/cli.js test tests/e2e/reports-interactions.test.ts --grep "Reports keeps selected labels" --workers=1 --retries=0 --reporter=list --output=/tmp/btt-m45-range-nJjwGo/review-label-test-results
```

**Exit 1; one failed** at the default 30-second budget, with disabled-Previous trace evidence.

Completed new-regression/original-Reports run:

```bash
/usr/bin/env CI=1 PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3004 node --env-file=/tmp/btt-m45-range-nJjwGo/source/.env node_modules/@playwright/test/cli.js test tests/e2e/reports-period-state.test.ts tests/e2e/reports.test.ts --workers=1 --retries=0 --reporter=list --output=/tmp/btt-m45-range-nJjwGo/review-range-test-results
```

**Exit 0; 8/8 passed in 2.5 minutes**, including all four new scenarios. This does not replace a complete all-Reports/full-repository run.

Focused keyboard diagnosis:

```bash
/usr/bin/env CI=1 PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3004 node --env-file=/tmp/btt-m45-range-nJjwGo/source/.env node_modules/@playwright/test/cli.js test tests/e2e/reports-interactions.test.ts --grep "consecutive keyboard" --workers=1 --retries=0 --reporter=list --output=/tmp/btt-m45-range-nJjwGo/review-keyboard-test-results
```

**Exit 0; 1/1 passed.** First-failure evidence was retained; no source changes, automatic retries, or per-test timeout increases occurred between runs.

### Inspection, side effects, and limitations

Source tracing included complete new files, the changed tracked files, sibling Agenda/Board pages, Settings modal, hierarchy filters, actual invalidation registration/resource map, request/error/auth boundaries, schema/timestamp storage, and installed Nuxt async-data key/status/cancellation handling. Local skills, Nuxt UI maintainer guidance, installed Effect examples, and official Oxc check documentation were consulted where relevant.

No non-ignored worktree side effects or fingerprint warnings were reported by checks; final Git inspections showed the same 14/26 input scope. Tests generated ignored browser artifacts and used disposable owner fixtures. Failed/timed-out fixture DELETE cleanup was incomplete, so leftover test records in the disposable database are possible; no manual database cleanup was attempted.

The existing server was identified as Build-owned Nuxt PID **8926**, cwd `/private/tmp/btt-m45-range-nJjwGo/source`, listening on **3004**. The inspected test environment points to disposable database **btt_range**, endpoint **127.0.0.1:55435**; the supplied handoff identifies container `btt-m45-range-pi`. Container lifecycle was not independently changed or inspected. Both endpoints remained listening at final inspection. No server/tunnel/container was started, stopped, or reconfigured.

No migration ran in Review. Canonical Nuxt typecheck/build were not repeated: they generate caches, the checkout also has unknown/user-owned services, and external scratch cwd execution was unavailable. Standalone Settings/data-invalidation suites, the full repository E2E suite, and live visual inspection remain unrun here. Historical migration/build/full-suite claims were read, not adopted as current independent results.

## Next Plan handoff

1. Revalidate R2 and R3 against the then-current tree; do not implement this report blindly. R2 is a test/approved-interaction mismatch, not justification to re-enable navigation during unavailable states.
2. Obtain approval for a narrow adaptation of the existing retained-label race regression and focused Reports helper reuse. Preserve delayed/superseded-request sensitivity, readable labels, error/recovery assertions, and the unchanged strict duplication baseline.
3. Obtain human direction for the two protected-input formatter failures before resuming the final handoff sequence. This review grants no exception or input-edit authorization.
4. Keep the response-authoritative implementation, all four invalidation resources, mounted tabs, API/ownership/date/estimate contracts, and Settings-owned read-only recovery intact. No architecture/schema/dependency change is implied by these findings.
5. Rediscover process ownership and source equivalence before further execution; do not assume recorded PIDs remain valid. Preserve first-failure traces and account for incomplete disposable fixture cleanup.
6. After approved fixes, repeat every required final gate, complete all Reports/Settings/invalidation coverage and the full browser suite, and perform the supported-width visual/keyboard checks. Retain the owned server through failures; stop/release only owned resources after all required checks pass. Keep M45 open and ADR 0061 Proposed until separate human acceptance/completion decisions.
