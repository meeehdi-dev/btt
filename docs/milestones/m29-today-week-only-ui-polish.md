# M29 — Agenda week-only UI and toolbar polish

> **Status: Complete.** Plan approved via Plannotator on 2026-10-07; implementation, automated checks, final live-app review, human code review, and the human completion declaration are recorded below.

## Context

The human selected “Agenda” as the visible name and `/agenda` as the canonical route. Update the shell navigation, page heading/title, keyboard shortcut, and internal destinations accordingly. The human also decided that `/today` should return 404 with no compatibility route.

`/today` currently offers Day and Week modes. The Day path duplicates weekly agenda rendering/interaction code, keeps a browser-local view preference, and adds a second date-oriented data/read path. The page also offers two direct-add entry points (the toolbar button and each weekly day-header plus button), while the Week timeline already supports drag-create and opens the same ticket-required add modal. The filter toolbar occupies its own row/card below the date controls, and weekly day headers render date and worktime progress on two lines. The shell calls this page “Today,” although the agenda can navigate to any selected week.

The requested polish makes Week the sole `/agenda` presentation and removes the specified duplicate controls while preserving the weekly agenda's data, gestures, correction, status, filtering, archive, and accessibility behavior. This is a focused agenda-page milestone; other pages are out of scope.

### Observed facts

- `app/pages/today.vue` owns Day/Week selection, the localStorage preference, both Day and Week reads, the top-level Add trigger, the status filter, and the separate filter toolbar; it will become the `/agenda` page component.
- `app/components/TodayAgenda.vue` implements a separate Day timeline. `WeeklyAgenda.vue` already implements the weekly time grid, date navigation context, per-day progress, drag-create/move/resize, current-time marker, and correction entry points.
- `WeeklyAgenda.vue` currently puts date/Add on its first header row and progress text/bar on a second row. The day-specific plus button is emitted to `today.vue` as `@add`.
- `TodayAgendaEntry.vue` currently uses `projectColor` for a 4px colored left border. Its status trigger opens a menu with “Filter by …” and a nested “Change” submenu.
- Today’s filter state includes client, project, release, ticket, and status. `useHierarchyFilters` already owns the cascading client/project/release/ticket behavior; the status filter is page-specific.
- Existing Week E2E coverage already exercises weekly reads, progress, filters, drag-create/move/resize, status actions, and current-date/time presentation. Other tests still assume Day mode, Day-specific drag gestures, quick-add buttons, or status filtering.

## Approved scope

The following is the proposed scope and becomes approved only after Plannotator approval:

