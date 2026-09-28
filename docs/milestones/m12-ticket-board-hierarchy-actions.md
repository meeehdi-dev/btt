# M12 — Ticket board hierarchy badge actions

> **Status:** Complete (2026-09-27); approved scope implemented, verification passed, code review accepted, and human completion declared.

## Context

M8 aligned the ticket board cards with Today visually, while intentionally keeping the board's client/project/release hierarchy badges as direct links. Today cards instead use a badge popover with two choices: filter by that hierarchy item or open its detail page. The shared `TicketHierarchyBadges.vue` already implements both modes, and the Tickets page already owns hierarchy filters through `useHierarchyFilters`.

Research facts:

- `app/components/TicketBoardCard.vue` currently renders its client, project, and release badges in `links` mode. Each badge immediately navigates to its detail route.
- `app/components/TicketHierarchyBadges.vue` already implements `filter-actions` mode: an accessible badge trigger opens `Filter by …` and `Open …` actions and emits a typed `filter` event.
- `app/components/TodayAgendaEntry.vue` uses that mode and forwards filter choices to its page owner. `app/pages/tickets/index.vue` already has the corresponding `applyFilter` handler, which selects the item and its ancestors and clears narrower dependent filters.
- `TicketBoardCard.vue` is used in desktop and mobile board layouts. It already treats links and buttons as interactive controls for drag prevention; badge actions must remain nested controls and must not start a drag.
- Ticket detail currently has breadcrumb links, not the filter/open badge popover. The approved interpretation of “same logic as in the inside view” is the existing Today badge behavior, the in-repository implementation matching the requested filter-or-open interaction.
- M8's approved scope and its original `PLAN.md` summary documented direct-link behavior on the board. This milestone makes an intentional, narrow revision of that behavior; it does not alter other M8 decisions.

No application code has been changed for this plan.

## Approved scope

**Approved via Plannotator on 2026-09-27; implementation may proceed within this scope.**

- Change only the ticket board's client/project/release hierarchy badges to use the existing `TicketHierarchyBadges` filter/open action popover, matching the interaction used by Today entries.
- Wire the board badge's filter event to the existing `applyFilter` function in `app/pages/tickets/index.vue` for both desktop and mobile card instances. Keep filter state and hierarchy cascade behavior page-owned.
- Preserve each badge's existing entity-detail route as its `Open …` action. The badge trigger itself opens the choice popover rather than navigating immediately.
- Reuse the current shared badge component and card composition. Do not duplicate the popover markup or move filter state into `TicketBoardCard`.
- Do a bounded composability check of hierarchy-item construction while touching the board and Today surfaces. Extract a tiny shared type/helper only if it removes real duplication without changing their distinct route/archive handling; otherwise keep the existing mappings and record that no further abstraction is warranted.
- Add desktop, mobile/touch, keyboard, and regression coverage for filtering, navigation, and preservation of board interactions.
- Update the current product-plan description and add a concise ADR documenting the revised board badge interaction, without rewriting the completed M8 milestone record.

## Out of scope

- Changing Today badge behavior or the hierarchy badges on Project, Release, or other cards.
- Changing ticket detail breadcrumbs, filter choices, hierarchy-filter cascade rules, archive visibility, board data fetching, URLs, API contracts, or stored data.
- Changing ticket card layout, tracked-time presentation, related-ticket/external-link popovers, board status behavior, drag/drop policy, or lane grouping.
- Broad card/composability refactoring, a new abstraction without demonstrated duplication, dependencies, schema/auth changes, or changes to the Effect boundaries.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- `docs/milestones/m8-polish-and-shared-ticket-work-items.md` — approved direct-link behavior at M8
- `docs/milestones/m9-shared-card-composition.md` — card/component interaction ownership
- ADR 0013 — no board status-change control; remains unchanged
- ADR 0020 — ticket card usage/context presentation; remains unchanged
- ADR 0022 — shared entity-card shell and wrapper interaction ownership
- `app/components/TicketBoardCard.vue`
- `app/components/TicketHierarchyBadges.vue`
- `app/components/TodayAgendaEntry.vue`
- `app/pages/tickets/index.vue`
- `app/composables/useHierarchyFilters.ts`
- `tests/e2e/ticket-context-popovers.test.ts`, `tests/e2e/filter-search.test.ts`, and `tests/e2e/ticket-status-moves.test.ts`

## Approach

