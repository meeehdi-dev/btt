# M30 — Agenda toolbar and timeline polish

> **Status: Complete — approved plan, implementation, local verification, Plannotator code review, and human completion declaration recorded on 2026-10-07.**

## Context

M29 made `/agenda` a Week-only page and placed date navigation and hierarchy filters in a single toolbar. The toolbar currently shows a “This week” action and conditionally adds a separate `Now HH:mm` badge only when the selected week includes today. Changing between the current week and another week therefore changes the toolbar's contents and available width. The weekly timeline also reserves a 3.5rem left column for hour labels.

### Observed facts

- `app/pages/agenda.vue` renders a “This week” button that jumps to the current week and a separate clock badge gated by `isCurrentPeriod`.
- `app/components/WeeklyAgenda.vue` draws the red current-time line only in today's column, when today is in the selected week and the current time is within visible hours.
- The weekly timeline, header, and out-of-hours entry rows use a 3.5rem time-label column. Hour labels are right-aligned with a 4px inset.
- ADR 0042 sets the supported desktop viewport floor to 1280 CSS px and requires standard interactive-control sizing. M29's filter controls are 32px high.
- Existing deterministic Playwright coverage checks current-time updates, period navigation, marker visibility, toolbar sizing, and the 1280px agenda layout in `tests/e2e/agenda-week.test.ts`.
- New M30 verification found that changing from `9/16/2024 – 9/22/2024` to `9/9/2024 – 9/15/2024` moves the filters 8.25px; the selected-week range label is one character shorter. This remains a hypothesis about the source until the range-button geometry is directly measured.

### Hypothesis

The current-week-only `Now` badge changes the toolbar contents when navigating away from or back to the current week. Separately, the selected-week range label has varying intrinsic width and can move the filters. Reserving adequate width for that range selector should prevent this remaining movement while retaining the full range label. The human answered Yes to adding this clarification to M30; browser verification confirms a 14rem minimum keeps the tested week labels and filter position stable at 1280 CSS px.

## Approved scope

The original M30 presentation changes and the selected-week range-width clarification were approved via Plannotator on 2026-10-07. The revised combined plan received explicit Plannotator gate approval.

- Replace the “This week” button's visible label with the current local date and time, for example `9/7, 16:18`. Format the date numerically using the browser locale and retain the existing 24-hour `HH:mm` convention. Show this current date/time regardless of which week is selected; clicking the button must continue to navigate to the current week. Preserve its existing highlighted primary/soft appearance when the selected week is current and its neutral/ghost appearance for other weeks.
- Remove the separate conditional `Now HH:mm` badge. Preserve the red current-time line in today's timeline column under its existing selected-week and visible-hours conditions, along with the current-day styling and accessible date indication.
- Reserve enough width for the selected-week range button so changing between weeks with different label lengths does not move the filter bar. Keep the full localized range visible and its accessible name intact; confirm the sizing at 1280 CSS px. This clarification was approved by the human in Plannotator's answer to Q1 on 2026-10-07.
- Add a vertical Nuxt UI `USeparator` (`orientation="vertical"`) between the date/navigation controls and the hierarchy-filter bar. Keep the row and controls aligned at the established 32px height and verify that the four filters remain usable at 1280 CSS px.
- First reduce the weekly hour-label gutter from 3.5rem to 2rem, consistently across the day-header/timeline grid and before/after-visible-hours rows. Keep labels right-aligned and verify `20:00` remains fully visible; if 2rem clips the label, use the smallest wider gutter that fits and record the measured outcome. Do not change vertical timeline geometry.
- Add or update deterministic browser coverage for current date/time text, minute updates while viewing both current and non-current weeks, the unchanged current-week action, current-day marker behavior, divider placement, and hour-label fit.
- Record implementation and verification evidence in this milestone file and add M30 to `PLAN.md` only after plan approval.

:::question
Should M30 also reserve stable width for the selected-week range button so its variable-length localized date range cannot move the filters?

The focused browser check found an 8.25px filter-bar shift when switching from `9/16/2024 – 9/22/2024` to `9/9/2024 – 9/15/2024`. The full range label can remain visible and unchanged; only its reserved width would be stabilized.

