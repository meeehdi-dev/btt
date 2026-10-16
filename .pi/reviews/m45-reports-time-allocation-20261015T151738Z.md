# Workflow review report

- Created: 2026-10-15T15:19:34.063Z
- Project: /Users/mehdi/code/btt
- Plan reference: /Users/mehdi/code/btt/docs/milestones/m45-reports-time-allocation.md
- Scope: All current uncommitted changes on main at HEAD 57a8f7f10bf1ded6cc694af1d280a5b825fa75bc: 14 unstaged tracked files, no staged changes, and all 22 untracked files, reviewed against docs/milestones/m45-reports-time-allocation.md and its approved plans/m45-reports-review-fixes.md amendment. No branch/base override.

# M45 Reports — independent review

## Summary and verdict

**One actionable finding; changes requested.** A settings-read failure can cause weekly totals to be displayed under dates different from the interval actually aggregated. This is a newly identified error path, not a recurrence of the four earlier review findings.

The original four fixes appear implemented in the inspected source. Independent unit, native typecheck, lint, formatting, and workflow checks passed. Browser/API execution was not independently repeated in this review.

## Inputs and reproducible scope

- Review date: **2026-10-15**; last independent test started **15:17:38 UTC**, followed by final Git/source reinspection.
- Repository: `/Users/mehdi/code/btt`; branch: `main`.
- HEAD: `57a8f7f10bf1ded6cc694af1d280a5b825fa75bc`.
- Primary reference: `docs/milestones/m45-reports-time-allocation.md`, including its complete journal and verification record.
- Approved amendment: `plans/m45-reports-review-fixes.md` (`pn-f60bf4`); discovery input: `plans/reports-discovery.md`. All were read completely.
- Applicable governance: `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`, milestone/ADR conventions, and relevant archive, ordering, shell, desktop, invalidation, verification, and presentation ADRs.
- Scope: **14 unstaged tracked files, no staged changes, and 22 untracked files**. Both tracked diff and staged diff were inspected; every new file was read. No branch comparison substituted for the worktree review.

### Tracked files reviewed

`PLAN.md`; `app/composables/useHierarchyFilters.ts`; `app/layouts/dashboard.vue`; `app/utils/agenda-week.ts`; `app/utils/entity-icons.ts`; `shared/agenda-week.ts`; `docs/decisions/0035-three-block-header-navigation.md`; `docs/decisions/README.md`; `tests/e2e/agenda-week.test.ts`; `tests/e2e/auth-shell.test.ts`; `tests/e2e/client-effect-failures.test.ts`; `tests/e2e/data-invalidation.test.ts`; `tests/e2e/helpers/modal-actions.ts`; `tests/e2e/search.test.ts`.

### New files reviewed

- UI: `app/pages/reports.vue`, `app/utils/calendar-date.ts`, `app/utils/reports.ts`.
- Server/shared: `server/api/reports/index.get.ts`, `server/domain/reports.ts`, `shared/date-only.ts`, `shared/report-period.ts`, `shared/reports.ts`.
- Tests: `tests/unit/report-filters.test.ts`, `tests/unit/report-format.test.ts`, `tests/unit/report-period.test.ts`; `tests/e2e/reports.test.ts`, `tests/e2e/reports-boundaries.test.ts`, `tests/e2e/reports-interactions.test.ts`; `tests/e2e/helpers/api-records.ts`, `current-date.ts`, `reports.ts`, and `test-owner.ts`.
- Records/inputs: `docs/decisions/0061-reports-time-allocation.md`, the M45 milestone, amendment, and discovery brief above. Their intentional untracked presence is not a defect.

Excluded: committed history beyond integration context, unrelated application behavior, external services, deployment, and live visual/browser validation. Final status/diffs showed no observed scope changes during review; untracked files are covered by the contents read, not by tracked Git diffs.

## Plan compliance

