# M33 — Agenda card drag affordance and initial loading

> **Status: Complete — the user declared M33 complete on 2026-10-08. Implementation and Plannotator code review are complete; focused/full E2E and manual visual review were explicitly deferred and are not claimed as passing.**

## Context

The Agenda's time-entry cards can be moved by dragging, but their card surface does not currently communicate that affordance. The user requests a Ticket Board-like hover border and grab cursor while preserving pointer cursors for links and badges, plus a more subtle border highlight in both Agenda and Ticket Board.

The Agenda also shows a client-side loading state before its first week appears. The source inspection explains why: no-query initialization depends on the browser's local date, while a valid `?date=` query is already available during SSR.

### Observed facts

- In `app/pages/agenda.vue`, `date` starts as `null` and is initialized in `onMounted()` by `syncRouteDate()`. That function reads a valid `?date=` query or calls `today(getLocalTimeZone())`, which uses the browser's local timezone.
- The `/api/agenda/week` fetch is configured with `immediate: false` and `watch: false`. A `watch(weekStart, ...)` starts `refreshWeek()` only after `date` is initialized. As a result, the week data is not part of the initial SSR render; the page shows `Loading agenda…` until the browser resolves the date and fetches the week.
- Settings and tickets already use awaited `useApiFetch()` calls. `app/composables/useApiFetch.ts` preserves the request context and cookies during SSR. The week endpoint (`server/api/agenda/week.get.ts`) requires a seven-day `startDate`, so the remaining obstacle is determining the correct initial date, not an API limitation.
- The current week depends on the user's browser-local date. A server request has no browser timezone unless the client supplies it; using the server's timezone or UTC can select the wrong date/week near a local-day or week boundary.
- The loading and loaded states both use the app's `UCard`, whose body padding is set to `p-2` in `app/app.config.ts`. However, the loaded card has `mt-2` while the loading card does not. The apparent mismatch may therefore include the outer vertical spacing as well as card padding; browser geometry should confirm the actual difference before correcting it.
- `TodayAgendaEntry.vue` renders an article with `border-accented/50`, but no hover-border or move cursor. `WeeklyAgenda.vue` handles mouse movement from its timeline and ignores interactive descendants when starting a gesture.
- Ticket Board cards use `EntityCard.vue`'s primary hover/focus border and `TicketBoardCard.vue`'s `cursor-grab active:cursor-grabbing`. Board cards also contain links and buttons whose normal pointer affordance must not be replaced by the card's drag cursor. Agenda resize handles use directional resize cursors and must remain unchanged.

## Approved scope

- Add an Agenda-entry hover border treatment matching the Ticket Board's card affordance, but use a subtler semantic accent border in both views.
- Show `grab` over the draggable area of an Agenda entry and `grabbing` while dragging. Preserve pointer cursors over ticket links, hierarchy badges, status controls, and other actionable descendants; preserve the existing resize cursors and prevent interactions on those controls from starting a move.
- Reduce the Ticket Board card's bright hover/focus/related-highlight border accent to the approved subtler treatment without weakening its ability to communicate focus or relation highlighting.
- Server-render the week for requests with a valid `?date=` query, where the selected week is already known to the server. Preserve the existing no-query browser-local date resolution rather than adding timezone state or substituting the server timezone.
- For the no-query initial visit, keep the existing client-side date bootstrap but make its loading shell match the loaded agenda card's horizontal inset, vertical gap, and computed padding so the transition does not jump.
- Keep week navigation, date queries, drag/move/resize behavior, overlap rules, status actions, APIs, data, and the supported 1280 CSS px viewport unchanged.
- No new ADR is expected for these focused presentation/loading changes. Update `PLAN.md` only after the plan is approved, then record implementation evidence here.

### Plannotator feedback incorporated

The reviewer asked to avoid unnecessary complexity: keep the current default behavior when that is simplest, but SSR-render requests where it can be done without added complexity. Accordingly, keep the no-query browser-local bootstrap unchanged and use a valid `?date=` query as the SSR week anchor. Do not add timezone cookies or use the server timezone as a substitute.

## Out of scope

