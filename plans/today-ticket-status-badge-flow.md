# Plan — Keep Today agenda badges in one ordered flow

## Context and observed facts

- `app/components/TodayAgendaEntry.vue` renders the client/project/release hierarchy controls and ticket status control as siblings in the bottom context row.
- In fixed-height desktop Day/Week entries under 90 minutes, the hierarchy component becomes a flex-growing horizontal scroller, while the status control remains outside it. The hierarchy row therefore takes the available space and pushes status toward the right edge.
- At 90 minutes or longer, the hierarchy group wraps. Natural-height mobile and out-of-window cards also wrap. These rules were established by M18 and ADR 0031 to avoid clipping and preserve time-block geometry.
- Today and Week desktop timelines both reuse `TodayAgendaEntry.vue` with `compact-timeline`; hierarchy badges, status actions, and relation/link popovers are all rendered there.
- At plan preparation, the worktree was clean and no source files had yet been changed.

## Requested outcome and proposed scope

- Keep the client, project, release, and status badges together in that order, with the status badge immediately following the hierarchy badges rather than being pinned to the right by the hierarchy scroller.
- In short fixed-height desktop entries, make the combined badge strip one horizontally scrollable row. Content that fits should remain visible without scrolling; overflow should scroll within this strip.
- Where the fixed-height entry has enough vertical room, keep the combined strip wrapping. Preserve M18's existing 90-minute wrap threshold and the existing wrap behavior for natural-height cards.
- Keep relation/external-link icon controls outside the badge strip so they remain visible and operable. Preserve status-menu actions, hierarchy filter/open actions, accessible names, and the existing compact styling.
- Preserve timeline geometry, entry duration, and adjacent-entry layout.

**Interpretation for review:** “all the badges” means the client/project/release badges plus the status badge. Relation and external-link popovers are separate icon actions and remain outside the strip. Please annotate if a different grouping is intended.

## Out of scope

