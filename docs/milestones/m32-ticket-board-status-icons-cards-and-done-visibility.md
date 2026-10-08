# M32 — Ticket board status icons, card sizing, and quiet Done tickets

> **Status: Complete — implementation, recorded verification, and Plannotator code review are complete. The user declared M32 complete on 2026-10-08. Focused browser checks for the final presentation refinement were not run and are recorded as explicitly deferred by that declaration.**

## Approved scope amendment — Ticket Board toolbar and viewport layout (2026-10-08)

This is a user-requested extension of the existing M32 plan, not a new milestone. The original M32 implementation/review records below remain historical. Plannotator approved this amendment before implementation; at that stage, M32 remained open.

### Observed facts

- `app/pages/tickets/index.vue` currently renders the four hierarchy filters in a bordered `UCard`, with the `Show archived` toggle and `New ticket` action outside that card. Its page stack uses 8px gaps; the board region has horizontal scrolling but no surrounding border or viewport-height minimum.
- The existing archive query defaults to active tickets. Selecting `Show archived` requests `archived=true`; `includeArchived()` then includes both active and archived tickets. It does not provide an archived-only mode. The existing board-only quiet-Done filtering remains separate and must not be weakened by this visual change.
- The Week Agenda has a 32px-high, borderless filter group. Its filter-to-timeline-card gap is 16px (`tests/e2e/agenda-week.test.ts`), and the dashboard shell's 16px main inset places its toolbar 16px below the sticky app header.
- The Ticket Board page has only an `sr-only` Tickets heading; it currently has no visible page-title row. The seven-lane board relies on its horizontal scroller and must keep doing so.

### Approved amendment scope

- Replace the separate archived toggle with an archive-visibility filter integrated into the borderless hierarchy filter bar. Preserve today's two modes: `Active tickets` (default) and `Include archived` (includes active plus archived tickets). Make `Clear filters` reset the archive filter to `Active tickets` along with the hierarchy filters; do not add an archived-only API mode.
- Remove the filter bar's card border/surface so it follows the Agenda filter-group treatment. Keep the filters, clear action, and archive filter aligned in the established compact toolbar height and usable at the 1280 CSS px support floor.
- Put a vertical divider between the filter bar and the existing `New ticket` action, reusing the Agenda's Nuxt UI `USeparator` pattern. Preserve the current destination and ticket-creation behavior.
- Match Agenda's geometry: keep a 16px inset from the sticky application header to the filter row and a 16px gap from the filter row to the board. Retain the current screen-reader-only Tickets heading and do not add a visible page-title row.
- Add a subtle rounded border around the horizontally scrollable board. Give the board area a viewport-reaching minimum height so its bottom edge sits 16px above the viewport bottom, and stretch the lane grid/lanes to that minimum height. Let content grow naturally when it exceeds the viewport; keep drag/drop, lane hover, horizontal scrolling, and existing empty/error states intact.
- Keep the scope presentation-only apart from moving the existing archive-visibility control into the filter bar. Do not change the quiet-Done rule, ticket data, archive lifecycle, default or board API contracts, schema, settings, dependencies, or unrelated views. No new ADR or milestone is proposed; update the existing M32 evidence and, if needed after approval, its existing `PLAN.md` entry only.

### Plannotator clarifications incorporated (2026-10-08)

- Archive filter: preserve today's two modes (`Active tickets` and `Include archived`) and make `Clear filters` reset to `Active tickets` along with the hierarchy filters. No archived-only mode or API change.
- Header spacing: “header” means the sticky app header. Keep Tickets screen-reader-only and start the filter row 16px below it; do not add a visible page heading.
- Evidence: the first amendment review returned `decision: annotated` with both questions answered. After incorporating them, `plannotator annotate docs/milestones/m32-ticket-board-status-icons-cards-and-done-visibility.md --gate --json --require-approval` returned `{"decision":"approved"}` on 2026-10-08, before implementation.

### Amendment approach and verification

1. Reuse the Agenda toolbar's borderless 32px filter-group styling and vertical `USeparator`; keep the hierarchy filter options sourced from `useHierarchyFilters` and preserve the server's existing archive-query behavior. Clear filters resets the archive filter and hierarchy selections to their defaults.
2. Apply the spacing and viewport minimum only within the Ticket Board page. Keep the outer board scroller responsible for horizontal overflow, add a single subtle board outline, and make its inner seven-lane grid stretch to the same minimum height without imposing a fixed height.
3. Extend browser coverage to verify archive-filter state/query behavior and Clear filters semantics; same-row control fit at 1280px; the borderless filter bar; divider placement; 16px header/filter and filter/board spacing; board outline; bottom margin and minimum-height geometry; and retained horizontal scrolling and drag/drop behavior.
4. At 1280×900, manually inspect the board and Agenda reference. Confirm the board reaches the viewport bottom with the matching 16px margin, does not introduce page-level horizontal overflow, and grows if ticket content exceeds the viewport. Record all outcomes in this M32 file.

### Planned files for this amendment

- `app/pages/tickets/index.vue` — archive filter placement/state, toolbar divider and borderless styling, Agenda-matched spacing, board border and viewport minimum-height layout.
- `tests/e2e/filter-search.test.ts` and focused existing Ticket Board E2E coverage — archive filter and Clear filters behavior, toolbar/layout geometry, and preserved Board interactions.
- `docs/milestones/m32-ticket-board-status-icons-cards-and-done-visibility.md` — approved amendment, implementation journal, verification and review evidence.
- `PLAN.md` — update the existing M32 entry to reflect this approved scope; do not add a new milestone.