- Changes to agenda/ticket APIs, database schema or data, authentication, time-entry ownership/overlap rules, or ticket status behavior.
- Changes to Agenda week/date navigation, local date semantics, drag geometry, move/resize behavior, or keyboard/accessibility semantics.
- Changes to the Ticket Board's drag/drop or relation-locate behavior beyond the border color and card cursor affordance.
- App-wide card hover redesign, responsive/mobile layouts, new dependencies, or a general loading-state refactor on other pages.
- Any implementation outside the approved scope.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- `docs/milestones/m28-desktop-only-ui-cleanup.md` — supported desktop width and compact spacing
- `docs/milestones/m29-today-week-only-ui-polish.md` — Week-only Agenda behavior and local-date semantics
- `docs/milestones/m30-agenda-toolbar-and-timeline-polish.md` — current local clock and week navigation
- `docs/milestones/m32-ticket-board-status-icons-cards-and-done-visibility.md` — current compact Board card presentation and subtle base border
- `docs/decisions/0029-weekly-agenda-and-conflict-previews.md` — weekly date and drag semantics
- `docs/decisions/0042-desktop-only-ui-and-spacing.md` — 1280 CSS px support floor and spacing rules
- `docs/decisions/0044-week-only-agenda-and-status-selector.md` — canonical `/agenda` route and week-only behavior
- `.agents/skills/nuxt-ui/SKILL.md` — project Nuxt UI guidance; consult relevant component references before implementation if needed
- `app/pages/agenda.vue`, `app/composables/useApiFetch.ts`, `app/components/WeeklyAgenda.vue`, `app/components/TodayAgendaEntry.vue`, `app/components/EntityCard.vue`, `app/components/TicketBoardCard.vue`, `app/app.config.ts`, `server/api/agenda/week.get.ts`
- `tests/e2e/agenda-week.test.ts`, `tests/e2e/agenda-drag.test.ts`, and focused Ticket Board E2E coverage

## Approach

1. **Keep the browser-local default and use explicit query dates for SSR.** Initialize `date` synchronously from a valid `route.query.date` before the week fetch is set up. For a missing or invalid date query, retain `syncRouteDate()` on mount and its current browser-local `today(getLocalTimeZone())` behavior; do not add timezone cookies or substitute a server timezone.
2. **Fetch query-anchored weeks through Nuxt SSR.** Reuse the existing `useApiFetch()` request-context behavior and `/api/agenda/week`; do not add an endpoint. Ensure initial SSR data is hydrated rather than fetched a second time immediately after mount. Keep subsequent week navigation and refresh/error flows working through the existing composable. No-query page requests continue to fetch after the existing client-local date bootstrap.
3. **Unify the loading shell with the loaded card.** Use the same `UCard` placement and app-authored spacing in both states. Confirm actual computed padding and outer geometry before changing styles; align the loading and loaded top gap, horizontal inset, and body padding. Avoid adding unnecessary placeholder complexity if SSR removes the normal loading state.
4. **Add the Agenda drag affordance.** Reuse the compact card border/surface, add transition and subtle hover/focus border styling, and apply grab/grabbing only to the movable card area. Keep native/explicit pointer cursors on links and controls and the existing `n-resize` / `s-resize` handles. Do not change pointer event routing or gesture calculations.
5. **Subdue card border highlights in both surfaces.** Keep the current neutral base border. Apply a softer semantic primary tint consistently to Agenda hover/focus and Ticket Board hover/focus/related highlighting, scoped so unrelated `EntityCard` users do not change.
6. **Regression coverage.** Add browser checks for card-body hover border and grab/grabbing cursor, pointer cursor on nested links/badges/status controls, resize cursor retention, subtle border styling on Agenda/Board, and unchanged drag/click behavior. Verify that a valid `?date=` request renders its week from SSR without a duplicate client week request; verify that a no-query request retains browser-local fallback behavior and that its loading/loaded card geometry matches.
7. Run the project's focused and full checks, inspect the Agenda and Ticket Board at 1280 CSS px, and record exact commands, results, manual findings, and deviations here.

## Files to modify

- `app/pages/agenda.vue` — initialize valid query dates early enough for SSR; preserve the no-query browser-local behavior; align loading and loaded shells; keep current refresh/error behavior.
- `app/components/TodayAgendaEntry.vue` — Agenda card hover/focus border and movable-area cursor while preserving nested action cursors.
- `app/components/EntityCard.vue` and `app/components/TicketBoardCard.vue` — scope a subtler hover/focus border treatment to Board cards and retain related-ticket highlighting.
- `tests/e2e/agenda-week.test.ts` and `tests/e2e/agenda-drag.test.ts` — add SSR/bootstrap, geometry, cursor, and drag regressions; extend focused Board tests as needed.
- `PLAN.md` — add the approved M33 roadmap entry after plan approval.
- `docs/milestones/m33-agenda-card-hover-and-initial-load.md` — implementation journal, verification, review, and closeout evidence.

No changes to `server/api/agenda/week.get.ts`, the response contract, database schema, or dependencies are expected.

## Reuse

- Reuse `useApiFetch()`'s current SSR request-context handling, the existing `/api/agenda/week?startDate=...` endpoint, and `refreshWeek` failure handling.
- Reuse `TodayAgendaEntry`'s current data attributes, `WeeklyAgenda` pointer capture, and target filtering for interactive descendants; do not reimplement drag logic.
- Reuse `EntityCard`'s existing base border and hover/focus state, adding only a scoped subtler variant for the Ticket Board.
- Reuse existing Playwright auth/agenda fixtures and deterministic date/time setup in the Agenda tests.
- Preserve Nuxt UI standard control sizes and semantic theme colors under ADR 0042.

