# M45 — Response-authoritative Reports periods

## Status and purpose

**Status: Proposed for Plannotator approval.** This is a focused corrective amendment to M45, not a new milestone. The human selected the response-authoritative approach during planning: keep successful reports usable, remove Reports’ redundant settings read, and leave Settings errors and read-only recovery in the Settings modal. That choice does not replace approval of this complete implementation plan.

The goal is to ensure that Reports never presents aggregate values under dates different from the interval aggregated by the server. The successful report response must own its displayed dates and adjacent-period navigation, including when an independent settings read fails.

The original M45 scope and approved first review-fix amendment remain authoritative except for the Reports page’s independent settings read and the presentation/navigation refinements explicitly replaced here.

## Inputs and current-state evidence

### Governing inputs

- Review: `reviews/m45-reports-time-allocation-20261015T151738Z.md`, read completely. It contains one actionable finding, R1.
- Original approved scope and execution record: `docs/milestones/m45-reports-time-allocation.md`, Plannotator session `pn-edefcf`.
- Earlier approved amendment: `plans/m45-reports-review-fixes.md`, session `pn-f60bf4`, read completely.
- Product discovery: `plans/reports-discovery.md`, read completely; its historical pending-status wording is not a new approval requirement.
- Repository instructions: `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`, milestone/plan conventions and templates.
- Relevant ADRs: 0001, 0011, 0012, 0024, 0041, 0042, 0050, 0051, 0057, 0058, and Proposed 0061. Preserve their ownership, date-only history, Nuxt/Effect boundary, desktop, verification, invalidation, and Settings-modal policies.

### Verified source facts

- Inspection baseline is `main` at `57a8f7f10bf1ded6cc694af1d280a5b825fa75bc`. Both tracked and staged diffs were inspected; there were 14 unstaged tracked files and no staged changes. Most M45 additions, including `app/pages/reports.vue`, are untracked. Preserve this existing work; do not reset, clean, or replace it.
- `app/pages/reports.vue` reads `app-api:settings`, substitutes Monday when settings data is absent, computes the selected/current ranges locally, and formats both visible period labels from that local range. Its result conditions do not require settings success.
- `server/api/reports/index.get.ts` independently reads the persisted week-start setting. `shared/reports.ts` already includes the effective period, time zone, and complete current/previous date range in `ReportsResponse`. No response-contract extension is necessary.
- `server/domain/reports.ts` returns the same range used by its aggregates. The server default for a genuinely missing settings row is distinct from a failed settings read; this amendment does not change either server behavior.
- Installed Nuxt source, `node_modules/nuxt/dist/app/composables/asyncData.js`, resets data to its default on failure. It also permits old data to be inherited during a reactive-key transition while the new reader is idle. A non-null response and `!pending` alone are therefore insufficient evidence of a successful current read.
- `shared/report-period.ts` shifts weeks from a locally computed week start. With Sunday configured, a Sunday anchor and a failed settings read can make the current Previous/Next behavior repeat or skip a server-defined week. This is another consequence of R1’s duplicated boundary calculation.
- `app/components/SettingsModal.vue` owns its own shared settings read, successful-write/failed-refresh feedback, and read-only retry. `app/layouts/dashboard.vue` mounts it lazily and retains it after first opening.
- `reportReadResources` in `app/utils/reports.ts` already includes `settings`. `useAppDataInvalidation` refreshes Reports after a successful settings mutation even if Reports no longer reads `/api/settings` itself.
- `tests/e2e/reports-interactions.test.ts` currently covers an active Reports refresh where `/api/reports` fails. It does not cover independent GET `/api/settings` failure with a successful report.
- Sibling `app/pages/agenda.vue`, `app/pages/tickets/index.vue`, Settings modal source, and relevant failure/invalidation tests were inspected. Their settings dependencies, geometry, and interactions are not part of this correction; no shared toolbar or settings-reader refactor is warranted.

**Validation limitation:** R1 is independently confirmed by source and installed-framework tracing, not by a browser run in this Plan session. No tests, servers, migrations, or implementation commands were run. Earlier milestone/review check results are historical evidence, not verification of this amendment.

## Scope and non-goals

### In scope