No server, database, API, app-shell, dependency, or new ADR changes are planned.

### Amendment implementation checklist

- [x] Receive explicit Plannotator approval of this amendment before implementation; the revised plan was approved on 2026-10-08 after both questions were answered.
- [x] Replace the archive toggle with the approved two-mode filter; make Clear filters reset archive visibility and hierarchy selections to defaults.
- [x] Match the Agenda borderless toolbar, vertical divider, 16px shell-header inset, and 16px toolbar-to-board gap; keep controls in one row at 1280px.
- [x] Add a subtle board border and viewport-reaching minimum height with a 16px bottom margin; ensure lanes stretch, content can grow, and horizontal scrolling remains local.
- [x] Add E2E assertions for archive behavior, clear/reset behavior, 1280px layout geometry, border and min-height, and preserved board interactions.
- [x] Run focused and relevant full verification, then visually inspect at 1280×900 and record outcomes below.
- [x] Submit the full amendment diff for human code review; Plannotator approved it with no changes requested on 2026-10-08. M32 remained open at that stage pending the user's app review and completion declaration.

## Approved scope extension — neutral unestimated tracked time and filter spacing (2026-10-08)

This small presentation refinement extends the existing M32 plan in response to the user's direct request; it does not create a new milestone. The request itself explicitly approved this scope before implementation. M32 remained open pending the completion declaration recorded below.

### Approved scope

- When a ticket has no estimate, render tracked time with the muted semantic text color in shared ticket usage and ticket-detail tracked-time displays. Preserve the existing estimate-ratio colors when an estimate exists; ADR 0047 records the no-estimate color policy.
- Increase the gap between each filter and the Clear filters action to 4px in both the Ticket Board and Agenda filter bars. Preserve the current 32px toolbar and supported 1280 CSS px layout.
- Make no API, data, archive, or time-entry behavior changes. No new milestone is proposed.

### Implementation checklist

- [x] Use muted tracked-time text without an estimate; keep estimate-based ratio bands unchanged.
- [x] Set both filter-grid and filter-group spacing to 4px on Ticket Board and Agenda.
- [x] Add focused assertions for no-estimate tracked-time color and 4px filter gaps.
- [x] Explicitly defer execution of the focused browser assertions for this refinement: they were not run because the user-requested dev server remained stopped; the user accepted this deferral by declaring M32 complete on 2026-10-08.
- [x] Submit the updated working-tree diff for human code review; Plannotator approved it with no changes requested on 2026-10-08.

## Context

The original M32 scope refreshes `/tickets`: give each fixed status a recognizable icon, use that icon in board columns and individual ticket identity rows, align Board cards with the compact Week Agenda entry presentation, and hide eligible Done tickets after one inactive week when their release has no target date.

### Observed facts

- `app/pages/tickets/index.vue` loads `/api/tickets`, groups active results into seven fixed status lanes, and renders each lane heading as plain text plus a count. It owns desktop drag-and-drop, local hierarchy filters, archive visibility, relation locate/highlight behavior, and retry/error feedback.
- `TicketBoardCard.vue` uses shared `TicketWorkItem.vue` and `TicketHierarchyBadges.vue`. Its title row currently displays the generic ticket glyph; hierarchy controls use compact Nuxt UI `xs` sizing. The board's two-row content arrangement is title/usage, then hierarchy/context actions.
- `TicketWorkItem.vue` is also used by weekly Agenda and Release detail ticket cards. `TodayAgendaEntry.vue` has a deliberately compact fixed-height timeline mode; its natural-height mode preserves the normal card presentation. Agenda and Release status controls currently show a generic `circle-dot` icon.
- `shared/ticket-status.ts` defines the seven statuses but no icon mapping. The local Lucide collection contains all proposed icon glyphs.
- `ticket.updatedAt` changes on ticket PATCHes, including status changes. Time entries have `createdAt` and `updatedAt`; create/edit updates the latter. Release `targetDate` is nullable.
- `/api/tickets` is also used by the Agenda ticket picker, ticket creation/relationship choices, and Release detail. Applying a board-only visibility rule to its default response would unintentionally change those other surfaces.
- The board's existing status drag behavior, archive policy, and card interactions are governed by ADRs 0010/0013/0020/0022/0042. Agenda status controls and time history are governed by ADRs 0012/0044.
- `git status --short --branch` was clean on `main` before this plan file was created. No application code, schema, roadmap, or ADR has been changed for M32.

### Proposed icon mapping

Use a consistent neutral-colored Lucide line icon at the existing icon size; status meaning is conveyed by shape and label, not by introducing new status colors:

| Status   | Proposed icon          |
| -------- | ---------------------- |
| Idea     | `lucide:lightbulb`     |
| Estimate | `lucide:calculator`    |
| Develop  | `lucide:code`          |
| Review   | `lucide:eye`           |
| Test     | `lucide:flask-conical` |
| Deploy   | `lucide:rocket`        |
| Done     | `lucide:circle-check`  |

The local `@iconify-json/lucide` collection was checked for all seven names; each is available.

## Approved scope

**This scope incorporates all five answers from the first Plannotator review and was explicitly approved on 2026-10-08.**

