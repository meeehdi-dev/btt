# M16 — Weekly agenda and cross-day moves

> **Status:** Complete. Plan approved via Plannotator on 2026-09-28; the full uncommitted M16–M18 diff received human code-review approval and the human completion declaration was recorded on 2026-09-29.

## Context

M15 (API item ordering) is complete. The agenda currently has a single-day Today view and desktop-only same-day drag interactions. Cross-day dragging and a weekly view were explicitly deferred to a future milestone in M6. ADR 0012 deferred a start-of-week preference until a weekly view existed.

This milestone adds a simple seven-day agenda beside the existing day view. The user asked for a configurable first day of the week, localized weekday/date headings, per-day worktime progress (not a weekly progress total), cross-day time-entry moves, and conflict previews that stay at the attempted cursor position in red rather than snapping visually back to the source entry.

## Approved scope

**Approved via Plannotator on 2026-09-28. Approval authorizes the following scope, including the user-settings schema migration.**

- Add a Day/Week switch to `/today`; keep Day as the initial/default view and retain its existing behavior. In Week mode, date navigation advances by seven days and the existing date picker/Today action continue to select the anchor date.
- Show the seven dates beginning on the configured start day. Default to Monday; persist the setting per user and allow Sunday through Saturday. Use Sunday = `0` through Saturday = `6`, matching JavaScript weekday numbering.
- Render a seven-column shared-hours timeline on wider screens, similar in structure to `../tt`; on narrow screens render the seven days as stacked, accessible day sections rather than forcing page-level horizontal overflow. Preserve all entries outside configured visible hours in per-day before/after sections.
- Label each day with the full weekday name and numeric month/day using the browser's locale and native locale ordering/punctuation (for example, locale-formatted equivalents of “Monday 16/9”). Do not force weekday/date order and do not add a locale preference.
- Show independent workday progress for each date, based on all entries for that day and the configured daily target, regardless of filters or visible hours. Do not display or calculate a weekly progress/target total.
- Reuse the existing agenda filters, entry cards, archived-history visibility, and date-only semantics across both views. Week mode supports desktop drag-create, move (within/across dates), and resize. Drag-created entries use the existing ticket-required add modal; a per-day Add action provides the non-drag/mobile path. Every entry belongs to exactly one date: creation cannot span midnight, movement preserves duration and is rejected if it would cross midnight, and resize stays on its existing date.
- Keep desktop mouse dragging consistent with the existing desktop-only drag policy. Provide a non-drag correction path on mobile/keyboard by adding a work-date picker to the existing Today correction modal; PATCH the selected date and time through the existing owner-scoped endpoint.
- During a move gesture, render a valid preview at its accepted destination. When the pointer proposes an occupied or out-of-bounds destination, retain the attempted preview under the cursor, style it as an error, and label it “Conflict” (or the equivalent existing conflict wording); do not render the invalid preview back at the source. Do not persist invalid drops: the original entry remains unchanged, and the existing accessible error/alert path reports rejection. Preserve the existing small near-edge tolerance for valid placements and server-side conflict checks.

## Out of scope

- Weekly progress totals, reports/summaries, additional filters, calendar sync, or new dependencies.
- Changing the 30-minute slot, midnight, no-overlap, ownership, archival, or ticket-linking rules.
- Touch dragging; changing existing date-only, slot, or overlap rules; cross-midnight entries.
- Automatic country-based start-day detection or browser-locale configuration. The user explicitly chooses the start day; Monday is the default.
- Changing time-entry storage or adding a persisted week/view mode.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`, `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- `docs/milestones/m5-today-agenda.md`, `docs/milestones/m6-agenda-drag-blocks.md`, `docs/milestones/m15-api-item-ordering.md`
- `docs/decisions/0011-manual-time-entry-history-and-slots.md` — date-only entries and owner-wide overlap prevention
- `docs/decisions/0012-today-agenda-settings-and-history.md` — settings, unfiltered daily totals, and archived history
- `docs/decisions/0014-agenda-drag-interactions.md` — current same-day desktop interaction policy; this milestone proposes revising its substantial-conflict snapback presentation only
- `../tt/app/pages/index.vue`, `../tt/app/composables/use-date.ts`, `../tt/app/components/day-progress.vue` — seven-column layout, week boundaries, and per-day progress as UX inspiration