## Decisions and ADR links

- Existing policy: Agenda dates and the current-time action use the browser's local date/time; the selected `date` query anchors the configured week (M29/M30, ADRs 0029 and 0044).
- Existing policy: desktop mouse drag remains authoritative; time entries remain date-bound and subject to existing conflict rules (ADR 0029).
- Proposed presentation: use a quieter semantic accent for Agenda and Ticket Board card border highlights; keep neutral base borders and all existing interaction/focus states.
- Decision from Plannotator feedback: keep the default no-query browser-local bootstrap unchanged and avoid timezone-cookie complexity; SSR-render weeks when a valid `?date=` query supplies the anchor.
- No other durable product or architecture decision is proposed. No ADR is planned because query-anchored SSR reuses existing route/API behavior and leaves the no-query browser-local default unchanged.

## Implementation checklist

- [x] Human approves this revised plan via Plannotator before implementation (2026-10-08).
- [x] SSR-render the selected week for valid `?date=` requests; preserve the no-query browser-local behavior and avoid duplicate hydration reads.
- [x] Match loading and loaded card gap, horizontal inset, and computed padding where a loading fallback remains.
- [x] Add Agenda grab/grabbing affordance and hover border while preserving pointer cursors for actionable descendants and resize cursors.
- [x] Apply a subtler border highlight to Agenda and Ticket Board without changing unrelated cards or Board drag/highlight behavior.
- [x] Add focused regression coverage for SSR/bootstrap, geometry, cursor/border states, and retained interactions.
- [x] Run formatting, lint, both typechecks, unit tests, build, workflow-doc checks, and diff checks; record outcomes.
- [x] Focused/full E2E — explicitly deferred by the user's 2026-10-08 completion declaration; not run because the dev server remained stopped per the user's prior request.
- [x] Manual 1280 CSS px inspection — explicitly deferred by the user's 2026-10-08 completion declaration; not performed.
- [x] Submit the full implementation diff for human code review; Plannotator approved with no changes requested on 2026-10-08.
- [x] Record the human completion declaration before closing M33 (2026-10-08).

## Journal

### Plan preparation

- Fact: source inspection found the Agenda week request is deliberately deferred until `onMounted()` sets the browser-local route/default date; settings and ticket reads already use awaited SSR-capable `useApiFetch()` calls.
- Fact: the week API requires an explicit valid `startDate`; the server has no browser timezone on a no-query request. A valid `?date=` query is available to SSR.
- Fact: loading and loaded Agenda states use the same themed Nuxt UI card-body padding (`p-2`); only the loaded card currently has an additional `mt-2`. The reported discrepancy should be verified using computed browser geometry and corrected within the chosen data-loading approach.
- Fact: Agenda cards have no hover/grab style; the Board uses `cursor-grab active:cursor-grabbing`, while Board card links/actions and Agenda resize handles need their own cursors preserved.
- Decision proposed: match the Board's drag affordance, soften the Agenda/Board accent borders, SSR the week wherever the local date is reliably known, and make any necessary loading fallback geometrically match the loaded card.
- Initial open question: choose how SSR resolves the no-query default week without changing browser-local date behavior. This was resolved by the Plannotator feedback recorded below.
- Evidence: read the workflow, roadmap, prior M28–M32 milestone records, relevant ADRs, Nuxt UI skill, page/components/API/composable, and current E2E tests. `git status --short --branch` was clean on `main` before creating this plan. No application code, roadmap, ADR, API, or schema was changed.

### Plannotator feedback incorporated

- Human feedback: “let's avoid complexifying the code, so if keeping the default behavior is the simplest, keep doing it. but if we can ssr-render some requets with no cost, go for it.”
- Decision: preserve the existing client-local bootstrap for `/agenda` without a `date` query. SSR-render a request with a valid `?date=` anchor because the request already supplies the selected date. Do not add timezone cookies or use the server's timezone as a substitute.
- Evidence: the first Plannotator gate returned `decision: annotated` with the timezone question answered as “Other.” The plan was revised to incorporate that direction; implementation has not started.

### Plannotator plan approval

- Decision: the revised plan is approved. Keep no-query browser-local initialization; SSR-render requests with an explicit valid `?date=` anchor. Implement the requested Agenda drag affordance and subtler card borders, and verify loading/loaded geometry.
- Evidence: `plannotator annotate docs/milestones/m33-agenda-card-hover-and-initial-load.md --gate --json --require-approval` returned `{"decision":"approved"}` on 2026-10-08. No application implementation had started.

### 2026-10-08 — Implementation

