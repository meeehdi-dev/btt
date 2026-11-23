# M51 — Remove estimates and related tickets; Agenda ticket creation and filtered day hours

## Context and references

Human request (2026-11-23):

1. Remove all ticket estimates.
2. Remove related tickets.
3. Add a button to create a new ticket from the Agenda.
4. Show worked hours (`7h`, `4.5h`) to the right of each Agenda day progress bar.
5. When Agenda filters are active, the day progress bar and hours reflect only the filtered entries.

References: `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md` (product scope names estimates and related tickets, so it must change), ADRs 0007, 0008, 0018, 0020, 0028, 0039, 0061, 0064.

Facts (current code):

- Estimate: `ticket.estimate_minutes` column + positive check (`server/db/schema.ts:130-139`), `TicketCreate`/`TicketUpdate` schemas, ticket POST/PATCH, ticket list ordering “estimated first” (`server/api/tickets/index.get.ts:56`, ADR 0028), Reports “Done estimates” cohort (`server/domain/reports.ts`, `shared/reports.ts`, `app/pages/reports.vue`), UI in `TicketCreateForm`, ticket detail field, `TicketTrackedUsage`, `TicketTimeEntries`, `TicketWorkItem`, `TicketBoardCard`, release detail. `usageColor` (`shared/time-entry.ts`) is only used for estimate ratios. `parseTicketEstimate` is the only user of the `parse-duration-ms` dependency. `formatTicketEstimate` is used everywhere as a generic duration formatter.
- The ticket **status** `Estimate` is a workflow status, not the estimate field. It stays.
- Related tickets: `ticket_relation` table (`server/db/schema.ts:157`), `TicketRelationCreate` schema, `server/api/tickets/[id]/relations/*`, relation loading in ticket GET/list/agenda (`server/domain/agenda.ts`, `shared/agenda.ts`), cleanup in ticket DELETE and creation in ticket POST, UI in `TicketCreateForm` (relation modal), ticket detail section, `TicketContextPopovers` (related trigger), board hover/locate highlight (`app/pages/tickets/index.vue:252-255`), `entity-icons.ts` `related`.
- Agenda: day progress lives in `app/components/WeeklyAgenda.vue:100-118,395-414` and reads the server-computed `trackedMinutesByDate` (`server/api/agenda/week.get.ts`), which ignores filters. `rows` is already the filtered list (`app/pages/agenda.vue:152,932`); `occupied` is unfiltered (for overlap rules).
- `TicketCreateModal` is a self-contained trigger + modal with an optional `initialReleaseId`, used on the board and release detail. It already invalidates the `ticket` resource, which the Agenda's week fetch subscribes to.

## Requirements and acceptance criteria

- R1: No estimate input, display, ratio color, percentage, or API field remains anywhere (create form, ticket detail, board/release cards, agenda, reports). Tracked time stays visible, muted. The `Estimate` status is unchanged.
- R2: Ticket list ordering becomes `createdAt` DESC, `id` DESC (no estimate grouping).
- R3: Reports no longer shows or computes the Done-estimate cohort; period totals/shares are unchanged.
- R4: No related-ticket UI (detail section, create form, popover trigger, board highlight) and no relation API/fields remain. External links are untouched.
- R5: Agenda toolbar has a labeled `New ticket` button right of the filters, after a separator, matching the Tickets page (reusing `TicketCreateModal`), prefilled with the active release filter when one is set. Creating a ticket refreshes Agenda ticket choices.
- R6: Each Agenda day header shows the day's worked hours right of the progress bar: hours with up to one decimal (`0h`, `4.5h`, `7h`, `9.5h`), tabular, always muted.
- R7: Progress bar, hours label, tooltip, and `aria-valuenow`/`aria-valuetext` use only the currently filtered entries. Target is unchanged. With no filter, values equal today's behavior. Overlap/drag rules keep using all entries.

## Non-goals

- No change to time-entry rules, statuses, priorities, external links, workday settings.
- No renaming of `formatTicketEstimate` (still the generic duration formatter) — avoids churn; can follow up.
- No per-filter target scaling; no new Agenda filter kinds.

## Approach

**Estimates (R1–R3):** delete end to end. Schema: drop the `estimate_minutes` column and `ticket_estimate_positive_check`, generate one Drizzle migration (`pnpm db:generate`) that also drops `ticket_relation`. Approved: the existing data is permanently deleted. API: remove from schemas, POST, PATCH, list ordering. Reports: remove the estimate query/type/UI block. UI: remove the create-form field, ticket-detail field and save handler, `estimateMinutes` props down `TicketWorkItem` → `TicketTrackedUsage`/`TicketTimeEntries` (render tracked time muted, drop percentage badge and ratio color). Delete `usageColor` and `parseTicketEstimate` with their tests; keep `formatTicketEstimate` and its test. Remove the `parse-duration-ms` dependency (`pnpm remove parse-duration-ms`, updating `pnpm-lock.yaml`).

**Related tickets (R4):** drop the `ticket_relation` table (same migration), delete `relations` endpoints and `TicketRelationCreate`, strip relation loading from ticket GET/list and `loadAgendaEntries`, remove `relatedTickets`/`relatedTicketIds`/`related` fields from shared types, POST, DELETE. UI: remove ticket-detail section + modal, create-form relation picker, related trigger in `TicketContextPopovers` (keep external links), board `related-hover`/`related-click` emits and highlight state, `related` entity icon if unused.

**Agenda ticket button (R5):** mirror the Tickets page toolbar (`app/pages/tickets/index.vue:426-432`): after the Agenda filter group's `Clear filters` button, add a vertical `USeparator` and `<TicketCreateModal :initial-release-id="filters.release" />` with its existing labeled `New ticket` trigger. `TicketCreateModal.vue` is unchanged.