| Requirement                                                             | Inspected implementation and verification evidence                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authenticated Reports destination and `g r`                             | Dashboard navigation array and auth page metadata follow existing patterns; shell/search browser assertions include Reports. Browser assertions inspected, not executed here.                                                                                                                                                                |
| Configured weeks, calendar months/years, previous equivalent period     | `shared/report-period.ts` and date-only extraction implement the boundaries and shifts. Thirteen period/completion tests passed independently under UTC and Los Angeles host zones. **Settings-failure presentation remains incorrect: R1.**                                                                                                 |
| Owner-scoped server aggregation, archive history, grouping, comparisons | `loadReports` scopes hierarchy through `client.userId`, aggregates current/prior minutes, retains previous-only/cohort rows, ranks with name/ID tie-breaks, and returns aggregate data rather than entry history. API/browser assertions cover representative totals, ownership, filters, and archives. SQL execution was not repeated here. |
| Done estimated cohort with lifetime usage                               | Separate estimate aggregate uses current Done status, non-null estimate, and the shared zoned completion predicate; lifetime usage stays distinct from period totals. UI explains the `updatedAt` limitation. Boundary/cohort browser tests are present.                                                                                     |
| Explicit reporting zone                                                 | Required validated `timeZone` query, response/key inclusion, independently converted midnights, and explicit UTC SQL normalization are present. Unit tests cover Paris DST, UTC, Los Angeles, Kathmandu, and invalid bounds/zones.                                                                                                           |
| Stable grouping and retained selected filters                           | Tabs are outside the conditional results subtree; results are hidden while pending. Bounded owned selected metadata, three retained labels, clearable selected controls, and success-only reconciliation are present. Utility tests passed; browser regressions for keyboard/error/empty states and retained labels were inspected.          |
| Same-tab invalidation                                                   | Actual registration uses `reportReadResources`; tests check all six mutation categories. SPA tests use shell navigation/time-origin assertions; active Settings coverage checks failed report refresh and read-only retry.                                                                                                                   |
| Records and scope limits                                                | Roadmap and ADR index updated; ADR 0061 remains Proposed; ADR 0035 receives a narrow pending extension. No schema, dependency, auth-policy, deployment, or CI change is in the reviewed worktree.                                                                                                                                            |
| Final verification and acceptance                                       | Milestone records 12 focused and 64 full browser passes plus other gates. Those are implementation claims, not independent results from this session. Human acceptance/completion remains pending.                                                                                                                                           |

## Prioritized actionable finding

### R1 — Medium: settings failure relabels a successful weekly report with the wrong dates

- **Primary locations:** `app/pages/reports.vue:60–84`, `341–350`, and `394–395`.
- **Supporting contract:** `server/api/reports/index.get.ts:44–56` independently reads the stored week-start setting and returns its resulting range.
- **Origin:** introduced by the new Reports page; violates consistent configured-period reporting and error-state behavior.
- **Confidence:** high from source/installed-framework tracing; not browser-reproduced in this session.

**Trigger:** An owner has a non-Monday week start, `/api/settings` fails, and `/api/reports` succeeds. This can occur on client-side entry to Reports or when its shared settings reader is refreshed. For example, with Sunday configured and an anchor of `2026-10-15`, the server aggregates **October 11–17**.

**Effect:** The page falls back to Monday when `settings` is unavailable and labels the report **October 12–18**. Totals, changes, allocation rows, and estimate context remain displayed despite `settingsError`, because their conditions check only report availability/pending state. A Sunday-only entry can therefore appear as logged time for a displayed interval that does not contain it. The alert does not explain this date mismatch or suppress the mislabelled report.

**Evidence:** The API uses persisted settings independently; the browser does not send its fallback week start. The page derives `periodLabel` from its locally computed range rather than the returned `report.range`. Installed Nuxt's `asyncData.js:375–377` clears data to its default on read failure, so a failed settings refresh also reaches the fallback even after an earlier successful read. The report watcher requires date/zone, not successful settings. Existing Reports Settings coverage fails `/api/reports`, not the independent `/api/settings` read, and does not catch this path.

