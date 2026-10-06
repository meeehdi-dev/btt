# Plan — Include relation and link actions in Today agenda context flow

## Context and observed facts

- The previously approved `plans/today-ticket-status-badge-flow.md` moved client/project/release/status badges into one conditional wrap/scroll strip. ADR 0038 records that decision and currently keeps relation/external-link icon controls outside the strip.
- In `app/components/TodayAgendaEntry.vue`, `TicketContextPopovers` is still rendered as a sibling after the strip. In compact fixed-height entries, that leaves relation and external-link triggers at the far right rather than in sequence with the other context controls.
- `TicketContextPopovers.vue` owns the existing related-ticket and safe external-link popovers. The same component is used in other surfaces, whose behavior/layout are out of scope.
- M18's compact policy uses a one-line horizontal scroller below 90 minutes, allows wrapping at or above 90 minutes, and keeps natural-height cards wrapped. Time-block geometry and adjacent entries must remain unchanged.
- The worktree contains the prior approved/reviewed status-flow changes, still uncommitted. This plan covers only the additional relation/external-link placement; it must preserve the prior work.

## Requested outcome and proposed scope

- Put all Today/Week time-entry context controls in one ordered flow: client, project, release, status, related tickets (when present), external links (when present).
- In fixed-height desktop entries under 90 minutes, keep that complete flow on one horizontal scroller. When it overflows, scrolling is confined to the context strip; relation and external-link triggers are not pinned at the right edge outside it.
- Keep the existing wrap behavior at or above 90 minutes and in natural-height cards. Preserve compact control sizing, accessible names, status actions, hierarchy filter/open actions, and relation/external-link popover behavior.
- Preserve page layout, timeline geometry, stored durations, and adjacent-entry positions. Do not change Ticket Board or Release detail presentation.

## Out of scope

- Changing the status menu, hierarchy actions, relation/link destinations, popover content, safe external-link attributes, or data eligibility.
- Changing the 90-minute threshold, time-block geometry, overlap behavior, or archive rules.
- Moving relation/external-link controls into scrollable groups on the Ticket Board, Release detail, or any other surface.
- Schema, server, API, dependency, or domain-rule changes.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `plans/today-ticket-status-badge-flow.md` — approved and reviewed status-flow implementation
- `docs/milestones/m18-agenda-layout-and-weekly-add.md` — fixed-height conditional wrap/scroll policy and geometry constraints
- `docs/decisions/0020-m8-polish-decisions.md` — accessible icon-only relation/external-link triggers
- `docs/decisions/0031-hierarchy-badge-wrapping.md` — agenda wrapping/scrolling behavior
- `docs/decisions/0038-today-agenda-status-badge-flow.md` — accepted hierarchy/status group, currently excluding relation/link controls
- `app/components/TodayAgendaEntry.vue`, `TicketHierarchyBadges.vue`, and `TicketContextPopovers.vue` — agenda context composition and existing popover ownership
- `tests/e2e/agenda.test.ts`, `tests/e2e/agenda-week.test.ts`, and `tests/e2e/ticket-context-popovers.test.ts` — current layout, scroll, focus, and popover coverage

## Approach

1. Move the `TicketContextPopovers` instance into the existing trailing slot of `TicketHierarchyBadges`, after the status selector. Keep `TicketContextPopovers.vue` itself and all non-agenda call sites unchanged.
2. Let the existing conditional strip policy apply to every available context control: under 90 minutes the controls stay in one horizontally scrollable row; at/above 90 minutes and in natural-height cards they wrap. Update the strip's accessible label to describe hierarchy, status, and link actions accurately.
3. Extend E2E coverage to assert order and membership for populated related/external collections, overflow and keyboard access to the icon triggers in a short desktop block, retained popover operation, wrap behavior in a taller block, and unchanged timeline geometry. Verify that icons are not rendered outside the scroller on Today/Week.
4. Preserve the accepted ADR history: draft and index ADR 0039 after plan approval; after code review accepts the decision, mark ADR 0039 Accepted and ADR 0038 Superseded by it. Append this post-closeout refinement to M18 while retaining M18's Complete status.
5. Submit the resulting code diff for human review after verification. The existing uncommitted, previously reviewed changes remain in scope context and must not be reverted.

## Files to modify after approval

- `app/components/TodayAgendaEntry.vue` — render relation/external-link controls inside the existing context strip after status.
- `tests/e2e/agenda.test.ts`, `tests/e2e/agenda-week.test.ts`, `tests/e2e/ticket-context-popovers.test.ts` — update the group label and cover ordered combined controls, short-block scrolling/focus, wrapping, and preserved popovers.
- `docs/decisions/0038-today-agenda-status-badge-flow.md` — mark Superseded by ADR 0039 after code review accepts the replacement decision.
- `docs/decisions/0039-today-agenda-context-control-flow.md` and `docs/decisions/README.md` — document/index the new policy.
- `docs/milestones/m18-agenda-layout-and-weekly-add.md` — append post-closeout implementation and verification evidence; retain Complete status.
- `plans/today-agenda-context-control-flow.md` — record plan approval, implementation, verification, and code review.