- Add a typed status-to-icon mapping alongside the fixed ticket statuses. Use it before the status name in every board column heading, retaining the existing count badge and accessible lane name.
- Replace the generic ticket glyph wherever an individual ticket identity/title is displayed and its status is available: board, Agenda, Release detail, ticket detail/related tickets, and global-search ticket hits. Keep generic ticket/entity icons for navigation, filters, new-ticket placeholders, aggregate counts, and relation-popover triggers, where they identify the entity type or relationship rather than a particular ticket.
- Update status indicators in the Agenda, Release detail, and ticket-detail status controls to use the current ticket's status icon. Keep status menu selection/check icons, status values, labels, colors, and update behavior unchanged.
- **2026-10-08 direct human clarification supersedes the initial size interpretation:** match Ticket Board cards to the current Week Agenda's compact timeline entry styling, not `md`/normal controls. Use the same compact hierarchy badge and context-trigger sizes, regular compact label scale, Agenda hierarchy badges' secondary soft surface/text colors, card padding/border/surface and row spacing. Keep the title/usage row followed by one horizontally scrollable hierarchy/context row as in Agenda, preserve tracked-time ratio colors, board-local horizontal scrolling, title navigation, drag/highlight behavior, and avoid page-level horizontal overflow. Use the same compact hierarchy-label truncation behavior as Agenda. Do not add or remove ticket data/actions. Agenda's fixed-height timeline presentation remains unchanged.
- Apply a presentation-only quiet-Done rule on the Ticket Board's active-ticket view: hide a ticket only when its status is `Done`, its release has no target date, and the later of `ticket.updatedAt` and its latest linked `time_entry.updatedAt` is at least seven elapsed days old. This fixed seven-day threshold applies to all users; no setting is added. Do not archive/delete tickets, mutate timestamps, alter status, or change historic Agenda entries. Non-Done tickets and Done tickets in releases with any target date remain visible. A ticket becomes visible again if it no longer meets the rule. Explicitly archived tickets remain accessible through the existing Show archived behavior.
- Keep the default `/api/tickets` response unchanged for all non-board consumers. Isolate eligibility filtering to a board-specific request/path and evaluate the cutoff against server time. Quiet-Done tickets remain available through Release detail, search, direct ticket detail, and Agenda history.
- Update `PLAN.md` only after plan approval, add an M32 roadmap entry, and record the durable quiet-Done visibility policy in a new ADR (expected number 0046). Do not rewrite completed history or unrelated pending milestone records.

### Plannotator answers incorporated

- **Visibility surface:** Ticket Board only. Preserve Agenda history, Release detail, search, direct ticket detail, and the default `/api/tickets` response.
- **Activity:** use the later of `ticket.updatedAt` and the latest linked `time_entry.updatedAt`.
- **Configuration:** fixed seven-day policy for all users; no setting or schema migration.
- **Icon scope:** use status icons wherever an individual ticket identity/title is shown and its status is available, including global search and ticket detail; retain generic icons for entity-category/aggregate and relationship uses.
- **Initial card-sizing answer:** the original approved plan specified default/normal controls and regular labels. On 2026-10-08 the user clarified that this was too large and directly approved matching the current compact Week Agenda entry's badge/control sizes, secondary hierarchy badge colors, padding, surface, and spacing. The newer instruction supersedes the initial size/color interpretation.

## Out of scope

- New ticket statuses, customizable workflows, status-specific color redesign, board status controls beyond existing drag-and-drop, or changes to ticket status transitions.
- Ticket archive/restore/delete behavior, release completion/archive behavior, target-date semantics, or time-entry creation/history rules.
- Hiding historical Agenda entries or mutating/archiving/deleting tickets as a side effect of inactivity.
- Changes to the default `/api/tickets` contract or visibility in non-board views.
- Any user setting, user-settings schema/API change, or database migration.
- Changes to authentication, ownership, deployment, dependencies, CI policy, supported viewport floor, or unrelated card families.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- Completed context: `docs/milestones/m30-agenda-toolbar-and-timeline-polish.md`, `docs/milestones/m31-project-name-and-header-navigation.md`
- Relevant UI/history milestones: `docs/milestones/m8-polish-and-shared-ticket-work-items.md`, `docs/milestones/m9-shared-card-composition.md`, `docs/milestones/m25-ticket-detail-overhaul.md`
- ADRs 0004 (archive lifecycle), 0008 (board), 0010/0013 (board drag/status policy), 0012 (Agenda settings/history), 0019/0020 (usage colors and shared ticket presentation), 0022 (card composition), 0037 (fixed/data-backed selectors), 0042 (desktop sizing), and 0044 (Week-only Agenda/status selector)
- `shared/ticket-status.ts`
- `app/pages/tickets/index.vue`, `app/components/TicketBoardCard.vue`, `app/components/TicketWorkItem.vue`, `app/components/TodayAgendaEntry.vue`, `app/components/TicketHierarchyBadges.vue`, `app/components/TicketContextPopovers.vue`
- `app/pages/agenda.vue`, `app/components/WeeklyAgenda.vue`, `app/pages/releases/[id]/index.vue`, `app/pages/tickets/[id]/index.vue`, `app/components/HierarchyBreadcrumbs.vue`, `app/components/GlobalSearch.vue`
- `server/api/tickets/index.get.ts`, `server/api/tickets/[id].get.ts`, `server/api/search.get.ts`, `server/domain/time-entries.ts`, `server/db/schema.ts`
- Existing browser coverage: `tests/e2e/ticket-status-moves.test.ts`, `tests/e2e/ticket-context-popovers.test.ts`, `tests/e2e/agenda-week.test.ts`, `tests/e2e/tickets.test.ts`; unit coverage in `tests/unit/tickets.test.ts`

## Approach

