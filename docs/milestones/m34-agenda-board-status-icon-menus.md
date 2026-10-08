# M34 — Agenda and Ticket Board status icon menus

> **Status: Complete — the user declared M34 complete on 2026-10-08. Focused/full E2E and 1280 CSS px visual review were not run and are explicitly deferred by the declaration; they are not claimed as passing.**

## Context

The Agenda currently shows a ticket's status twice in each entry: its status-specific icon beside the ticket title, and a status badge in the entry-context strip. The badge opens the existing flat status menu. The user requests removing that badge and making the status icon beside the title open the menu instead. In Plannotator feedback on the first draft, the user asked for the same status-icon behavior on Ticket Board cards so the two card surfaces remain similar.

### Observed facts

- `TodayAgendaEntry.vue` renders `TicketWorkItem` in `entry` mode. `TicketWorkItem.vue` currently puts the status icon inside the ticket-title link, so that icon click navigates to ticket detail.
- The Agenda context strip in `TodayAgendaEntry.vue` renders a second status control: an icon plus status label inside `UDropdownMenu`. Its items are the fixed statuses; the current status, busy states, and archived entries are disabled as appropriate.
- Ticket Board cards render `TicketWorkItem` in `ticket-summary` mode. Their status icon is also inside the ticket-title link, and there is no card-level status menu.
- `app/pages/agenda.vue` owns `changeTicketStatus`, which uses the existing ticket PATCH endpoint, refreshes Agenda/ticket data, and reports write/refresh failures accessibly.
- `app/pages/tickets/index.vue` owns `moveStatus` for Board drag-and-drop. It uses the same ticket PATCH endpoint and provides refresh/error/retry/live-announcement behavior; archived tickets and same-status/invalid transitions are rejected.
- `TicketBoardCard.vue` prevents dragging when pointer interaction starts on a button/link, and drag start ignores interactive descendants. `WeeklyAgenda.vue` excludes buttons and links from pointer-drag initiation.
- `TodayAgendaEntry` is used both in fixed-height weekly timeline entries and in out-of-window entries. The requested Agenda interaction should be consistent in both.
- Existing Agenda status coverage is in `tests/e2e/agenda-status.test.ts`; weekly layout/accessibility assertions are in `tests/e2e/agenda-week.test.ts`; `tests/e2e/agenda-drag.test.ts` also locates the current status control. Board drag/status coverage is in `tests/e2e/ticket-status-moves.test.ts`.
- ADR 0013 preserves Board drag-and-drop while rejecting a non-drag Board status control. The current M32 record explicitly keeps Board status controls absent beyond drag-and-drop.
- The worktree was clean on `main` tracking `origin/main` during initial planning research. M33 is recorded Complete in `docs/milestones/m33-agenda-card-hover-and-initial-load.md`.

## Approved scope

**Approved via Plannotator on 2026-10-08 after incorporating feedback requesting Ticket Board parity.**

- On Agenda entries, remove the status badge (icon and visible status text) from the entry-context strip.
- On Agenda entries and Ticket Board cards, make the existing status-specific icon beside each ticket title the icon-only status-menu trigger. The icon remains visually adjacent to the title, but is a separate accessible button rather than part of the ticket-detail link.
- Keep ticket titles independently navigable to ticket detail. Clicking a status icon opens the flat menu without navigating or starting a time-entry/Board drag.
- Reuse the existing Agenda status mutation and refresh/error/live-announcement flow. Reuse Ticket Board's existing `moveStatus` mutation, refresh/error/retry/live-announcement flow for direct menu selections. Do not add a second status-write path on either surface.
- Show each status's corresponding icon to the left of its name in both menus, and retain a separate checkmark for the current status. Preserve the fixed status list, same-status/busy/archived disabling, and accessible keyboard/menu behavior. Preserve the Board's existing desktop drag-and-drop status workflow alongside the new direct menu.
- Apply the Agenda interaction to entries in both the weekly timeline and out-of-window sections, including compact timeline entries. Keep other Agenda context actions and card/time geometry unchanged.
- Scope the Ticket Board interaction to individual ticket cards. Do not add status menus to lane headings or other ticket identity surfaces.
- Update Agenda and Board browser coverage affected by moving the controls, including regression checks for each surface's existing drag/navigation interactions.
- Keep APIs, data, status values/rules, archive behavior, and stored data unchanged.

