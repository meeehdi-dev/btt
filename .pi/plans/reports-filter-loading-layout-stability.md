# M45 Focused Amendment — Reports filter-loading layout stability

**Status: Proposed for Plannotator approval.** This is a focused presentation amendment to the active M45 Reports work, not a new product milestone. It authorizes no implementation until approved. The original M45 scope and its approved amendments remain in force except for this narrowly described loading-layout behavior.

## Purpose and desired behavior

Changing a hierarchy filter starts a keyed Reports request. While it is pending, the current page removes the two summary cards and allocation rows, replacing them with a compact loading card. The page therefore becomes much shorter during the request and expands again when the new response arrives. Keep the summary/results layout footprint stable while that request is pending, without showing stale totals, rows, or estimate information as if they belonged to the newly selected filter.

The intended interaction is: changing a filter leaves the toolbar and grouping controls in place; a neutral loading state appears in the existing content footprint; no prior report values are visible or available to assistive technology; and the newly selected scope's values replace the placeholder only after its successful response. The content may naturally resize once the new response is displayed.

**Scope assumption:** the reported shift is on `/reports` when a hierarchy filter triggers a report read. Agenda and Ticket Board loading behavior are not included.

## Scope and non-goals

### In scope

- Preserve the rendered heights of the Reports summary area and allocation-results area while a filter-driven read is pending.
- Keep the current response-authoritative loading/error rules, accessible busy state, filter values, grouping controls, keyboard focus, and error/retry behavior.
- Add one deterministic browser regression that holds a real filter request and verifies stable geometry and non-disclosure of prior values.
- Append implementation and verification evidence to the active M45 journal after approval.

### Out of scope

- Changes to report calculations, API/request/response contracts, SQL, date/time-zone semantics, selected-filter metadata, or same-tab invalidation.
- Keeping stale report values visible, caching another copy of a prior report, or changing which controls are usable during loading.
- General skeleton/loading redesign, layout changes to Agenda or Ticket Board, new components/dependencies, an ADR, a roadmap change, or changes to unrelated existing work.
- Re-running a previous M45 approval by editing its plan, review reports, or other protected input artifacts.

## Inputs and current-state evidence

### Governing context

- `AGENTS.md`, `docs/llm-workflow.md`, and `PLAN.md`.
- Active M45 scope and execution record: `docs/milestones/m45-reports-time-allocation.md`.
- Approved Reports review-fix amendment: `plans/m45-reports-review-fixes.md`, Plannotator session `pn-f60bf4`.
- Response-authoritative period amendment: `plans/m45-reports-response-range-fix.md`.
- Approved verification-fixes amendment: `plans/m45-reports-verification-fixes.md`, with its approval and evidence recorded in the M45 journal.
- Proposed ADR 0061: `docs/decisions/0061-reports-time-allocation.md`.

### Verified facts

- In `app/pages/reports.vue`, `displayedReport` is null until the initialized, current async read is successful and not pending or failed. This correctly prevents values from an inherited/old async-data response being presented for a new filter.
- The template conditionally removes the summary grid while `displayedReport` is null and substitutes one compact loading card. The report-results section stays mounted but has no loaded content during that state. The allocation heading and tabs remain mounted separately.
- The client/project/release controls are outside that conditional results content. The existing M45 browser coverage already checks held report reads, loading/error states, filter-label retention, and mounted grouping controls. In `tests/e2e/reports-interactions.test.ts`, a selected-client request can be held while another request is started, making it a suitable real-request test location.
- The accepted response-range amendment explicitly requires values and result content to remain hidden until the current successful response. It also rejects a parallel last-success report cache. This amendment preserves those requirements.
- The current worktree contains substantial uncommitted M45 work, including the Reports page and tests. The M45 journal records prior checks, but those results do not verify a new production-source change.

### Hypothesis and open questions