1. **Reuse the existing interaction:** render board hierarchy items through `TicketHierarchyBadges` in `filter-actions` mode. Retain the current item names, IDs, icons, route targets, truncation, and context-row placement.
2. **Keep ownership composable:** add a `filter` event to `TicketBoardCard` and forward it from both desktop and mobile instances in `tickets/index.vue` to the existing `applyFilter`. The shared badge component owns the action menu; the page owns filters; the card owns only its presentation and drag behavior.
3. **Preserve interaction semantics:** selecting `Filter by …` applies the board's existing cascading filter behavior without navigating. Selecting `Open …` follows the existing entity route. Keyboard, touch, pointer, and nested-control behavior must remain usable, and badge interactions must not initiate card dragging.
4. **Keep any extra extraction conditional:** compare the hierarchy item construction in Today and the board. Extract only a focused shared helper/type if it reduces genuine duplication and preserves their current route/archive differences; otherwise add no new component or composable.
5. **Record the changed contract:** add ADR 0025 and its index entry; keep it Proposed until code review accepts it. Update `PLAN.md` to show the current board interaction while preserving the historical fact that M8 originally used direct links. Do not edit the completed M8 journal.
6. **Regression and review:** add a focused authenticated Playwright test for filter/open actions across client, project, and release badges, including responsive behavior; run existing drag/status and context-popover regressions. Review desktop/mobile behavior and keyboard operation before handoff.

## Files to modify

- This milestone file.
- `app/components/TicketBoardCard.vue` — use action mode and forward the filter event.
- `app/pages/tickets/index.vue` — connect both desktop and mobile cards to existing `applyFilter`.
- `app/components/TicketHierarchyBadges.vue` — apply its existing truncation/title-hint option to filter-action triggers so the board retains its current compact badges; additionally change its type/helper API only if the bounded extraction is confirmed useful. `TodayAgendaEntry.vue` remains unchanged unless needed for that narrowly scoped helper.
- New `tests/e2e/ticket-board-hierarchy-actions.test.ts` (or extend an existing focused suite if that gives simpler fixture reuse).
- `PLAN.md` — update current board behavior and clarify the historical M8 wording without changing its completion record.
- New `docs/decisions/0025-ticket-board-hierarchy-actions.md` and `docs/decisions/README.md`.

No API, database, schema, dependency, authentication, or server files are in scope.

## Reuse

- `TicketHierarchyBadges.vue` already contains the action popover and filter event; do not reimplement it.
- `TodayAgendaEntry.vue` and `today.vue` show how the shared component forwards filter actions to the state owner.
- `tickets/index.vue` already uses `useHierarchyFilters` and `applyFilter`, including ancestor selection and dependent-filter resets.
- `TicketBoardCard.vue` already guards interactive descendants from drag initiation and emits card-level events to the Tickets page.
- Extend existing Playwright fixture/cleanup patterns from `ticket-context-popovers.test.ts` and `filter-search.test.ts`; run the existing board drag coverage in `ticket-status-moves.test.ts`.

## Decisions and ADR links

- Human direction, approved through the M12 Plannotator plan review, replaces board direct-link badges with the same filter/open action pattern already used by Today.
- The approved plan interprets “inside view” as the Today entry hierarchy badges. Ticket detail has breadcrumb links only.
- ADR 0025 documents the board badge choice behavior and clarifies that only the M8 board-direct-link decision is revised. It was accepted via Plannotator code review. ADR 0013, ADR 0020, and ADR 0022 remain authoritative for their existing status, ticket-card context, and card-composition rules.
- Plan review was approved via Plannotator before implementation. Code review is a separate acceptance gate and has been accepted via Plannotator.

## Implementation checklist

- [x] Human approved this plan via Plannotator before implementation.
- [x] Use the shared filter/open badge behavior in both desktop and mobile ticket-board cards.
- [x] Filtering a client, project, or release badge updates existing board filters correctly; opening each badge's entity action navigates to its existing detail route.
- [x] Keep filter state page-owned and retain drag prevention, card title navigation, board grouping, and other context actions.
- [x] Complete the bounded composability check; no helper was warranted because Today and board route/archive inputs differ, and the shared badge component already composes the behavior.
- [x] Add focused desktop/mobile/keyboard regression coverage and run existing drag/status/context-popover tests.
- [x] Update `PLAN.md`; add and index ADR 0025, accepted through code review.
- [x] Record commands, outcomes, manual checks, deviations, and follow-ups; submit the implementation for human code review.

## Journal

### 2026-09-27 — Planning research

- Fact: board badges currently render `TicketHierarchyBadges` in direct-link mode, while Today uses the existing filter/open mode and forwards filter actions to its page.
- Fact: `tickets/index.vue` already owns shared hierarchy filter state and provides `applyFilter`; `TicketBoardCard.vue` is rendered in both desktop and mobile layouts.
- Fact: ticket-detail hierarchy is represented by direct breadcrumb links, so “inside view” is interpreted as the existing Today badge action pattern pending human confirmation.
- Decision proposed: preserve component ownership by reusing the shared badge mode and routing its filter event to the Tickets page; do not add a second popover implementation or move filter state into the card.
- Evidence: read `app/components/TicketBoardCard.vue`, `TicketHierarchyBadges.vue`, `TodayAgendaEntry.vue`, `app/pages/tickets/index.vue`, `app/composables/useHierarchyFilters.ts`, `tests/e2e/ticket-context-popovers.test.ts`, `tests/e2e/filter-search.test.ts`, ADR 0013/0020/0022, and M8/M9 milestone records. `git status --short` was clean before creating this plan. No application code was changed.

