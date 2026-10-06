# M26 — Today current-day and current-time indicators

## Context

`/today` already highlights the Today/This week navigation action, but the weekly agenda does not distinguish the current date among its seven columns and neither time-scaled timeline marks the current time. The request is to make current day/time easier to locate without changing agenda dates, entries, or progress calculations.

**Plan review status: Approved via Plannotator on 2026-10-05.** Implementation is authorized within the scope below.

**Implementation status: Complete — implementation, verification, Plannotator code review, and human completion declaration recorded on 2026-10-05.**

## Approved scope

Approved via Plannotator on 2026-10-05, including the clarification that the clock remains in the page control row outside visible hours:

- Use the browser's local date and clock; initialize on the client and update the displayed minute at minute boundaries. Re-sync after the page becomes visible or regains focus.
- On `/today`, show a compact `Now HH:mm` indicator when the selected Day is today or the selected Week includes today. Use the app's existing 24-hour clock convention. Keep the existing Today/This week navigation control and its behavior.
- In the desktop Day timeline, draw a thin, accessible current-time marker with a time label when today is selected and the current minute is inside the configured visible-hours interval.
- In the desktop Week timeline, draw the same marker only in today's column when that week contains today and the current minute is inside the visible-hours interval.
- In Week headers (desktop and stacked narrow layout), visibly identify today's date with a `Today` label and an accessible current-date indication.
- On narrow Day layout, where entries are chronological cards rather than a time-scaled grid, the `Now HH:mm` indicator supplies the current-time cue. The stacked Week view likewise uses the page indicator and `Today` header label; do not add a fabricated timeline position.
- Keep the clock indicator visible for the current date/week even when the current time is outside the visible-hours interval. Place `Now HH:mm` in the existing page control row near the date/view controls (on both desktop and narrow layouts), not at the timeline boundary; omit the grid marker rather than pinning it to a misleading boundary.
- Keep the marker non-interactive (`pointer-events: none`) so existing drag, resize, edit, filters, and entry geometry are unaffected.

## Out of scope

- Changes to time-entry data, agenda APIs, settings/schema, time zones, server state, dependencies, or workday progress.
- Showing a current-time marker on a selected historical/future day or a week that does not contain today.
- Changing the configured visible-hours window or showing a grid marker outside that window.
- Persisting the selected date or adding a new date-navigation behavior.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- `docs/milestones/m5-today-agenda.md` — local-day semantics and visible-hours presentation
- `docs/milestones/m16-weekly-agenda.md` — Day/Week behavior and per-day headers
- `docs/milestones/m17-agenda-ui-refinements.md`, `docs/milestones/m18-agenda-layout-and-weekly-add.md` — responsive headers and fixed timeline geometry
- `docs/decisions/0012-today-agenda-settings-and-history.md`, `docs/decisions/0029-weekly-agenda-and-conflict-previews.md`, `docs/decisions/0030-agenda-view-preference.md`, `docs/decisions/0039-today-agenda-context-control-flow.md`

## Approach

1. Add a client-only clock state on the Today page, initially unset to avoid SSR/hydration disagreement. Update it at minute boundaries, and re-sync on visibility/focus. Derive current local date and minute from that one state.
2. Pass the current date/minute to the Day/Week agenda components. Reuse their existing visible-hours bounds and pixels-per-minute geometry; render the marker only for today's date and only within `[start, end)`. Layer the thin marker over the timeline/cards; make it ignore pointer events so it cannot intercept entry controls or gestures.
3. Identify today's Week header on desktop and in the stacked layout. Preserve selected-week navigation, date headings, and daily progress semantics.
4. Show the formatted local clock in the existing control row only when the selected period contains today, so mobile users and users outside visible hours still have a current-time cue.
5. Add focused E2E coverage with a deterministic browser clock for Day, Week, period/date changes, visible-hour boundaries, minute updates, and narrow-screen behavior. Run the standard project checks and record actual outcomes here.
6. After approval, add M26 to `PLAN.md`; no ADR is expected because this is a local presentation change with no durable domain or architecture policy.