1. **Status icon source:** add a typed mapping for all fixed statuses in `shared/ticket-status.ts`, with a small shared accessor if useful. Use icons from the already-installed Lucide collection. Keep the generic ticket entity icon unchanged for category/count use.
2. **Status icon surfaces:** add a required status input to the shared ticket work-item presentation and update its board, Agenda, and Release callers. Add the icon before each board column's text. Pass ticket status to current/related ticket identity rows and include status on global-search ticket results. Use the same mapping for existing status-control leading icons; leave status action menu checkmarks unchanged.
3. **Board card parity:** use the current Week Agenda's compact `compactTimeline` entry as the reference. Match its hierarchy badge/context-trigger sizing, 10px compact hierarchy labels, secondary soft hierarchy badge colors, neutral relation/link triggers, 4px card padding, subtle border/elevated surface, compact row spacing, and title typography where compatible. Match hierarchy label truncation, title/metadata row placement, and the single horizontally scrollable hierarchy/context row. Keep aggregate tracked-time/estimate semantics and ratio colors, Board title navigation/drag/highlight ownership, and horizontal lane scrolling. Do not change Agenda or Release card sizing.
4. **Quiet Done eligibility:** implement a pure, testable eligibility rule using an injected/current server timestamp, `max(ticket.updatedAt, latest linked time_entry.updatedAt)`, the Done status, and the release's nullable target date. Hide eligible, non-archived tickets only from the Ticket Board's active view, at or after seven elapsed days. Keep explicitly archived tickets visible under the existing archive filter. Preserve default ticket-list behavior for the Agenda picker, Release detail, creation/relationship selectors, search, and other consumers.
5. **Regression coverage:** verify every status icon is rendered in its intended locations; status labels/counts remain accessible; Board cards match compact Agenda sizes, truncate/scroll safely, retain semantic tracked-time colors, and remain draggable/clickable; generic category/aggregate/relation icons remain unchanged. Use deterministic timestamps to test just-before/at/after the cutoff, release target-date exclusion, status re-entry, qualifying activity, archived visibility, and recovery through other views. Confirm `/api/tickets` default and Agenda history remain unchanged.
6. **Roadmap/decision/evidence:** after plan approval, add M32 to `PLAN.md`, create/index ADR 0046 for the durable board visibility policy, then record exact focused/full checks, manual 1280px review, deviations, and review outcomes in this file.

## Files to modify

- `shared/ticket-status.ts` — typed status-to-icon map.
- `app/pages/tickets/index.vue` — board-specific visibility request and status-lane icons.
- `app/components/TicketBoardCard.vue`, `app/components/TicketWorkItem.vue` — Agenda-compact Board styling and status-aware ticket identity.
- `app/components/EntityCard.vue` — expose the existing compact padding plus focused border/content-spacing options for Board parity.
- `app/components/TicketTrackedUsage.vue`, `app/components/TicketWorkItem.vue` — allow the Board's usage text to use the Agenda entry text scale without changing other surfaces.
- `app/components/TicketHierarchyBadges.vue`, `app/components/TicketContextPopovers.vue` — reuse the Agenda compact style rather than adding a larger Board-only size.
- `app/components/TodayAgendaEntry.vue`, `app/pages/agenda.vue`, `app/pages/releases/[id]/index.vue` — pass current status and update existing status indicators; preserve compact timeline behavior and existing card sizing.
- `app/pages/tickets/[id]/index.vue`, `app/components/HierarchyBreadcrumbs.vue`, `app/components/GlobalSearch.vue`, `server/api/tickets/[id].get.ts`, and `server/api/search.get.ts` — provide status on specific ticket identity rows/search hits.
- `server/api/tickets/index.get.ts` plus a focused helper under `server/domain/` or `shared/` and unit tests — apply board-only quiet-Done filtering while preserving endpoint default behavior.
- Tests: extend `tests/e2e/ticket-status-moves.test.ts`, `tests/e2e/ticket-context-popovers.test.ts`, `tests/e2e/agenda-week.test.ts`, and focused ticket/API coverage; add unit tests for the status-icon map and quiet-Done eligibility.
- `PLAN.md`, `docs/decisions/README.md`, new `docs/decisions/0046-*.md`, and this milestone journal.

No settings, database-schema, migration, authentication, or dependency files are planned.

## Reuse

- Reuse the fixed `ticketStatuses` list and existing `TicketWorkItem` shared by board, Agenda, and Release detail; do not fork ticket-title markup.
- Reuse the existing semantic usage palette in `TicketTrackedUsage.vue` and ADR 0020. Status glyphs remain neutral; do not introduce a separate status-color system.
- Reuse `TicketHierarchyBadges` and `TicketContextPopovers` in the same compact configuration used by Week Agenda, rather than duplicating their interaction/accessibility logic.
- Reuse the existing owner-scoped ticket query while keeping board-only eligibility distinct from `GET /api/tickets`' current default semantics.
- Reuse existing test authentication fixtures, deterministic database seeding, and drag helpers in `tests/e2e/ticket-status-moves.test.ts`; retain current accessible board labels and selectors.
- No migration is required. Do not alter `ticket.updatedAt` or time-entry history to represent automatic hiding.

## Decisions and ADR links