### Possible remedies and regression checks for R1

These are proposals for a fresh Plan session, not approved implementation decisions:

- Keep the displayed interval tied to the successfully aggregated response range. Alternatively, suppress results/disable interval-dependent actions until required settings are available. Do not interpret a failed settings read as confirmation of default settings. Preserve mounted grouping controls and selected-filter presentation.
- Add a deterministic browser regression with Sunday week start, a fixed October 15 clock, and an October 11-only entry. Enter Reports through SPA navigation while consistently failing GET `/api/settings` but allowing `/api/reports`. Assert that data is never displayed under October 12–18 when the returned interval is October 11–17.
- Repeat for a settings refresh failure while Reports remains mounted, then recover via read-only retry. Check restored interval/total agreement and preserved grouping/filter state without another settings write.

## Separate out-of-scope concerns

No additional confirmed out-of-scope defect is included in the verdict. Lint's two existing `consistent-function-scoping` warnings in `tests/e2e/ticket-context-popovers.test.ts:254,257` remain warnings, not findings about M45. The accepted `updatedAt` completion-proxy limitation is a product decision, not a new defect.

## Independent verification

All commands ran from `/Users/mehdi/code/btt` through confirmed check invocations:

| Exact command                                                                               | Observed result                                                                                                     |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                                                                 | Exit 0; 19 files / 104 tests passed.                                                                                |
| `pnpm typecheck:tsgo`                                                                       | Exit 0. This configuration covers server utilities/unit tests and their imports, not full Vue/browser/API coverage. |
| `node scripts/check-workflow-docs.mjs`                                                      | Exit 0; required documentation structure complete.                                                                  |
| `pnpm lint`                                                                                 | Exit 0; only the two warnings identified above.                                                                     |
| `pnpm format:check`                                                                         | Exit 0; 385 matched files formatted.                                                                                |
| `/usr/bin/env TZ=UTC pnpm exec vitest run tests/unit/report-period.test.ts`                 | Exit 0; 13 tests passed.                                                                                            |
| `/usr/bin/env TZ=America/Los_Angeles pnpm exec vitest run tests/unit/report-period.test.ts` | Exit 0; 13 tests passed.                                                                                            |

Source inspection also traced the complete new files through sibling Agenda/Board controls, hierarchy cascades, request/error boundaries, shared Nuxt data behavior, mutation resources, Settings modal, schema/timestamp storage, auth middleware, and ticket update semantics.

Status was checked after commands; no non-ignored worktree side effects were observed. No source/configuration was changed, tests added, snapshots updated, dependencies installed, or app/server/database lifecycle operations performed.

**Limitations:** Full Playwright/API tests were not run: no isolated database and agent-owned server were established for this Review, and existing/user-owned services were not attached to or changed. Canonical Nuxt typecheck/build were not repeated because they generate Nuxt/cache artifacts in a worktree whose running-server ownership was not established. Duplicate/unused gates and a separate whitespace check were also not independently rerun. The milestone's scratch-copy build, browser, manual, and cleanup claims were read but not independently verified. No browser reproduction is claimed for R1.

## Next Plan handoff

1. Revalidate R1 against the then-current code using independent settings/report failure injection; do not blindly implement this report.
2. Decide whether response-authoritative labels, withholding results on settings failure, or a combination best preserves consistent intervals and existing error/retry behavior. The response already contains `range`; no schema/dependency change is implied.
3. Keep the existing four review fixes, archive/ownership formulas, invalidation resource registration, and mounted tabs intact. Affected implementation is primarily `app/pages/reports.vue`; regression coverage belongs with Reports interaction/settings tests.
4. Obtain approval for any corrective plan, record evidence in M45, and repeat approved final gates plus focused/full E2E under the existing owned-server policy. Keep ADR 0061 Proposed and M45 open until separate human review and completion decisions.
