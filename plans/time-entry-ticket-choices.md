# Revised focused plan — Time-entry ticket choices and searchable data selectors

## Context and observed facts

- `app/pages/today.vue` loads `/api/tickets` and uses the result for the ticket selector in its “Add completed work” modal. The same ticket collection also feeds Today hierarchy filters and status actions.
- `/api/tickets` includes Done tickets, as required by the board and other ticket workflows. Filtering that shared collection would affect those unrelated features.
- The ticket-detail time-entry form in `app/components/TicketTimeEntries.vue` is already bound to its current ticket; it does not offer a ticket list.
- Other forms use non-searchable `USelect` controls for user-managed entities: clients, projects, releases, and tickets. These options can grow as the user adds records. Relevant current pages include project creation, release creation, ticket creation/editing, ticket relations, and Today time-entry creation.
- Existing `USelect` controls for fixed, code-defined choices include ticket statuses, durations, and agenda settings. Existing searchable `USelectMenu` filters provide a project pattern for searchable options and touch-friendly search focus.
- The earlier version of this focused plan was approved in Plannotator. The scope below has since expanded at the user’s direction; that approval does not authorize the revised scope. No application code has been changed during planning.

## User direction and proposed scope

1. In the Today page’s new-entry ticket selector (used in both Day and Week views), omit tickets whose status is `Done`.
2. Make selectors backed by user-managed/free data searchable throughout the app. Treat clients, projects, releases, tickets, and relation-ticket choices as free data. Use searchable `USelectMenu` controls for these collections, retaining existing labels and selection values.
3. Keep simple `USelect` controls for fixed, code-defined choices such as ticket status, duration presets, and agenda settings. Preserve existing status enum controls and existing filter menus. This applies the user's “only the enum should use selects” guidance to the distinction between fixed choices and user-managed records.
4. Audit all current `<USelect>` usages during implementation and convert any additional user-managed collection selector found; do not convert fixed-choice controls.
5. Keep the unfiltered ticket response in Today for hierarchy/status filters and status actions. The eligible-ticket list for new entries must be separate. Use that eligible list for the modal’s empty state and submit guard.

**Scope interpretation for review:** this excludes Done tickets from the Today/Week ticket picker only. It does not prohibit adding a time entry from a Done ticket’s detail page and does not add a server/API restriction. Existing entries and Done-ticket history remain unchanged.

## Out of scope

