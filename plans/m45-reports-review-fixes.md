# M45 — Reports review fixes

**Status: Approved by the human in Plannotator session `pn-f60bf4`.** This is a focused amendment to [M45](../docs/milestones/m45-reports-time-allocation.md), not a new product milestone. The original M45 approval (`pn-edefcf`) remains in force; the API/behavior refinements below are now implementation-authorizing.

## Context

The independent review found four issues:

1. `server/domain/reports.ts:187–188` compares UTC-valued ticket timestamps with unadjusted calendar midnights. A completion at October 1, 00:30 Europe/Paris appears in September's cohort rather than October's.
2. `app/pages/reports.vue:323` unmounts the grouping tabs whenever a request is pending. Arrow-key activation loses focus to `<body>` and cannot continue through the tabs.
3. `app/pages/reports.vue:115–116,228` derives filter labels only from period-relevant paths. Navigating a retained selection into an empty period shows its UUID in a disabled selector.
4. `tests/e2e/reports.test.ts:294` uses `page.goto()` after priming Reports. That replaces the Nuxt app and discards the cache the inactive-report test intends to exercise.

**Observed evidence:** `pnpm test` passed 86 tests. A separate isolated browser run passed all 54 repository scenarios plus two temporary reproduction scenarios that confirmed the defects; those temporary checks asserted the observed bugs, not corrected behavior. Logs are in `/tmp/btt-m45-review-ZWM4hn/review-full.log` and `review-focused-followup.log`. Initial sandbox failures were caused by Tailwind resolution in the isolated dependency links, corrected without changing repository source. The agent-created database was removed and port 3004 released afterward.

**Existing decisions to preserve:** owner-scoped server aggregation, date-only entry dates, configured week starts, calendar months/years, archived history, grouping/filter separation, and lifetime estimate usage for currently Done estimated tickets using `updatedAt` as the accepted completion proxy. No `doneAt` field is added.

## Scope and approved decisions

- Fix the four findings and add focused regression coverage within M45.
- Interpret the completion cohort in the browser's reporting time zone, matching its local calendar period. Extend the new Reports request/response contract explicitly rather than depending on the server's time zone.
- Preserve a selected hierarchy filter and its readable archive-aware label when a period has no matching history. An empty period must not silently clear the scope or disable its clear action.
- Keep Nuxt async data and the existing invalidation mechanism as the read-state owner. No polling, global cache change, private Nuxt APIs, or persisted report state.
- No schema, migration, dependency, auth/ownership-policy, deployment, CI-policy, or unrelated Agenda/Board behavior changes. The selected-filter lookup must enforce the existing ownership policy.

## Approach

### 1. Use explicit local-calendar completion boundaries

- Capture the browser's `getLocalTimeZone()` on mount; use the same zone for the current local date and report requests. Include it in the Reports query and async-data key. Do not send a report request until both date and zone are initialized.
- Add a required `timeZone` parameter to `GET /api/reports`; update every repository caller. This endpoint is part of the unaccepted M45 changes, so no compatibility fallback is proposed. Validate supported zones and return the existing typed HTTP 400 validation response for missing/invalid input, not a raw `RangeError` or silent UTC fallback. Return the effective zone in the typed report response.
- Keep the existing date-only current/prior ranges and time-entry SQL comparisons unchanged. Separately derive completion bounds as **local midnight at the period start, inclusive**, and **local midnight on the following calendar day after the period end, exclusive**.
- Convert each boundary independently with the already-installed `@internationalized/date` APIs. Do not use a fixed offset or add fixed 24-hour durations: a DST week can be 167 or 169 hours. Reject unrepresentable boundaries explicitly.
- Compare those UTC instants against the existing UTC-valued `timestamp without time zone` column with explicit UTC normalization, independent of PostgreSQL/session time zone. Reuse the exact same predicate for estimate aggregates and cohort-derived hierarchy paths.
- Keep the lifetime tracked/estimate formula unchanged. Clarify the completion time-zone basis alongside the existing `updatedAt` caveat. Refine Proposed ADR 0061 after plan approval; do not accept it yet.

### 2. Keep grouping controls mounted

- Move the allocation heading and `UTabs` outside the conditional loading/results subtree. Keep the same tab component, values, automatic keyboard activation, and stable accessible names through initial load, refresh, empty results, and fetch errors.
- Apply loading/`aria-busy` state to the results region; do not move focus to a spinner, replace the tab list, or switch to manual activation to conceal the problem. Retain the current error/retry behavior and prevent stale rows from acting as the new grouping while its request is pending.
- Inspect the existing Agenda and Ticket Board control/error structure for parity. Preserve their rendering and interactions; no generic toolbar refactor is needed for this fix.