- Plannotator answered five review questions and explicitly approved the revised plan on 2026-10-08. The implementation has since passed Plannotator code review. At the time of this planning note, the user's app review and completion declaration were pending; see the closeout journal below.
- Implemented status mapping: Idea/lightbulb, Estimate/calculator, Develop/code, Review/eye, Test/flask-conical, Deploy/rocket, Done/circle-check. Generic ticket icons remain for entity categories, aggregate counts, and relationships.
- Initial implementation used `md` controls and wrapping hierarchy labels; the user's 2026-10-08 visual-parity clarification superseded that interpretation. The compact Week Agenda sizes, hierarchy badge colors, padding, border/surface, row spacing, truncation, and scrolling have since been implemented and reviewed below.
- Implemented quiet-Done behavior: Ticket Board active view only; latest ticket update or linked time-entry update determines activity; fixed seven-day threshold for all users; no setting. The rule does not archive/delete tickets or mutate timestamps. The default ticket API, archived-ticket access, Release detail, search, direct detail, and Agenda history remain unchanged.
- Accepted ADR 0046 records the durable Done-ticket board-visibility policy. Presentation-only icon/size changes do not by themselves require an ADR.
- Existing ADRs 0004, 0008, 0010, 0012, 0013, 0020, 0022, 0042, and 0044 continue to govern archive lifecycle, board interactions, shared presentation, spacing, and Agenda history/status behavior.

## Implementation checklist

- [x] Incorporate Plannotator feedback and obtain explicit approval of this revised M32 plan before implementation.
- [x] Add and test the status-to-icon mapping; render it in lane headings and all approved individual-ticket/status indicator locations.
- [x] Match Ticket Board hierarchy/context sizing, hierarchy colors, padding, surface, row spacing, and single scrollable context row to compact Week Agenda entries; verify truncation and interaction behavior.
- [x] Implement the quiet-Done rule only for eligible non-archived board tickets; keep archived tickets accessible and do not archive/delete/mutate ticket data.
- [x] Add deterministic unit/API/E2E coverage for status icons, cutoff boundaries, qualifying activity, target-date behavior, reappearance, archived visibility, and board interaction regressions.
- [x] Update `PLAN.md` and add/index ADR 0046 within approved scope.
- [x] Run focused tests, typechecks, unit tests, full Playwright, build, workflow documentation checks, and diff/whitespace checks; record outcomes and deviations here.
- [x] Manually inspect the revised Board/Agenda visual parity at the supported 1280 CSS px width, including sizes, placement, colors, padding, column scrolling, icon placement, and drag/click affordances.
- [x] Submit the full implementation diff for human code review; Plannotator approved it with non-blocking notes.
- [ ] Record the user's app review and completion declaration; do not close the milestone before then.

## Journal

### 2026-10-08 — Planning research

- Fact: the current board's headings have no workflow icons; its shared title row displays `EntityIcon kind="tickets"`; hierarchy controls use `size="xs"`. The board currently keeps title/usage on the first row and hierarchy/context popovers on the second.
- Fact: `TicketWorkItem.vue` is shared by board, Agenda, and Release detail. Agenda fixed-height Week blocks deliberately opt into a compact timeline variant; normal-height Agenda entries do not.
- Fact: `ticket.updatedAt` changes on all ticket PATCHes; time-entry creation and edits update `time_entry.updatedAt`; release target date is nullable. The endpoint's default ticket list is consumed outside the board, so board-only filtering must be isolated.
- Decision proposed: centralize seven neutral Lucide status icons; use the standard-size Agenda card treatment as the board visual reference; retain generic ticket-category glyphs for navigation/filter/aggregate contexts; apply quiet-Done visibility without archiving, deletion, or timestamp mutation.
- Evidence: read `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`, the milestone template/lifecycle, M8/M9/M25/M30/M31 records, relevant ADRs, board/shared-card/Agenda/Release/settings/server/schema/test sources. Verified the seven proposed glyphs exist in the installed local Lucide set. `git status --short --branch` showed a clean `main` worktree before creating this plan. No code, schema, roadmap, or ADR content was changed.

### 2026-10-08 — First Plannotator review and revision

- Fact: Plannotator answered all five questions and returned `decision: annotated`, not approval. The answers selected board-only hiding, latest ticket-or-time-entry update as activity, a fixed seven-day rule with no setting, status icons on all individual ticket identity rows with status available, and default Nuxt UI control sizes with regular labels.
- Decision: incorporate those answers, mark each selection in the review artifact, and resubmit for explicit approval. The Q4 response in CLI feedback was truncated after “keep”; it matches the complete selected option recorded above (generic category, aggregate, and relation icons remain unchanged).
- Evidence: `plannotator annotate docs/milestones/m32-ticket-board-status-icons-cards-and-done-visibility.md --gate --json --require-approval` returned `decision: annotated`; 5/5 answers were recorded. Implementation had not started at that point.

### 2026-10-08 — Planning artifact checks

- Fact: `node scripts/check-workflow-docs.mjs` passed. `./node_modules/.bin/oxfmt --check docs/milestones/m32-ticket-board-status-icons-cards-and-done-visibility.md` passed after formatting the plan with the local Oxfmt binary. `git diff --no-index --check /dev/null docs/milestones/m32-ticket-board-status-icons-cards-and-done-visibility.md` produced no whitespace diagnostics (expected untracked-file exit normalized).
- Fact: the documented `pnpm exec oxfmt --check` command could not run because `pnpm` is not available in this shell (`pnpm: command not found`). Used the repository-installed Oxfmt executable instead; no package or environment changes were made.
- Evidence: planning checks only; no application verification was run or is implied.

### 2026-10-08 — Revised Plannotator plan approval