## Out of scope

- Changes to status controls on Release detail, ticket detail, global search, or other non-Agenda/non-Board surfaces.
- Changes to ticket status values, transitions, authorization, ownership, API contracts, data model, database/schema, or dependencies.
- Changes to Agenda filters, hierarchy badges, time-entry presentation, drag/move/resize geometry, Board lane layout, or Board drag-and-drop behavior beyond regression verification.
- Reintroducing the removed next-status arrow or changing Board status drag-and-drop; the icon menu supplements, rather than replaces, drag-and-drop.
- New settings or changes to archived-ticket visibility.
- Any code implementation before the revised plan is approved.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- `docs/milestones/m29-today-week-only-ui-polish.md` — Week-only Agenda and direct status selection
- `docs/milestones/m32-ticket-board-status-icons-cards-and-done-visibility.md` — current Board status-icon and drag behavior; completed scope remains historical
- `docs/milestones/m33-agenda-card-hover-and-initial-load.md` — current Agenda interaction baseline
- `docs/decisions/0013-board-status-control-removal.md` — Board has no direct status action apart from drag-and-drop
- `docs/decisions/0044-week-only-agenda-and-status-selector.md` — flat fixed-status Agenda selector
- `docs/decisions/0039-today-agenda-context-control-flow.md` — historical context-strip composition; status-menu structure is superseded only as recorded by ADR 0044
- `.agents/skills/nuxt-ui/SKILL.md` — Nuxt UI maintainer guidance pointer; consult component references before implementation if changing UI component patterns
- `app/components/TodayAgendaEntry.vue`, `app/components/TicketWorkItem.vue`, `app/components/TicketBoardCard.vue`, `app/components/WeeklyAgenda.vue`, `app/pages/agenda.vue`, `app/pages/tickets/index.vue`
- `tests/e2e/agenda-status.test.ts`, `tests/e2e/agenda-week.test.ts`, `tests/e2e/agenda-drag.test.ts`, `tests/e2e/ticket-status-moves.test.ts`

## Approach

1. Add an opt-in status-icon slot/seam to `TicketWorkItem.vue` for both entry and ticket-summary modes. When supplied, render the caller's icon button as a sibling of the ticket-title link; otherwise preserve the existing icon-within-link presentation. This isolates the new interaction to Agenda and Ticket Board callers while leaving other surfaces unchanged.
2. In `TodayAgendaEntry.vue`, render an icon-only `UDropdownMenu` trigger through the entry slot. Keep an accessible name identifying the ticket and current status, preserve the status icon, existing flat status items, current-status check, busy handling, and archived-entry restrictions. Remove the status-labeled control from the context strip; leave hierarchy, relation, and external-link controls unchanged.
3. In `TicketBoardCard.vue`, supply the same icon-only trigger for the ticket-summary status icon. Build the same fixed status menu and emit a status-change event. In `app/pages/tickets/index.vue`, pass selections to existing `moveStatus`; preserve its failure/retry behavior and ensure focus remains usable when a successful status change moves the card to another lane. Keep Board lane drag-and-drop unchanged.
4. Continue forwarding Agenda selections through `WeeklyAgenda.vue` to the unchanged `changeTicketStatus` handler in `app/pages/agenda.vue`. Do not introduce new server calls or a parallel mutation path.
5. Extend Agenda status E2E coverage to prove that the icon opens the menu, each fixed option behaves as before, an update changes the ticket and displayed icon, the ticket-title link still navigates, and the old status badge is absent. Retain failure, in-flight, archived, and keyboard/menu coverage. Update weekly layout/drag tests to locate the moved icon trigger and confirm it does not start dragging or time-entry correction.
6. Extend Board E2E coverage to exercise direct icon-menu status selection alongside existing drag moves, verify the selected card moves to its status lane and update failures use existing recovery, and confirm title navigation, interactive-control drag protection, archived restrictions, and keyboard behavior remain correct.
7. Run focused Agenda and Board browser tests plus relevant project checks. At 1280 CSS px, inspect compact timeline entries, out-of-window Agenda cards, and Board cards for title/action fit, context-strip cleanup, and unchanged time geometry/Board drag behavior. Record exact outcomes and any deviations in this milestone file.
8. After plan approval, add the M34 roadmap entry to `PLAN.md` and draft ADR 0048 for the new shared Agenda/Board status-icon-menu policy. ADR 0048 should supersede only ADR 0013's prohibition on an additional direct Board status control; preserve its next-status-arrow removal and drag-and-drop decisions. Update ADR 0013's supersession pointer only after implementation review, following project convention. Accept ADR 0048 after code review. If implementation research suggests a broader change, stop and seek approval.