- Make Week the only `/agenda` view. Remove the Day/Week switch, Day timeline rendering, Day-only request/state/summary code, and browser-local Day/Week view preference handling. Keep the existing `date` query as the anchor date for the selected week, week navigation, the configured week-start setting, locale formatting, and the “This week” current-period action. Ignore any old `nxmr:agenda-view` value; do not clear the user's localStorage key as part of this change.
- Rename the user-facing page/navigation name to “Agenda” and make `/agenda` the canonical route. Update the shell navigation, page heading/title, internal links/redirects (including the home and post-login destinations and time-entry search results), and the `g`-then navigation shortcut from `t` to `a`. Do not change authentication rules or date-query semantics. Retire `/today` with a 404 and no compatibility redirect.
- Remove the page-level “Add time entry” toolbar button and the per-day plus buttons in Week headers. Keep the drag-create interaction and its ticket-required add modal; remove only the two direct button entry points and the now-unused week-bounded page-add date picker path. Keep correction/edit/delete workflows unchanged.
- Move the four hierarchy filters (client, project, release, ticket) into the top toolbar beside the week/date indicator and navigation. Remove the separate filter row/card placement while preserving searchable selectors, cascading/reset behavior, per-filter clears, Clear filters, accessible names, and M28's 2px horizontal-inset spacing role. Do not add vertical wrapper padding: keep the filter controls and neighboring toolbar controls at the existing 32px height (within 2px). Live-app review requests no enclosing ring/border around the filter group; individual selector outlines remain. Keep the toolbar usable at the supported 1280 CSS px minimum viewport.
- Make each weekly day header a single line: retain the full localized weekday/date label on the left and let the thicker progress bar span the remaining width to the right edge. Remove the visible worked/target text (for example `2h / 8h`) and expose the worked/target/overtime details through a tooltip on hover/focus plus the progressbar's accessible name/value text. Add a little header padding while preserving the fixed timeline geometry. Preserve the unfiltered per-day total and progress/overtime colors. Remove the visible `Today` badge; the existing current-day header color treatment is sufficient, while `aria-current="date"` continues to identify the current date accessibly. Remove the day-header plus action and eliminate the doubled bottom timeline border.
- Remove the client/project-color-dependent left border from Today/Week time-entry cards. Keep a subtle neutral border/surface and all ticket, hierarchy, status, relation, external-link, description, and time presentation.
- Remove status from the Today filter bar and filter state. Clicking the status badge should immediately expose the fixed status choices in one flat selector; remove both “Filter by status” and the intermediate “Change” submenu. Preserve current-status indication, busy handling, archive disabling, server update/error/refresh behavior, and status values.
- Refactor/delete now-unused Day-only UI code where it simplifies the result. Preserve the `/api/agenda?date=...` endpoint and its server/API contract; this milestone changes the Agenda UI, not API or stored data.
- Update the current product roadmap and add a proposed ADR for the durable week-only/status-control policy after approval. Keep completed M16–M18 and M26 milestone records as historical evidence; do not rewrite their original accepted scopes.

### Plannotator clarifications requested

Plannotator feedback settled the header-fit treatment: retain the full weekday/date label, remove the visible worked/target text, and expose those details in a tooltip beside the progress bar. The tooltip opens on keyboard focus; progressbar `aria-valuetext` includes overtime. This avoids truncating the date or changing locale formatting. The reviewer selected “Agenda” and `/agenda` as the user-facing name and canonical route, changed the shortcut from `g`-then-`t` to `g`-then-`a`, and selected 404/no compatibility route for `/today`.

Later live-app annotations refine the visual treatment: remove the filter group's enclosing ring/border; extend each header progress bar from the date label to the right edge; remove the doubled line at the end of the timeline; increase header padding and progress thickness; add 16px between the toolbar and agenda card; and give time-entry cards a subtle neutral border.

## Out of scope

- Changes to the week API, day API, time-entry/ticket APIs, schema, migrations, authentication, dependencies, or stored data.
- Changes to configured week start, date-only semantics, weekly ownership/archive behavior, daily totals, visible hours, workday target, overtime rules, overlap rules, or fixed time-grid geometry.
- Removing drag-create or its required ticket selection, drag move/resize, the correction modal, delete, current-time/current-date indicators, or archived-history display.
- Changing hierarchy filtering semantics, ticket status values/rules, status write boundaries, Ticket Board/Release status controls, relationship/external-link actions, or other pages.
- Removing the `/api/agenda` endpoint or deleting its tests; it remains an API contract even though the Agenda UI will use the week read exclusively.
- Removing the legacy localStorage key from browsers; it will simply no longer affect `/agenda`.
- Broad spacing changes outside the Agenda toolbar/header/card adjustments required here.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- `docs/milestones/m16-weekly-agenda.md` — weekly boundaries, per-day progress, and week gestures
- `docs/milestones/m17-agenda-ui-refinements.md`, `docs/milestones/m18-agenda-layout-and-weekly-add.md` — current headers, direct-add flows, and fixed geometry (historical scopes remain intact)
- `docs/milestones/m26-today-current-day-and-time-indicators.md` — current-date/time behavior to preserve on Week
- `docs/milestones/m27-ci-browser-test-reliability.md` — archived-entry top-resize coverage to preserve in the supported Week workflow
- `docs/milestones/m28-desktop-only-ui-cleanup.md` and `docs/decisions/0042-desktop-only-ui-and-spacing.md` — 1280px support floor, compact spacing roles, and filter surface sizing
- `docs/decisions/0003-m1-authentication-and-database.md` — historical authenticated landing-route clause superseded for the current route by M29
- `docs/decisions/0016-agenda-correction-control-and-board-filters.md` — current Today status-filter policy
- `docs/decisions/0029-weekly-agenda-and-conflict-previews.md` — week behavior and conflict presentation
- `docs/decisions/0033-no-compatibility-route-for-project-collection.md` — existing `/` landing target, superseded only for the root destination by M29
- `docs/decisions/0030-agenda-view-preference.md` — browser-local Day/Week preference to retire
- `docs/decisions/0039-today-agenda-context-control-flow.md` — current context-strip composition and status action
- `app/pages/today.vue` / `app/pages/agenda.vue`, `app/pages/index.vue`, `app/pages/login.vue`, `app/layouts/dashboard.vue`, `app/components/GlobalSearch.vue`, `app/components/TodayAgenda.vue`, `app/components/WeeklyAgenda.vue`, `app/components/TodayAgendaEntry.vue`, `app/components/TicketHierarchyBadges.vue`, `app/composables/useHierarchyFilters.ts`, `app/utils/agenda-week.ts`
- `tests/e2e/agenda.test.ts`, `agenda-week.test.ts`, `agenda-drag.test.ts`, `agenda-status.test.ts`, `filter-search.test.ts`, `ticket-context-popovers.test.ts`, and `auth-shell.test.ts`