- Decision: Plannotator approved the revised M32 plan after the five answers were incorporated. The approved scope is the Ticket Board-only quiet-Done policy (seven days based on the later ticket/time-entry update, no setting), status icons for individual ticket identities wherever status is available, and standard-size Ticket Board card controls with existing colors/placement preserved.
- Evidence: `plannotator annotate docs/milestones/m32-ticket-board-status-icons-cards-and-done-visibility.md --gate --json --require-approval` returned `{"decision":"approved"}`. Implementation had not started at the time of approval.

### 2026-10-08 — Implementation

- Fact: the shared status map now drives the seven Board lane icons, title icons on Board/Agenda/Release cards, Agenda/Release/ticket-detail status indicators, ticket-detail breadcrumb and related-ticket identities, and ticket hits in global search. Generic category and relationship icons remain in their existing roles.
- Fact: the initial Board implementation used Nuxt UI `md` hierarchy/context controls, `p-2` card padding, `space-y-2` row spacing, and wrapped hierarchy labels; the Week Agenda uses compact timeline controls, `p-1` card padding, secondary soft hierarchy badges, truncation, and `gap-1`. The user directly instructed that the Board match the latter treatment; at this point the correction was pending, and its implementation and verification are recorded in the subsequent revision section.
- Fact: the `WeeklyAgenda` row status type matches the fixed status union so the shared status-aware work item remains type-safe.
- Fact: the Board sends `board=true`; `/api/tickets` only applies the seven-elapsed-day rule for that explicit request. Ticket status, nullable release target date, ticket update, and max linked time-entry update are used. The default ticket-list shape is preserved and the internal target date is not returned.
- Decision: record the durable fixed visibility policy in accepted ADR 0046; no schema, migration, setting, dependency, timestamp mutation, or archival side effect was added.
- Evidence: added unit coverage for all seven icon names and deterministic cutoff/activity/target-date/archive behavior; added E2E coverage for the API default contract, board visibility, recent tracked work, archived access, status re-entry, and preserved Release/search/direct-detail/Agenda access. Existing Board drag/status, hierarchy, popover, compact Agenda, and Release behavior are also covered.
- Deviation/fix: the first quiet-Done API E2E exposed that the raw SQL `max(updated_at)` result is a string, not a decoded `Date`; the endpoint now normalizes the aggregate result before applying the pure date rule. The focused E2E then passed.
- Initial manual check (superseded by the Agenda-parity review below): reviewed a 1280px full-page screenshot at `/tmp/m32-ticket-board.png` (temporary, not added to the repository). Status glyphs preceded lane names; the original Board implementation used normal-sized controls and wrapping labels. No screenshot artifact is committed.

### 2026-10-08 — User-directed Agenda visual parity revision

- Decision: the user's direct instruction superseded the original normal-size Board interpretation. The Board now reuses the Week Agenda's compact hierarchy badges (secondary soft colors, 10px labels, 20px controls, label truncation) and compact neutral relation/link triggers. The Board card surface now matches Agenda padding (`p-1`), subtle border, elevated background, text scale, title/context spacing, and a single horizontally scrollable hierarchy/context row. Tracked usage uses the compact text scale without changing semantic ratio colors. Drag/highlight/title navigation and lane scrolling remain supported.
- Fact: `EntityCard` received opt-in subtle-border and compact-content-spacing props; defaults for other card families remain unchanged. `TicketWorkItem`/`TicketTrackedUsage` gained an opt-in usage text size used only by Board. The Board no longer uses Board-only `md` control sizing or wraps hierarchy labels; it uses the same compact/truncating/scrolling paths as Week Agenda.
- Evidence: the Board and matching 30-minute Agenda entry were compared in a 1280px Playwright browser. The temporary screenshots `/tmp/m32-board-card-parity.png` and `/tmp/m32-agenda-card-parity.png` showed the same compact badge color/scale, card padding/surface, title/context placement, and horizontal context scrolling. The screenshots are outside the repository. E2E assertions compare computed card surface/padding/border/radius/text size, badge surface/color/padding/height/icon size, title text scale, and horizontal scroll behavior.
- Regression adjustment: the established drag test's `x+8/y+8` drag-start point was inside the now-denser card content; it now begins at `x+2/y+2` within the card padding. Board border and padding assertions were updated to the new Agenda-matched `border-accented/50` and `p-1` contract. A full-suite run after the single-row scrolling change exposed the old no-overflow assertion and status-move interactions that assumed every control was simultaneously visible. E2E coverage now asserts the Agenda-like scroller and brings offscreen hierarchy/relation controls into view before activation. Focused hierarchy/status/popover tests passed and the final full suite passed 39/39 with two workers.
- Test-harness correction: an initial parity-test attempt evaluated the Board locator after navigating to Agenda; the Board scroll metric is now captured before navigation. The focused comparison then passed.

### 2026-10-08 — Plannotator code review

- Decision: Plannotator reviewed the full working-tree diff and returned `approved` with non-blocking notes; no changes were requested. Do not revise or reopen the reviewed diff solely because of those notes.
- Reviewer note: “code looks good, i'll now review the app myself”. The app review and the user's M32 completion declaration therefore remain open.
- Evidence: `plannotator review --git --no-git-remote-check` returned “Code review completed — the changes are approved.”

### 2026-10-08 — Ticket Board toolbar/layout amendment planning