## Files to modify

- `app/components/TicketWorkItem.vue` — add an opt-in status-icon slot for entry and ticket-summary modes; keep the default presentation and all unmodified callers unchanged.
- `app/components/TodayAgendaEntry.vue` — move the existing dropdown trigger to the title-adjacent icon and remove the visible status badge from the Agenda context strip.
- `app/components/TicketBoardCard.vue` — add the status icon menu trigger and emit a selected status without changing drag ownership.
- `app/pages/tickets/index.vue` — route Board menu selection through `moveStatus` and preserve appropriate focus after a card changes lanes.
- `tests/e2e/agenda-status.test.ts` — verify icon-triggered direct status changes, menu/accessibility, current/busy/archive behavior, title navigation, write failure, and absence of the context status badge.
- `tests/e2e/agenda-week.test.ts`, `tests/e2e/agenda-drag.test.ts`, `tests/e2e/ticket-context-popovers.test.ts` — update status-control location assertions and verify compact entry fit and unchanged drag/correction/context behavior.
- `tests/e2e/ticket-status-moves.test.ts` — verify Board icon-triggered status changes, failures/archives, title navigation, control-vs-drag separation, and retained Board drag-and-drop.
- `PLAN.md` — add the approved M34 roadmap entry only after plan approval.
- `docs/decisions/0048-agenda-and-board-status-icon-menus.md` (Proposed after plan approval, Accepted after code review), `docs/decisions/README.md`, and the narrow supersession pointer in ADR 0013 after code review.
- `docs/milestones/m34-agenda-board-status-icon-menus.md` — record implementation, verification, review, and closeout evidence.

No changes to server, API, database/schema, authentication, dependencies, or other view components are planned.

## Reuse

- Reuse `ticketStatusIcon` and `ticketStatuses` from `shared/ticket-status.ts`; do not create a second icon/status map.
- Reuse the existing `statusMenuItems`/`changeTicketStatus` event path in Agenda and `moveStatus` mutation/retry path on Ticket Board.
- Reuse `TicketWorkItem` as the shared ticket identity component; keep slot behavior opt-in so other ticket-summary and entry callers retain their current presentation.
- Reuse Agenda test fixtures and update/failure/archive checks in `tests/e2e/agenda-status.test.ts`.
- Reuse Ticket Board lane/drop fixtures and failure/retry tests in `tests/e2e/ticket-status-moves.test.ts`.
- Preserve `WeeklyAgenda.vue`'s interactive-descendant guard, Board card's interactive drag guard, existing status event forwarding, and existing time/Board geometry.

## Decisions and ADR links

- User request: remove the Agenda status badge and make its title-adjacent status icon open the status menu.
- Plannotator feedback on the first plan draft: apply the same title-adjacent status-icon menu behavior to Ticket Board cards so the two surfaces remain similar. Preserve Board drag-and-drop.
- Existing decision: ADR 0044 keeps one flat fixed-status selector directly available from an Agenda entry control. This plan relocates that control without changing its policy.
- Existing decision: ADR 0013 removes the next-status arrow and otherwise preserves Board drag-and-drop. ADR 0048 supersedes only its prohibition on another direct Board status control; the arrow remains removed and drag-and-drop remains available.
- Accepted ADR 0048 documents the shared icon-menu interaction after human code review. It narrowly supersedes ADR 0013's prohibition on another direct Board status control; no API, data, ownership, archive, or dependency decision was made.
- Plan review: First Plannotator pass requested Ticket Board parity; the revised scope was approved via Plannotator on 2026-10-08.

## Implementation checklist