`TicketContextPopovers.vue` and `TicketHierarchyBadges.vue` should need no behavior changes; reuse their current components and the existing trailing slot.

## Reuse

- Reuse the existing trailing slot in `TicketHierarchyBadges.vue` and the accepted hierarchy/status ordering from ADR 0038.
- Reuse `TicketContextPopovers.vue` as-is so hover/focus/touch, relation navigation, and safe external anchors remain unchanged.
- Reuse M18's `compactTimeline` flag, 90-minute threshold, compact dimensions, and agenda E2E fixtures.
- Reuse existing tests for popover contents and responsive no-overflow behavior on non-agenda surfaces.

## Decisions and ADR links

- Preserve ADR 0031's conditional wrap-versus-scroll policy and the 90-minute threshold.
- Accepted durable refinement: relation and external-link icon triggers join the hierarchy/status strip in Today/Week entries, after status. ADR 0039 supersedes ADR 0038's narrower decision that kept these controls outside the strip; both ADR statuses were updated after code review approval.
- No stored domain, API, or interaction-policy changes are proposed.

## Implementation checklist

- [x] Human approves this plan via Plannotator before implementation.
- [x] Place relation and external-link triggers after status inside the same conditional wrap/scroll strip.
- [x] Preserve keyboard/focus access and popover actions when the triggers are horizontally scrolled.
- [x] Verify natural/tall cards wrap and short fixed-height cards retain their original duration/adjacent geometry.
- [x] Add/update E2E coverage for order, scroll reachability, wrapping, and popover behavior.
- [x] Record the refinement and verification in M18.
- [x] Run the full static, unit, build, workflow, diff, and 28-test Playwright checks.
- [x] Submit the complete uncommitted diff for human code review; after approval, accept ADR 0039 and supersede ADR 0038.

## Journal

### Plan preparation

- Fact: inspected the accepted ADR 0038, M18 wrap/scroll policy, current Today entry composition, popover component, and related E2E tests. The worktree contains the prior approved status-flow implementation and documentation changes.
- User direction: relation and external-link controls also exhibit the right-edge alignment and should join the same badge/control flow.
- Decision proposed for review: retain the current item order and append relation then external-link triggers to the shared conditional strip; preserve all non-agenda layouts.
- Evidence: `plannotator annotate plans/today-agenda-context-control-flow.md --gate --json --require-approval` returned `{"decision":"approved"}`. The human approved this follow-up plan via Plannotator; implementation is authorized within its scope.

### 2026-10-01 — Implementation, verification, and review

- Fact: Today/Week relation and external-link controls now follow status in the shared conditional wrap/scroll strip. Other surfaces, popover behavior, time geometry, and adjacent-block placement remain unchanged.
- Evidence: the focused agenda/context suite passed 8 tests; the complete isolated-server Playwright suite passed all 28 tests. Screenshots of short and tall entries were inspected.
- Verification: formatting, lint, both typechecks, all 72 unit tests, workflow checks, production build, and `git diff --check` passed. Two earlier full-suite attempts showed intermittent unrelated loading/navigation timeouts; the cause was not established, and final warmed-server runs passed.
- Review evidence: `plannotator review --git --diff-type uncommitted --no-git-remote-check --json` returned `decision: approved` with “Code review completed — no changes requested.” ADR 0039 was accepted and ADR 0038 marked Superseded.

## Verification

After approval:

- Focused Playwright: `pnpm exec playwright test tests/e2e/agenda.test.ts tests/e2e/agenda-week.test.ts tests/e2e/ticket-context-popovers.test.ts --workers=1` — verify all available context controls share the strip, relation/external triggers can be focused/reached in a short block, popovers still work, tall entries wrap, and adjacent time geometry is unchanged.
- Manually inspect short desktop Day/Week cards with both relation and external-link collections, plus a 90-minute/natural-height card. Confirm all context controls flow in order, horizontal scrolling is confined to the strip, and the timeline has no new overlap or page-level overflow.
- Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, the full Playwright suite, `pnpm build`, `pnpm check:workflow`, and `git diff --check`; record actual outcomes.

## Review status

- Plan review: Approved via Plannotator
- Code review: Approved via Plannotator on 2026-10-01 with no changes requested.
- Implementation authorization: Approved via Plannotator plan approval

## Follow-ups

- None identified during plan preparation.