## Approach

1. **Week boundaries and locale formatting:** add pure date utilities for finding the start date of a selected week from `startOfWeekDay`, producing seven local calendar-date strings, advancing weeks, and formatting date-only values through `Intl.DateTimeFormat` with the browser locale. Avoid UTC date-only conversion. Week headers use `{ weekday: 'long', month: 'numeric', day: 'numeric' }`, allowing the locale to choose order and punctuation.
2. **Settings:** extend `shared/agenda.ts`, settings validation/schema/UI, and `user_settings` with `startOfWeekDay` (integer `0..6`, default `1`). Generate and inspect a migration that adds the non-null column with Monday as the default for existing settings rows and a database check. Retain per-user ownership and the existing settings update contract.
3. **Weekly read:** add an owner-scoped `GET /api/agenda/week?startDate=YYYY-MM-DD` read for exactly seven validated calendar dates. Reuse the day read's hierarchy joins, archived-history behavior, deterministic entry ordering, relation/link enrichment, and ownership rules. Return entries with date plus daily totals keyed by date; preserve `/api/agenda?date=...` and its response contract for Day mode. Do not return a weekly tracked-time aggregate.
4. **Agenda UI and gestures:** add the Day/Week switch, week navigation, localized seven-day headings, shared visible-hours grid, and narrow-screen stacked sections. In Week mode, support same-day drag-create (date comes from the target column and opens the existing ticket-required form), move (including between date columns), and top/bottom resize. Clamp creation/resize to the configured day window and midnight; never allow an entry to span dates. Provide a per-day Add action for non-drag/mobile use. Apply filters to rendered rows only. Put the existing progress treatment on each day's heading using that day's unfiltered total. Ensure entries before/after visible hours remain discoverable for every date.
5. **Movement and conflict preview:** extend pure move geometry to represent the snapped attempted date/time separately from whether it is valid. In Week mode determine date from the destination column and time from the shared vertical axis; include that date in the existing PATCH payload and refresh the week after save or failure. Keep source data authoritative until a valid save. Use the invalid candidate for the red “Conflict” preview both in Week mode and the existing Day-mode move preview; invalid drops never reach the API. Resizing remains within the source date and cannot pass midnight. Add the correction modal's date control for mobile/keyboard use, reusing the ticket history date-picker pattern.
6. **Verification and records:** add pure date/locale/move tests, authenticated settings/API coverage, and browser tests for desktop/week/mobile behavior, locale formatting, progress independence, and conflicts. Add a proposed ADR for the new week-start and conflict-preview policy; accept it only after human code review. Update `PLAN.md` to place this work in the milestone roadmap when implementation is approved.

## Files to modify

- `PLAN.md` — move weekly agenda from the later-ideas list into the approved milestone roadmap after plan approval.
- `shared/agenda.ts`, `app/utils/agenda-week.ts` (new), `app/utils/agenda-drag.ts`
- `server/db/schema.ts`, `server/domain/schemas.ts`, `server/api/settings/index.patch.ts`, `drizzle/` generated SQL and metadata
- `server/api/agenda/week.get.ts` (new; plus a shared agenda query helper if needed)
- `app/pages/settings.vue`, `app/pages/today.vue`, `app/components/TodayAgenda.vue`, `app/components/TodayAgendaEntry.vue`, and new `app/components/WeeklyAgenda.vue`; refactor the add form to accept a selected week date and provide per-day Add/Edit actions on narrow screens
- `tests/unit/agenda-week.test.ts` (new), `tests/unit/agenda-drag.test.ts`, relevant agenda/settings E2E coverage (prefer a focused `tests/e2e/agenda-week.test.ts`)
- `docs/milestones/m16-weekly-agenda.md`, new `docs/decisions/0029-weekly-agenda-and-conflict-previews.md`, and `docs/decisions/README.md`