- Changing ticket status rules, board/filter visibility, archived-ticket behavior, or the `/api/tickets` response.
- Rejecting time-entry creation for Done tickets at the API/domain layer.
- Changing the fixed-ticket form on ticket detail or editing existing time-entry history.
- Making finite fixed-choice controls searchable or redesigning their options.
- Schema, migration, dependency, or API changes.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/m5-today-agenda.md` — completed Today agenda behavior and quick-add selector
- `docs/decisions/0011-manual-time-entry-history-and-slots.md` — existing time-entry and history rules
- `docs/decisions/0020-m8-polish-decisions.md` — searchable Today/Tickets filters and prior form-select scope
- `app/pages/today.vue` — ticket data use, add modal, and entry submit handler
- `app/pages/projects/new.vue`, `app/pages/releases/new.vue`, `app/pages/tickets/new.vue`, `app/pages/tickets/[id]/edit.vue`, `app/pages/tickets/[id]/index.vue` — user-managed entity selectors to audit/convert
- `server/api/tickets/index.get.ts` — owner-scoped active-hierarchy ticket list
- `app/components/TicketTimeEntries.vue` — fixed-ticket detail form
- `shared/ticket-status.ts` — fixed status vocabulary, including `Done`
- `app/pages/tickets/index.vue` and existing Today/Tickets filter menus — searchable `USelectMenu` conventions

## Approach

1. Derive a separate eligible-ticket collection in `app/pages/today.vue`, filtering `Done` from the fetched tickets. Keep the original `tickets` collection for filters and status actions.
2. Use the eligible collection for the Today/Week modal’s ticket options, empty state, and submit guard. Keep existing hierarchy labels and active/archive handling.
3. Convert data-backed entity selectors from `USelect` to searchable `USelectMenu` in the listed forms. Use clear search placeholders and preserve single-selection, `v-model` values, prerequisite/empty/error states, and route context. Do not alter enum or fixed-choice selectors.
4. Follow the existing searchable-filter interaction pattern: search is keyboard accessible, and opening the picker on a touch device must not automatically focus the search field and summon the mobile keyboard.
5. Audit all `<USelect>` call sites to confirm every remaining simple select has fixed code-defined options. Keep existing `USelectMenu` filters and their current search/focus behavior unchanged.
6. Add browser coverage for Done-ticket exclusion, searching/selecting free-data options across the affected entity types, and successful form submission/updates. Retain coverage that fixed status controls remain usable.
7. After the revised plan is approved, record the durable selector convention in a new ADR (proposed next number: `0037`) and update `docs/decisions/README.md`. Record the Today-specific post-closeout follow-up in `docs/milestones/m5-today-agenda.md`; keep M5’s completed status unchanged. No roadmap feature changes are planned.

## Files to modify after approval

- `app/pages/today.vue` — derive/use eligible tickets and make the new-entry ticket picker searchable.
- `app/pages/projects/new.vue` — make the client selector searchable.
- `app/pages/releases/new.vue` — make the project selector searchable.
- `app/pages/tickets/new.vue` — make release and related-ticket selectors searchable.
- `app/pages/tickets/[id]/edit.vue` — make the release selector searchable; leave the status enum selector unchanged.
- `app/pages/tickets/[id]/index.vue` — make the link-a-ticket selector searchable.
- Any additional app page found by the `<USelect>` audit to select user-managed data; fixed-choice controls remain unchanged.
- `tests/e2e/agenda.test.ts`, `tests/e2e/agenda-week.test.ts`, `tests/e2e/agenda-drag.test.ts`, `tests/e2e/hierarchy-breadcrumbs.test.ts`, `tests/e2e/ticket-navigation.test.ts`, and `tests/e2e/tickets.test.ts` — update/add focused search, selection, Done-exclusion, and save/update assertions as appropriate.
- `docs/decisions/0037-searchable-data-backed-selectors.md` and `docs/decisions/README.md` — record/index the approved general selector convention.
- `docs/milestones/m5-today-agenda.md` — append the Today-specific post-closeout implementation and verification record without changing M5 status.
- `plans/time-entry-ticket-choices.md` — keep the approval, implementation, and verification record current.

## Reuse

- Reuse the existing `/api/tickets` fetch and its ownership/archive filtering; no endpoint is needed.
- Reuse Nuxt UI `USelectMenu` and the searchable filter input patterns already used on Tickets and Today. Do not add a new component or dependency.
- Preserve existing `USelect` status controls backed by `ticketStatuses` and fixed duration/settings choices.
- Reuse current E2E fixture patterns for creating clients, projects, releases, tickets, and time entries.

## Implementation checklist

- [x] Obtain human approval of this revised plan through Plannotator before changing application code.
- [x] Exclude Done tickets only from the Today/Week new-entry selector and use the eligible list for its empty state and submit guard.
- [x] Convert all user-managed, data-backed entity selectors to searchable `USelectMenu`; verify the `<USelect>` audit leaves only fixed-choice selects.
- [x] Add browser coverage for search and selection across the affected entity kinds, Done exclusion, successful creation/update, and unchanged enum controls.
- [x] Add/index the ADR for the selector convention and append Today follow-up evidence to M5.
- [x] Run focused and project verification, record actual results, and present the full diff for human code review.

## Verification

After approval:

- Focused Playwright: verify Done is absent from the open Today ticket choices; a non-Done ticket remains searchable, selectable, and savable; confirm existing Done tickets remain available through unrelated filters/history.
- Playwright for user-managed choices: search and choose a client, project, release, and ticket/relation option in the relevant create/edit/link forms; verify selection persistence and existing route context. Confirm touch-device search does not auto-focus and open the mobile keyboard.
- Verify fixed ticket-status controls still offer the full `ticketStatuses` enum and continue to update status; fixed duration/settings selectors remain unchanged.
- Manually check the Today add picker in Day and Week views and at a narrow viewport; inspect the no-eligible-ticket empty state if represented by the fixture.
- Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, `pnpm exec playwright test --workers=1`, `pnpm build`, `pnpm check:workflow`, and `git diff --check`; record actual outcomes and environment limitations.
- No database migration or DB-specific verification is expected.

## Open question for review

The Done-ticket interpretation remains limited to the Today/Week picker. Should Done tickets also be blocked when adding directly from their ticket-detail page, or by the API? That would be a broader work-eligibility rule and is not included here.

## Implementation and verification record

### Implementation — 2026-10-01

- Fact: Today keeps the full `/api/tickets` collection for hierarchy filters and status actions, while a separate eligible list excludes Done tickets from the Day/Week quick-add selector and submit guard. No API, domain rule, detail-page restriction, or history behavior changed.
- Fact: Client, project, release, ticket, and relation selectors backed by user-managed collections now use searchable `USelectMenu` controls with entity-specific search prompts. The `<USelect>` audit found only fixed status, duration, and settings choices remaining.
- Decision: Accepted ADR `0037` records this selector convention. M5 remains Complete; its journal records this narrow post-closeout follow-up.
- Evidence: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (13 files, 72 tests), `pnpm exec playwright test --workers=1 --timeout=120000` (28 passed), `pnpm build`, `pnpm check:workflow`, and `git diff --check` passed. Playwright exercised Done-ticket exclusion and continued visibility through unrelated filters, selector search/selection and form actions, mobile search focus behavior, and Day/Week add flows.
- Environment note: Playwright's dev server logged non-fatal `ResizeObserver loop completed with undelivered notifications` messages; all 28 tests passed. No separate manual visual check or all-tickets-Done empty-state check was performed.
- Human review: Plannotator code review approved the complete diff with no changes requested.

## Review status

- Previous plan review: Approved via Plannotator before the scope expansion; superseded by this revised plan.
- Revised plan review: Approved via Plannotator (`decision: approved`); no feedback returned.
- Implementation: Complete; Plannotator code review approved with no changes requested.
