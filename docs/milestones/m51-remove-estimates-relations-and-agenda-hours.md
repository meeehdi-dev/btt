# M51 — Remove estimates and related tickets; Agenda ticket creation and filtered day hours

## Context

The human asked to remove ticket estimates and related tickets, add a `New ticket` button to the Agenda, and show filtered worked hours per Agenda day. This file logs the build. Steps S1–S5 are implemented. Manual checks are pending.

## Approved scope

- S1 Remove estimates end to end (schema, API, reports cohort, UI, tests, `parse-duration-ms`).
- S2 Remove related tickets end to end (schema, API, shared types, UI, tests).
- S3 Agenda filtered per-day hours.
- S4 Agenda `New ticket` button.
- S5 Docs (PLAN.md, ADRs 0007, 0008, 0018, 0020, 0028, 0039, 0061, new ADR).

## Out of scope

- Time-entry rules, statuses (the `Estimate` status stays), priorities, external links, workday settings.
- Renaming `formatTicketEstimate`.

## Source references

- `AGENTS.md`
- `docs/llm-workflow.md`
- `PLAN.md`
- Relevant ADRs: 0007, 0008, 0018, 0020, 0028, 0039, 0061, 0064
- Focused approved plan: [`plans/m51-remove-estimates-relations-and-agenda-hours.md`](../../plans/m51-remove-estimates-relations-and-agenda-hours.md)
- Actual human implementation approval authority: Human approved plan in chat 2026-11-23 ("go").

## Requirements and acceptance criteria

Defined in the linked plan (R1–R7). This build covers R1–R7.

## Risks and stop conditions

- Data loss (approved, D1): the migration permanently deletes `ticket.estimate_minutes` and the `ticket_relation` table on deploy. Back up beforehand if the data may be wanted.
- Stop if `pnpm remove` changes unrelated packages (it did not).

## Approach

See the plan. Decisions recorded from chat 2026-11-23:

- D1: Drop the `estimate_minutes` column and the `ticket_relation` table.
- D2: Remove the `parse-duration-ms` dependency.
- D3: Hours label is always muted.
- D4: Agenda `New ticket` is the labeled button, to the right of the filters, like the Tickets page.

## Files to modify

See the plan. S1/S2 touched: `server/db/schema.ts`, `drizzle/0012_slim_slipstream.sql` (+ meta), `server/domain/{schemas,agenda,reports}.ts`, `server/api/tickets/*`, `server/api/reports/index.get.ts`, `shared/{agenda,reports,report-period,time-entry}.ts`, the ticket/board/release/reports/agenda-entry components and pages, `app/utils/{ticket-estimate,entity-icons}.ts`, unit tests, `package.json`, `pnpm-lock.yaml`, `.jscpd-baseline.json`.

## Reuse

`formatTicketEstimate` kept as the generic duration formatter. `TicketTrackedUsage` kept, now a muted tracked-time label.

## Decisions and ADR links

- D1–D4 above. The ADR updates and the new removal ADR were done in S5.

## Implementation checklist

- [x] S1 Estimates removed.
- [x] S2 Related tickets removed.
- [x] S3 Agenda filtered per-day hours.
- [x] S4 Agenda `New ticket` button.
- [x] S5 Docs.
- [x] Review fixes F1–F6 built and checked.

## Journal

### 2026-11-23 — S1 and S2 build