### 3. Preserve selected filter context without broadening report data

- Add bounded `selectedFilters` metadata to the Reports response: for each requested client/project/release selection, return its owned ID, current name, and effective archived state (including ancestors), or `null` when unavailable. Resolve this independently of period activity, without enumerating all historical hierarchy or returning raw entries.
- Keep `paths` limited to the approved current/prior/cohort sources. Merge only the current selected option into each Reports selector when absent from those paths; deduplicate by ID and preserve the existing search/cascade/reset behavior.
- Retain at most the three selected display labels locally while a request is pending or fails; reconcile them with the next successful server response so rename/archive changes do not leave permanently stale labels. This is bounded local selection presentation, not a separate report/entity cache.
- A selected control remains enabled and individually clearable even when there are no period options. Preserve client → project → release clearing rules and global Clear filters. Never render an internal UUID as the user-facing label; unavailable/deleted/foreign selections get a neutral unavailable label and a clear action, not disclosed foreign metadata.
- Keep this option-merging behavior Reports-specific unless inspection proves it is an existing shared invariant. Do not broaden Agenda/Board filter semantics or reset a valid selection merely because the current report is empty.

### 4. Make invalidation evidence meaningful

- Replace the mid-scenario `page.goto()` with authenticated shell/router navigation. Record `performance.timeOrigin` after the initial mount and assert it is unchanged through navigation, mutation, and return to Reports.
- Keep the initial read, UI mutation, and refreshed duration assertions; do not replace the mutation with a direct database write. Use short separate scenarios for time-entry and hierarchy/ticket mutations rather than expanding one long timeout-prone test.
- A Reports remount currently fetches again even without invalidation. Preserve that behavior, but do **not** treat a fresh response on return alone as proof that invalidation registration works.
- Add an active-reader check: open Settings over Reports, change the configured week start, and verify the still-mounted report refreshes its interval/totals without document navigation. Include a failed-refresh/retry case that retries reads, not the successful settings write.
- Put the existing Reports resource list in a small typed utility used by the actual registration and unit coverage. Check it against the centralized client/project/release/ticket/time-entry/settings mutation map; add no new resources. Retain the existing failed-write/no-invalidation policy.

## Files to modify

- `app/pages/reports.vue` — browser zone, query/key, stable grouping controls, selected-filter presentation, loading/error behavior.
- `app/utils/reports.ts` — focused option-merging/read-dependency helpers alongside the existing formatting utilities.
- `shared/report-period.ts`, `shared/reports.ts` — zoned completion boundaries and explicit request/response metadata types.
- `server/api/reports/index.get.ts`, `server/domain/reports.ts` — zone validation, normalized completion predicate, owner-scoped selected-filter metadata.
- `tests/unit/report-period.test.ts`, `tests/unit/report-format.test.ts` (or a focused Reports utility test), `tests/unit/app-data-resources.test.ts` — deterministic boundary, option-merging, and dependency coverage.
- `tests/e2e/reports.test.ts` — API and browser regressions; split into focused Reports test files if needed for readability.
- `docs/decisions/0061-reports-time-allocation.md`, `docs/milestones/m45-reports-time-allocation.md`, and this plan — amended semantics, approval, review findings, checks, and follow-ups. No product-roadmap scope change is needed.

## Reuse and research