- [x] Incorporate the Plannotator feedback and obtain human approval of this revised scope before implementation.
- [x] After approval, add the M34 roadmap entry in `PLAN.md` and add/index Proposed ADR 0048.
- [x] Move the Agenda status-menu trigger to the title-adjacent icon and remove the status badge from the Agenda context strip.
- [x] Add the same icon-triggered menu to Ticket Board cards; route selections through existing `moveStatus` and preserve drag-and-drop.
- [x] Keep ticket-title links, all existing menu options, current/busy/archive semantics, and each surface's existing write/error/refresh/retry behavior.
- [x] Add/update browser tests for both surfaces, including direct selection, link separation, badge absence, accessibility, errors, archives, compact layout, and drag/correction regressions.
- [x] Complete non-browser verification (recorded below); focused/full E2E was explicitly deferred by the user's completion declaration and was not run.
- [x] 1280 CSS px visual inspection was explicitly deferred by the user's completion declaration and was not performed.
- [x] Submit the original implementation for human code review; accept ADR 0048 and record the narrow ADR 0013 supersession.
- [x] Submit the status-menu icon refinement for follow-up human code review; no changes were requested.
- [x] Record the user's completion declaration before marking M34 Complete.

## Journal

### 2026-10-08 — Initial planning research

- Fact: the Agenda currently shows the same status as a status-specific icon in the ticket-title link and a labeled status dropdown in the context strip. The title icon currently navigates because it is inside the ticket link.
- Fact: the context dropdown already contains the fixed flat status menu and emits `change-status`; the page already owns the status PATCH, refresh, error, and live-status announcement path.
- Fact: Ticket Board cards have a status-specific icon in the ticket-title link but no direct menu; Board status writes are owned by `moveStatus` and desktop drag-and-drop.
- Decision proposed from the user's request: remove the redundant Agenda context-strip badge and make the title-adjacent status icon a separate menu trigger while retaining the title link.
- Fact: Agenda status-control tests appear in `agenda-status.test.ts`, `agenda-week.test.ts`, and `agenda-drag.test.ts`; Board drag/status coverage is in `ticket-status-moves.test.ts`. Tests and relevant ADRs were inspected; no code or tests were modified.
- Evidence: read the required workflow and roadmap, relevant ADRs/milestones, Nuxt UI skill pointer, and current Agenda/Board components/pages/tests. `git status --short --branch` reported a clean `main` worktree tracking `origin/main` before the initial plan file was created.
- Open question at initial draft: whether the Board should gain the same icon menu. This was answered by the human's Plannotator feedback below.

### 2026-10-08 — Plannotator feedback incorporated

- Human feedback: “use the same behavior for the ticket board, as we want those cards to keep similar behavior as much as possible”.
- Decision incorporated for resubmission: Ticket Board cards will gain the same title-adjacent icon-only status menu; existing Board drag-and-drop remains. Agenda-only status badge removal remains scoped to Agenda, where that badge currently exists.
- Fact: ADR 0013 currently prohibits an additional direct Board status action; ADR 0048 is therefore planned to supersede only that clause. The historical removal of the next-status arrow and retention of drag-and-drop remain intact.
- Evidence: first Plannotator review returned `decision: annotated` with this feedback. The revised plan was then approved via Plannotator on 2026-10-08; implementation had not started.

### 2026-10-08 — Revised plan approval and roadmap entry

- Decision: the human approved the expanded M34 scope covering both Agenda and Ticket Board title-adjacent status-icon menus. The Agenda status badge is removed; Ticket Board drag-and-drop is retained.
- Evidence: `plannotator annotate docs/milestones/m34-agenda-board-status-icon-menus.md --gate --json --require-approval` returned `{"decision":"approved"}`.
- Documentation: added M34 to `PLAN.md` and drafted Proposed ADR 0048, indexed in `docs/decisions/README.md`. ADR 0013 remains Accepted until the post-implementation code review updates its narrow supersession pointer.
- Status: plan approved; application implementation has not started.

### 2026-10-08 — Implementation research

- Fact: `tests/e2e/ticket-context-popovers.test.ts` also asserts that the Agenda status control lives in the hierarchy/context badge group. It must be updated with the other affected Agenda tests.
- Decision: add that test file to the M34 file list. This is test coverage required by the already-approved behavior change; it does not expand product or implementation scope.
- Evidence: `rg -n "Change status from|Entry hierarchy, status" tests/e2e app` identified this additional assertion. No application behavior outside the approved scope was changed.