- Fact: Generated one migration with `pnpm db:generate`: `drizzle/0012_slim_slipstream.sql`. It drops the `ticket_relation` table, the `ticket_estimate_positive_check` constraint and `ticket.estimate_minutes`.
- Fact: `pnpm remove parse-duration-ms` changed only `package.json` (1 line) and `pnpm-lock.yaml` (9 lines, the package's own entries).
- Decision: The Reports Done-estimate cohort is removed with its only inputs. `ReportCompletionBounds` and `getReportCompletionBounds` (plus the `completionBounds` request field and its tests) are deleted because nothing else used them. `resolveReportTimeZone` stays.
- Decision: `TicketTrackedUsage` loses `estimateMinutes` and `showPercentage` and renders tracked time muted. `TicketWorkItem` loses both props. `TicketTimeEntries` loses `estimateMinutes`. The `usageColor` and `parseTicketEstimate` helpers and their tests are deleted. `formatTicketEstimate` and its test stay.
- Decision: Ticket list ordering is `createdAt` DESC, `id` DESC. The board related-hover/click and highlight state, the `highlighted` prop on `TicketBoardCard`, and the `related` entity icon are removed.
- Decision: Three new jscpd clones appeared because removing the relation code exposed existing join boilerplate (`api/tickets/index.get.ts`, `domain/agenda.ts`, `domain/tickets.ts`, `api/search.get.ts`, `domain/time-entries.ts`). I refreshed `.jscpd-baseline.json` with `jscpd --baseline … --update-baseline`. The plan allowed a baseline change if the check required it. The file shrank by 93 lines (stale fingerprints dropped).
- Fact: `pnpm format` was run only on changed files. `oxfmt` was also run on the two generated drizzle meta JSON files, which `format:check` flagged.
- Evidence: the final `rg` command is listed under Verification.

### 2026-11-23 — S3–S5 build

- Fact: `WeeklyAgenda.vue` now sums minutes per date from `props.rows` (filtered). The `trackedMinutesByDate` prop, its `agenda.vue` binding and the server field in `week.get.ts` are removed (no other users or tests). `formatHours` is in `app/utils/agenda-week.ts` with a unit test (0h, 4.5h, 7h, 9.5h). `occupied` still holds all entries for overlap/drag.
- Fact: The label is an `aria-hidden` `text-xs text-muted tabular-nums` span with `shrink-0`; the progressbar aria and tooltip use the filtered minutes.
- Fact: `agenda.vue` has a vertical `USeparator` and `<TicketCreateModal :initial-release-id="filters.release" />` after Clear filters. `TicketCreateModal.vue` is unchanged. It invalidates `ticket` (`appDataMutationResources.ticket` includes `tickets`), and the Agenda's `/api/tickets` fetch subscribes to `tickets`, so the new ticket reaches the Add-work choices; no fix was needed.
- Decision: Docs updated in place with 2026-11-23 Revisions in ADRs 0007, 0008 (estimate goal marked superseded), 0018, 0020, 0028, 0039, 0061; new ADR 0067 and its README row; `PLAN.md` scope and history.

### 2026-11-23 — Review fixes (M51-R1 to M51-R6)

- Fact: Corrective plan `plans/m51-review-fixes.md`, input review `reviews/m51-remove-estimates-relations-and-agenda-hours-20261123T083824Z.md` (preserved).
- Fact: F1 ADRs 0012 and 0029 now say day progress and hours use the filtered entries, with Revisions lines. F2 ADRs 0017, 0031, 0040 and 0048 no longer describe estimates or related tickets as current, with Revisions lines. F3 ADRs 0008 and 0020 retitled to their surviving goals with plain `Accepted` status and estimate Context/Alternatives removed; the strikethrough in ADR 0061 removed; README index titles updated.
- Fact: F6 this milestone's stale verification note and handoff are updated, and the original plan records plan approval.
- Fact: F4 (move the `New ticket` separator and button out of the filters group in `agenda.vue`) and F5 (per-date sum helper in `app/utils/agenda-week.ts` with a unit test) were built by a parallel code builder.

## Verification

Independently run on the final worktree (S1–S5):

- [x] `pnpm format:check`: pass (first run failed on the two generated drizzle meta JSON files; formatted them).
- [x] `pnpm lint`: pass (first run failed on the unused `uniqueIndex` import in `server/db/schema.ts`; removed it).
- [x] `pnpm check:duplicates`: pass after the baseline refresh (first run: 3 new clones, see Journal).
- [x] `pnpm check:unused`: pass.
- [x] `pnpm typecheck`: pass.
- [x] `pnpm typecheck:tsgo`: pass.
- [x] `pnpm test`: pass, 21 files, 100 tests.
- [x] `pnpm build`: pass.
- [x] `pnpm db:migrate`: applied all migrations, including 0012, on an agent-started disposable `postgres:17` container (`m51-agent-pg`, 127.0.0.1:55432, started with `--rm`). `\d ticket` shows no `estimate_minutes` or estimate check, and `ticket_relation` is absent. I stopped the container and verified it and port 55432 are released. The user-owned Postgres containers on 5432/5433 were not touched.
- [x] `rg -i "estimateMinutes|ticketRelation|relatedTicket|usageColor|parseTicketEstimate|parse-duration"` outside `drizzle/`, `docs/`, `plans/`, `reviews/` and `.claude/` worktrees: no matches.
- [x] Re-run on the final worktree after S3–S5: `pnpm format:check`, `lint`, `check:duplicates`, `check:unused`, `typecheck`, `typecheck:tsgo`, `test` (21 files, 101 tests), `build`, `check:workflow`, `git diff --check`: all pass.

Review-fix checks (M51-R1 to M51-R6), run on the final worktree on 2026-11-23: `pnpm format:check`, `lint`, `check:duplicates`, `check:unused`, `typecheck`, `typecheck:tsgo`, `test` (102 passed), `build`, `check:workflow` and `git diff --check` all pass. The docs builder found five more accepted ADRs that still mentioned estimates or relations: 0011, 0016, 0049, 0053 (its tie-break order also changes to newest created, then id) and 0056. They are fixed in place under F2, each with a 2026-11-23 Revisions line.

Focused review `reviews/m51-review-fixes-20261123T085918Z.md` confirmed M51-R1 to M51-R6 resolved and raised N1 to N6, all fixed on 2026-11-23:

- N1: removed the ADR 0049 usage-band wording.
- N2: narrowed the ADR 0048 placeholder rule back to empty separator and footer suppression.
- N3: retitled ADR 0007 and its README row.
- N4: each Revisions line in 0011, 0016, 0049, 0053 and 0056 now names only what that ADR lost.
- N5: fixed a comma in ADR 0017.
- N6: aligned the README title for 0067.
- The plan's next-mode line is also fixed.

Manual (human-owned, pending):

- [ ] Create/edit a ticket: no estimate or related fields. Board, release, detail and agenda show tracked time only (muted).
- [ ] Reports page loads without the estimate block.
- [ ] Ticket list is newest first.
- [ ] Agenda: day `Nh` label matches that day's entries and follows filters; overtime still colors the bar.
- [ ] Agenda `New ticket`: opens prefilled with the release filter; the new ticket appears in Add-work choices.

## Review status

- Plan review: Human approved in chat 2026-11-23
- Independent review report / exact comparison scope: Pending
- Human code review: Pending
- Milestone status: In progress

## Fresh-session handoff

- Next mode: Review / human code review.
- Absolute saved plan/report input: `/Users/mehdi/code/btt/plans/m51-remove-estimates-relations-and-agenda-hours.md`
- Scope: S1–S5 and the review fixes are built. Final checks for the fixes pass. Human manual checks are pending.

## Follow-ups

- Optionally rename `formatTicketEstimate` to a neutral name.

## Closeout checklist

- [ ] Approved checklist complete or explicitly deferred.
- [ ] Verification evidence recorded.
- [ ] Human code review accepted.
- [ ] Review status updated to `Complete`.
