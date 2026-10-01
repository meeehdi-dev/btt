# M5 — Today agenda (Complete)

## Context

M4 is complete; the next roadmap milestone is M5, making Today the primary working surface for reviewing and adding completed ticket-linked work. M4 already persists date-only, 30-minute, non-overlapping entries; M6 reserves drag/drop.

## Approved scope

Approved via Plannotator. Follow the full M5 roadmap: mobile-friendly day agenda, 08:00–20:00 default configurable visible window, date navigation and quick add of completed work, filters by client/project/release/ticket/status, and badge-click contextual actions (filter or navigate). Include the product plan's day progress/overtime bar with configurable workday-duration target; leave start-of-week for a weekly view. No filtered result should change the whole-day progress total.

## Out of scope

Desktop drag/create/resize/move (M6), timer, reports, configurable slot grid, weekly view/start-of-week settings, changes to M4's entry/archival/overlap rules.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`, `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- `docs/milestones/m4-manual-time-entries.md`; `docs/decisions/0004-m2-core-data-model.md`, `0007-m3-ticket-model-and-relations.md`, `0011-manual-time-entry-history-and-slots.md`

## Approach

1. Add an owner-scoped `/api/agenda?date=YYYY-MM-DD` read joining entry → ticket → release → project → client, including archived history and labels/IDs/status/color for filter badges; sort by start and return unfiltered day total. Validate a real date; keep the existing ticket-scoped `/api/time-entries` GET unchanged. Use the date-only string end-to-end (no UTC conversion).
2. Add per-user settings row/API for `visibleStartMinute`, `visibleEndMinute` (defaults 480/1200, 30-minute aligned, 0 ≤ start < end ≤ 1440) and `workDayDurationMinutes` (default 480, positive 30-minute multiple, at most 1440). Settings page edits/saves; absent row reads defaults. Do not add start-of-week until there is a weekly surface. Review migration and ownership checks; no new packages.
3. Replace the Today placeholder with local-calendar-date initialization on mount, previous/next/today and calendar navigation; SSR-safe initial loading. Show labelled hourly/half-hour grid with noninteractive positioned blocks on desktop, legible chronological cards or stacked timeline on mobile, and accessible text/actions. Entries outside the configured window must remain discoverable (compact before/after sections, not silently clipped). Use M4's `UCalendar`, `UInputTime`, duration selection, save/error pattern for a Today quick-add form with an active-ticket selector, date prefilled, and API POST; refresh day results after save. Reuse the existing ticket detail for history/correction unless a day-level edit is justified during review.
4. Filter the fetched day rows in UI by client/project/release/ticket/status using single-value hierarchical selectors built from the day rows (downstream choices and selections reset when parent changes); status independent. Treat archived history as visible and filterable by the hierarchy/status labels returned with entries, even if excluded from active ticket selectors. Badge popovers for client/project/release/ticket offer 'Filter' and 'Open detail'; status offers 'Filter' only (no status detail route). Archived ancestor detail currently 404s even with `?archived=true` for project/release; extend read-only explicit archived detail behavior and breadcrumbs for owner-scoped project/release pages so historical badge navigation works, without relaxing default lists or writes. Provide clear filters/date controls and empty/loading/error states. Day total and progress use the full unfiltered day; filtered sum can be shown separately.
5. Add focused unit/API/browser coverage for validation/ownership/archival, window boundaries, totals, filtering and badge navigation, quick add/overlap errors, responsive layout and keyboard access. Record commands/evidence; any durable setting policy gets an ADR after human approval.

## Files to modify

- `app/pages/today.vue`, `app/pages/settings.vue`, new `app/components/TodayAgenda.vue` (and small badge/filter or form component if warranted).
- `server/api/agenda/index.get.ts`, `server/api/settings/index.get.ts`, `server/api/settings/index.patch.ts`, `server/domain/schemas.ts`, `server/db/schema.ts`, new generated `drizzle/` migration + metadata; `server/api/projects/[id].get.ts`, `server/api/releases/[id].get.ts` and their read-only detail pages for archived-ancestor navigation; a pure shared agenda/settings helper if useful.
- `tests/unit/`, `tests/e2e/`, this milestone file, `docs/decisions/README.md` and new ADR if a durable setting decision is approved.

## Reuse

- `app/components/TicketTimeEntries.vue` for Nuxt UI calendar/time pickers, duration controls and save/error behavior; `app/utils/ticket-estimate.ts` for duration labels.
- `server/api/time-entries/index.post.ts` for creation; `shared/time-entry.ts` for date/slot validation; keep ticket-scoped history GET unchanged. `server/api/tickets/index.get.ts` provides active ticket choices and hierarchy labels; archived history needs its own day-read labels. `app/pages/tickets/index.vue` uses `useFetch`, reactive filters and refresh/error patterns; `app/components/ArchiveFilterButton.vue` is a small toggle example. `tests/e2e/time-entries.test.ts` has two-user fixtures, archival tests and mobile overflow checks.