## Approach

1. Move the page to `app/pages/agenda.vue` (`/agenda`) and convert it to a single weekly data path. Retain the `CalendarDate` anchor, selected-week `date` query/date navigation, configured start-of-week, locale, and current clock. Remove Day/Week state and persistence, Day fetch/error/pending selection, Day-only progress summary, and conditional Day rendering. Keep week refresh/retry and existing write/refresh failure behavior. Update all app-owned internal links and default redirects to the canonical route. Remove the `/today` page rather than adding a compatibility redirect; add route coverage for its 404.
2. Remove `TodayAgenda.vue` once all callers/tests are migrated. Keep `WeeklyAgenda.vue` as the sole agenda renderer and preserve its pointer capture, create/move/resize calculations, conflict previews, and fixed grid geometry. Keep `/api/agenda` server code and direct API coverage unchanged.
3. Keep the add modal controlled by drag-create only. Delete page/per-day trigger buttons and their events, `addSource` variants, and the week-date picker/min/max logic used only by page-level Week Add. Preserve the drag-provided date/start/duration, required active-ticket selector, POST, and refresh/error flow.
4. Move the existing four hierarchy `USelectMenu` filters into the week/date toolbar. Use a flexible horizontal layout that fits at 1280px, preserve standard selector sizing and a 2px horizontal inset, and add no vertical wrapper padding. Keep the selector/bar height aligned to neighboring toolbar controls (32px, within 2px) but leave the filter group without an enclosing ring/border per live-app feedback. Retain all hierarchy filter/clear semantics. Remove the status filter-specific state/options/search/icon handling and reduce the filter source/type surface if no remaining caller uses its optional status field.
5. Recompose `WeeklyAgenda.vue` day headers into a single row, with the full localized date label on the left and a 4px progress bar spanning the remaining width. Remove visible worked/target text and expose the detailed progress (including overtime) through a tooltip that opens on hover/focus and through the progressbar's accessible name/value text. Increase header padding slightly, remove the visible Today badge while keeping the current-date color treatment and `aria-current`, remove the plus button and `add` event, and eliminate the doubled bottom timeline border. Verify at 1280px and with multiple locales that the header does not wrap or clip.
6. Remove the color-dependent inline left border and unused color prop from agenda presentation types; use a subtle neutral card border. Flatten the status dropdown to one level of fixed status options; retain the current checkmark, disabled-current/busy/archive states, and existing `changeTicketStatus` mutation path.
7. Update browser tests to treat Week as the initial and only UI. Remove obsolete Day-view/localStorage preference assertions and tests of Day-only pointer components; keep Week create/move/resize/conflict/current-time/progress coverage. Port any unique archived-entry resize and stale-server-overlap coverage from `agenda-drag.test.ts` to Week before retiring Day-only tests, preserving M27's regression coverage. Remove quick-add button/date-picker assertions while continuing to test drag-create modal creation. Update status tests to verify direct flat selection and absence of status filtering.
8. Add/index a proposed ADR 0044 documenting the Week-only `/agenda` page, retired view preference, new page name/route and legacy-route behavior, removal of the status filter, and direct status selection. ADR 0044 also supersedes the old authenticated landing route in ADR 0003 and ADR 0033's former `/` landing target only; ADR 0033's no-compatibility decision for `/projects` remains accepted. After code review, update the superseded-clause references in ADRs 0003, 0016, 0030, 0033, and 0039 without rewriting their historical decisions. Update `PLAN.md` with M29/current agenda direction after this plan is approved; leave completed milestone records historically accurate.
9. Run project checks and full E2E, inspect the live Week page at the supported minimum viewport and a wider desktop, and record actual results, deviations, and any follow-ups in this milestone file.

