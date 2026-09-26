# M4 — Manual time entries (Complete)

## Context

M3/M3.5 are complete. The next roadmap milestone is M4: ticket-linked completed-work entries and estimate usage, before the Today agenda (M5). Source: `PLAN.md`, `docs/milestones/m3.5-ticket-board-status-moves.md`.

## Approved scope

Approved via Plannotator and implemented:

- Ticket-linked manual entry CRUD with calendar date, start time, duration and description; ticket required. Ticket detail shows entries with edit/delete and tracked total; when estimate exists show tracked/estimated percentage and color bands: normal <80%, warning ≥80%, red ≥100%.
- Prevent overlaps across **all of a user's tickets** on a given day using start/end intervals, including archived history; allow adjacent entries. Start and duration snap to 30-minute increments (duration ≥30); end may be exactly midnight but not later. Fixed rule for M4, configurable later.
- Archived tickets/ancestors retain existing entries and usage; an entry's ticket link opens archived ticket detail even if its parent is archived. Block new work on archived ticket/ancestor, allow corrections to existing entries without moving them to an archived ticket; block permanent ticket deletion if it has entries.

## Out of scope

- M5 agenda, configurable slot increments/settings, filters and M6 drag/drop. No cross-midnight entries.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`, `docs/milestones/README.md`, `docs/templates/milestone-template.md`, M3 and M3.5 milestone files.
- ADRs `docs/decisions/0004-m2-core-data-model.md`, `0005-m2-domain-validation-and-ui-polish.md`, `0006-uuidv7-identifiers.md`, `0007-m3-ticket-model-and-relations.md`, `0008-ticket-estimates-and-board-layout.md`, `0010-board-drag-and-compact-ticket-metadata.md`.

## Approach

1. Persist `time_entry` (UUIDv7 ID, required restrictive ticket FK, PostgreSQL `date`, integer `start_minute` and `duration_minutes`, description, timestamps), indexes on ticket/date; DB checks for aligned 30-minute slots, positive minimum, and end ≤1440. Keep calendar date as a date-only string (the user's local date from the form), never convert it to UTC for display; interval math uses integers, not wall-clock timestamps. Validate real dates, grid and end at API boundary using Effect Schema plus a small pure interval/date helper.
2. Implement owned entry list/create/update/delete endpoints under `/api/time-entries` (list optionally by ticket; expose entry + owned ticket label/archived state). Resolve ownership through ticket → release → project → client. On create require active ticket and ancestors; on editing an existing archived-ticket entry permit historical correction but do not permit reassignment to an archived target. Use a transaction locking the owner's user row before checking all entries for that date (including archived) and writing; on update exclude self and check overlap in the target date. For date changes, the same per-user lock serializes writes. Return 409 on conflicts and 400 on invalid slots; enforce DB FK/checks as backstop. Delete only owned entries. Consider tests for simultaneous requests.
3. On ticket detail expose a form and entries in date/start order with correction/delete actions, a tracked total regardless of estimate, and percentage/color only when estimated. Read aggregates from persisted entries on the server, not a UI-only sum; refresh after mutations. Archived ticket detail must be readable through explicit `?archived=true` even with an archived ancestor, without widening default list visibility or write privileges. Route archived history links with that flag. Reject permanent ticket deletion with a 409 if entries exist, before child cleanup; adjust the delete prompt accordingly.
4. Keep M4 ticket-centric; no agenda/day list UI yet (M5). Add tests for validation, ownership, concurrency/overlap, archive/retention, ratios and desktop/mobile forms; document new durable time-entry rules in an ADR if approved.

## Files to modify

- `server/db/schema.ts`, generated `drizzle/` migration and metadata — table, constraints, indexes.
- `server/domain/schemas.ts`, new `shared/` or `app/utils/` pure slot/date/ratio helper, new `server/domain/time-entries.ts`, `server/api/time-entries/` CRUD routes — validation, ownership, atomic overlap check, aggregation.
- `server/api/tickets/[id].get.ts`, `server/domain/tickets.ts`, `server/api/tickets/[id].delete.ts` — ticket history/usage, explicit archived-history detail and deletion guard.
- `app/pages/tickets/[id]/index.vue`, `app/pages/tickets/[id]/edit.vue`, `app/components/TicketTimeEntries.vue` — form/list/status/prompt. Review revision: `package.json` and `pnpm-lock.yaml` for explicitly approved direct `@internationalized/date` dependency used by Nuxt UI pickers.
- `tests/unit/`, `tests/e2e/`, this milestone file, new ADR and `docs/decisions/README.md` if durable decisions are approved.

## Reuse

- `server/db/schema.ts` restrictive FK/check/index pattern; `server/utils/id.ts` UUIDv7 generator; `server/domain/decode.ts` + `server/domain/schemas.ts` Effect v4 request validation; `server/utils/domain.ts` authentication, errors and archived query.
- `server/domain/tickets.ts` owned ticket/hierarchy lookup, `server/api/tickets/[id].get.ts` explicit `?archived=true`, `server/api/tickets/[id].delete.ts` child cleanup, and ticket detail/edit Vue pages for UI actions.
- `app/utils/ticket-estimate.ts` formats tracked time as human-readable duration; `app/components/TicketEstimate.vue` suppresses missing estimates (ADR 0010). `tests/e2e/tickets.test.ts` uses two owned-user fixtures, request-level API tests, browser checks and child-first cleanup; extend its cleanup for entry FK or use a dedicated M4 fixture. Pinned skills: `.agents/skills/{effect-development,nuxt-ui,oxc}/SKILL.md`; check official Effect v4 and Nuxt UI component references when implementing.

## Decisions and ADR links

- Plan approved via Plannotator. Human confirmed 30-minute static minimum/grid, no overlap from M4, midnight cap, archival retention and deletion guard in chat. Durable rules recorded in ADR `docs/decisions/0011-manual-time-entry-history-and-slots.md`; retain ADRs 0004/0007 for archive/FK conventions and 0008/0010 for estimate display.
- Review revision: human explicitly requested Nuxt UI date/time pickers in lieu of native typed `UInput`s and separately approved the direct `@internationalized/date` dependency in chat. This superseded the initial UI implementation, not the M4 domain rules; the revised code review was accepted.

## Implementation checklist

- [x] Obtain human approval via Plannotator before implementation.
- [x] Add M4 table/migration and reviewed SQL, validation of date/grid/interval and concurrency-safe owned CRUD/history/usage API.
- [x] Add ticket detail entry CRUD and tracked/estimate usage display; support archived-history links and guard permanent ticket deletion.
- [x] Add focused unit and API/browser tests for slot edges, cross-ticket overlaps, concurrent writes, archive and ownership behavior, and 80%/100% ratio boundaries; run checks and record evidence/ADR.
- [x] Submit diff for human code review and address feedback.
- [x] Record human completion declaration before closeout.

## Journal

### Planning — orientation

- Fact: `PLAN.md` names M4 as manual time entries; M3.5 milestone reports completion. No application code changed during planning.
- Decision (human): no overlap permitted from M4; 30-minute static grid for start and duration (minimum 30); entry ends by midnight. Archived tickets/ancestors keep entries visible and count as real work; tickets with entries cannot be permanently deleted. Future configuration deferred.
- Fact: current ticket delete explicitly removes link/relation rows; M4 must check for entries _before_ transactional child cleanup, return a conflict and keep the restrictive FK. Archived ticket detail supports `?archived=true` only if ancestors are active: `server/domain/tickets.ts` rejects archived ancestors; history navigation must account for that.
- Fact: `app/utils/ticket-estimate.ts` already formats integer minutes; `app/pages/tickets/[id]/edit.vue` has the existing archived/delete action; `tests/e2e/tickets.test.ts` contains owned-user fixtures but its cleanup must delete time entries before tickets after the migration. `playwright.config.ts` requires `DATABASE_URL`.
- Decision (human): 30-minute static grid/minimum including start alignment; end no later than midnight; block permanent deletion when work exists. Configuration deferred.
- Planning check: `node scripts/check-workflow-docs.mjs` and `git diff --check` passed; only new markdown milestone file is untracked. No code, DB or dependency changes in planning.

### Revised code review

- Decision (human via Plannotator): revised uncommitted M4 diff approved with no changes requested. The first review feedback was addressed through the explicitly authorized picker/dependency revision. At the time of this review, the separate completion declaration was still pending.

### Human completion declaration and closeout

- Decision (human, directly in chat): “i hereby declare the milestone complete.” In context this refers to M4; transcribed as the explicit M4 completion declaration.
- Fact: the approved scope is implemented, verification evidence and ADR 0011 are recorded, and the revised code review was accepted with no changes requested. The M4 list endpoint requires `ticketId` and returns entries/total for that owned ticket, rather than offering an unfiltered all-ticket list or per-row hierarchy labels; the ticket detail already supplies the title/history link. M5 agenda and M6 drag/drop remain follow-ups. M4 is **Complete**; this closeout only changes documentation.

### First code review — date/time picker revision

- Human Plannotator review returned one finding, **not approval**: asked whether Nuxt UI has better date/time controls than the native HTML types in `UInput`. Verdict discussed: partly confirmed; original fields were Nuxt UI `UInput` wrappers but used browser-native pickers. Human instructed replacement with Nuxt UI components and explicitly approved adding the required direct dependency `@internationalized/date` (pinned 3.12.4, already transitive in lockfile). No other findings submitted.
- Fact: replaced date input with `UCalendar` in a `UPopover`, and time input with `UInputTime` (`hour-cycle=24`, 30-minute step/snapping). Reused `CalendarDate`/`Time` for date-only serialization and minute arithmetic. `prevent-deselect` avoids clearing the selected date by clicking it. Docs consulted: <https://ui.nuxt.com/docs/components/calendar>, <https://ui.nuxt.com/docs/components/input-time>, <https://ui.nuxt.com/docs/components/popover>. A new browser assertion exercises the calendar popover, selected day and 30-minute time spinbutton increments. First revised test discovered selected-day deselection left the date empty; added `prevent-deselect`; focused test now passes. Revised checks: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (10 files / 48 passed), `pnpm exec playwright test --workers=1` (7 passed), `pnpm build`, `pnpm check:workflow`, working/staged `git diff --check` all passed; fresh human review pending. No separate manual visual check beyond Playwright.

### Verification and ADR — pre-review

- Fact: `tests/unit/time-entry.test.ts` covers valid leap dates, invalid dates, grid/midnight limits, half-open overlap and 79/80/100% color boundaries; `tests/e2e/time-entries.test.ts` exercises CRUD, concurrent creates and updates, cross-ticket collision, archive/parent archival, owner isolation, deletion guard, browser form/correction/delete, no-estimate display, and 390px width. ADR `docs/decisions/0011-manual-time-entry-history-and-slots.md` records approved durable rules; index updated.
- Correction: first E2E run clicked the form before hydration; waited for network idle. First full suite failed because the old M3 assertion expected archived-parent explicit ticket detail to return 404; updated it to expect 200 only for `?archived=true`, while default still returns 404. Lint's `.sort()` warning was corrected to `.toSorted()`; all rerun checks clean. Changed percentage display to floor so a value just below 80% cannot show `80%` while retaining neutral color.
- Evidence (final pre-review): `pnpm db:generate`, `pnpm db:migrate`, second `pnpm db:generate` (no drift), `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (10 files / 48 passed), `pnpm exec playwright test --workers=1` (7 passed), `pnpm build`, `pnpm check:workflow`, and working/staged `git diff --check` all passed. No manual visual review was performed apart from automated desktop/mobile Playwright. Code review remains pending.