## Reuse

- `app/pages/today.vue` already owns date navigation, settings, filters, entry correction, day progress, and server refresh/error handling.
- `app/components/TodayAgenda.vue` provides the visible-hours grid, pointer capture, day-mode gestures, filtered-out blockers, and entry rendering; `TodayAgendaEntry.vue` is the shared ticket/time card.
- `app/utils/agenda-drag.ts` and `shared/time-entry.ts` provide slot geometry and half-open overlap checks. `server/api/time-entries/[id].patch.ts` already accepts a date, and `server/domain/time-entries.ts` serializes owner writes and rejects overlaps for the requested date, so cross-day persistence should reuse this boundary without schema changes.
- `server/api/agenda/index.get.ts` is the source for owner-scoped day reads, full daily totals, archived history, stable ordering, and related ticket/link data.
- `shared/agenda.ts`, `server/db/schema.ts`, `/api/settings`, and `app/pages/settings.vue` define the existing per-user settings pattern. `app/components/TicketTimeEntries.vue` demonstrates the established date-picker correction interaction.
- `../tt` is UX inspiration only; reuse the existing Nuxt/Effect/Drizzle patterns rather than copying its implementation.

## Decisions and ADR links

- User-requested behavior: configurable week start; weekday/date labels localized to browser language and locale order; per-day progress only; cross-day moves; invalid move previews remain at the attempted cursor position in red.
- Proposed default: Monday (`1`), following the requested Monday–Sunday example. The settings selector lists all seven weekday names localized with the browser locale.
- ADR 0011's storage and overlap rules remain authoritative. ADR 0012's daily totals and visible-window semantics remain authoritative. ADR 0014's pointer and near-edge policies remain; its invalid-move snapback presentation was revised by ADR 0029, accepted after human code review on 2026-09-29.
- ADR 0029, `docs/decisions/0029-weekly-agenda-and-conflict-previews.md`, documents the durable week-start and conflict-preview policy and was accepted after the full-diff human code review on 2026-09-29.

## Implementation checklist

- [x] Human approves this plan through Plannotator before implementation; approval explicitly covers the settings migration and the scoped interaction/UI decisions above.
- [x] Add and validate the per-user start-of-week setting, Monday default, database constraint, and migration.
- [x] Add pure week-boundary/date-formatting utilities and an authenticated seven-day agenda read with per-date totals.
- [x] Add Day/Week navigation, localized day headings, desktop seven-column view, responsive narrow-screen sections, filters, and per-day progress without weekly progress.
- [x] Support Week-mode desktop drag-create (opening the ticket-required form for that date), per-day non-drag/mobile add and edit, within/across-date moves, same-day resize, and date-picker correction. No entry may span midnight; retain existing domain validation and Day-mode behavior.
- [x] Render invalid move candidates at the attempted position in red with “Conflict”; verify overlap, bounds, and stale-server rejections never persist invalid data.
- [x] Add/index ADR 0029 as Proposed during implementation, then accept it after human code review.
- [x] Run and record schema/migration checks, focused and full tests, type/lint/format/build/workflow checks, manual desktop/mobile/locale review, failures, deviations, and follow-ups.
- [x] Human code review of the full uncommitted M16–M18 diff was approved via Plannotator on 2026-09-29; M16 remains open until its completion declaration is recorded.

## Journal

### 2026-09-28 — Planning and repository research