- **Hypothesis:** the vertical jump is caused by the conditional removal of the summary and allocation content, rather than the filter controls changing size. This is supported by the current template but has not been measured in a browser during Plan.
- **Open question:** none blocks the proposed fix. Build must reproduce and measure the affected regions first. If the observed shift is instead in the toolbar/filter-control geometry, stop and ask before widening this scope.

## Decisions and rationale

### D1 — Keep response-authoritative semantics

Do not render old report values during loading. Before starting a read, retain only the measured heights of the currently displayed successful summary and results regions. Use those dimensions as temporary minimum heights while the current request is pending, with the existing neutral loading state and `aria-busy` behavior. This is geometry state only, not report data or a second cache.

Keep the summary and results reservations separate: the grouping heading/tabs sit between them and must not move when either dynamic region is replaced. Apply each reservation only to its own region. Do not keep old values in hidden markup or use them to construct new visible output.

On initial load, when no successful layout has been displayed, retain the current compact preparing/loading behavior; there is no previous footprint to preserve. When the active request settles, release the temporary reservations and show its successful report or the existing safe error/retry state. A successful report may then resize naturally to fit its new rows. A superseded request must not release the reservation while the active request remains pending.

### D2 — Keep the change local and test actual filter behavior

Use the existing page, async-data state, and Reports E2E fixtures. Do not add a shared layout abstraction, request-generation mechanism, endpoint, dependency, or test framework. The regression must hold a real owner-scoped Reports request caused by selecting a hierarchy row, not substitute a mocked report response.

### D3 — Treat current M45 verification as historical until repeated

This is a production-template change on top of a worktree with extensive M45 edits. After implementation, the complete final checks and full E2E run required by M45 still apply. Earlier M45 passing results are useful history but are not final verification for this new change. Preserve all unrelated and already-approved work.

## Requirements and acceptance criteria

- **RFL-01 — Stable vertical footprint:** With a successful non-empty report visible, selecting a hierarchy row and holding its report request changes neither the summary slot nor the results slot's top position or height by more than 1 CSS pixel. The grouping controls and filter toolbar also remain at their prior positions.
- **RFL-02 — No stale values:** During the held request, prior totals, row text, shares, changes, and estimate context are not visible and are absent from the accessible results. The existing loading status and `aria-busy` state are exposed. The selected hierarchy filter remains readable, clearable, and usable.
- **RFL-03 — Correct replacement:** When the held real response is released, the new selected-scope total and rows appear; rows from outside that scope are not shown. The temporary height reservations are removed, so the layout can fit the returned content rather than retaining the previous report's height.
- **RFL-04 — First load and errors remain safe:** Initial loading still works without a prior measured height. A failed current read continues to show the existing safe error/retry behavior and never displays prior values as current. No report or filter state is reset by the visual reservation.
- **RFL-05 — Superseded reads remain safe:** If another filter/grain change supersedes a pending read, the original successful layout reservation remains until the active request settles; an older response cannot reveal stale values or release the active loading state prematurely.
- **RFL-06 — No product/data changes:** Report API, SQL, data ownership, filters, period semantics, response authority, grouping/tab activation, and invalidation remain unchanged. No new dependency, schema, ADR, or application-wide loading policy is introduced.
- **RFL-07 — Honest M45 handoff:** Record this amendment and its exact test/check results in the M45 journal; keep ADR 0061 Proposed and M45 open until its separate acceptance gates are satisfied.

## Ordered implementation checklist