- Remove the Reports page’s direct settings fetch and Monday fallback.
- Use one successful current report response for visible dates, totals, comparisons, allocation rows, and estimate context.
- Base Previous/Next navigation on the returned period range; compute Current-period state without a separate week-start read.
- Preserve report-only errors and read retries, stable grouping controls, selected-filter presentation, and existing invalidation registration.
- Add focused unit/browser regressions and record new evidence in M45 and Proposed ADR 0061.

### Protected behavior and exclusions

- Keep the Reports API/query/response contract, SQL, ownership checks, archive history, grouping/sorting, and all aggregate formulas unchanged.
- Keep explicit reporting time zones, date-only entry semantics, UTC-normalized completion bounds, lifetime estimate usage, and the accepted `updatedAt` completion-proxy limitation unchanged.
- Keep browser-local initialization, default Week/Clients selection, local non-persisted period/filter state, searchable cascading filters, and row-to-filter behavior.
- Keep the earlier four review fixes, including success-only selected-label reconciliation and mounted automatic-activation tabs.
- Do not change Agenda, Board, Settings modal behavior, shared settings keys, the invalidation core/resource map, shell navigation, or global error/cache policy.
- No schema, migration files, dependency/lockfile, authentication, deployment, CI, timeout-default, charting, roadmap-scope, or unrelated cleanup changes.
- Do not edit the original approved amendment, this approved plan during Build, or the input review report. Historical verification records must remain visible.

## Decisions and rationale

### D1 — The successful response owns the reported interval

The human selected this approach rather than withholding a successful report until an independent settings request succeeds. The server already knows the configured interval and returns it with the aggregates. Using that response avoids a second interpretation of the same setting and preserves useful data during unrelated read failures.

Reports will no longer fetch `/api/settings`, merge settings errors into its page error, or refresh settings from its page retry button. An independently failing Settings modal continues to show its existing safe feedback and retry. Do not introduce a replacement settings banner on Reports for data it no longer reads.

### D2 — No speculative or stale interval is presented as loaded

Use Nuxt’s public success/error/pending state to decide whether a current report is displayable. During initialization, idle reactive-key transitions, loading, or report failure, show neutral period status rather than computing guessed dates. Hide totals and result content until a successful current response is available. Do not add a parallel response cache, last-success result store, private Nuxt inspection, or custom request-generation system.

### D3 — Adjacent navigation uses returned boundaries

For weeks, an adjacent anchor is the returned start date shifted by a calendar multiple of seven days, without recalculating a week start. Calendar month/year shifts can reuse `shiftReportPeriod` with the returned start date. Keep existing shared period helpers and their contracts unchanged; add one small Reports-specific navigation helper for this use.

Previous/Next are unavailable without a successful current response. Grain/group/filter controls stay mounted and usable through loading/errors. The Current action needs only initialized browser date/time zone and successful-range containment to identify an already-current period.

### D4 — Removing the settings read does not remove the settings dependency

Retain `reportReadResources` unchanged. The server’s configured weekly interval still depends on settings, and successful Settings writes must refresh the active report through the existing invalidation mechanism. Retry of a successful settings write remains read-only and belongs to the Settings modal.

No new ADR number is needed: clarify Proposed ADR 0061 without accepting it. M45 remains open for separate human code review and completion declaration.

## Requirements and acceptance criteria