## Files to modify

- `app/pages/today.vue` — client clock lifecycle, current-period indicator, and pass current date/minute.
- `app/components/TodayAgenda.vue` — current-time marker in the desktop Day timeline.
- `app/components/WeeklyAgenda.vue` — current-date header label and marker in today's desktop column.
- `tests/e2e/agenda-week.test.ts` — deterministic current date/time behavior across Day/Week, boundaries, updates, and responsive indicators.
- `PLAN.md` — record the approved M26 scope after plan approval.
- This milestone file — implementation journal and verification evidence.

## Reuse

- `app/pages/today.vue` already provides local-date semantics through `today(getLocalTimeZone())`, the `Today`/`This week` action, selected Day/Week range, and `navigator.language`.
- `app/components/TodayAgenda.vue` and `app/components/WeeklyAgenda.vue` already compute the fixed timeline scale and use the configured visible-hours bounds.
- `app/utils/agenda-week.ts` formats date-only values at local noon to avoid UTC date shifts; do not convert agenda dates through UTC.
- Existing E2E tests in `tests/e2e/agenda.test.ts` and `tests/e2e/agenda-week.test.ts` cover current-period navigation and responsive Day/Week rendering.

## Decisions and ADR links

- Approved interaction policy: show a live local clock only when the selected Day/Week contains today's local date; show a grid marker only within configured visible hours; identify today's Week header at all supported widths.
- Existing date-only, locale, visible-hours, Day/Week, and entry-geometry policies remain unchanged (ADRs 0012, 0029, 0030, and 0039).
- No new ADR is proposed unless implementation/review establishes a durable policy beyond this approved presentation scope.

## Implementation checklist

- [x] Obtain human approval of this plan before implementation.
- [x] Add client-local minute clock and period-aware `Now` indicator without hydration mismatch.
- [x] Mark today's Week header on desktop and narrow layouts.
- [x] Add current-time marker to the desktop Day timeline and today's desktop Week column only, within configured visible hours.
- [x] Verify keyboard/accessibility semantics and ensure the marker does not intercept existing pointer interactions.
- [x] Add deterministic E2E coverage for period changes, visible-hour boundaries, minute updates, and narrow layouts.
- [x] Run and record format, lint, typecheck, unit, E2E, build, workflow, and diff checks as available; document failures/deviations.
- [x] Submit the diff for human code review; Plannotator approved the full uncommitted diff on 2026-10-05 with no changes requested.
- [x] Record the human completion declaration before closing M26.

## Journal

### 2026-10-05 — Planning research

- Fact: the Day timeline is time-scaled on desktop and switches to chronological cards on narrow screens (`app/components/TodayAgenda.vue`). The Week timeline is time-scaled on desktop and stacked by date on narrow screens (`app/components/WeeklyAgenda.vue`).
- Fact: `/today` already derives local today and selected Day/Week state and applies the configured first weekday; Week headers currently have no current-date distinction.
- Fact: both desktop grids derive marker placement from configured visible-hour bounds and fixed pixels-per-minute scales. Existing entry position, duration, overlap, and progress behavior should remain unchanged.
- Decision proposed for review: use a live local-minute clock; provide a marker only on the desktop time grid for today's in-window time; provide a `Now` indicator and explicit Today header on narrow layouts, which have no time axis.
- Evidence: read the workflow, roadmap, relevant M5/M16/M17/M18 records, ADRs 0012/0029/0030/0039, `/today` source, Day/Week agenda components, and current agenda E2E tests. `git status --short` was clean before creating this plan. No application code changed.
- Open question (resolved by plan approval): whether to identify today's Week header separately from the `Now` clock. The approved scope includes a visible `Today` label.

### 2026-10-05 — Plannotator feedback and approval