- [ ] **S1 — Re-establish the baseline and reproduce the shift.** Read this approved plan, the active M45 journal, and the referenced approved amendments. Inspect `git status`, staged and unstaged changes, and all relevant tracked/untracked files; preserve all current M45 work. At 1280 CSS px, load a real non-empty report, select a hierarchy row, and hold the ensuing `/api/reports` response after the real server has produced it. Measure the summary, results, grouping controls, and filter-toolbar bounding boxes before and during the pending read. Confirm that the current source's conditional content change reproduces the reported jump. Record the plan approval and ownership of any verification server/database. Stop for clarification if the observed cause differs from this plan.
- [ ] **S2 — Reserve the dynamic summary and results footprints.** In `app/pages/reports.vue`, add narrowly scoped element references and temporary minimum-height state for the summary region and the report-results region. Capture each region's rendered height only while it contains a successfully displayed current report and before triggering the next keyed read. During pending state, retain those heights and render the existing safe loading presentation without exposing prior values; keep the result region busy and the grouping/filter controls mounted. Maintain the original reservation through superseding filter/grain changes rather than measuring a smaller loading placeholder. Release the reservations when the active read settles, then render its new successful data or the existing failure/retry state. Do not add report-data caches, private Nuxt APIs, fixed long-term heights, or changes to API/read ownership.
- [ ] **S3 — Add a deterministic filter-loading regression.** In `tests/e2e/reports-interactions.test.ts`, add a focused scenario using existing owner and report-fixture helpers. Seed two real owner-scoped hierarchy rows with selected-period work, load Reports successfully, capture the summary/results/control bounds, and intercept the request caused by selecting one row. Fetch the real response but hold its delivery so the browser remains pending. Assert RFL-01/RFL-02, including that the selected filter and grouping controls remain mounted and the prior values are unavailable. Release the response; assert its filtered total/row, absence of the other row, and release of temporary geometry reservation. Always release held routes before fixture cleanup. Avoid sleeps, retries, timeout increases, and direct database aggregate mocks.
- [ ] **S4 — Record the amendment without rewriting history.** Append the approval, brief implementation description, reproduction/measurement, exact regression command/result, final verification results, manual checks, deviations, and follow-ups to `docs/milestones/m45-reports-time-allocation.md`. Preserve its previous findings and historical check outcomes. Do not modify `PLAN.md`, ADR 0061, prior approved plan files, or review inputs.
- [ ] **S5 — Re-run final verification and stop before Review.** Run the focused layout regression, the full Reports and Settings/invalidation coverage, all required M45 non-browser gates, and the complete repository Playwright suite against a safely owned app server and isolated test database. Inspect the final diff and the 1280 CSS px interaction. Keep the server running during failures; stop it only after all required checks pass and verify its port is released. Hand off for separate human code review; do not accept ADR 0061 or declare M45 complete.

## Files and reuse

### Expected changes

- `app/pages/reports.vue` — separate, temporary geometry reservations for summary and results while the current read is pending; preserve all response-authoritative display and error behavior.
- `tests/e2e/reports-interactions.test.ts` — real held-filter-request geometry and stale-value regression.
- `docs/milestones/m45-reports-time-allocation.md` — approval, journal, validation, and handoff evidence.
- This plan is saved under `.pi/plans/` and must remain unchanged during Build.

Reuse `trackAppApiFetch`, the public `pending`/`status`/`error` state, `displayedReport`, the existing report-key watcher, `createTestOwner`, `createReportFixture`, `createReportTicket`, `createReportEntry`, the existing route interception pattern, and the current report error/retry and loading text. No shared composable or fixture-helper change is planned unless implementation discovers a directly necessary, narrowly scoped reuse.

## Validation

### Focused browser regression

Use the existing real app server and isolated test database with the standard one-worker, zero-retry Playwright settings. Add an unambiguous test title that can be selected alone. The test must establish a successful report before the geometry baseline, select an actual report row, and hold the matching filtered request only after the server has generated the real response. It must compare summary/results bounds and the stable control positions while pending, check stale content is unavailable to users and assistive technology, and then verify the current response replaces it. The request must be released in `finally` before fixture cleanup.

### M45 regression suite and final gates

The following commands were verified in the active M45 verification plan; run them from the implementation worktree or its source-equivalent isolated verification copy. The API/database fixtures and app server must share a disposable database/auth environment; never migrate or reset the normal database.