## Files to modify

- `app/pages/today.vue` renamed to `app/pages/agenda.vue` — single Week read/view, toolbar filters, removal of direct Add buttons and obsolete Day/status-filter state, updated page title/copy, and date-query navigation.
- `app/layouts/dashboard.vue` — change the navigation label/destination to Agenda `/agenda`, the shortcut to `g`-then-`a`, and the logo destination.
- `app/pages/index.vue`, `app/pages/login.vue`, and `app/components/GlobalSearch.vue` — update the home redirect, post-login default destination, and time-entry search destinations to `/agenda`.
- `app/components/WeeklyAgenda.vue` — single-line per-day headers and removal of per-day Add action/event.
- `app/components/TodayAgendaEntry.vue` — neutral card border and flat direct status selector.
- `app/components/TodayAgenda.vue` — delete after its Day-only caller and tests are removed/migrated.
- `app/composables/useHierarchyFilters.ts` — remove the optional status source field only if confirmed unused by remaining callers.
- `tests/e2e/agenda.test.ts`, `tests/e2e/agenda-week.test.ts`, `tests/e2e/agenda-drag.test.ts`, `tests/e2e/agenda-status.test.ts`, `tests/e2e/filter-search.test.ts`, `tests/e2e/ticket-context-popovers.test.ts`, `tests/e2e/auth-shell.test.ts`, `tests/e2e/client-effect-failures.test.ts`, `tests/e2e/agenda-progress.test.ts`, `tests/e2e/search.test.ts`, and `tests/e2e/production-access.test.ts` — update route/name/shortcut and obsolete Day/Add/status-filter assumptions; preserve Week/API regressions.
- `PLAN.md` — record M29 and the current Week-only agenda behavior after plan approval; preserve historical milestone entries.
- `docs/decisions/0044-week-only-agenda-and-status-selector.md` (Accepted after code review), `docs/decisions/README.md`, and supersession references in ADRs 0003, 0016, 0030, 0033, and 0039 after human code review.
- `docs/milestones/m29-today-week-only-ui-polish.md` — implementation journal, verification, review, and closeout evidence.

No API/server/schema/migration/dependency files are expected to change.

## Reuse

- `WeeklyAgenda.vue` and `/api/agenda/week` already own the selected week's dates, localized headings, unfiltered daily totals, timeline interactions, conflict previews, and progress semantics.
- `app/pages/today.vue` already has week range navigation, the week-start preference, the current-period action/clock, hierarchy selectors, `changeTicketStatus`, and the correct retry/write/refresh workflows.
- `TodayAgendaEntry.vue` remains shared by the Week timeline and out-of-window entry sections; retain `TicketHierarchyBadges` and `TicketContextPopovers` composition as-is apart from removal of the color border and status menu structure.
- Reuse `tests/e2e/agenda-week.test.ts` for supported Week behavior; preserve M27's direct resize-handle/preview/persistence assertion when migrating archived resize coverage.
- Keep `shared/agenda-week.ts`, `/api/agenda/week`, `shared/time-entry.ts`, `app/utils/agenda-drag.ts`, and the existing owner-scoped status/time-entry mutation boundaries unchanged.