- **RNG-01 — Accurate labels:** Whenever report values are visible, both the toolbar period label and total-card period label describe the returned current range, using the returned period and existing localized formatter. The displayed summary, comparison, rows, and estimate explanation belong to that same successful response.
- **RNG-02 — Independent settings failure:** With Sunday configured, a fixed local date of October 15, 2026, and a Sunday October 11-only entry, successful Reports must show October 11–17 and the correct entry total even when GET `/api/settings` consistently fails. It must never display that total under October 12–18. The failed settings read must actually be observed in the test, not merely intercepted by an unused route.
- **RNG-03 — No redundant read:** Entering Reports from the authenticated shell must not initiate its former settings request. Existing mounted Settings readers may still request settings for their own operations. Reports’ own retry refreshes only Reports.
- **RNG-04 — Correct adjacent/current navigation:** Sunday- and other non-Monday-start weeks move by one complete returned interval per Previous/Next action, including when today itself is the configured first weekday. No repeated or skipped week is permitted. Current state is determined by whether the browser-local today lies inclusively within the successful returned range. Month/year calendar and leap/rollover behavior remains unchanged.
- **RNG-05 — Safe unavailable states:** Until date/zone initialization completes, show preparing state and disable date-dependent actions. For idle/pending reads, use the existing loading-period message and hide totals, rows, and estimate context. For report failure, show a neutral unavailable-period label plus the existing safe report error/read retry; do not show false empty results or loaded values. Previous/Next remain disabled whenever no successful current response is displayable.
- **RNG-06 — State and keyboard preservation:** Grouping tabs remain mounted, with existing automatic arrow-key activation and focus behavior. Hierarchy selections, readable retained labels, clear actions, and cascade rules survive independent settings failure, report pending/error states, and recovery.
- **RNG-07 — Still-mounted settings invalidation:** A real Settings UI save changing Monday to Sunday refreshes Reports without document navigation, even if the settings GET refresh fails while the report succeeds. Report dates/totals agree with its response. Settings feedback remains a partial-success/read failure, and retry makes no additional settings PATCH. The grouping tab elements and selected filters remain intact.
- **RNG-08 — Report request transitions:** Delayed grain/group/filter reads must not present inherited old values as a newly selected period. A delayed superseded response must not overwrite the active period’s display. A report failure followed by retry recovers the correct range and data without settings requests or writes originating from Reports.
- **RNG-09 — Scope and verification:** Existing aggregate/security/archive/completion/invalidation tests remain green. All required local gates and full browser tests pass on the final source, with recorded server ownership and cleanup. No human code acceptance or milestone completion is inferred from automated success.

## Files to modify and reuse

### Implementation and tests

- `app/pages/reports.vue` — remove the settings reader and local range calculation; centralize successful-response presentation; revise period navigation, loading/error labels, and report retry.
- `app/utils/reports.ts` — add `getAdjacentReportDate`, a pure Reports-specific helper using the effective response period/range and an integer period shift. Its output is a date-only anchor or `null` for invalid/unrepresentable input. The UI uses shifts of minus one and plus one.
- New `tests/unit/report-navigation.test.ts` — prove response-boundary navigation and invalid-input behavior.
- New `tests/e2e/reports-period-state.test.ts` — own the independent settings-failure, response-authoritative period, navigation, and pending/error regressions described below.
- `tests/e2e/helpers/reports.ts` — only if repeated response/range assertions across the new scenarios merit a small Reports-specific helper. Preserve existing fixture contracts; no broad helper rewrite.

### Records

- `docs/milestones/m45-reports-time-allocation.md` — approval link, R1 disposition, journal, exact validation results, server lifecycle, and still-pending human acceptance.
- `docs/decisions/0061-reports-time-allocation.md` — clarify returned-range authority and independent Settings-read behavior; keep Proposed status.

Reuse `formatReportPeriodLabel`, `addCalendarDays` in `shared/date-only.ts`, existing month/year `shiftReportPeriod`, `reportReadResources`, Nuxt public async-data state, current fixture cleanup, `createTestOwner`, `navigateReportsShell`, `waitForClientMount`, request interception, browser clock, and document time-origin assertions. No new UI component or general-purpose composable is needed. Read the project-local Nuxt UI/Oxc guidance before implementation/checks; additional Effect API changes are not authorized by this plan.

## Ordered implementation checklist

- [ ] **S1 — Establish the approved baseline and record authorization.** Read this approved file and the governing inputs in a fresh Build session. Recheck status and existing M45 contents, preserving unrelated tracked/untracked work. Record the exact plan approval reference and R1’s response-authoritative decision in M45 before application edits. Establish an isolated disposable database and a safely owned verification environment; do not assume historical process IDs or ports are still available. Completion evidence: baseline/approval recorded and verification ownership identified.

- [ ] **S2 — Add deterministic reproductions before changing application behavior.** Add the new browser file using isolated owners, a fixed `en-US` locale, Europe/Paris time zone, 1280-by-900 viewport, and explicit clock installation before navigation. Implement the two independent-settings failure scenarios and configured-first-weekday navigation assertions from the validation section. Observe the incorrect pre-fix period labels/navigation with successful real report responses. Capture request/response ranges and first-failure evidence; do not accept a test that merely fails because Reports never loaded or the wrong endpoint failed. Keep any agent-owned server running after expected red tests. Completion evidence: recorded focused pre-fix failures attributable to R1, with successful report requests and independently failed settings GETs.