- Fact: M15 is marked complete in `docs/milestones/m15-api-item-ordering.md`; the worktree was clean before this planning artifact was created.
- Fact: Day agenda data is read from `/api/agenda?date=...`; its total includes all entries for the date. Settings currently persist visible start/end and workday duration only. ADR 0012 explicitly deferred start-of-week.
- Fact: the existing PATCH endpoint accepts `date`, and `saveEntry` validates the real calendar date and checks overlaps transactionally for that date. No time-entry schema/API expansion is needed for a cross-day move.
- Fact: ADR 0014 currently rejects substantial move collisions with a preview rendered at the original entry. Its small near-edge tolerance remains useful; the user-requested change targets the invalid preview position/presentation.
- Fact: `../tt` uses a seven-column week grid and one progress indicator per date. Its date composable defaults to Monday. This plan proposes keeping those high-level UX ideas while reusing this app's day-entry and ownership rules.
- Decision (proposed from direct user instruction): make Monday the default, store weekday values as Sunday `0` through Saturday `6`, display locale-native weekday/date formatting, show only per-day progress, and keep invalid move previews at the attempted position.
- Decision (human via Plannotator feedback): Week mode must also support creating and resizing entries. Revised scope: desktop drag-create/move/resize, day-specific Add actions for narrow/mobile use, and strict single-date entries that never span midnight. On narrow screens, the week is a vertically stacked seven-day view and cross-day correction uses the date-picker form rather than touch dragging.
- Evidence: read `docs/llm-workflow.md`, `PLAN.md`, M5/M6/M15 milestone records, ADRs 0011/0012/0014, relevant settings/agenda/time-entry source, tests, and the Plannotator skill. No application code or database migration was changed.

### 2026-09-28 — Plannotator plan feedback

- Fact: Plannotator returned `annotated`, not approved. The human clarified that Week mode must support adding and resizing time entries, not just moving existing entries.
- Decision: revise Week mode to support desktop drag-create, move, and resize, plus a per-day Add action for narrow/mobile use. Every created/moved/resized entry must remain within one local calendar date; no cross-midnight entries.
- Evidence: first `plannotator annotate docs/milestones/m16-weekly-agenda.md --gate --json --require-approval` returned `decision: annotated` with the two notes recorded above.

### 2026-09-28 — Plan approval

- Decision (human via Plannotator): approved the revised M16 plan, including Week-mode creation and resizing, per-day mobile Add actions, and the single-date/no-cross-midnight constraint.
- Evidence: second `plannotator annotate docs/milestones/m16-weekly-agenda.md --gate --json --require-approval` returned `{"decision":"approved"}`. Implementation is authorized within this plan.

### 2026-09-28 — Implementation and verification

- Fact: added per-user `startOfWeekDay` (Sunday `0` through Saturday `6`, Monday default), database constraint/migration, shared calendar-week/date-format utilities, and owner-scoped `/api/agenda/week` data with seven dates and separate daily totals.
- Fact: `/today` now retains Day mode and adds Week navigation, locale-native headings, per-day progress, a desktop timeline, narrow stacked day cards, date-specific Add/Edit controls, and correction-modal date selection. Cross-day moves reuse the existing owner-scoped PATCH/overlap boundary.
- Decision: ADR 0029 remains Proposed until human code review. No new dependencies or changes to time-entry storage/overlap rules were introduced.
- Evidence: desktop pointer tests found and fixed horizontal-only drag threshold detection and alert-driven timeline layout shifts. Final unit, E2E, type, lint, format, migration, build, workflow, and manual visual-check evidence is recorded below. Human code review and M16 completion declaration were pending at implementation closeout.

## Verification

Plan review:

- [x] `node scripts/check-workflow-docs.mjs` — passed; required milestone structure is complete.
- [x] `git diff --check` — passed; planning artifact has no whitespace errors.
- [x] `plannotator annotate docs/milestones/m16-weekly-agenda.md --gate --json --require-approval` — approved on 2026-09-28 before implementation.

Implementation (only after plan approval):