- Changing status values, status persistence, API/domain rules, or status-menu behavior.
- Changing the 90-minute wrapping threshold, time-block geometry, overlap behavior, or adjacent-entry layout.
- Changing hierarchy or status presentation on the Ticket Board, Release detail, or other non-agenda surfaces.
- Changing Today/Week date/filter behavior, mobile interaction policy, or relation/external-link popover behavior.
- Schema, dependency, server, or API changes.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/m17-agenda-ui-refinements.md` — wrap behavior for natural-height cards and M18 follow-up boundary
- `docs/milestones/m18-agenda-layout-and-weekly-add.md` — fixed-height agenda policy, 90-minute threshold, and preserved time geometry
- `docs/decisions/0031-hierarchy-badge-wrapping.md` — current durable wrapping/scrolling policy
- `app/components/TodayAgendaEntry.vue` — context-row order and compact timeline behavior
- `app/components/TicketHierarchyBadges.vue` — hierarchy badge wrapping and overflow container
- `app/components/TodayAgenda.vue`, `app/components/WeeklyAgenda.vue` — fixed-height desktop timeline usage
- `tests/e2e/agenda.test.ts`, `tests/e2e/agenda-week.test.ts`, `tests/e2e/ticket-context-popovers.test.ts` — existing layout, keyboard-scroll, compact-control, and popover coverage

## Approach

1. Compose the status badge into the same ordered wrap/scroll strip as the client, project, and release badges. A focused trailing slot on `TicketHierarchyBadges.vue` or an equivalent entry-local wrapper can achieve this without changing other component call sites.
2. Apply the existing layout policy to the combined strip: short compact desktop blocks use one no-wrap horizontal scroller; blocks at or above the existing threshold and natural-height cards allow wrapping. Do not let a hierarchy-only flex-growing element separate the status badge from the hierarchy sequence.
3. Keep relation and external-link popover controls as visible siblings after the combined strip. Keep all existing compact dimensions, behavior, and status busy/disabled states.
4. Give the combined strip an accurate accessible label and update E2E selectors/assertions. Verify the status control remains reachable by keyboard when it is in the short-block scroller.
5. Add/update focused browser checks for 30/60-minute scrolling, 90-minute wrapping, badge order/status reachability, unchanged adjacent-block geometry, and preserved popover actions. Record this as a post-closeout refinement in M18 without changing its Complete status.
6. Add a concise proposed ADR 0038 clarifying that the Today/Week status badge joins the hierarchy badge strip while preserving ADR 0031's wrap/scroll policy; add it to the decision index. No `PLAN.md` roadmap change is needed.

## Files to modify after approval

- `app/components/TodayAgendaEntry.vue` — place the status control in the shared ordered badge strip.
- `app/components/TicketHierarchyBadges.vue` — provide the minimal composition point for the status badge while preserving existing callers.
- `tests/e2e/agenda.test.ts`, `tests/e2e/agenda-week.test.ts`, `tests/e2e/ticket-context-popovers.test.ts` — update group selectors and add layout/order/focus regressions as appropriate.
- `docs/decisions/0038-today-agenda-status-badge-flow.md` and `docs/decisions/README.md` — document and index the approved durable refinement.
- `docs/milestones/m18-agenda-layout-and-weekly-add.md` — append post-closeout implementation and verification evidence; retain M18's completed status.
- `plans/today-ticket-status-badge-flow.md` — record approval, implementation, and verification status.

## Reuse

- Reuse M18's existing `compactTimeline` flag, 90-minute wrap threshold, compact badge styling, and fixed timeline geometry.
- Reuse `TicketHierarchyBadges.vue` for hierarchy filter/open actions; do not duplicate hierarchy badge markup or alter its other call sites.
- Reuse existing agenda E2E fixtures and assertions for 30-minute/60-minute scroll behavior, 90-minute wrapping, keyboard focus, and adjacent entries.
- Reuse `TicketContextPopovers.vue` unchanged; its icon actions remain outside the combined badge strip.

## Decisions and ADR links

- Preserve ADR 0031's conditional wrap-versus-scroll behavior and M18's existing threshold/geometry.
- Historical durable clarification: the Today/Week status badge joined the hierarchy strip; ADR 0038 was accepted after human code review and later superseded by ADR 0039, which brings relation/external-link actions into that strip.
- No product data, API, or domain decision changes are proposed.

## Implementation checklist

- [x] Human approves this plan via Plannotator before implementation.
- [x] Put client/project/release/status badges in one ordered wrap/scroll strip; remove the status-right-pinning behavior.
- [x] Preserve scroll and keyboard access in short desktop blocks; preserve wrapping where vertical space permits.
- [x] Keep relation/external-link controls visible and retain all status/hierarchy interactions.
- [x] Add/update E2E coverage for badge order, short-block scrolling, tall-block wrapping, adjacent geometry, and existing popover behavior.
- [x] Record the refinement and verification in M18, add/index ADR 0038, accept it after code review, and update this plan.
- [x] Run relevant focused and full checks.
- [x] Submit the code diff for human review; Plannotator approved with no changes requested.

## Journal

### Plan preparation

- Fact: inspected the current Today entry, hierarchy badge, and relation/link components; M17/M18 records; ADR 0031; and existing agenda/card tests. `git status --short` was empty.
- Decision proposed for review: include hierarchy plus status badges in the same ordered scroll/wrap group, while keeping relation/external-link icon controls outside it.
- Evidence: `plannotator annotate plans/today-ticket-status-badge-flow.md --gate --json --require-approval` returned `{"decision":"approved"}`. The human approved the plan; implementation is authorized within its scope.

## Implementation journal

### 2026-10-01 — Implementation and verification

- Fact: `TicketHierarchyBadges.vue` now exposes an optional trailing slot, and Today/Week entry cards render status as the next item in the hierarchy badge strip. The group label now accurately includes hierarchy and status actions.
- Fact: short compact desktop entries retain one-line horizontal scrolling; the status badge is part of that sequence instead of being pushed to the far edge. Entries at or above 90 minutes and natural-height cards retain wrapping. Relation/external-link controls remain visible outside the scroller. Time-block geometry and status behavior are unchanged.
- Evidence: E2E asserts the client/project/release/status order, horizontal overflow and keyboard focus in a 30-minute Week entry, wrapping and status inclusion at 90 minutes, unchanged adjacent 54px blocks, and visible relation/external controls outside the strip.
- Manual visual check: inspected `/tmp/nxmr-today-badge-flow-short.png` and `/tmp/nxmr-today-badge-flow-tall.png`. In the short card, the status follows the release badge within the horizontally scrollable row; in the tall card, hierarchy and status remain left-to-right and wrap without clipping. Existing E2E checks confirmed popover controls remain separate and operable.
- Verification: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (13 files / 72 tests), `pnpm build`, `pnpm check:workflow`, and `git diff --check` passed. The final isolated-server full Playwright run passed all 28 tests.
- Transient test notes: an earlier focused run timed out in an existing Release-detail click, and an earlier full run missed a Week drag preview; the focused gesture rerun and subsequent full 28-test run passed. One full focused run also saw transient Nuxt/ResizeObserver or app-manifest logs. No code change was needed for these transient failures.
- Decision record: ADR 0038 was accepted after Plannotator code review and later superseded by ADR 0039 following approval of the relation/external-link refinement.
- Evidence: `plannotator review --git --diff-type uncommitted --no-git-remote-check --json` returned `decision: approved` with “Code review completed — no changes requested.”
- Deviation: none.

## Verification

- [x] `pnpm exec playwright test tests/e2e/agenda.test.ts tests/e2e/agenda-week.test.ts tests/e2e/ticket-context-popovers.test.ts --workers=1 --timeout=60000` — Day and Week layout/status tests passed; a transient Ticket context popover timeout occurred during this focused run. The isolated full suite below passed that test.
- [x] `PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3101 pnpm exec playwright test --workers=1 --timeout=90000` — all 28 Chromium tests passed on the final run.
- [x] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (13 files / 72 tests), `pnpm build`, `pnpm check:workflow`, and `git diff --check` — passed. Build emitted the nonfatal Rolldown plugin-timings warning.
- [x] `plannotator review --git --diff-type uncommitted --no-git-remote-check --json` — approved with no changes requested.
- [x] Manual screenshots at `/tmp/nxmr-today-badge-flow-short.png` and `/tmp/nxmr-today-badge-flow-tall.png` confirmed the intended sequence and wrapping/scrolling presentation.

## Review status

- Plan review: Approved via Plannotator
- Code review: Accepted via Plannotator on 2026-10-01
- Implementation authorization: Approved via Plannotator plan approval

## Follow-ups

- None. Implementation and verification are complete; human code review was accepted, and ADR 0039 now supersedes ADR 0038.