### 2026-10-08 — Implementation

- Fact: `TicketWorkItem.vue` now exposes an opt-in status-icon action slot for Agenda entry and Ticket Board summary modes. The icon-menu triggers are rendered separately from the ticket-title links; callers without the slot retain the previous icon/link presentation.
- Fact: Agenda entries use the title-adjacent icon as an icon-only menu trigger, and the visible status control was removed from the hierarchy/context strip. Fixed status choices, current checkmark, busy/archive restrictions, status mutation, refresh, and error announcements reuse the existing Agenda flow.
- Fact: Ticket Board cards use the same title-adjacent icon menu. Selections use the existing `moveStatus` path; a successful lane change restores focus to the status trigger. Board drag-and-drop and interactive-control drag protections remain in place.
- Fact: updated Agenda status, Week layout, Agenda drag, context-popover, and Ticket Board status-move E2E assertions. Added coverage for icon-menu opening/selection, title-link separation, removed Agenda badge, keyboard activation, Board menu recovery, archive disabling, and retained drag behavior.
- Deviation: source/test search found `tests/e2e/ticket-context-popovers.test.ts` also asserted the Agenda status badge was inside the context group. Added it to the milestone file list as necessary regression coverage; no product scope changed.
- Verification: Nuxt typecheck, tsgo, oxlint, Vitest, Nuxt build, Oxfmt, workflow-doc checks, and diff whitespace checks passed; details are in the Verification section. Build output included non-fatal Vite/Rolldown plugin-timing warnings.
- E2E/manual limitation: `curl -fsS --max-time 2 http://127.0.0.1:3000/api/health` could not connect. Playwright discovered 42 tests, but no browser tests or 1280 CSS px manual review were run because the development server remains stopped per the user's prior request that they run it themselves. No browser result or visual review is claimed.
- Status: code changes and non-browser verification are complete. Focused/full E2E and supported-width visual inspection remain pending; human code review has been accepted with no requested changes, and ADR 0048 has been accepted with its narrow ADR 0013 supersession recorded. M34 is not complete.

### 2026-10-08 — Human code review and ADR acceptance

- Evidence: `plannotator review --git --diff-type uncommitted --no-git-remote-check --json` returned `{"decision":"approved","message":"# Code Review\n\nCode review completed — no changes requested."}`.
- Decision: accepted ADR 0048 after human code review and updated ADR 0013's supersession pointer only for the prohibition on another direct Board status control. The removed arrow and established drag-and-drop remain in force.
- Status: the original implementation review and decision records were complete. E2E and live visual verification remained open; M34 was not complete.

### 2026-10-08 — Status-menu icon refinement

- Human instruction: “in the status menu, also show the icon to the left of the status name”.
- Decision: use the shared status-specific icon as each menu item's leading icon on Agenda and Board; preserve the current-status checkmark separately at the trailing edge. Keep the existing menu-item semantics, status choices, and mutation paths unchanged.
- Fact: updated both menu item builders and the Agenda/Board browser assertions to cover leading icons, their position before labels, and the trailing current-status checkmark.
- Verification: follow-up non-browser checks passed (Nuxt typecheck, tsgo, oxlint, Vitest, Nuxt build, workflow-docs, formatting, and whitespace checks); see the refinement verification subsection below.
- Status: this refinement is implemented and non-browser checks passed. Follow-up human code review is pending at this point in the journal; E2E and live visual verification remain open. M34 is not complete.

### 2026-10-08 — Follow-up code review

- Evidence: `plannotator review --git --diff-type uncommitted --no-git-remote-check --json` returned `{"decision":"approved","message":"# Code Review\n\nCode review completed — no changes requested."}` for the status-menu icon refinement.
- Status: the complete implementation diff has human code review approval. Browser E2E and live visual verification remained unrun; M34 was not complete at this point.

### 2026-10-08 — Human completion declaration

- Human declaration: “i declare this milestone complete.”
- Decision: mark M34 Complete per the user's declaration. Focused/full Playwright E2E and live 1280 CSS px review were not run; the user accepted their deferral by declaring the milestone complete. They are not claimed as passing.
- Status: M34 Complete. No follow-up is required unless the user later requests the deferred browser or visual checks.