## Decisions and ADR links

- Human decision via Plannotator: the page is named “Agenda,” `/agenda` is canonical, and legacy `/today` returns 404 with no compatibility route.
- Approved user decision: `/agenda` shows Week only; no Day/Week view preference remains. Selected-date/week navigation and configured week-start remain.
- Approved user decision: the page is named Agenda; it exposes hierarchy filters only, not a status filter; clicking a time-entry status directly opens the fixed status choices.
- Existing rules retained: filters do not affect per-day progress; status updates use the existing ticket PATCH path; archived rows remain visible but status changes remain disabled; all time geometry and data boundaries remain authoritative.
- Accepted ADR 0044 supersedes ADR 0003's authenticated landing-route clause, ADR 0030's Day/Week local preference, ADR 0033's former `/` landing target only, and only the Today status-filter/status-menu clauses of ADRs 0016 and 0039. ADR 0033's no-compatibility decision for `/projects` remains accepted; all other ADR policies remain in force. ADR 0029's week boundary and conflict-preview decisions remain unchanged.
- No schema, API, data, ownership, archive, or dependency decision is proposed.

## Implementation checklist

- [x] Human approves this plan via Plannotator before implementation (2026-10-07).
- [x] `/agenda` always renders Week; remove the Day switch/timeline, Day-only read/summary state, and view-preference read/write logic. Update all internal destinations and the home/post-login defaults. Confirm `/today` returns 404 with no compatibility route.
- [x] Remove toolbar/per-day Add buttons and their unused date-specific add paths while preserving drag-create and its ticket-required modal.
- [x] Place the four hierarchy filters beside the week/date controls at 1280px; remove status filtering and preserve cascading/search/clear behavior. Keep controls aligned to the existing 32px toolbar height without added vertical wrapper padding.
- [x] Render each weekly full weekday/date label and compact progress bar on one line; put worked/target/overtime details in a focusable tooltip and progressbar accessible text, and remove the visible Today badge while retaining current-date color and `aria-current`.
- [x] Remove project/client color accent borders from agenda cards and remove any newly unused presentation-only color prop.
- [x] Make status badge click open the flat list of statuses directly; preserve write, busy/error, and archived-entry behavior.
- [x] Delete or simplify dead Day-only UI code without changing the day API contract.
- [x] Update E2E coverage to remove obsolete Day/preference/direct-Add/status-filter assumptions and preserve Week gesture, archived resize, stale-overlap, progress, filters, status, and current-time behavior. Assert the Agenda navigation label, `g`-then-`a` shortcut, canonical `/agenda` route, and `/today` 404.
- [x] Update the roadmap; add/index ADR 0044 documenting narrow supersessions, then accept it after code review.
- [x] After human code review, add supersession references to ADRs 0003, 0016, 0030, 0033, and 0039; retain unaffected policies.
- [x] Run and record format, lint, both typechecks, unit tests, full E2E, build, workflow-doc checks, and diff checks.
- [x] Visually inspect the refined layout at supported desktop widths and multiple locales after the live-app feedback changes; final Plannotator live-app review returned no feedback.
- [x] Submit the full implementation diff for human code review and record the no-changes-requested result.
- [x] Record the human completion declaration in the journal and closeout status (2026-10-07).

## Journal

### 2026-10-07 — Planning research