- Feedback: clarify where the current-time indicator appears after the current time passes the configured visible-hours end.
- Decision (human-approved): keep the `Now HH:mm` indicator in the page's top control row beside the date/view controls; do not place it at the timeline boundary. The in-grid marker remains hidden outside visible hours.
- Evidence: the first Plannotator gate returned `decision: annotated`; after updating this clarification, the second gate returned `{"decision":"approved"}`. `node scripts/check-workflow-docs.mjs` and `git diff --check` passed. No application code had changed before approval.

### 2026-10-05 — Implementation and verification

- Fact: `/today` now keeps a client-local clock, refreshes it on minute boundaries and focus/visibility changes, and shows `Now HH:mm` only when the selected period contains today. The desktop Day/Week timelines draw a pointer-transparent current-time line only inside configured visible hours; the Week header marks today on desktop and narrow layouts.
- Fact: current date/time state is initialized after mount, avoiding SSR/client clock disagreement. No API, schema, dependency, time-entry geometry, or progress semantics changed.
- Decision: no ADR was added; this remains a client-side presentation behavior. Focused current-time E2E coverage lives in `agenda-week.test.ts`, which exercises both Day and Week; `agenda.test.ts` did not need a separate change.
- Evidence: focused `pnpm exec playwright test tests/e2e/agenda-week.test.ts --grep 'Today marks the current local date and time' --workers=1 --timeout=60000` passed (1 test). Full `pnpm exec playwright test --workers=1 --timeout=90000` passed (31 tests). Vitest passed (13 files / 72 tests).
- Evidence: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, `pnpm build`, `pnpm check:workflow`, and `git diff --check` passed. The build emitted only its non-fatal plugin-timing warning.
- Manual visual check: inspected temporary `/tmp/m26-day-current-time.png`, `/tmp/m26-week-current-time.png`, and `/tmp/m26-mobile-current-day.png`. Day/Week desktop markers align with the time grid; today's week column/header is highlighted; the narrow Week view shows Today and Now without horizontal overflow. Screenshots were not retained in the repository.
- Transient verification failures resolved: the first `pnpm typecheck` flagged Node `Timeout` versus browser timer typing; changed the timer handle to `number` and used `window.clearTimeout`. Initial lint warned about test-only formatting helpers; moved those helpers out of the evaluate callbacks. Final checks are clean.
- Non-fatal test-server output: full Playwright logged the existing Vite `ResizeObserver loop completed with undelivered notifications` message and expected router no-match warnings from M25 retired-editor tests; all tests passed.

### 2026-10-05 — Human code review and completion declaration

- Decision (human via Plannotator): the full uncommitted M26 diff was approved with no changes requested.
- Decision (human, in chat): “i declare this milestone complete”. M26 is complete.
- Evidence: `plannotator review --git --diff-type uncommitted --no-git-remote-check --json` returned `decision: approved`; the human completion declaration was received in this conversation on 2026-10-05.

## Verification

Plan review:

- [x] `node scripts/check-workflow-docs.mjs` — passed after the Plannotator feedback revision.
- [x] `git diff --check` — passed after the Plannotator feedback revision.
- [x] Human approval recorded before implementation; Plannotator returned `{"decision":"approved"}` on 2026-10-05.

Implementation verification (after plan approval):

- [x] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (13 files / 72 tests), focused Playwright (1 passed), full Playwright (31 passed), `pnpm build`, `pnpm check:workflow`, and `git diff --check` — passed. Build plugin-timing output and Playwright `ResizeObserver`/expected M25 router warnings were non-fatal.
- [x] Browser-checked current-date indication in Day and Week, current-minute placement and updates, dates outside the current period, visible-hours start/end/outside boundaries, narrow Day/Week cues, pointer-events, and page overflow. Manual desktop/mobile screenshot inspection recorded in the journal.

## Review status

- Plan review: Approved via Plannotator on 2026-10-05, after one annotated round of feedback.
- Code review: Accepted via Plannotator on 2026-10-05 (full uncommitted diff; no changes requested).
- Milestone completion declaration: Received in chat on 2026-10-05 — Complete

## Follow-ups

- None identified. Any different current-date/time policy or change to time-axis/data semantics requires human plan review before implementation.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in the journal and review status.