## Verification

Planning checks:

- [x] `node scripts/check-workflow-docs.mjs` — passed on the initial and revised plan drafts and after the roadmap/ADR updates: “Workflow documentation structure looks complete.”
- [x] `./node_modules/.bin/oxfmt --check PLAN.md docs/decisions/README.md docs/decisions/0048-agenda-and-board-status-icon-menus.md docs/milestones/m34-agenda-board-status-icon-menus.md` — passed after the roadmap/ADR updates; the revised plan also passed its focused format check before review.
- [x] `git diff --check` and `git diff --no-index --check /dev/null` on the new ADR and milestone — no whitespace diagnostics; normalized the expected untracked-file diff status.
- [x] First review, `plannotator annotate docs/milestones/m34-agenda-status-icon-menu.md --gate --json --require-approval` — returned `decision: annotated`, requesting the same icon-menu behavior on Ticket Board; feedback was incorporated before resubmission.
- [x] Revised review, `plannotator annotate docs/milestones/m34-agenda-board-status-icon-menus.md --gate --json --require-approval` — returned `{"decision":"approved"}` on 2026-10-08.

Implementation checks (2026-10-08):

- [x] `./node_modules/.bin/nuxt typecheck` — passed.
- [x] `./node_modules/.bin/tsgo --project tsconfig.tsgo.json --noEmit` — passed.
- [x] `./node_modules/.bin/oxlint .` — passed.
- [x] `./node_modules/.bin/vitest run` — 14 test files, 75 tests passed.
- [x] `./node_modules/.bin/nuxt build` — completed. Vite/Rolldown reported non-fatal plugin-timing warnings.
- [x] `node scripts/check-workflow-docs.mjs && ./node_modules/.bin/oxfmt --check` — workflow documentation check passed; all 300 matched files were formatted.
- [x] `git diff --check` and the no-index whitespace check for new ADR/milestone files — passed.
- [x] `./node_modules/.bin/playwright test --list` — discovered 42 tests in 23 files; listing is not browser execution.
- [x] Focused/full Playwright browser tests — explicitly deferred by the user's 2026-10-08 completion declaration; not run. `curl -fsS --max-time 2 http://127.0.0.1:3000/api/health` failed with connection refused. No E2E pass is claimed.
- [x] Live inspection at 1280 CSS px — explicitly deferred by the user's 2026-10-08 completion declaration; not performed.

Status-menu icon refinement checks (2026-10-08):

- [x] `./node_modules/.bin/nuxt typecheck` — passed.
- [x] `./node_modules/.bin/tsgo --project tsconfig.tsgo.json --noEmit` — passed.
- [x] `./node_modules/.bin/oxlint .` — passed.
- [x] `./node_modules/.bin/vitest run` — 14 test files, 75 tests passed.
- [x] `./node_modules/.bin/nuxt build` — completed; Vite/Rolldown plugin-timing warnings were non-fatal.
- [x] `node scripts/check-workflow-docs.mjs && ./node_modules/.bin/oxfmt --check` — passed; all 300 matched files formatted.
- [x] `git diff --check` and no-index whitespace checks for new docs — passed.

The full implementation, including the icon refinement, passed non-browser checks and human code review. The user declared M34 complete with Playwright E2E and live visual review explicitly deferred; these checks remain unrun and are not claimed as passing.

## Review status

- Plan review: Approved via Plannotator on 2026-10-08 after incorporating the request to include Ticket Board cards. The approved scope includes Agenda badge removal and icon-triggered menus on Agenda and Ticket Board.
- Code review: Original implementation and the status-menu icon refinement approved via Plannotator on 2026-10-08 with no changes requested. Browser verification and visual review were deferred at closeout and are not claimed as passing.
- Milestone completion declaration: Recorded on 2026-10-08 — “i declare this milestone complete.”

## Follow-ups

- None. Focused/full E2E and the 1280 CSS px live review were explicitly deferred at closeout, were not run, and are not claimed as passing.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred.
- [x] Verification evidence recorded, with unrun E2E and visual review explicitly deferred.
- [x] Human code review accepted for the complete implementation, including the follow-up icon refinement.
- [x] Human completion declaration recorded in the journal and review status.