**Filtered hours (R6–R7):** compute minutes per date inside `WeeklyAgenda` from `props.rows` (already filtered), replacing the `trackedMinutesByDate` prop; remove the now-unused server field from `week.get.ts`. Add a tiny `formatHours(minutes)` (`${Number((minutes / 60).toFixed(1))}h`) next to the agenda helpers with a unit test, render it as an always-muted `text-xs text-muted tabular-nums` span (no ratio/overtime color) after the progress bar, `aria-hidden` because the progressbar `aria-valuetext` already carries the value.

Rationale for computing client-side: the client already holds every filtered row; no new API or query parameters.

## Files to modify

- Schema/migration: `server/db/schema.ts`, new `drizzle/0012_*.sql` + meta (generated).
- Server: `server/domain/schemas.ts`, `server/api/tickets/index.post.ts`, `index.get.ts`, `[id].get.ts`, `[id].patch.ts`, `[id].delete.ts`, delete `server/api/tickets/[id]/relations/`, `server/domain/agenda.ts`, `server/domain/reports.ts`, `server/api/agenda/week.get.ts`.
- Shared: `shared/agenda.ts`, `shared/reports.ts`, `shared/time-entry.ts`.
- App: `app/components/TicketCreateForm.vue`, `TicketTrackedUsage.vue`, `TicketTimeEntries.vue`, `TicketWorkItem.vue`, `TicketBoardCard.vue`, `TicketContextPopovers.vue`, `TodayAgendaEntry.vue`, `WeeklyAgenda.vue`, `app/pages/agenda.vue`, `tickets/index.vue`, `tickets/[id]/index.vue`, `releases/[id]/index.vue`, `reports.vue`, `app/utils/ticket-estimate.ts`, `app/utils/entity-icons.ts`.
- Tests: `tests/unit/tickets.test.ts`, `ticket-estimate.test.ts`, `time-entry.test.ts`, agenda/report tests as affected, new `formatHours` test.
- Docs: `PLAN.md` scope, ADRs 0007, 0008, 0018, 0020, 0028, 0039, 0061 (update in place with Revisions lines; ADR 0008 likely marked superseded/retired), new ADR for the removal decision, `docs/milestones/m51-….md`.
- `package.json`, `pnpm-lock.yaml` (remove `parse-duration-ms`), `.jscpd-baseline.json`/`knip.json` only if the checks require it.

## Reuse

`TicketCreateModal` (board/release), `useHierarchyFilters` `filters.release`, existing `progressText`/`progressSegments` in `WeeklyAgenda.vue`, `formatTicketEstimate`, Drizzle `db:generate`.

## Steps

- [ ] S1 Estimates: schema + migration, server, reports, shared, UI, tests, remove `parse-duration-ms`.
- [ ] S2 Related tickets: schema + migration, server, shared, UI, tests. (S1 and S2 both touch ticket POST/schemas/create form/detail page → run sequentially, or one builder.)
- [ ] S3 Agenda: filtered per-day minutes, `formatHours` + test, hours label, remove server `trackedMinutesByDate`.
- [ ] S4 Agenda labeled `New ticket` button right of the filters, after a separator, like the Tickets page.
- [ ] S5 Docs: PLAN.md, ADRs, milestone file with evidence.

S3/S4 are disjoint from S1/S2 except `TodayAgendaEntry.vue`/`shared/agenda.ts` (S2) — keep S3/S4 after S2 or in the same builder.

## Verification

Automated (final worktree): `pnpm db:migrate` against an agent-owned disposable test database, `pnpm format:check`, `pnpm lint`, `pnpm check:duplicates`, `pnpm check:unused`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, `pnpm build`, `pnpm check:workflow`, `git diff --check`, plus `rg -i "estimateMinutes|ticketRelation|relatedTicket"` returns nothing outside history/migrations.

Manual (human-owned, pending):

- Create/edit a ticket: no estimate or related fields; board, release, detail, agenda show tracked time only.
- Reports page loads without the estimate block.
- Agenda: day header shows `Nh` matching that day's entries; apply client/project/release/ticket filters → bar and hours change; clear → back to totals; a day >target still shows overtime coloring.
- Agenda `New ticket`: opens, prefilled with filtered release; created ticket appears in Add-work ticket choices.

## Risks and stop conditions

- **Data loss (approved):** dropping `estimate_minutes` and `ticket_relation` permanently deletes that production data on deploy. Back up beforehand if the data may be wanted later.
- The lockfile change is limited to removing `parse-duration-ms`; stop if `pnpm remove` changes unrelated packages.
- The four filters shrink to fit the labeled button (`grid-cols-4` with `flex-1`). If they become unusably narrow at common desktop widths, stop and ask; do not switch to icon-only on your own.

## Finding disposition and open questions

Human decisions (2026-11-23, chat):

- D1: Drop the `estimate_minutes` column and the `ticket_relation` table.
- D2: Remove the `parse-duration-ms` dependency.
- D3: Hours label is always muted.
- D4: Agenda `New ticket` is the labeled button, to the right of the filters, like the Tickets page.

No open questions remain.

## Approval and fresh-session handoff

- Human plan approval: approved in chat 2026-11-23.
- Next mode: Build done; Review and human code review.
- Absolute input: `/Users/mehdi/code/btt/plans/m51-remove-estimates-relations-and-agenda-hours.md`.
- Context: schema-destructive milestone with D1–D4 decided; copy D1–D4 into the milestone file at Build start.