- [ ] **S3 — Add response-boundary navigation and unit coverage.** Add the focused helper in `app/utils/reports.ts`. Weekly shifts use date-only offsets from the returned start, not default-Monday period normalization or fixed elapsed-millisecond arithmetic. Month/year shifts reuse the existing calendar helper from the returned start. Invalid dates and non-integer or unrepresentable shifts return `null`; a null target must not issue a request or change the selection. Add unit cases for Sunday/Monday/non-Monday weeks, both directions, leap-month/year rollover, and invalid/boundary input. Do not change `shared/report-period.ts` or its existing tests’ expected contracts. Completion evidence: the new unit file and existing period/format/filter tests pass.

- [ ] **S4 — Make Reports consume one successful response snapshot.** Remove the Reports settings key/fetch/refresh/error/start-day calculation and the locally computed selected/current ranges. Preserve the existing report query/key, browser date/time-zone initialization, fetch watcher, resource registration, and selected-label success guard. Define one displayable-report computation based on initialized date/zone, present response, public `success` status, and no pending/report error. Use it consistently for labels, current-period detection, totals, rows, and estimate context. Format loaded labels from its returned period/range, never from settings or a fallback range. Previous/Next consume its range through S3’s helper and are disabled without it; the Current action remains available after browser initialization unless a successful response already contains today. Keep period/group/filter state local, and do not copy response data into a second cache. Preserve mounted tabs and filter presentation outside the result subtree. Show preparing/loading/unavailable-period states as specified in RNG-05; the unavailable-period copy is “Report period unavailable”. Retain the existing report error title and retry label, but retry only the report read. Completion evidence: response/date/total agreement through settings failure, loading, and retry, with all original interactions intact.

- [ ] **S5 — Finish regressions and update durable context.** Complete the delayed/superseded report request and report-error/read-only retry cases. Run the existing active Settings report-failure regression unchanged unless a locator requires a narrowly justified adjustment; its behavior must not be weakened. Clarify Proposed ADR 0061 that the returned interval governs presentation/navigation and that Reports does not depend on a second settings fetch. Add this corrective amendment and R1’s outcome to the milestone without rewriting historical red/green evidence or editing the previous approved plan. Completion evidence: targeted regressions and current records describe the actual behavior, with M45 open and ADR 0061 Proposed.

- [ ] **S6 — Verify the final source and stop before Review.** Run every final gate below, then focused and full browser suites against a tracked agent-owned server. Complete supported-width visual/keyboard checks and record exact commands, first failures, fixes, outcomes, source-copy equivalence if applicable, and cleanup. If any source/test change follows a check, repeat the affected checks and the complete final handoff sequence; do not substitute earlier M45 results. Stop only the owned server after all gates pass and verify its port is released. Hand off the diff/evidence for separate human code review without starting Review or declaring completion.

## Validation

### V1 — Initial SPA entry with settings unavailable

Seed Sunday settings and one 30-minute Idea-ticket entry dated `2026-10-11`. Freeze the browser on `2026-10-15T12:00:00Z`. Start on Clients, wait for mount, record document time origin, then fail only browser GET `/api/settings` with a private-detail 503 while allowing all report requests to reach the real API.

Open Settings to observe a real failed shared settings read and its safe modal feedback, dismiss it, and enter Reports through header navigation. Assert that the report succeeds with current range `2026-10-11` through `2026-10-17` and previous range October 4–10. Both loaded date-label locations, total, and allocation row must agree with the returned range and 30 minutes; no Monday range may label those values. Reports entry must not add its own settings GET, and no report-failure alert should appear solely because Settings failed. Assert unchanged document time origin and no exposed private error detail.

Run the entry/navigation case with the clock on Sunday `2026-10-11T12:00:00Z` as well. Under that clock, Next must return October 18–24, Previous must return October 11–17, and a further Previous must return October 4–10. Verify the corresponding current/prior totals, disabled Current state in the current returned week, and Current action recovery from an adjacent week. This catches the fallback-driven repeated/skipped-week path, not just label formatting.

### V2 — Independent settings refresh failure while Reports stays mounted

Start with Monday settings and entries on October 11 and 12, each 30 minutes, with the October 15 clock. Load Reports, choose Releases, and select the fixture row so client/project/release filters are populated. Capture a grouping-tab element and the document time origin. The Monday report initially has 30 current-period minutes.