- Run the focused selected-filter layout scenario in `tests/e2e/reports-interactions.test.ts`.
- Run all four Reports files: `tests/e2e/reports.test.ts`, `tests/e2e/reports-boundaries.test.ts`, `tests/e2e/reports-interactions.test.ts`, and `tests/e2e/reports-period-state.test.ts`.
- Run `tests/e2e/client-effect-failures.test.ts` and `tests/e2e/data-invalidation.test.ts`.
- Run the complete Playwright suite with no file/grep arguments, one worker, and zero retries. Use `CI=1`, `PLAYWRIGHT_SKIP_DEV_SERVER=1`, and `PLAYWRIGHT_BASE_URL` for the tracked agent-owned server.
- Repeat the full M45 non-browser gate set after the final source change: isolated `pnpm db:migrate` using existing migrations only; `pnpm format:check`; `pnpm lint`; `pnpm check:duplicates`; `pnpm check:unused`; `pnpm typecheck`; `pnpm typecheck:tsgo`; `pnpm test`; `pnpm build`; `pnpm check:workflow`; `git diff --check`; and whitespace/conflict-marker checks for changed untracked files. Run the two report period unit suites under both `TZ=UTC` and `TZ=America/Los_Angeles` as required by the active M45 verification plan.

Keep first-failure evidence visible; do not add retries, global timeout changes, test exclusions, or a duplication-baseline change. If using an isolated copy to avoid shared Nuxt cache effects, verify source and dependency-manifest equivalence. Complete all checks on the final source after any fixes, then stop only the owned server and verify the port is released. Remote CI, live OAuth, deployment, and production-database checks are not authorized or required.

### Manual review

At the supported 1280 CSS px desktop floor, load a non-empty report, change a client/project/release filter, and inspect the held loading state. Confirm summary/results/control positions do not jump; the loading state is clear; no stale values can be seen or reached by keyboard/screen reader; focus, filter clear/search/cascade, and grouping selection continue to work. After the request settles, confirm the filtered rows are correct and the reserved layout adapts to the new response. Also inspect first-load and report-error/retry states and confirm no page overflow. Record actual checks and outcomes as agent review, not human acceptance.

## Risks and stop conditions

- The exact browser geometry has not been measured during Plan. If S1 does not reproduce a vertical change in the summary/results regions, stop and ask rather than broadening into filter-control redesign.
- Geometry must be retained without showing old report values. If that cannot be done using measured dimensions and the existing async state without a new report cache, private Nuxt state, or changed response/error semantics, stop for a new Plan.
- A changed response is allowed to produce a different layout after it settles; this task prevents the transient loading collapse, not every data-dependent reflow. Initial load has no earlier report footprint to retain. Existing error behavior remains authoritative when a request fails.
- Current M45 verification results are recorded history. Do not describe them as final evidence for this new source change; repeat the approved checks after implementation.
- The worktree contains uncommitted M45 implementation, tests, and documentation. Do not reset, clean, replace, or reformat unrelated changes or approved input artifacts. If any unexpected verification requires widening scope or changing a protected M45 decision, stop for a new Plan.

## Fresh-session Build handoff

Implement only this approved M45 presentation amendment: preserve the separate summary/results layout footprints while a hierarchy-filter request is pending, never expose the old report as current, add the real held-request browser regression, and record evidence in the active M45 journal. Preserve the existing response-authoritative period/navigation semantics, filter and grouping behavior, and all current M45 work. No API, server, schema, dependency, ADR, roadmap, or unrelated test changes are authorized.

The approved plan file must not be edited during Build. Run the focused regression and the complete final M45 checks, including all E2E/browser tests, with the server/database ownership rules above. Approval of this focused plan is not human code acceptance, acceptance of ADR 0061, or an M45 completion declaration. After checks pass, stop before Review and hand off the diff and evidence for separate human code review.