- Fact: inspected `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`, the milestone/ADR records listed above, current Today/Week components, filter composable, and relevant browser tests. No approved plan for this request existed at planning start.
- Fact: the initial status inspection showed an unrelated `app/app.config.ts` modification; a later `git status --short` no longer listed it. No assumption is made about that unrelated change, and M29 does not include `app/app.config.ts`.
- Fact: the Week surface already supports drag-create, move, resize, conflict previews, per-day unfiltered progress, and current-time/date cues. Day-specific component and state can be removed; `/api/agenda` remains separately tested and will not be deleted.
- Decision proposed from the direct user request: make Week the sole Agenda presentation; remove the two direct-add buttons, status filter, and client/project color border; expose the status choices immediately from the badge; place filters and per-day progress in the requested compact positions.
- Evidence: source/test searches and file reads only. No application code, roadmap, ADR, or existing milestone record was changed during research.

### 2026-10-07 — Plannotator plan review and approval

- Feedback (human via Plannotator): keep the full localized weekday/date in each one-line header, remove the visible worked/target text, and expose progress details in a tooltip or popover; the compact progress bar and its accessible text remain. Remove the visible Today badge and rely on the current-day color treatment.
- Decision (human via Plannotator): name the page “Agenda,” use `/agenda` as the canonical route, update the navigation shortcut from `g`-then-`t` to `g`-then-`a`, and return 404 for legacy `/today` with no compatibility route.
- Feedback (human via Plannotator): keep the top toolbar aligned at the established 32px height; do not add vertical padding around the filters that recreates the prior Day/Week selector spacing problem.
- Evidence: first, second, and third Plannotator sessions returned `decision: annotated` with the clarifications above. After incorporating them, `plannotator annotate docs/milestones/m29-today-week-only-ui-polish.md --gate --json --require-approval` returned `{"decision":"approved"}`.
- Verification: `node scripts/check-workflow-docs.mjs` passed; `git diff --no-index --check /dev/null docs/milestones/m29-today-week-only-ui-polish.md` reported no whitespace errors. No implementation, roadmap, or ADR changes were made; the milestone remains pending implementation and code review.

### 2026-10-07 — Implementation and local verification

- Fact: replaced the Day/Week `/today` page with a Week-only `/agenda` page, removed `TodayAgenda.vue`, and confirmed `/today` returns 404. Updated shell labels, shortcuts, root/post-login destinations, and time-entry search links. The browser title and accessible page heading are “Agenda.”
- Fact: consolidated the four hierarchy filters and week/date controls into the existing 32px toolbar; removed direct Add entry points and the status filter; compacted weekly date/progress headers; removed agenda-card project-color accents; and made entry status menus flat. The weekly API, day API, data model, gesture utilities, and authentication remain unchanged.
- Verification: format, lint, Nuxt/tsgo typechecks, unit tests, full E2E, production build, workflow checks, and the API route tests passed. Full E2E result: 38/38 tests passed. Detailed commands and results follow below.
- Visual check: reviewed temporary Playwright screenshots at 1280 CSS px in English and German and 1600 CSS px in English. Toolbar controls are 32px, localized dates remain on one line, and the week grid and progress bars fit; screenshots were deleted after inspection.
- Verification corrections: browser geometry showed `size="sm"` controls were 28px, so the toolbar controls now use standard `md` sizing at 32px. Adjusted the stale-overlap test drag start outside the ticket link and kept the quick-add drag within one 30-minute slot; these are test setup corrections, not product-behavior changes.
- Documentation clarification: ADR 0003 records `/today` as the authenticated landing route and ADR 0033 records the former `/` destination as `/today`. Proposed ADR 0044 supersedes those landing-route clauses only; ADR 0033's accepted no-compatibility policy for `/projects` remains unchanged.
- Follow-up: the first Nuxt/Vite development E2E run logged one `ResizeObserver loop completed with undelivered notifications` error; the final full E2E rerun did not reproduce it. No product failure was observed.
- Review status: the initial Plannotator code review approved the changes with non-blocking notes. The later live-app annotations resulted in additional edits, so final code review and the milestone completion declaration are pending. ADR 0044 remains Proposed.

### 2026-10-07 — Live-app review refinements