- Decision: this request extends the existing M32 plan; it does not create a new milestone. The archive filter retains the existing active/include-archived modes, and Clear filters resets all filters to their defaults. The header-spacing reference is the sticky application header; the Tickets heading remains screen-reader-only. The human selected both choices in Plannotator.
- Evidence: the first amendment gate returned `decision: annotated` with 2/2 questions answered. The revised amendment was approved via `plannotator annotate docs/milestones/m32-ticket-board-status-icons-cards-and-done-visibility.md --gate --json --require-approval` on 2026-10-08. No amendment implementation had started at the moment of approval; implementation followed the approval.

### 2026-10-08 — Ticket Board toolbar/layout amendment implementation

- Fact: the archive visibility toggle is now a filter-bar select with `Active tickets` (default) and `Include archived`. The latter retains the current `archived=true` behavior, including active and archived tickets; Clear filters now resets archive visibility and hierarchy selections to defaults. No server/API behavior changed.
- Fact: the UCard filter border/surface was removed. The borderless 32px filter bar remains one row at 1280 CSS px, followed by a vertical Nuxt UI separator and the unchanged `New ticket` action. The sticky header-to-filter and filter-to-board gaps measure 16px.
- Fact: the scrollable board has a subtle rounded border and stretches its lanes toward the bottom of the viewport. The page and board grow naturally when lane content exceeds the available height; horizontal overflow remains in the board scroller.
- Verification: the E2E test covers active/include-archived behavior, archived card visibility, Clear filters reset, toolbar/divider geometry, 1280px horizontal fit, border, lane height, viewport-bottom spacing, local horizontal scrolling, and growth with 18 additional lane cards.
- Manual visual check: inspected `/tmp/m32-ticket-board-layout.png` at 1280×900. The filter bar is borderless; the divider is between filters and `New ticket`; the board has a subtle outline and reaches the viewport bottom. The measured board bottom margin was 17px (within 1px of the nominal 16px target); the shell header/filter and filter/board gaps were exactly 16px. Screenshot is temporary and not committed.
- Deviation: the viewport-bottom E2E accepts a 1px tolerance for the min-height calculation; measured bottom spacing is 17px at 1280×900. This is visually consistent with the shell's 16px page inset. No page-level horizontal overflow was observed.
- Scope: no server, API, database, schema, settings, app-shell, dependency, or new ADR changes.

### 2026-10-08 — Plannotator code review of the toolbar/layout amendment

- Decision: Plannotator approved the complete working-tree diff with no changes requested.
- Evidence: `plannotator review --git --no-git-remote-check --json` returned `{"decision":"approved","message":"# Code Review\n\nCode review completed — no changes requested."}` on 2026-10-08.
- Follow-up at this stage: the user's live-app review and M32 completion declaration remained pending; the subsequent closeout declaration is recorded below.

### 2026-10-08 — User-directed unestimated tracked-time and filter-spacing refinement

- Decision: the user's direct request explicitly approved this small extension within M32. No new milestone was created. Tracked time without an estimate is muted; estimate-based usage colors remain unchanged. The Ticket Board and Agenda filter group/grid gaps are now 4px.
- Fact: both shared ticket usage and ticket-detail tracked-time displays use the muted semantic color when no estimate exists. The archive/hierarchy filters and Clear filters action retain their behavior. ADR 0047 records the durable no-estimate color rule.
- Verification: `./node_modules/.bin/oxfmt --check` passed on all 297 files; `./node_modules/.bin/oxlint .`, `./node_modules/.bin/nuxt typecheck`, `./node_modules/.bin/tsgo --project tsconfig.tsgo.json --noEmit`, `./node_modules/.bin/nuxt build`, and `./node_modules/.bin/vitest run` passed (14 files, 75 tests). The build emitted only non-fatal Vite/Rolldown plugin-timing warnings. `node scripts/check-workflow-docs.mjs` and `git diff --check` passed. `./node_modules/.bin/playwright test --list` discovered all 39 E2E tests.
- E2E limitation: browser tests were not run because no app server was listening on `127.0.0.1:3000`; the dev server remains stopped at the user's request that they run it themselves. The new assertions are in `tests/e2e/filter-search.test.ts`, `tests/e2e/ticket-context-popovers.test.ts`, and `tests/e2e/time-entries.test.ts`; run these when the user-provided server is available.
- Code review: `plannotator review --git --no-git-remote-check --json` approved the updated complete working-tree diff with no changes requested on 2026-10-08.
- Follow-up: focused E2E execution remains a documented, human-accepted deferral; no further M32 work is required.

### 2026-10-08 — User completion declaration

- Fact: the user stated, “i declare this milestone complete.” on 2026-10-08.
- Acceptance: the prior handoff disclosed that the final refinement's focused browser assertions were unrun because the dev server remained stopped at the user's request, and that M32 remained open for those checks and app review. This declaration is recorded as approval to defer those specific browser checks and close M32; they are not represented as passing.
- Review status: the declaration closes the user's app-review/acceptance gate. No separate written app-review findings were provided. Plannotator had already approved the complete working-tree diff with no changes requested.
- Result: M32 is Complete. Prior E2E evidence (39/39) and the latest unrun assertions are distinguished in the verification record below.

## Verification

Original M32 planning artifact checks:

- [x] `node scripts/check-workflow-docs.mjs` — passed.
- [x] `./node_modules/.bin/oxfmt --check docs/milestones/m32-ticket-board-status-icons-cards-and-done-visibility.md` — passed; `pnpm` is unavailable in this shell, so the repository-installed binary was used.
- [x] `git diff --no-index --check /dev/null docs/milestones/m32-ticket-board-status-icons-cards-and-done-visibility.md` — no whitespace diagnostics (expected untracked-file exit status normalized).
- [x] Plannotator explicitly approved the original M32 plan; the first review returned `annotated` with all five answers, and the resubmitted plan returned `approved`.