- [x] Yes — reserve enough width for the full range label and verify the toolbar at 1280 CSS px.
- [ ] No — keep the range button content-sized and limit M30 to removing the conditional `Now` badge.

Answer: Yes, approved via Plannotator on 2026-10-07. The revised combined plan received explicit Plannotator approval on 2026-10-07.
:::

## Out of scope

- Changes to week navigation semantics, date queries, locale/week-start rules, time-entry data or interactions, current-day detection, visible hours, progress, APIs, schema, authentication, dependencies, or stored data.
- Changes to hierarchy filter behavior, filter/search contents, or the page's 32px toolbar-control sizing.
- Changes to the red current-time marker's color, position, visibility rules, or pointer behavior.
- Broad spacing/layout changes outside the requested divider and hour-label gutter.
- An ADR: this is a focused presentation adjustment with no proposed domain, architecture, or durable interaction-policy change.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- `docs/milestones/m26-today-current-day-and-time-indicators.md` — current local clock and red timeline marker behavior
- `docs/milestones/m28-desktop-only-ui-cleanup.md` — supported desktop viewport and compact spacing direction
- `docs/milestones/m29-today-week-only-ui-polish.md` — current toolbar and Week-only Agenda behavior
- `docs/decisions/0029-weekly-agenda-and-conflict-previews.md` — week semantics and fixed timeline interaction policy
- `docs/decisions/0042-desktop-only-ui-and-spacing.md` — 1280px support floor, compact spacing, and control sizing
- `docs/decisions/0044-week-only-agenda-and-status-selector.md` — canonical Week-only Agenda behavior
- [Nuxt UI Separator component](https://ui.nuxt.com/docs/components/separator) — vertical orientation API
- `app/pages/agenda.vue`, `app/components/WeeklyAgenda.vue`, `tests/e2e/agenda-week.test.ts`

## Approach

1. Reuse `currentTime`, its minute-boundary refresh, and its visibility/focus synchronization in `app/pages/agenda.vue`. Derive the current date and locale-formatted numeric month/day from that client-local value; append the existing zero-padded 24-hour clock. Keep the current-week action available while another week is selected, and expose an accessible name that clearly identifies the action.
2. Give the selected-week range button enough stable width for its full locale-formatted label so filters retain a constant horizontal start position as weeks change. Verify the chosen width at 1280 CSS px.
3. Remove only the separate `Now` badge. Keep passing the existing current date/minute to `WeeklyAgenda` so its red marker remains tied to today's column and the configured visible-hours interval. Avoid adding any new selected-week-dependent toolbar content.
4. Insert a Nuxt UI `USeparator` in vertical orientation between the date/navigation group and the filter group. Keep its height within the existing 32px toolbar row and preserve the filter group's usable width at 1280 CSS px.
5. Change all corresponding weekly grid track definitions together from 3.5rem to 2rem initially. Retain the current right alignment/inset of hour text and all vertical sizing, pointer geometry, and entry positions. If `20:00` is clipped, increase the gutter only enough to fit and record the resulting dimension.
6. Update `agenda-week.test.ts` to use the button's stable accessible action name, assert the localized current date/time remains visible while navigating across weeks and updates at a minute boundary, verify its current-week highlight toggles without changing its date/time content, and continue asserting the red marker appears only in the current day column. Assert filter-bar position stays fixed across short and long range labels. Add layout checks for the Nuxt UI separator and the narrower hour-label gutter/visible end label.
7. Run focused and full project verification, then visually inspect the toolbar and week grid at 1280 CSS px. Record exact outcomes and any deviations here.

## Files to modify

- `app/pages/agenda.vue` — format/render the always-visible current date/time on the current-week action, preserve its current-week highlight, remove the `Now` badge, place the vertical `USeparator` between the control groups, and stabilize the week-range button width.
- `app/components/WeeklyAgenda.vue` — reduce the time-label grid column consistently, starting at 2rem and widening only if required for label visibility.
- `tests/e2e/agenda-week.test.ts` — cover clock/button behavior, marker preservation, divider placement, and hour-label fit.
- `PLAN.md` — record M30 after approval while preserving completed M26–M29 history.
- `docs/milestones/m30-agenda-toolbar-and-timeline-polish.md` — implementation journal and verification evidence.

No API, server, schema, migration, dependency, or ADR changes are expected.

## Reuse

- Reuse the existing client-local clock lifecycle and `goToCurrentWeek()` action in `app/pages/agenda.vue`.
- Reuse `WeeklyAgenda`'s `currentDate`, `currentMinute`, `showNowMarker()`, and red marker; do not alter its timeline calculations.
- Reuse the current 32px toolbar controls, M28 spacing roles, the Nuxt UI `USeparator` component, and deterministic clock setup in `tests/e2e/agenda-week.test.ts`.
- Keep the existing full-locale week-range button and four hierarchy filters unchanged.

## Decisions and ADR links

- Approved presentation behavior: the current-week action always displays the current local date/time and navigates to the current week; preserve its existing highlighted state when the selected week is current. Remove the separate `Now` badge.
- Decision: reserve width for the selected-week range button to prevent its variable localized label from shifting filters; the human answered Yes to the Plannotator question on 2026-10-07.
- Preserve the red current-time marker only for the current day in the selected week and within visible hours (M26, M29, ADR 0029).
- Preserve the 1280 CSS px support floor, compact layout roles, and standard control sizing (ADR 0042), and the Week-only `/agenda` route (ADR 0044).
- No new ADR is proposed unless human review establishes a durable policy beyond this UI treatment.

## Implementation checklist

- [x] Human approves the original scope via Plannotator before implementation (2026-10-07).
- [x] Human approves the selected-week range-width clarification via Plannotator (Yes to Q1, 2026-10-07).
- [x] The current-week action displays the live current local date/time at all selected weeks and still navigates to the current week; current-week highlighting is retained.
- [x] Remove the separate `Now` badge while retaining the existing red current-day marker behavior.
- [x] Reserve 14rem for the selected-week range button; verify full labels and stable filter position across week changes at the supported viewport.
- [x] Add a vertical Nuxt UI separator between date/navigation controls and filters without disrupting 32px control alignment or 1280px usability.
- [x] Try a 2rem hour-label gutter; it clipped `20:00` by 5.484375px, so use the measured smallest fitting 2.375rem/38px gutter. Preserve vertical time-grid geometry.
- [x] Update deterministic E2E assertions for the current date/time action, minute updates, week changes, marker behavior, separator, range width, and label fit.
- [x] Run and record focused tests, format, lint, both typechecks, unit tests, full E2E, build, workflow checks, and diff checks; document intermediate failures/deviations.
- [x] Visually inspect the Agenda at 1280 CSS px and verify the toolbar does not shift when changing weeks.
- [x] Submit the full implementation diff for human code review before accepting the work; Plannotator approved it on 2026-10-07.

## Journal

### Plan preparation

- Fact: source inspection found the `Now HH:mm` badge is conditional on `isCurrentPeriod`; the date/time clock is already client-local and updates on minute boundaries and focus/visibility changes. The current-week button itself remains present and calls `goToCurrentWeek()`.
- Fact: `WeeklyAgenda.vue` uses a 3.5rem hour-label column in its header/timeline grid and before/after-hours rows; the red marker remains independent of the page-level `Now` badge.
- User direction: display the current date and time on the current-week action, remove the `Now` badge, retain the red line, reduce left-side hour-label spacing, and add a divider between date controls and filters.
- Decision proposed for approval: use locale-formatted numeric month/day plus the existing 24-hour clock; preserve the current-week-dependent button highlight; use Nuxt UI `USeparator` in vertical mode; try a 2rem hour-label gutter first and widen only if required for `20:00` visibility; preserve all existing navigation, marker, filter, and timeline semantics.
- Evidence: read `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`, the M26/M28/M29 records, ADRs 0029/0039/0042/0044, and the current page/component/E2E source. The working tree was clean before this plan was created. No application code or roadmap content has been changed.

### Plannotator plan feedback and approval

- Feedback: preserve the current-week action's existing highlighted appearance when the selected week is current; use Nuxt UI's vertical separator component; try a 2rem time-label gutter first while ensuring `20:00` remains visible.
- Decision: retain the existing selected-week-dependent highlight, use `<USeparator orientation="vertical">`, and try the 2rem gutter with a minimal-width fallback only if needed for label visibility.
- Evidence: the first Plannotator gate returned `decision: annotated` with these three clarifications. After incorporating them, the revised `plannotator annotate docs/milestones/m30-agenda-toolbar-and-timeline-polish.md --gate --json --require-approval` returned `{"decision":"approved"}`.
- Verification: `node scripts/check-workflow-docs.mjs`, `pnpm exec oxfmt --check docs/milestones/m30-agenda-toolbar-and-timeline-polish.md`, and the untracked-file `git diff --no-index --check` passed after revision. Implementation was authorized within the original scope.

### 2026-10-07 — Verification finding and approved scope clarification

- Fact: the first focused `agenda-week.test.ts` run passed three of four tests. The current-time test showed that a 2rem/32px hour-label gutter clips the `20:00` label by 5.484375px at the left edge. Following the approved fallback, the gutter was increased to 2.375rem/38px; the 1280px layout test then passed and the label-fit assertion passed at 1600px.
- Fact: the next focused run still failed a test asserting stable filter position: the filter group's x-coordinate moved 8.25px when navigating to a week whose localized date-range label is one character shorter. The other three tests passed, including divider placement and 38px gutter sizing. The content-sized range button is a likely cause but its width was not yet directly measured.
- Decision: the human answered Yes via Plannotator to reserving width for the selected-week range button while keeping the complete localized text visible.
- Approval: after incorporating the answer, `plannotator annotate docs/milestones/m30-agenda-toolbar-and-timeline-polish.md --gate --json --require-approval` returned `{"decision":"approved"}`. The revised milestone plan is approved and implementation is authorized within the combined scope.
- Evidence: `pnpm exec playwright test tests/e2e/agenda-week.test.ts --workers=1 --timeout=60000` — first run: 3 passed / 1 expected gutter-fit failure at 2rem; second run: 3 passed / 1 filter-position failure at 2.375rem. These were intermediate results; the final focused and full suites passed after reserving range-button width.

### 2026-10-07 — Implementation and local verification

- Fact: the current-week action now shows the live local numeric date and 24-hour time, remains highlighted only when the selected week contains today, and still navigates to the current week. The separate `Now` badge is gone; the existing red line remains on today's column within visible hours.
- Fact: the selected-week range button has a 14rem minimum width. Deterministic coverage confirms the range button width and filter-bar start remain stable across current/previous/next week navigation, including a shorter date-range string. The date/time action continues to update at minute boundaries while either current or non-current weeks are selected.
- Fact: the toolbar uses Nuxt UI `<USeparator orientation="vertical">`; E2E geometry at 1280 CSS px confirms it is 24px high between the navigation and filter groups and filters remain 32px high.
- Fact: the approved 2rem time gutter clipped `20:00` by 5.484375px at the left edge. The smallest tested fitting width is 2.375rem/38px; header/timeline/off-hours grids use the same width. Vertical grid and pointer geometry are unchanged.
- Verification: `pnpm exec playwright test tests/e2e/agenda-week.test.ts --workers=1 --timeout=60000` — 4/4 passed. `pnpm test:e2e --workers=1 --timeout=60000` — all 38 E2E tests passed. `pnpm test` — 13 files, 72 tests passed.
- Verification: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm build`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and tracked/untracked-document whitespace checks passed. Build emitted non-fatal Vite/Rolldown plugin-timing warnings; build completed successfully.
- Manual visual review: temporary 1280 CSS px screenshots of a non-current week and a simulated current week were inspected. The date/time button and active-week highlight, red current-day marker, divider, filter alignment, reduced hour gutter, and `20:00` label fit looked correct. Temporary screenshots were deleted after inspection.
- Scope: no API, server, schema, migration, dependency, or data changes.
- Review status: Plannotator approved the full code diff on 2026-10-07 with a non-blocking request for live-app review. The Nuxt dev server is now listening on `127.0.0.1:3000` (`/api/health` returned 200); `/agenda` redirects to login when unauthenticated. The live app was opened through Plannotator at `http://localhost:3000/agenda`; Plannotator's session itself uses a separate random port.

### 2026-10-07 — Live-preview port and auth check

- User direction: use Nuxt on port 3000 and let Plannotator use its default separate session port. A temporary experiment with Nuxt on 3001 and `PLANNOTATOR_PORT=3000` did not work for the reviewer, so the setup was reversed. No `.env` or tracked auth configuration was changed.
- Verification: Nuxt is listening on `127.0.0.1:3000`; `GET /api/health` returned 200. The Better Auth social sign-in endpoint generated the callback `http://localhost:3000/api/auth/callback/github`; the GitHub authorization endpoint returned HTTP 200 with no callback-mismatch message detected. This verifies the requested callback origin, not completion of an interactive sign-in.
- Live-app feedback: while Plannotator displayed the app, the reviewer saw the social API request go to its random session origin (`localhost:64038`) rather than `localhost:3000`. `app/lib/auth-client.ts` calls `createAuthClient()` without an explicit base URL, so the browser uses the current page origin. The server log separately reported Better Auth rejecting `http://localhost:64038`; the user chose to review manually instead of continuing with the Plannotator proxy.

### 2026-10-07 — Dev-server Vite cache recovery

- Fact: the browser's dynamically imported `parse-duration-ms.js?v=fd5b7d43` returned HTTP 504 `Outdated Optimize Dep`. The current Vite optimizer no longer had that dependency hash, so this was a stale optimized-dependency URL rather than a source or package error. The installed `parse-duration-ms` package imports successfully in Node.
- Action: stopped the managed Nuxt dev process, cleared ignored generated `.nuxt/` and `node_modules/.cache/vite/` caches, and restarted Nuxt on `127.0.0.1:3000` with `BETTER_AUTH_URL=http://localhost:3000`. No application source, dependency, `.env`, or tracked auth configuration was changed.
- Verification: `GET http://localhost:3000/api/health` returned 200. The freshly transformed `ticket-estimate.ts` now points to optimized dependency hash `dfc76c93`, and that module returns HTTP 200. A hard browser refresh may be needed to discard the old URL. The dev server remains available on port 3000; a second `pnpm dev` process should not be started on the same port.

### 2026-10-07 — Completion declaration

- Human completion declaration: the user declared M30 complete on 2026-10-07.
- Plannotator code review approval and implementation/verification evidence are recorded above. M30 is complete; no additional implementation changes were requested.

## Verification

Planning checks:

- [x] `node scripts/check-workflow-docs.mjs` — passed after plan revisions.
- [x] `pnpm exec oxfmt --check docs/milestones/m30-agenda-toolbar-and-timeline-polish.md` — passed.
- [x] `git diff --no-index --check /dev/null docs/milestones/m30-agenda-toolbar-and-timeline-polish.md` — no whitespace errors (expected untracked-file exit 1 normalized).
- [x] Original Plannotator plan approval — `{"decision":"approved"}` on 2026-10-07 after incorporating the three review clarifications.
- [x] Plannotator Q1 answered Yes to the selected-week range-width clarification on 2026-10-07.
- [x] Revised combined-plan gate approval — `{"decision":"approved"}` on 2026-10-07.

Implementation verification (after plan approval):

- [x] Focused Playwright: `pnpm exec playwright test tests/e2e/agenda-week.test.ts --workers=1 --timeout=60000` — 4/4 passed.
- [x] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (13 files / 72 tests), `pnpm test:e2e --workers=1 --timeout=60000` (38 tests), `pnpm build`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and `git diff --check` — passed. Build printed non-fatal plugin-timing warnings.
- [x] Manual browser review at 1280 CSS px: compared current and non-current weeks; confirmed the date/time action remains constant across week selection, current-week highlighting and red marker remain correct, separator and filters align, and `20:00` fits in the reduced gutter.

## Review status

- Plan review: Revised combined scope approved via Plannotator on 2026-10-07.
- Code review: Full diff approved via Plannotator on 2026-10-07 with non-blocking guidance requesting live-app review.
- Manual review: The user chose to review the app directly instead of through Plannotator; the dev-server cache recovery is recorded above.
- Milestone completion declaration: Complete — declared by the user on 2026-10-07.

## Follow-ups

- None. The user declared the milestone complete on 2026-10-07.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in the journal and review status.