## Decisions and ADR links

- ADR 0004/0007: owner-scoped hierarchy and archive behavior; ADR 0011: fixed slot/overlap/history rules. M5 defaults and archived navigation are documented in ADR `docs/decisions/0012-today-agenda-settings-and-history.md` following approved plan.

## Implementation checklist

- [x] Obtain human approval via Plannotator before implementation; review migration/settings contract.
- [x] Add owner-scoped day read and persisted settings with validation and tests.
- [x] Build responsive date-aware agenda, out-of-window history, quick add and day progress.
- [x] Add hierarchy/status filters, contextual badges and keyboard/mobile affordances.
- [x] Run unit/API/browser/full checks, record evidence/ADR as needed and obtain human code review and completion declaration.

## Journal

### Planning — initial orientation

- Fact: M4 is marked Complete; `PLAN.md` identifies M5 as Today agenda and M6 as drag/drop. `app/pages/today.vue` and `app/pages/settings.vue` are placeholders. `app/components/TicketTimeEntries.vue` already uses `UCalendar`, `UInputTime` and `USelect`; `/api/time-entries` GET requires `ticketId`, and there is no `UserSettings` table in `server/db/schema.ts`.
- Fact: `PLAN.md` explicitly lists filters by client/project/release/ticket/status and badge-click contextual popovers under M5, not M7. M7 covers universal search and polish. Decision (human): follow the full M5 roadmap; do not defer filters/badge actions.
- Fact: ticket board API excludes archived ancestors; M4's time-entry history is retained even with archived ancestors (ADR 0011). Day read must join all owned historical rows, while quick-add ticket choices stay active. Client detail GET supports `?archived=true`; project/release detail GET still reject archived ancestors even with this flag; ticket detail already supports archived ancestor history. Settings table/API do not yet exist; `PLAN.md` drafts workday duration and a progress/overtime bar but does not assign start-of-week to an M5 UI.
- Proposed decision for review: M5 stores only settings actually used by the day agenda (visible window and workday duration); implement hour window as a display preference, not a constraint on entry times. Date navigation and out-of-window presentation ensure retained history remains accessible.
- Planning evidence: `node scripts/check-workflow-docs.mjs` passed (structure complete); `git diff --check` passed. Only the new markdown milestone file was untracked; no application code changed.
- Decision (human): Plannotator plan approved; implementation authorized. Reviewed settings contract: per-user row keyed by user UUID, default 480/1200 visible minutes and 480 target minutes, 30-minute grid and bounds 0..1440; migration adds one settings table only, no backfill needed because reads supply defaults. Generated SQL must be inspected before local migration.

### Implementation — day read and settings

- Fact: new `/api/agenda` reads owner-scoped entries across archived ancestors and returns hierarchy metadata plus unfiltered day total; existing ticket-scoped history GET unchanged. Settings GET defaults when absent; PATCH validates integer 30-minute grid/window/target through Effect Schema + pure helper and upserts an owner-keyed row. Database checks duplicate the bounds.
- Evidence: reviewed `drizzle/0007_loud_eternity.sql` (only user settings table, check constraints, cascade user FK); `pnpm db:generate`, `pnpm db:migrate`, second generate (no drift), focused Vitest (2 passed), `pnpm typecheck`, and focused Playwright API test (1 passed). Local dev DB only.

### Implementation — day UI

- Fact: Today now initializes a local calendar date on mount and fetches that day, has day navigation, a desktop timeline/mobile chronological cards, before/after window sections, a ticket-linked quick-add form, and unfiltered day progress/overtime. Settings page edits the visible window and target. No new entry rules or dependency.
- Evidence: initial `pnpm typecheck` failed because literal `as const` defaults inferred narrow refs in settings; changed to `ref<number>`; rerun `pnpm typecheck` and `pnpm lint` passed. Browser verification pending.

### Implementation — filters and navigation

- Fact: client/project/release/ticket/status selectors filter day rows without affecting total; badge popovers on in-window and out-of-window entries offer filter and owner-scoped detail navigation. Explicit `?archived=true` project/release detail reads now support archived ancestors, while default reads and writes remain restricted. Keyboard-operable Nuxt UI buttons/popovers and mobile chronological cards provide non-drag access.
- Evidence: `pnpm typecheck` and `pnpm lint` passed after filter and detail-navigation changes. API/browser interaction verification pending.