- Feedback (human via Plannotator): remove the filter group's enclosing border, extend the progress bar from the date to the end of each header, and eliminate the doubled bottom timeline border. Implemented these changes.
- Feedback (human via Plannotator): increase header padding and progress-bar thickness, add the same 16px spacing between the toolbar and agenda card as the page inset, and give entry cards a subtle border. Implemented these changes with a neutral border color.
- Verification: the final full E2E run passed all 38 tests; 72 unit tests, both typechecks, lint, formatting, workflow checks, and production build passed after these refinements.
- Review status: final Plannotator live-app review at `http://localhost:3000/agenda` returned “User reviewed the document and has no feedback.” Final code review after these UI refinements was still pending at this point.

### 2026-10-07 — Final code review and decision updates

- Code review (human via Plannotator): `plannotator review` returned “Code review completed — no changes requested.”
- Decision: accepted ADR 0044; marked ADR 0030 Superseded and added narrow ADR 0044 supersession references to ADRs 0003, 0016, 0033, and 0039. Unaffected clauses remain in force.
- Verification: final `pnpm format:check`, `pnpm lint`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and tracked/untracked-document diff whitespace checks passed after the documentation updates.
- Status: implementation, automated verification, visual review, and human code review are complete; the human completion declaration remains pending.

### 2026-10-07 — Human completion declaration

- Human decision: The user declared in chat, “i declare this milestone complete.”
- Status: M29 is Complete. The approved checklist, verification evidence, ADR updates, final live-app review, and accepted human code review are recorded above. The documented ResizeObserver notice remains a non-blocking follow-up; it did not recur in the final full E2E run.

## Verification

Planning checks:

- [x] `node scripts/check-workflow-docs.mjs` — passed after plan revisions.
- [x] `git diff --no-index --check /dev/null docs/milestones/m29-today-week-only-ui-polish.md` — no whitespace errors (exit 1 from the untracked-file diff was normalized).
- [x] Plannotator plan review/approval — approved on 2026-10-07 after three annotated feedback rounds.

Implementation checks (2026-10-07):

- [x] `pnpm format:check` — passed; `pnpm lint` — passed without warnings.
- [x] `pnpm typecheck` and `pnpm typecheck:tsgo` — passed.
- [x] `pnpm test` — 13 files, 72 tests passed.
- [x] `pnpm test:e2e --workers=1 --timeout=60000` — all 38 E2E tests passed, including the unchanged day API and weekly API coverage, Week gestures, status, filters, and 404 route behavior.
- [x] `pnpm build` — production build completed. Vite printed plugin timing notices; no build failures.
- [x] `pnpm check:workflow` and `node scripts/check-workflow-docs.mjs` — passed.
- [x] Reinspect the refined UI at 1280 CSS px in English and German and at 1600 CSS px in English. Confirm the unbordered filter group, full-width 4px progress bars, increased header padding, 16px toolbar/card gap, subtle card borders, and single end-of-grid border. Final Plannotator live-app review returned no feedback.
- [x] `/api/agenda` and `/api/agenda/week` API behavior remains covered; no API/server/schema/database/dependency files changed.
- [x] Final `git diff --check` and untracked-document whitespace checks — passed after the journal update.
- [x] Human code review accepted via Plannotator on 2026-10-07; ADR 0044 is Accepted.
- [x] Human completion declaration recorded in the journal on 2026-10-07; M29 is Complete.

## Review status

- Plan review: Approved via Plannotator on 2026-10-07.
- Initial code review: Approved with non-blocking notes via Plannotator on 2026-10-07.
- Implementation, automated verification, and final live-app review: Complete.
- Final code review: Accepted via Plannotator on 2026-10-07 with no changes requested.
- Human completion declaration: Recorded via chat on 2026-10-07.
- Milestone status: Complete.

## Follow-ups

- The one ResizeObserver loop error from the first dev E2E run did not recur in the final full suite; no product failure was reproduced.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in the journal and review status.