### Implementation — ticket UI and history

- Fact: ticket detail now shows tracked total, estimate ratio/threshold badge when estimated, and entry list with manual add/correction/delete form. Explicit archived ticket detail can be opened even after parent archive; default board visibility unchanged. Archived ticket deletion returns conflict when time entries exist and the edit prompt explains that guard. Form/API runtime behavior and visual checks pending in step 4.
- Evidence: `pnpm typecheck` passed after handling potentially missing split-time values; initial `pnpm lint` found an unused import (removed, rerun pending).

### Implementation — persistence/API

- Fact: added `time_entry` with restrictive FK, indexed date/ticket, 30-minute DB checks; Effect request schemas and pure date/slot/overlap helper. New owned list/create/update/delete endpoints lock the user's row inside entry save transactions before querying for overlap across all owned tickets; ticket history is included even when archived. Edits of existing archived entries are allowed, but creating against archived tickets/parents or moving into them is blocked. Reviewed `drizzle/0006_gifted_raza.sql`: only intended table, checks, FK and indexes.
- Evidence: `pnpm db:generate`, `pnpm typecheck`, `pnpm db:migrate`, and a second `pnpm db:generate` passed (no drift). Further API tests pending.

### Post-closeout CI maintenance — Check workflow (review accepted)

- Fact: the `Check` push runs for `02f8927` ([36181499818](https://github.com/meeehdi-dev/nxmr/actions/runs/36181499818)), `f8b2c05` ([36224856569](https://github.com/meeehdi-dev/nxmr/actions/runs/36224856569)) and `1502d07` ([36231715273](https://github.com/meeehdi-dev/nxmr/actions/runs/36231715273)) all failed at `pnpm typecheck:tsgo` with TS2345 at `tests/unit/tickets.test.ts:14`. Earlier push run `631b73e` ([35640426665](https://github.com/meeehdi-dev/nxmr/actions/runs/35640426665)) instead failed at `pnpm format:check` on `docs/decisions/README.md`; formatting passes now. The Node 20 action deprecation message was a warning, not the failed step. CI did not reach tests, E2E or build on the latest three runs.
- Cause/fix: the generic ticket test helper accepted any `Schema.Top`, including schemas that could need decoding services, then called service-free `Effect.runPromise`. This follow-up uses Effect v4 `Schema.decodeUnknownPromise` and a `Schema.ConstraintDecoder<unknown>` bound (default decoding services `never`) for the test-only helper. The CI workflow, product code, dependency versions and M4 acceptance are unchanged. Approved plan: `plans/check-workflow-failures.md`.
- Evidence: before the fix, local `pnpm typecheck:tsgo` reproduced TS2345; after it, `pnpm typecheck:tsgo`, `pnpm typecheck`, `pnpm exec vitest run tests/unit/tickets.test.ts` (3 passed), `pnpm format:check`, `pnpm lint`, `pnpm test` (10 files / 48 passed), `pnpm build`, `pnpm check:workflow`, `git diff --check`, and `pnpm exec playwright test --workers=1` (7 passed against local PostgreSQL) all passed. No separate manual browser session was run.
- Decision (human, via Plannotator): code review of this post-closeout diff approved with no changes requested. Remote `Check` status cannot be confirmed until a new commit/PR triggers it; no push or workflow dispatch was authorized here. M4 remains **Complete**.

## Verification

- [x] Review generated SQL, then run `pnpm db:generate`, `pnpm db:migrate`; confirm no unplanned migration drift (local dev DB only).
- [x] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm exec playwright test --workers=1`, `pnpm build`, `pnpm check:workflow`, `git diff --check` — all passed in final pre-review run.
- [x] API/browser: unauthenticated/foreign access denied; impossible dates, short/off-grid/beyond-midnight slots rejected; adjacent slots accepted; overlaps across tickets and simultaneous creates/updates rejected; editing self permitted; failure leaves data unchanged; estimate threshold colors/percent/absence with no estimate; archived ticket/parent history link, corrections, no new work and deletion conflict; mobile 390px form/list without overflow. Exact ratio thresholds are covered by unit tests; browser asserts 150% and no-estimate suppression. No separate visual browser inspection performed.

## Review status

- Plan review: Approved via Plannotator.
- Code review: First review requested picker changes; revised diff approved via Plannotator with no changes requested.
- Milestone completion declaration: Received directly in chat; recorded in the journal. Milestone status: Complete.

## Follow-ups

- M5 agenda presentation/quick add; M6 drag/drop.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in journal and review status.