### 2026-09-27 — Plan approved

- Fact: Plannotator returned `{"decision":"approved"}` with no annotations.
- Decision: the M12 plan is approved; any implementation must stay within its approved scope and receive separate human code review.
- Evidence: `plannotator annotate docs/milestones/m12-ticket-board-hierarchy-actions.md --gate --json --require-approval` returned approval.

### 2026-09-27 — Implementation and verification

- Fact: `TicketBoardCard.vue` now uses the shared `filter-actions` mode and forwards its typed hierarchy-filter event. Both desktop and mobile card instances in `tickets/index.vue` forward to the existing `applyFilter`; filter state and cascade logic remain page-owned.
- Fact: `TicketHierarchyBadges.vue` now honors its existing `truncateLabels` option in filter-action mode, retaining compact board badges and the full title hint. No hierarchy-item helper was extracted: Today derives archived-aware routes while board routes are already constrained by its current hierarchy data, so combining the mappings would obscure real differences. The shared badge component and event boundary were sufficient composition.
- Fact: added an authenticated E2E test for filtering by client/project/release, ancestor and descendant filter state, opening each entity route, keyboard activation, mobile touch, and page overflow. Updated board context, navigation, and status-move tests to assert the new choice popover rather than immediate hierarchy-link navigation; release-card links remain unchanged.
- Fact: the first E2E runs exposed stale test assumptions, not implementation failures: a client filter correctly leaves child filters at “All”; board hierarchy controls are now buttons/menus rather than direct links; and the status test's broad `/Move /` selector matched hierarchy labels. Tests now assert the established cascade and distinguish the absent `Move to …` status action. The status test also re-hovers the related-ticket trigger after using hierarchy menus, since pointer movement closes its hover popover.
- Decision: retain the compact board hierarchy truncation while reusing the shared filter/open popover; make no additional abstraction beyond the existing shared component.
- Evidence: focused board hierarchy/context/navigation/status Playwright tests passed (4 tests). Final `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (12 files/67 tests), full `pnpm exec playwright test --workers=1` (21 tests), `pnpm build`, and `pnpm check:workflow` passed. Build produced only the existing non-failing Vite `PLUGIN_TIMINGS` advisory. Captured and inspected temporary desktop/mobile screenshots; screenshot hooks were removed from the test afterward.

### 2026-09-27 — Human code review

- Fact: Plannotator returned `{"decision":"approved","message":"Code review completed — no changes requested."}` for the uncommitted diff.
- Decision: accept the implementation review and ADR 0025. The milestone completion declaration remains pending.
- Evidence: `plannotator review --git --diff-type uncommitted --json` returned approval.

### 2026-09-27 — M12 completion declared

- Fact: the human declared, “i hereby declare this milestone complete.”
- Decision: M12 is complete; the approved scope, verification evidence, and accepted human code review are recorded above.

## Verification

Planning artifact:

- [x] `pnpm exec oxfmt --check docs/milestones/m12-ticket-board-hierarchy-actions.md` — passed.
- [x] `pnpm check:workflow` — passed (`Workflow documentation structure looks complete.`).
- [x] `plannotator annotate docs/milestones/m12-ticket-board-hierarchy-actions.md --gate --json --require-approval` — approved.

Implementation (after plan approval):

- [x] Focused Playwright coverage: badge menus offer filter/open for client, project, and release; filtering applies the right hierarchy values and board result set; opening navigates to the matching detail page; keyboard and touch use the actions without page overflow.
- [x] Existing board drag/status and ticket context-popover tests pass; badge actions do not alter title navigation, relation/link popovers, or board status policy.
- [x] Desktop/mobile visual and keyboard check: inspected `/tmp/nxmr-m12-board-desktop.png` and `/tmp/nxmr-m12-board-mobile.png`; action choices are legible, hierarchy labels truncate, touch/keyboard behavior passes, and the page has no horizontal overflow.
- [x] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (12 files/67 tests), `pnpm exec playwright test --workers=1` (21 tests), `pnpm build`, `pnpm check:workflow`, and `git diff --check` passed. Build emitted the informational Vite `PLUGIN_TIMINGS` advisory.

## Review status

- Plan review: Approved via Plannotator (2026-09-27); no annotations.
- Code review: Accepted via Plannotator (2026-09-27); no changes requested.
- ADR 0025: Accepted via Plannotator code review (2026-09-27).
- Milestone completion declaration: Recorded (2026-09-27); M12 complete.

## Follow-ups

- None known. Any broader hierarchy-badge or card-composition refactor discovered during implementation requires a separate plan unless it fits the approved bounded helper check above.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred with human approval.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in the journal and review status.