- [x] Inspect generated SQL; run `pnpm db:generate`, migrate only the local development DB, then regenerate to confirm no drift. The migration adds `start_of_week_day` with `DEFAULT 1 NOT NULL` and a `0..6` check; the API/database tests verify Monday defaults and reject invalid weekdays.
- [x] Run the required checks and record exact outcomes below.
- [x] Browser/API coverage: calendar boundaries, configurable week start and per-user settings, locale-native dates, navigation and Day/Week switching, filtered/out-of-window progress independence, no weekly total, archived/foreign ownership, cross-date moves, conflict/bounds previews at the attempted location, no invalid persistence, mobile date-picker correction, and no page-level overflow.
- [x] Manually inspect desktop and narrow-screen layouts and at least two browser locales before code review.

Implementation evidence:

- `pnpm db:generate` — passed; Drizzle reported no schema changes after generating migration `drizzle/0009_burly_mysterio.sql`.
- `pnpm db:migrate` — passed against the local development database.
- `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build`, `pnpm check:workflow`, and `git diff --check` — passed. Vitest: 13 files / 72 tests passed. The production build completed; Vite emitted non-fatal plugin-timing notices.
- `pnpm exec playwright test --workers=1 --timeout=60000` — passed: 26 E2E tests. Week-specific tests cover settings/database constraints, week ownership and archived rows, localized headings, responsive range text, filters/progress, mobile Add/Edit/date correction, desktop create/move/resize, overlap and bounds conflict previews in red at the attempted column/time, and invalid-drop non-persistence. Existing agenda-drag coverage also passed.
- `pnpm check:workflow` and `git diff --check` — passed after updating the plan, ADR index, and milestone evidence.
- Manual visual review of temporary Playwright screenshots (not retained): 1440px seven-column layout, 390px stacked week with visible per-day Add/Edit and a readable locale-formatted range, and `de-DE` weekday/date headings. Browser checks found no horizontal page overflow.
- Implementation discovery: cross-date drags need a two-axis movement threshold; a vertical-only threshold ignored horizontal moves. Retaining the previous error alert until the gesture finishes also prevents the timeline from shifting under the pointer. The narrow-screen week now has explicit Edit buttons so date correction is reachable without touch dragging.
- Verification hiccups: `pnpm test:e2e -- --workers=1` passed an extra separator and reported no tests; the direct Playwright command was used. One full run at the default 30-second test timeout had four timeouts during a slow local dev-server run and emitted non-fatal `ResizeObserver loop completed with undelivered notifications` Vite-client messages; the complete 26-test rerun with `--timeout=60000` passed. An early `pnpm format:check` found two unformatted files; both were formatted and the final check passed.

### 2026-09-29 — Full-diff human code review

- Evidence: `plannotator review --git --diff-type uncommitted --no-git-remote-check --json` returned `decision: approved` with “Code review completed — no changes requested.”
- Scope: the uncommitted diff contained M16, M17, and M18 changes; this approval satisfies the code-review gate for all three milestones.
- Status: M16 code review accepted. The completion declaration was pending at this point; see the following journal entry.

### 2026-09-29 — Human completion declaration

- Decision: the human declared M16, M17, and M18 complete: “i declare those milestones complete.”
- Status: M16 is complete; its plan, verification, and full-diff human code review are accepted, and the human completion declaration is recorded.

## Review status

- Plan review: Approved via Plannotator on 2026-09-28 (revised scope).
- Code review: Accepted via Plannotator on 2026-09-29 (full M16–M18 diff).
- Milestone completion declaration: Received from the human on 2026-09-29 — Complete

## Follow-ups

- None identified yet. Capture any scope exclusions or browser/layout issues found during implementation and review here.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred.
- [x] Verification evidence recorded.
- [x] Human code review accepted via Plannotator on 2026-09-29.
- [x] Human completion declaration recorded in the journal and review status.