Open Settings, choose Sunday, then fail subsequent GET `/api/settings` while permitting the real PATCH and every `/api/reports` read. Count settings PATCHes only after setup. Save once and observe the existing Settings saved/refresh-failed feedback. The successful refreshed report must return October 11–17 and 60 current minutes, despite shared settings data becoming unavailable.

Dismiss the modal while settings remains failed and assert the correct Reports date/total/rows, no false Reports error, retained Releases selection and readable filters, connected tab element, and stable time origin. Reopen Settings, restore GET success, and use its existing Retry loading settings action. Assert recovery, a consistent refreshed report, and exactly one settings PATCH throughout; retry must not resubmit the write.

Retain the existing Reports interaction scenario that fails `/api/reports` after a settings save. Together these prove distinct failures and read-only recovery without changing Settings modal implementation.

### V3 — Pending, superseded, and failed report reads

Use non-empty fixtures with distinguishable week/month/year totals. Hold a new-grain report request deterministically. Assert neutral loading-period text, absent Period totals and allocation rows/estimate context, disabled Previous/Next, and still-mounted grouping/filter controls. Do not use fixed sleeps.

Select another grain while the earlier request is held, allow the active response to succeed, then release the superseded response. Assert that visible period labels and values remain those of the active successful response. Also fail a report request independently of settings: verify unavailable-period text, safe error/read retry, no false empty/loaded report, retained grouping/filters, and correct recovery. Count requests to prove Reports retry performs no settings read or write. Release held routes in cleanup so failures cannot strand the suite.

### V4 — Unit and existing regressions

- New navigation tests must prove October 11 Sunday-start anchors shift to October 4/18, Monday and another configured first weekday remain aligned, and month/year calendar boundaries remain correct across leap years and rollovers.
- Invalid/non-integer/overflow targets must not produce invalid date anchors. Keep date-only arithmetic independent of host time zone.
- Run all existing Reports tests for completion-zone boundaries, owner isolation, selected metadata, archive history, grouping keyboard focus, retained-label race recovery, allocation formulas, SPA mutations, and the read-resource matrix.
- Re-run Settings failure/retry and same-tab invalidation suites. No new migration or security policy is required; existing API ownership tests remain the regression evidence for unchanged server behavior.

### V5 — Required commands and final server handoff

All database-backed commands and Playwright’s fixture process must use the same isolated test database and compatible test authentication environment as the owned app server. Never migrate/reset the user’s normal database. The following command names/configuration were verified in the repository; they have not been executed in this Plan session.

Run final non-browser gates before the final browser verification:

1. `pnpm db:migrate` against the isolated database, using existing migrations only.
2. `pnpm format:check`, `pnpm lint`, `pnpm check:duplicates`, `pnpm check:unused`.
3. `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, `pnpm build`.
4. `pnpm check:workflow` (the package command invokes `node scripts/check-workflow-docs.mjs`), `git diff --check`, and whitespace inspection of all new/untracked changed files.
5. Focused host-zone checks: `TZ=UTC pnpm exec vitest run tests/unit/report-navigation.test.ts tests/unit/report-period.test.ts` and the same command with `TZ=America/Los_Angeles`.

Use a genuinely isolated Nuxt build/cache directory for verification when this checkout also backs user-owned servers. If disposable verification copies are necessary, include all final untracked application/test files, preserve package/lockfile contents, verify source equivalence, and record paths/configuration. A shared root `node_modules/.cache/nuxt` through a parent symlink is not isolation; do not repeat the previous M45 cache incident. Do not alter repository configuration or install/upgrade packages to solve a scratch-environment problem.

Start and track an agent-owned server on a freshly checked unused port, or retain the owned server used for reproduction. Run the new focused browser file, then all Reports files with `CI=1 PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:<owned-port> pnpm exec playwright test tests/e2e/reports.test.ts tests/e2e/reports-boundaries.test.ts tests/e2e/reports-interactions.test.ts tests/e2e/reports-period-state.test.ts --workers=1 --retries=0`.

Run focused `tests/e2e/client-effect-failures.test.ts` and `tests/e2e/data-invalidation.test.ts` as needed, followed by the full repository suite using the same environment and `pnpm exec playwright test --workers=1 --retries=0` with no file arguments. Passing only focused tests, listing tests, or relying on historical 64/64 results is insufficient.

Keep first-failure evidence and the agent-owned server through failures. No automatic retries or blanket timeout increases. A bounded per-test timeout requires the duration/trace evidence specified by `docs/llm-workflow.md` and ADR 0050; it must not conceal state/locator/fixture defects.

At 1280 CSS px, inspect both loaded date labels, busy/error states, Sunday navigation, retained filters, modal dismissal/reopen/retry, and keyboard grouping/clear actions. Check no new page overflow; inspect the ordinary report and independent-settings-failure state, not just screenshots of loading. Only after all required checks pass, stop the owned server, verify its port is released, and clean up only agent-created database/process resources. Leave all user-owned or unknown services untouched.

Remote CI, live OAuth, deployment, and production-database checks are not authorized or required here. Local authenticated fixtures, real API/database assertions, both typechecks, build, and full Chromium execution provide this amendment’s verification evidence.

## Review-finding disposition

| Input                                                               | Classification and evidence                                                                                                                                                                                                                                                                      | Planned resolution and coverage                                                                                                                                                                                                                                |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1, Medium — settings failure relabels successful weekly aggregates | **Confirmed by current source and installed Nuxt tracing.** Reports computes fallback-Monday labels while the API uses persisted settings; failed refresh clears settings data. Related weekly navigation shares the same inconsistent boundary source. No browser reproduction claimed in Plan. | S2–S4 remove the duplicated dependency and make returned ranges authoritative. RNG-01–RNG-08 and V1–V4 cover initial SPA failure, mounted refresh failure, first-weekday navigation, stale-response safety, and recovery. S5–S6 record and verify the outcome. |
| Earlier four findings summarized by the review                      | Not new action items in this report; their implementation is present and must be protected, not reopened or silently replaced.                                                                                                                                                                   | Preserve existing time-zone, tabs, selected-label, resource-matrix, and SPA tests; run them in focused/full verification.                                                                                                                                      |
| Existing lint warnings and accepted completion proxy                | Explicitly not actionable M45 findings in the input review.                                                                                                                                                                                                                                      | No unrelated warning cleanup or schema/history change. Record any unchanged warnings accurately.                                                                                                                                                               |

No confirmed actionable finding is deferred or excluded.

## Risks and stop conditions

- Removing the direct fetch but also removing the settings resource would break still-mounted updates. Stop if the existing invalidation path cannot meet RNG-07 without changes to the shared invalidation system; do not redesign it in Build.
- Using `!pending` without success state can display inherited old data. Keep one authoritative display computation and prove pending/superseded behavior with held requests; do not bypass failures with stale-result caches or private framework state.
- Do not silently introduce server defaults, browser-local timestamp conversions of entry dates, API parameters, or response-field changes. If the existing response cannot support this plan, return for a new Plan.
- The Settings modal may continue reporting a failed settings refresh while Reports correctly succeeds. That is intentional separation of independent reads, not an error to hide or a reason to replay a successful write.
- Browser interception does not control server-side SSR reads. Use the specified SPA/shared-reader setup and verify actual failure counters, report responses, and unchanged time origin so the regressions are meaningful.
- Stop for human direction if new confirmed defects require unrelated product changes, schema/auth/dependency/workflow changes, modification of previously accepted policy, or edits outside the scoped files beyond a narrowly justified fixture helper. Preserve evidence rather than expanding scope.
- If a safe isolated database, cache/build environment, or owned server cannot be established, report the verification blocker. Do not attach to or terminate unknown services, skip full E2E, or claim readiness.

## Fresh-session Build handoff

Implement only this approved R1 amendment: remove Reports’ separate settings reader, use the successful API response range for dates and adjacent navigation, preserve Settings-owned failures/read-only retries and all existing M45 behavior, and add the specified regressions. Expected outputs are the focused page/utility/test changes, updated Proposed ADR 0061, and a human-readable M45 evidence log.

**Do not edit this approved plan during Build.** Do not rewrite the earlier approved plan or input review. Run all final local gates, focused and full E2E, and the supported-width keyboard/visual checks under the owned-server policy. Record limitations and first failures honestly; this Plan session has not run checks. The server/database/cache environment must be rediscovered safely rather than assuming historical resources still exist.

There are no blocking product questions after the human’s response-authoritative choice. The accepted completion-proxy limitation and absence of remote/production verification remain unchanged. Completion of Build stops before Review: hand off the plan path, focused diff, and verification evidence for separate human code review, leaving M45 open and ADR 0061 Proposed until the required human decisions.