- Existing `getReportPeriodRange`, date validation, Effect HTTP/validation boundary, owner joins, `useHierarchyFilters`, `trackAppApiFetch`, and mutation-resource map.
- Existing shell navigation, `waitForClientMount`, API fixtures, and `performance.timeOrigin` checks in `tests/e2e/data-invalidation.test.ts`.
- [Adobe CalendarDate conversion guidance](https://react-spectrum.adobe.com/internationalized/date/CalendarDate.html): conversion to a native instant takes an explicit time zone. Installed `@internationalized/date` declarations confirm `CalendarDate.toDate(timeZone)` is available; an exploratory command confirmed Paris DST weeks of 167/169 hours and Kathmandu's fractional-hour offset. No package installation is needed.
- [Nuxt UI Tabs](https://ui.nuxt.com/docs/components/tabs) and [SelectMenu](https://ui.nuxt.com/docs/components/select-menu): retain controlled tabs and native clear/value-key behavior rather than compensating with focus hacks or smaller hit targets.
- ADRs [0011](../docs/decisions/0011-manual-time-entry-history-and-slots.md), [0042](../docs/decisions/0042-desktop-only-ui-and-spacing.md), [0050](../docs/decisions/0050-e2e-verification-and-server-handoff.md), [0051](../docs/decisions/0051-same-tab-api-data-invalidation.md), and [0057](../docs/decisions/0057-sibling-ui-consistency-and-shared-presentation.md). Read the relevant project-local Nuxt UI/Effect/Oxc skills before implementation.

## Steps

- [x] Obtain explicit approval of this amendment; record the decision in M45 before application edits (`pn-f60bf4`).
- [x] Add deterministic regressions for timezone boundaries, consecutive keyboard tab changes, retained filters, and SPA navigation/invalidation; observe the relevant pre-fix failures without automatic retries.
- [x] Implement the zone contract and UTC-normalized cohort predicate; update API callers and Proposed ADR 0061.
- [x] Keep grouping controls stable and add selected-filter metadata/option merging, preserving existing cascade and archive presentation.
- [x] Correct the SPA scenario and add active Settings refresh plus shared resource-matrix coverage.
- [x] Run the final verification below and record commands/outcomes and manual findings in M45: 104 unit tests, 12 focused Reports tests, full 64/64 Playwright tests, both typechecks, build, and all remaining gates passed. The agent-owned server was stopped and its port released. Hand off for separate human code review; M45 remains open and ADR 0061 Proposed until the required human decisions.

## Verification

### Targeted acceptance checks

- Completion bounds: UTC, Europe/Paris, America/Los_Angeles, and Asia/Kathmandu; week/month/year rollover; inclusive start and exclusive end; DST forward/back; invalid zones and unrepresentable dates. Repeat focused unit checks under different host `TZ` settings to detect implicit server-local conversion.
- API: seed exact ticket update instants around boundaries, including the October 1, 00:30 Paris reproduction. Assert current Done + estimate requirements, unchanged lifetime usage and date-only period totals, cohort-only paths/rows, and owner isolation. Update invalid-date/period tests with valid zone inputs so they still exercise their intended validation.
- Keyboard: delay a response deterministically, use consecutive arrow keys without refocusing a tab, and assert focus/selection before and after refresh. Repeat through error/retry and empty results.
- Filters: exercise client, project, and release selections across empty periods and grain changes; verify readable names/archive labels, per-filter clearing, parent/child clearing, global reset, metadata refresh after rename/archive, and unavailable/foreign metadata handling.
- Invalidation: use real UI writes and SPA navigation with stable document time origin; cover the existing mutation-resource matrix and a still-mounted Reports week-start update. Preserve failure messages and read-only retry semantics.
- Manual review at 1280 CSS px: keyboard-only grouping/filter/row navigation, loading/error recovery, readable selected filters and archived labels, and no supported-width layout regression.

### Final gates and server ownership

Run against the final worktree, with database migrations on an isolated test database:

1. `pnpm db:migrate`, `pnpm format:check`, `pnpm lint`, `pnpm check:duplicates`, `pnpm check:unused`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, `pnpm build`, `pnpm check:workflow`, and `git diff --check`; include whitespace checks for untracked files.
2. Start and track an agent-owned app server on an unused port, or retain the tracked server used for pre-fix browser reproductions. If that server is already running after an expected regression failure, keep it available through diagnosis and final gates. Isolate generated build/cache files from running servers; do not repeat the earlier shared Nuxt-cache build issue.
3. Run focused Reports tests, then the full suite with `CI=1 PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:<owned-port> pnpm exec playwright test --workers=1 --retries=0`.
4. Preserve first-failure evidence and keep the agent-owned server running during diagnosis. No automatic test retries or blanket timeout increases. After all required checks pass, stop only the tracked server and verify its port is released.

## Open questions and tradeoffs

Approval in session `pn-f60bf4` explicitly authorizes the required Reports `timeZone` parameter and bounded selected-filter metadata extension; no additional product choice is needed. These are refinements to the new M45 API, not changes to stored timestamps or the existing time-entry date contract.

Server-resolved selected labels add a small bounded lookup but avoid keeping renamed/archived selections permanently stale. Explicit zoned boundaries add conversion tests but preserve local-calendar meaning across DST without a dependency or schema change. The accepted `updatedAt` completion-proxy limitation remains unchanged.

## Planning verification

- `pnpm exec oxfmt --check plans/m45-reports-review-fixes.md docs/milestones/m45-reports-time-allocation.md` — passed.
- `node scripts/check-workflow-docs.mjs` — passed.
- `git diff --check` and new-file `git diff --no-index --check /dev/null <file>` checks for both planning artifacts — no whitespace diagnostics. The new-file comparisons exit 1 because the files differ from `/dev/null`, not because of whitespace errors.
- No application code is authorized or changed by this planning step.