Toolbar/layout amendment planning checks:

- [x] `./node_modules/.bin/oxfmt --check docs/milestones/m32-ticket-board-status-icons-cards-and-done-visibility.md` — passed after incorporating the first review answers.
- [x] `node scripts/check-workflow-docs.mjs` — passed.
- [x] `git diff --no-index --check /dev/null docs/milestones/m32-ticket-board-status-icons-cards-and-done-visibility.md` — no whitespace diagnostics (expected untracked-file exit status normalized).
- [x] Plannotator approval — first amendment review returned `annotated` with 2/2 questions answered; the revised plan returned `approved` on 2026-10-08 before implementation.

Original M32 implementation checks:

- [x] `./node_modules/.bin/oxfmt --check` — passed all 296 files.
- [x] `./node_modules/.bin/oxlint .` — passed.
- [x] `./node_modules/.bin/nuxt typecheck` — passed.
- [x] `./node_modules/.bin/tsgo --project tsconfig.tsgo.json --noEmit` — passed.
- [x] `./node_modules/.bin/vitest run` — 14 files and 75 tests passed.
- [x] Focused `PLAYWRIGHT_SKIP_DEV_SERVER=1 ./node_modules/.bin/playwright test tests/e2e/ticket-board-quiet-done.test.ts tests/e2e/ticket-status-moves.test.ts tests/e2e/ticket-context-popovers.test.ts` — 5 passed.
- [x] Full `PLAYWRIGHT_SKIP_DEV_SERVER=1 ./node_modules/.bin/playwright test --workers=2` — 39 passed, 0 skipped.
- [x] `./node_modules/.bin/nuxt build` — passed.
- [x] `node scripts/check-workflow-docs.mjs` — passed with the M32 roadmap and ADR index entries.
- [x] `git diff --check` and explicit checks of new untracked files — no whitespace diagnostics.

Toolbar/layout amendment implementation checks:

- [x] `PLAYWRIGHT_SKIP_DEV_SERVER=1 ./node_modules/.bin/playwright test tests/e2e/filter-search.test.ts --workers=1` — passed (1/1), including filter/reset and layout/growth assertions.
- [x] `PLAYWRIGHT_SKIP_DEV_SERVER=1 ./node_modules/.bin/playwright test tests/e2e/ticket-board-quiet-done.test.ts tests/e2e/ticket-status-moves.test.ts tests/e2e/tickets.test.ts --workers=1` — passed (3/3).
- [x] `PLAYWRIGHT_SKIP_DEV_SERVER=1 ./node_modules/.bin/playwright test --workers=2` — passed (39/39).
- [x] `./node_modules/.bin/nuxt typecheck`, `./node_modules/.bin/tsgo --project tsconfig.tsgo.json --noEmit`, and `./node_modules/.bin/oxlint .` — passed.
- [x] `./node_modules/.bin/vitest run` — passed (14 files, 75 tests).
- [x] `./node_modules/.bin/oxfmt --check` — passed (296 files).
- [x] `./node_modules/.bin/nuxt build` — passed; non-fatal Vite/Rolldown plugin-timing warnings were emitted.
- [x] `node scripts/check-workflow-docs.mjs`, `git diff --check`, and whitespace checks of new M32 files — passed.
- [x] Manual 1280×900 Playwright visual inspection — see the implementation journal above; no screenshot is committed.
- [x] `plannotator review --git --no-git-remote-check --json` — approved with no changes requested on 2026-10-08.

- Deviation: `pnpm` is unavailable (`pnpm: command not found`), so repository-local binaries and the underlying workflow-document check script were used without changing dependencies or environment configuration.
- Full-suite concurrency evidence: the first default six-worker run had two failures (a hierarchy-action assertion expecting the old truncated-label `title`, fixed to assert visible label text, and a 30-second timeout in the unrelated archived-hierarchy E2E). The second six-worker run passed 38/39 and hit the same archived-hierarchy timeout; that test passed in isolation. The full suite then passed 39/39 with two workers and no retries. No Playwright worker policy or timeout configuration was changed.

M32 is complete by the user's 2026-10-08 declaration. The latest no-estimate usage/filter-spacing refinement was implemented and reviewed; its focused browser assertions were explicitly deferred by that declaration and are not claimed as passing.

## Review status

- Plan review: Original M32 scope approved via Plannotator on 2026-10-08 after incorporating all five answers. The Ticket Board toolbar/layout amendment was also approved via Plannotator on 2026-10-08 after incorporating both answers.
- Code review: Original M32 diff approved via Plannotator on 2026-10-08 with non-blocking notes. The complete diff including the toolbar/layout amendment and latest user-directed refinement was approved via Plannotator on 2026-10-08 with no changes requested.
- App review/acceptance: Complete by the user's M32 completion declaration on 2026-10-08; no separate written findings were provided.
- Milestone completion declaration: Complete — the user stated, “i declare this milestone complete.” on 2026-10-08.

## Follow-ups

- No open M32 follow-ups. The focused browser assertions for the final presentation refinement remain an explicitly accepted deferral, not a passing test result.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred; the final refinement's focused browser checks were explicitly deferred by the user.
- [x] Verification evidence recorded, including the unrun focused checks and earlier passing suite results.
- [x] Human code review accepted for the complete M32 scope via Plannotator on 2026-10-08.
- [x] User's completion declaration recorded in the journal and review status on 2026-10-08.