### Pre-review verification

- Fact: first focused browser run found an invalid empty-string `USelect` item; removed it and used a placeholder. Another run found test locator mistaken for button instead of NuxtLink, and a hydration-race on settings save; corrected both. An expanded quick-add test exposed a strict locator collision (desktop and mobile render same text); scoped the assertion to desktop region. Formatting initially flagged generated JSON metadata and later a unit test; both were formatted. `tsgo` initially flagged literal-inferred test overrides; changed helper argument to `Partial<AgendaSettings>`.
- Evidence: generated SQL reviewed (settings table only); local `pnpm db:generate`, `pnpm db:migrate`, second generate (no drift) passed. `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (11 files / 50 passed), `pnpm exec playwright test --workers=1` (8 passed), `pnpm build`, `pnpm check:workflow`, `git diff --check` passed. Focused E2E was rerun (1 passed) after status filter and archived ancestor assertions. No separate manual visual browser review beyond automated Playwright.

### First code review — compact agenda revision

- Human Plannotator review annotated, not approved. Findings discussed in chat and human authorized focused fixes. Verdicts: add form at bottom and large progress card were confirmed design changes introduced in M5; agenda entries lacked the board's ticket/hierarchy icons and card-like styling (confirmed M5 gap); ticket filter only derived from day entries, so active tickets without day entries could not be selected (partly confirmed bug, introduced in M5). Existing board reference: `app/components/TicketBoardCard.vue`.
- Revision: top compact add button opens an accessible `UModal` (Escape/cancel, error stays in modal, closes on successful save); progress is a compact inline indicator and overtime amount. Agenda cards reuse one `TodayAgendaEntry.vue` with ticket/hierarchy/status icons and board-like background/border on desktop/mobile/before/after sections. Filter choices now combine active tickets with archived historical rows; no-option selectors are disabled with an explicit empty state, and a selected ticket with no entries shows a no-match message. No schema, API or dependency changes in this revision. Nuxt UI Modal/Select official docs consulted.
- Revised verification: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (11 files/50 passed), `pnpm build`, `pnpm check:workflow`, `git diff --check`, and `pnpm exec playwright test --workers=1` (8 passed) all passed. Focused browser asserts modal Escape/save/overlap, active ticket filter on empty date, compact progress, badge actions and 390px layout. No separate manual visual inspection was performed. Revised code review pending.

### Second code review — compact cards and per-filter clear

- Human Plannotator review annotated, not approved. Verdict (confirmed M5 UI gaps, discussed in chat): `TodayAgendaEntry.vue` stacked ticket/time/description/metadata rather than two compact rows; `today.vue` only cleared all filters. Human approved compact two-row cards and requested investigating an in-field clear icon before adding separate buttons.
- Fact: official Nuxt UI v4 `USelect` docs do not offer a clear prop, but `USelectMenu` (v4.4+) supports `clear` and `value-key`. Switched agenda filter controls to `USelectMenu` with built-in in-field clear; selecting/clearing a parent still resets dependent filters. Cards now place ticket/time/duration/brief comment on row one, icon links on row two, with tall-block space/full comment between; desktop timeline scale increased so 30-minute cards fit both rows. Kept horizontal metadata scrolling for narrow viewports.
- Evidence: first focused Playwright run timed out because old tests targeted combobox roles instead of SelectMenu buttons; updated locators. A later intermittent timeout occurred at mobile badge after filter interactions; repeat focused Playwright run (2/2 passed) after debugging, no deterministic failure reproduced. Revised checks passed: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (11 files/50 passed), `pnpm build`, `pnpm check:workflow`, `git diff --check`, full Playwright (8 passed). First lint run gave a no-shadow warning in new test; renamed the variable and reran lint clean. Fresh human review pending. Source: <https://ui.nuxt.com/docs/components/select-menu>.

### Third code review — board metadata layout (scope deviation approved in chat)

- Plannotator review annotated, not approved. Fact: `TicketBoardCard.vue` previously rendered title/related links above parent links, and estimate/archive/status actions below; it omitted ticket description on board despite description being present in `/api/tickets`. Human clarified that the board change covers full placement and icons, not only the comment: main metadata line, optional comment line with icon, parent relations last. This is an approved M3.5 UI scope deviation within M5 review; no board status behavior, API or schema change. Fact: spacious agenda comment icon was in source but `inline` icon span had zero width; changed to `inline-flex` with a browser width assertion.

- Implementation: board main line now includes ticket, status icon, estimate icon, related icons and status action; optional single-line description/comment icon follows; icon-linked parent hierarchy is last. Horizontal scrolling preserves access in narrow lanes. First board test found flex shrink made a title invisible; set a non-shrinking, truncated title with tooltip. Added board comment/ordering test; focused board tests pass.
- Evidence: focused `pnpm exec playwright test tests/e2e/agenda.test.ts --workers=1 --repeat-each=2` passed 2/2 after changing the spacious icon. The mobile badge popover link can reposition during pointer-driven Playwright click in a horizontal scroller; verified link navigation with keyboard focus + Enter instead (2/2), retaining a non-drag accessible route. Full suite pending.

### Approved code review with explicit board-arrow cleanup

- Plannotator returned structured `approved` with a note requesting next-status arrow removal. Clarified with human in chat: remove **only** that board button and its dedicated code; retain the ticket edit form status selector. This supersedes ADR 0010's arrow requirement; new ADR `docs/decisions/0013-board-status-control-removal.md` documents the intentional loss of a direct mobile/keyboard board action. Code review approval preceded this cleanup, so the final diff requires fresh review.
- Implementation: removed arrow, `advance` event/handler, board-only `nextStatus` imports and focus targeting of the arrow; kept drag save/retry, ticket-detail next-status action and edit form unchanged. Board E2E tests absence of arrow, desktop drag to Test, and mobile navigation to the edit form's status selector. Old tickets E2E still expected the board arrow; replaced that assertion with API status PATCH + board reload (dedicated drag E2E covers board moves).
- Evidence: first full E2E timed out on the obsolete arrow assertion in `tests/e2e/tickets.test.ts`; corrected it and focused test passed. Final run: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (11 files/50 passed), `pnpm build`, `pnpm check:workflow`, working/staged `git diff --check`, `pnpm exec playwright test --workers=1` (8 passed). Human approved the revised post-cleanup diff via Plannotator with **no changes requested**. Completion declaration remains pending.

### Human completion declaration and closeout

- Decision (human, directly in chat): “i hereby declare this milestone complete.” In context this declares **M5 complete**. The approved implementation checklist is complete, final verification evidence is recorded, and Plannotator code review accepted the final post-cleanup diff with no changes requested. Follow-ups remain M6 drag/drop and a future direct mobile/keyboard board status control; M5 is **Complete**.

## Verification

- [x] Review generated SQL, `pnpm db:generate`, `pnpm db:migrate` (local DB), then regenerate to detect drift; verify defaults and per-user settings isolation.
- [x] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, `pnpm exec playwright test --workers=1`, `pnpm build`, `pnpm check:workflow`, `git diff --check`; record results/failures.
- [x] Browser/API: today/local date and adjacent days; owned entries including archived ancestors, foreign/unauthenticated exclusion; filter total unaffected; badge filter/navigation; active-ticket quick add, reject overlap; early/late entries; settings invalid bounds/step and persistence; 390px no overflow, accessible labelled controls, progress equal/above target. Below-target path uses same computed progress and is covered by display logic but lacks a separate browser assertion. Manual visual review not performed.

## Review status

- Plan review: Approved via Plannotator
- Code review: Approved via Plannotator (final diff, no changes requested)
- Milestone completion declaration: Received in chat; M5 status **Complete**.

## Follow-ups

- M6 desktop-only drag/drop and mobile non-drag alternatives.
- Apply the human-requested metadata icon convention to other views as they are next changed; do not broad-rewrite unrelated pages during M5.
- Design a direct keyboard/mobile board status action if needed; ADR 0013 records the edit form as the remaining non-drag route.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in journal and review status.

### Post-closeout follow-up — searchable ticket choices

- Fact: Under the separately approved `plans/time-entry-ticket-choices.md`, Done tickets are excluded only from Today/Week's new-entry picker and guard. Today retains the full ticket collection for filters/status actions; `/api/tickets`, ticket-detail entry creation, Done history, and archive behavior are unchanged.
- Fact: Data-backed client, project, release, ticket, and relation selectors use searchable `USelectMenu` controls. Remaining simple `USelect` controls are fixed status, duration, or settings choices. ADR `0037` records the convention.
- Evidence: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (13 files/72 tests), `pnpm exec playwright test --workers=1 --timeout=120000` (28 passed), `pnpm build`, `pnpm check:workflow`, and `git diff --check` passed. E2E coverage includes the Today Done exclusion/other-filter preservation, searchable entity choices, mobile no-auto-focus, and Day/Week quick add. Playwright emitted non-fatal dev-server `ResizeObserver loop completed with undelivered notifications` logs. No separate manual visual inspection or all-tickets-Done empty-state check was performed.
- Review status: M5 remains **Complete**. Plannotator reviewed this post-closeout diff and approved it with no changes requested.