- Fact: `/agenda?date=...` now initializes its validated date before the week fetch, allowing the existing `useApiFetch('/api/agenda/week')` call to render through SSR. No-query visits still resolve the browser-local date on mount. Added E2E assertions for SSR output and no duplicate browser week read.
- Fact: Agenda timeline entries now show a subdued primary hover/focus border and `grab`/`grabbing` cursors on the movable surface. Descendant links, buttons, and role-based controls explicitly retain pointer cursors; top/bottom resize handles retain their directional cursors. The Ticket Board opts into the same 50% primary border tint for hover/focus and related-ticket highlights; other `EntityCard` users are unchanged.
- Fact: the loading and loaded Agenda cards now share `mt-2`, the same UCard body padding, and a stable test identifier. Added a delayed-request E2E comparison of their geometry.
- Verification: Nuxt typecheck, tsgo typecheck, oxlint, Vitest (14 files / 75 tests), and Nuxt production build passed. Oxfmt, workflow-doc, and whitespace checks passed; Playwright discovered 42 E2E tests. The build emitted only non-fatal Vite/Rolldown plugin-timing advisories.
- E2E limitation: browser tests were not run because `127.0.0.1:3000` is not listening (`curl http://127.0.0.1:3000/api/health` failed to connect). M32 records the user's direction to leave the development server stopped for the user to run. The new browser assertions and manual 1280px visual review are therefore pending and are not claimed as passed.
- Scope: no API, server, schema, dependency, data, or date-semantics changes. No implementation deviation identified; E2E verification remains outstanding.

### 2026-10-08 — Plannotator code review

- Decision: Plannotator approved the full uncommitted implementation diff with no changes requested. At that point M33 remained open for the pending E2E execution and visual review.
- Evidence: `plannotator review --git --diff-type uncommitted --no-git-remote-check --json` returned `{"decision":"approved","message":"# Code Review\n\nCode review completed — no changes requested."}` on 2026-10-08.

### 2026-10-08 — User completion declaration

- Fact: the user stated, “i declare this milestone complete.”
- Decision: record M33 as Complete. The user accepted the previously disclosed deferral of focused/full browser tests and the 1280 CSS px visual inspection; neither is represented as passing.
- Evidence: the completion declaration in this conversation. The unavailability of `127.0.0.1:3000`, prior direction to leave the development server stopped, passing non-browser checks, and approved Plannotator code review are recorded above.

## Verification

Planning checks:

- [x] `node scripts/check-workflow-docs.mjs` — passed; workflow documentation structure is complete.
- [x] `./node_modules/.bin/oxfmt --check docs/milestones/m33-agenda-card-hover-and-initial-load.md` — passed.
- [x] `git diff --no-index --check /dev/null docs/milestones/m33-agenda-card-hover-and-initial-load.md` — no whitespace diagnostics (expected untracked-file exit status normalized).
- [x] Human Plannotator review — approved the revised query-anchored SSR scope before implementation on 2026-10-08.

Implementation checks (after plan approval):

- [x] `./node_modules/.bin/nuxt typecheck` — passed.
- [x] `./node_modules/.bin/tsgo --project tsconfig.tsgo.json --noEmit` — passed.
- [x] `./node_modules/.bin/oxlint .` — passed.
- [x] `./node_modules/.bin/vitest run` — 14 files / 75 tests passed.
- [x] `./node_modules/.bin/nuxt build` — passed; non-fatal Vite/Rolldown plugin-timing advisories were emitted.
- [x] `./node_modules/.bin/oxfmt --check` on modified source, tests, `PLAN.md`, and this milestone — passed.
- [x] `node scripts/check-workflow-docs.mjs`, `git diff --check`, and untracked milestone whitespace check — passed.
- [x] `./node_modules/.bin/playwright test --list` — discovered 42 E2E tests, including the new M33 coverage.
- [x] Focused/full Playwright execution and manual 1280 CSS px review — explicitly deferred by the user's 2026-10-08 completion declaration; not run. The app server was stopped at the user's prior request, and a port check confirmed `127.0.0.1:3000` was unavailable. No browser behavior is claimed as verified.

## Review status

- Plan review: Approved via Plannotator on 2026-10-08.
- Code review: Approved via Plannotator on 2026-10-08 with no changes requested.
- Milestone completion declaration: Complete — declared by the user on 2026-10-08; the browser checks and visual review were accepted as explicit deferrals.

## Follow-ups

- No open follow-up. Focused/full E2E and manual 1280 CSS px review remain unrun and are explicitly deferred by the user's completion declaration; they are not passing results.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred; the user accepted the unrun browser and visual checks.
- [x] Verification evidence recorded, including the checks that were not run.
- [x] Human code review accepted via Plannotator.
- [x] Human completion declaration recorded in the journal and review status.
