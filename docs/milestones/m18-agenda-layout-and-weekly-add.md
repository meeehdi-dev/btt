# M18 — Agenda card fit and weekly add-entry date

> **Status:** Complete. Plan approval, implementation authorization, and full uncommitted M16–M18 code-review approval were recorded on 2026-09-29; the human completion declaration was recorded on 2026-09-29.

## Context

The human identified three follow-up issues in the M16/M17 agenda work:

1. The desktop weekly day heading in `app/components/WeeklyAgenda.vue` has `min-h-10` on its `<h2>`, adding a forced minimum height the user wants removed.
2. A 30-minute entry can clip its wrapped hierarchy badges in the time-scaled agenda. `TodayAgendaEntry.vue` fills and clips to its parent block; Day and Week timeline heights are computed from duration (`2.25` and `1.8` CSS pixels per minute respectively). The hierarchy context wraps, so a narrow weekly column can require more vertical space than the 54px block provides. Adjacent entries are allowed, including entries that start exactly when the prior entry ends.
3. The page-level “Add time entry” action calls `beginAdd(day)`, and the modal shows the date as static text. In Week mode this only adds on the anchor date, even though the visible week has seven valid dates. The existing per-day Add and drag-create flows already select a specific date.

At M18 implementation authorization, M16 and M17 code reviews/closeout were still pending. The human's direct “go” instruction on 2026-09-29 overrides the M18 sequencing gate and authorizes implementation before those reviews; it does not declare M16/M17 complete or waive their completion declarations. The full-diff code review has since been approved for M16–M18. This plan is limited to the three requested fixes and must not silently amend their accepted date, ownership, overlap, or view-preference behavior.

### Recommended solution for clipped hierarchy badges

Do **not** give a timed card an independent `min-height` larger than its actual interval. Adjacent non-overlapping entries can be only 30 minutes apart; allowing one card to grow would make cards overlap visually and would desynchronize the card bounds from the timeline/drag geometry.

Instead, preserve the duration-to-height mapping and make hierarchy layout depend on the vertical space available inside the time block. First reduce agenda-card padding and use smaller hierarchy action badges. When the block has room for another badge row, let the hierarchy group wrap. When wrapping would exceed the block's available height (notably a 30-minute Week block), keep the badges on one line and allow horizontal scrolling within the hierarchy group. Keep all hierarchy actions present and operable, with full accessible names and their existing filter/open popovers. Natural-height stacked and before/after-visible-hours cards continue to wrap.

This follows the human's Plannotator feedback: icon-only one-line controls would not fit because the title, ticket-filter action, and duration already occupy the first row. Conditional wrapping/scrolling avoids schedule overlap while keeping the existing time geometry. A uniform increase to pixels-per-minute is an alternative but makes the full timeline taller and may still not fit labels that wrap differently by column/locale. A card-only minimum height is not recommended.

## Approved scope

**Approved via Plannotator on 2026-09-29.** The human's direct “go” instruction overrides the sequencing gate only for implementation of this plan. M16/M17 reviews were pending at authorization and have since been approved in the full-diff review; their completion declarations were subsequently recorded:

- Remove `min-h-10` from the desktop weekly day-header `<h2>` only. Keep the date/Add row, progress row, and narrow-screen header unchanged.
- Make hierarchy actions fit inside fixed-height desktop Day and Week timeline entries without clipping or overlapping adjacent entries. Reduce card padding and badge size; allow hierarchy wrapping only when the entry has enough vertical room, otherwise keep the hierarchy group on one line with horizontal scrolling. Preserve keyboard access, accessible names, filter/open behavior, status actions, relation/link actions, and ticket navigation. Natural-height stacked and out-of-window cards continue to wrap.
- **Human-directed code-review refinement (2026-09-29):** compact the title-adjacent ticket-filter, status, and relation/link triggers alongside hierarchy badges only in fixed-height desktop agenda cards; preserve their actions, accessible names, and default sizing in all other contexts.
- In Week mode, make the page-level “Add time entry” modal's work date selectable among the seven dates in the currently displayed week. Default it to the current anchor date. Use the existing date-picker pattern and prevent selecting dates outside that week. The week follows the configured start-of-week setting (Monday by default); selecting a work date must not navigate the page or persist the selected date.
- Keep Day-mode page-level Add behavior unchanged. Keep per-day Add and drag-create pinned to their selected day/date and time; no change to their current prefill behavior.
- Add focused E2E coverage and update the roadmap/decision documentation after this plan is approved.

## Out of scope

- Changes to stored time-entry duration/date rules, overlap checks, server APIs, schema, ownership, archive behavior, or date-only semantics.
- Changing the 30-minute minimum slot, drag coordinates, configured visible hours, or default/configurable week start.
- Persisting the add-modal date, changing the anchor date when a modal date is selected, or allowing a Week-mode add date outside the currently displayed week.
- Touch dragging, changes to Day-mode Add behavior, or changes to M16/M17 completion/review status.
- Raising the whole agenda's timeline scale or allowing adjacent timed cards to overlap without explicit human approval.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- `docs/milestones/m16-weekly-agenda.md` — approved Week behavior, configured week boundaries, and date-specific Add/drag-create semantics
- `docs/milestones/m17-agenda-ui-refinements.md` — hierarchy wrapping and accepted full-diff review status
- `docs/decisions/0011-manual-time-entry-history-and-slots.md` — 30-minute slots, date-only entries, and overlap prevention
- `docs/decisions/0012-today-agenda-settings-and-history.md` — visible-hours presentation and daily agenda behavior
- `docs/decisions/0014-agenda-drag-interactions.md`, `docs/decisions/0016-agenda-correction-control-and-board-filters.md` — interaction and correction policies
- `docs/decisions/0022-shared-entity-card-presentation.md`, `docs/decisions/0029-weekly-agenda-and-conflict-previews.md`, `docs/decisions/0030-agenda-view-preference.md`, `docs/decisions/0031-hierarchy-badge-wrapping.md`

## Approach

1. Remove the desktop weekly heading's forced minimum height and verify the heading remains aligned with the date-specific Add action and does not push the progress row down unnecessarily.
2. Add a compact presentation mode for agenda entries placed in fixed-height desktop timelines. Reduce card padding and compact hierarchy, title-filter, status, and relation/link triggers while preserving their actions and accessible names. Center icon-only controls in their compact square hit areas. Let hierarchy badges wrap only when their available vertical space can contain the extra row; otherwise use a single horizontally scrollable hierarchy row. Keep natural-height mobile and before/after-hours cards wrapped. Do not change `pixelsPerMinute`, block positioning, hit areas, or stored durations.
3. Add an explicit add source/mode in `app/pages/today.vue` if needed so only the page-level Week Add exposes the week-bounded date picker. Initialize it from the anchor date; use the existing `UPopover`/`UCalendar` date-picker pattern; limit selection to `weekDates`. Per-day Add and drag-create continue to use the target date they already supply. Continue to submit `addDate` through the existing `/api/time-entries` request.
4. Test configured-week boundaries, creation on a different day from the anchor, outside-week prevention, unchanged Day/per-day/drag flows, 30-minute hierarchy visibility, and adjacent-entry geometry.
5. After this plan is approved, add M18 to `PLAN.md`, record the narrowly scoped fixed-height agenda exception in M17's milestone, and update ADR 0031 to document conditional wrapping/horizontal scrolling. The ADR remained Proposed until the separate human code review and is now accepted following approval on 2026-09-29.

## Files to modify

- `PLAN.md` — add M18 to the roadmap after plan approval.
- `app/components/WeeklyAgenda.vue` — remove the desktop heading minimum height; pass a compact-context flag to fixed-height timeline entries if needed.
- `app/components/TodayAgenda.vue` — use compact entry presentation only inside its fixed-height desktop timeline.
- `app/components/TodayAgendaEntry.vue` — support compact hierarchy/context rendering without changing natural-height cards.
- `app/components/TicketHierarchyBadges.vue` — provide smaller hierarchy actions and conditional wrap-versus-scroll behavior, if needed.
- `app/components/TicketContextPopovers.vue` — support compact relation/link triggers only when rendered in fixed-height agenda cards.
- `app/pages/today.vue` — add a Week-only, page-level Add date-selection mode constrained to the displayed week.
- `tests/e2e/agenda-week.test.ts` — weekly header, compact 30-minute entry, and week-bounded Add-modal coverage.
- `tests/e2e/agenda.test.ts` — Day-mode and adjacent-entry geometry regression coverage.
- `tests/e2e/ticket-context-popovers.test.ts` — compact agenda filter/status/relation/link trigger geometry and preserved popover behavior.
- `tests/unit/agenda-week.test.ts` — date-bound helper tests only if new pure logic is extracted.
- `docs/milestones/m17-agenda-ui-refinements.md` — record the narrowly scoped fixed-height agenda exception to M17's general wrapping behavior after approval.
- `docs/milestones/m18-agenda-layout-and-weekly-add.md` — implementation log and evidence.
- `docs/decisions/0031-hierarchy-badge-wrapping.md` — clarify conditional wrapping/horizontal scrolling for fixed-height desktop timeline entries if approved.
- `docs/decisions/README.md` — update only if a new or superseding ADR is approved/created.

No server, schema, migration, API, or dependency changes are planned.

## Reuse

- `WeeklyAgenda.vue` owns the desktop day headings, per-day Add actions, configured date columns, and 1.8px/minute fixed timeline.
- `TodayAgenda.vue` owns the Day timeline and 2.25px/minute fixed timeline; both timeline components reuse `TodayAgendaEntry.vue`.
- `TodayAgendaEntry.vue` owns the entry card and current hierarchy/status/relation/link controls; `TicketHierarchyBadges.vue` owns hierarchy action triggers and their filter/open popovers.
- `app/pages/today.vue` already owns `day`, `weekDates`, `addDate`, the Add modal, and the POST body. `/api/time-entries` already accepts the selected date and enforces existing owner/overlap rules.
- `app/pages/today.vue` correction modal and `app/components/TicketTimeEntries.vue` demonstrate the existing `UPopover`/`UCalendar` date-selection pattern.
- `docs/decisions/0011` and `0014` remain authoritative for temporal geometry and overlap; M17's ADR 0031 was accepted after the full-diff human review on 2026-09-29.

## Decisions and ADR links

- Existing decisions retained: 30-minute minimum entries, no overlaps, date-only storage, configured week boundaries, and no persisted selected date.
- Human decision via Plannotator feedback: reduce agenda-card padding and hierarchy badge size; when there is insufficient height to wrap without clipping, keep hierarchy badges on one line and allow horizontal scrolling. Continue wrapping where there is enough height.
- Decision: preserve fixed time-block geometry and apply the conditional wrap/scroll policy only to fixed-height desktop timeline entries; keep naturally sized stacked and out-of-window cards wrapped.
- Durable documentation: ADR 0031 records this fixed-height policy and was accepted after the Plannotator human code review on 2026-09-29.
- No other ADR is superseded by this proposal.

## Implementation checklist

- [x] Human approves this plan through Plannotator before implementation.
- [x] Remove `min-h-10` from the desktop weekly day-header `<h2>` only.
- [x] Reduce card padding and compact hierarchy/title-filter/status/relation/link actions only in fixed-height desktop agenda entries; wrap hierarchy badges only when the entry has enough vertical room, otherwise use an accessible horizontal scroller. Ensure 30-minute fixed-height desktop Day/Week entries show all hierarchy actions without vertical clipping and preserve adjacent-entry geometry.
- [x] Add a Week-only date selector to the page-level Add modal, defaulted to the anchor date and constrained to the seven dates in the displayed configured week.
- [x] Preserve Day Add, per-day Add, and drag-create date/time behavior; verify add-modal date selection does not change the page anchor or persist.
- [x] Add focused E2E coverage, update `PLAN.md`, and update ADR 0031 after approval.
- [x] Record verification evidence, manual layout checks, deviations, and follow-ups.
- [x] Human code review of the full uncommitted M16–M18 diff was approved via Plannotator on 2026-09-29; M18 remains open until its completion declaration is recorded.

## Journal

### 2026-09-29 — Findings and plan draft

- Fact: the weekly desktop day-heading `<h2>` currently includes `min-h-10`; the narrow-screen `<h2>` does not.
- Fact: the timeline block's height is duration-derived, while `TodayAgendaEntry.vue` clips overflow and the hierarchy action group wraps. Adjacent entries can be contiguous, so an independent card minimum height can cover the next entry.
- Fact: the page-level Add button passes the anchor `day`, and the add modal renders `addDate` as non-interactive text. The add POST already uses `addDate`; per-day Add and drag-create supply their own date.
- Human request: remove the weekly header minimum height, fix 30-minute hierarchy clipping, and make Week-mode page-level Add choose any date in the displayed week.
- Recommendation: preserve the time-grid scale; reduce agenda-card padding and hierarchy badge size; wrap only when the entry's available height can contain the row, otherwise keep badges on one horizontally scrollable line. Do not set a card-only `min-height`.
- Evidence: inspected the relevant M16/M17 plans, ADRs, agenda components, add modal, and E2E tests. No application code or roadmap entry was changed.

### 2026-09-29 — Plannotator feedback and revision

- Fact: the first Plannotator pass returned `decision: annotated`, not approval.
- Human feedback: icon-only controls would not fit because the title, ticket filter action, and duration already occupy the first row. Reduce padding and badge size; use horizontal scrolling instead of wrapping when width is insufficient and the time block cannot afford another row; keep wrapping where there is enough height.
- Decision (proposed): replace the icon-only/no-scroll recommendation with conditional wrapping or horizontal scrolling inside fixed-height desktop timeline entries. Keep time geometry and natural-height mobile/out-of-window wrapping unchanged.
- Evidence: revised M18 plan only; no application code, M16/M17 scope, roadmap, or ADR was changed before approval.

### 2026-09-29 — Revised Plannotator approval

- Decision: the human approved the revised conditional wrap/scroll plan. The fixed-height desktop timeline should reduce card padding and badge size, scroll horizontally when there is insufficient vertical room to wrap, and wrap only when the entry has enough height.
- Evidence: `plannotator annotate docs/milestones/m18-agenda-layout-and-weekly-add.md --gate --json --require-approval` returned `{"decision":"approved"}` on the second pass.
- Status: plan approval is recorded; at this point implementation had not started. M16/M17 review and closeout remained the sequencing gate unless the human explicitly overrode it.

### 2026-09-29 — Implementation authorization

- Fact: M16 and M17 human code reviews and completion declarations remain pending.
- Decision: the human's direct “go” instruction on 2026-09-29 overrides M18's sequencing gate and authorizes implementation now. It does not declare M16/M17 complete or waive their separate review requirements.
- Evidence: implementation began after this explicit instruction; scope remains the Plannotator-approved M18 plan.

### 2026-09-29 — Implementation and verification

- Fact: removed the desktop weekly heading's `min-h-10`; no narrow heading, timeline, or date geometry changed.
- Fact: fixed-height desktop agenda cards use reduced padding and compact hierarchy, title-filter, status, relation, and external-link actions. Below a conservative 90-minute wrap threshold (selected for the narrower 1.8px/minute Week scale), the hierarchy row stays single-line and horizontally scrollable; longer cards wrap. The context row stays unwrapped in compact cards so its actions remain visible. Natural-height mobile/out-of-window cards continue to wrap.
- Human-directed code-review refinement: compact the ticket-title filter, status, and relation/link triggers in fixed-height desktop agenda cards only. An opt-in `TicketContextPopovers` prop keeps other cards and natural-height agenda entries at their existing control sizes.
- Fact: the page-level Week Add modal uses the configured week boundaries and `UCalendar` min/max dates, defaults to the anchor, and validates the selected date before submission. Page-level Day Add, per-day Add, and drag-create retain their existing static/date/time behavior. Selecting a date leaves the page anchor and local storage unchanged.
- Evidence: M18 E2E covers configured Sunday-start dates, 30/60-minute scrolling, 90-minute wrapping, full accessible badge focus/scroll, a visible status action, 54px Week blocks, adjacent block geometry, Day Add, per-day Week Add, drag-create, date bounds, and unchanged anchor URL. Focused agenda tests passed; the full Chromium suite passed all 27 tests.
- Evidence: `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm lint`, `pnpm format:check`, `pnpm test` (13 files, 72 tests), `pnpm build`, `pnpm check:workflow`, and `git diff --check` passed.
- Manual check: screenshots of adjacent Day entries, the desktop Week layout, narrow stacked Week layout, and the Week Add calendar were visually inspected. Cards remain aligned with their fixed time intervals; no card overlap or page-level horizontal overflow was observed. Temporary screenshots are not tracked.
- Deviation: none from approved M18 scope. No server/API/schema/dependency changes or new unit-test helper were needed.
- Review status at implementation closeout: M18 awaited human code review and completion declaration. The subsequent full-diff Plannotator review accepted M16–M18 code; the human later declared all three milestones complete.
- Open follow-up: the human said mobile does not need Week view because it cannot fit. M16's approved scope currently provides a stacked narrow-screen Week view; M18 does not change that behavior pending a separate scope decision.

### 2026-09-29 — Plannotator code-review annotation

- Evidence: `plannotator review --git --diff-type uncommitted --no-git-remote-check --json` returned `decision: annotated` for the current uncommitted diff.
- Finding: fixed-height agenda entries compact hierarchy badges, but leave status and relation/link triggers at their existing sizing.
- Verdict: Confirmed. `TicketHierarchyBadges.vue` applies the compact height/padding/text classes; the status trigger in `TodayAgendaEntry.vue` and relation/external-link triggers in `TicketContextPopovers.vue` remain `size="xs"` without compact dimensions. Their prior sizing predates M18; M18's badge-only compact treatment introduces the inconsistency.
- Human direction: apply compact sizing to status and relation/link triggers as well, while preserving their behavior.
- Implementation: added compact dimensions and centered icons for status, title-filter, relation, and external-link triggers behind the fixed-timeline flag. E2E checks confirm 20px triggers and icon centers within 1px; existing popover behavior and non-agenda contexts remain unchanged.
- Evidence: the focused `ticket-context-popovers.test.ts` passed. The final desktop screenshot `/tmp/m18-compact-actions-final.png` was visually inspected.
- Status: the annotated M18 diff will be resubmitted for Plannotator code review; no review approval or milestone completion declaration has been received.

### 2026-09-29 — Plannotator follow-up annotation

- Evidence: the second `plannotator review --git --diff-type uncommitted --no-git-remote-check --json` returned `decision: annotated`.
- Findings: relation/external icon glyphs were not centered after compacting their square triggers; the title-adjacent ticket-filter trigger was also not compact.
- Verdict: Confirmed. Nuxt UI's generated button theme uses `inline-flex items-center`, and its `square` variant adds no `justify-center`; compact trigger classes set zero padding without overriding that alignment. The ticket-filter `UButton` in `TodayAgendaEntry.vue` lacked compact dimensions/icon sizing. The default sizing predated M18; the mismatch was introduced by applying compact sizing only to some controls.
- Resolution: compact and center title-filter, relation, and external-link triggers only in fixed-height desktop agenda cards. E2E now verifies these triggers are no more than 20px high and their icons are centered within 1px, without changing other card contexts.
- Status: focused E2E passed; full verification and Plannotator re-review were pending at this point.

### 2026-09-29 — Plannotator code-review approval

- Evidence: `plannotator review --git --diff-type uncommitted --no-git-remote-check --json` returned `decision: approved` with “Code review completed — no changes requested.”
- Scope: the reviewed uncommitted diff included M16, M17, and M18. This approval satisfies the code-review gate for all three milestones and accepts ADRs 0029–0031.
- Verification after the final UI refinements: all 27 Playwright E2E tests passed; `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm lint`, `pnpm format:check`, `pnpm test` (13 files / 72 tests), `pnpm check:workflow`, `git diff --check`, and `pnpm build` passed.
- Status: M18 code review accepted. At this point, the human completion declaration had not yet been recorded.

### 2026-09-29 — Human completion declaration

- Decision: the human declared M16, M17, and M18 complete: “i declare those milestones complete.”
- Status: M18 is complete; its plan, implementation, verification, full-diff human code review, and human completion declaration are recorded.

### 2026-10-01 — Post-closeout status badge flow refinement

- Fact: in short fixed-height Today/Week desktop entries, the hierarchy badge scroller filled the row while the status selector sat outside it, visually separating status from the hierarchy.
- Decision: the human approved `plans/today-ticket-status-badge-flow.md` via Plannotator. The hierarchy and status badges now share one ordered wrap/scroll strip; relation/external-link actions remain outside it. The existing 90-minute threshold and time geometry are unchanged.
- Fact: `TicketHierarchyBadges.vue` now provides an optional trailing slot, used by Today entries for the status selector. E2E assertions cover the client/project/release/status order, short-block scrolling and status focus, tall-block wrapping, and separate visible relation/link actions.
- Evidence: `pnpm exec playwright test tests/e2e/agenda-week.test.ts --grep "weekly agenda reads" --workers=1 --timeout=60000` passed (1 test). The final isolated-server full Playwright run passed all 28 tests. `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (13 files / 72 tests), `pnpm build`, `pnpm check:workflow`, and `git diff --check` passed. Manual screenshots `/tmp/nxmr-today-badge-flow-short.png` and `/tmp/nxmr-today-badge-flow-tall.png` were inspected.
- Transient test notes: earlier focused/full runs had intermittent Release button and Week gesture/preview failures; the gesture rerun and later full suite passed. The final full suite had no failures. The build emitted its nonfatal Rolldown plugin-timings warning.
- Decision record: ADR 0038 documents the new ordered strip and was accepted after Plannotator code review on 2026-10-01.
- Review evidence: `plannotator review --git --diff-type uncommitted --no-git-remote-check --json` returned `decision: approved` with “Code review completed — no changes requested.”

### 2026-10-01 — Relation and external-link controls join the strip

- Fact: after the prior status-badge refinement, Today/Week entries still rendered relation/external-link triggers outside the hierarchy/status scroller, leaving those icons separated at the right edge.
- Decision: the human approved `plans/today-agenda-context-control-flow.md` via Plannotator. Append related-ticket and external-link triggers after status in the same conditional wrap/scroll strip; keep other surfaces and interactions unchanged.
- Fact: `TodayAgendaEntry.vue` now provides the status selector and `TicketContextPopovers` through the existing trailing slot. The strip label includes hierarchy, status, and ticket links; `TicketContextPopovers.vue` and non-agenda call sites are unchanged.
- Evidence: screenshots `/tmp/nxmr-agenda-context-controls-short.png` and `/tmp/nxmr-agenda-context-controls-tall.png` were visually inspected. The focused agenda/context suite passed all 8 tests; the final complete Playwright suite passed all 28 tests. Two earlier full-suite attempts had intermittent unrelated `Loading agenda…`/navigation timeouts; the cause was not established, and later warmed-server runs passed.
- Verification: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (72 tests), `pnpm check:workflow`, `pnpm build`, and `git diff --check` passed. Full Playwright command: `PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3101 pnpm exec playwright test --workers=1 --timeout=30000` (28 passed in 2.5 minutes).
- Review evidence: `plannotator review --git --diff-type uncommitted --no-git-remote-check --json` returned `decision: approved` with “Code review completed — no changes requested.” ADR 0039 is Accepted and ADR 0038 is Superseded by it.

### Badge visual consistency follow-up

- Fact: in compact Today/Week entries, the shared strip uses `gap-1` (4px) between its top-level controls, but `TicketContextPopovers.vue` used a tighter `gap-0.5` (2px) between related-ticket and external-link buttons.
- Decision: the human approved `plans/today-agenda-badge-visual-consistency.md` via Plannotator. Use a consistent 4px gap across the full control sequence and distinguish hierarchy badges only with a subtle primary-tinted background in compact Today/Week cards. Preserve button sizes, neutral styling for status/relation/link controls, and all other surfaces.
- Fact: compact relation/external buttons now use the same 4px gap as the surrounding badges. Compact hierarchy badges receive `bg-primary/5`; their readable text color, 20px dimensions, 10px labels, 12px icons, and shared rounded button treatment remain consistent. Non-agenda hierarchy buttons retain their prior appearance.
- E2E evidence: `ticket-context-popovers.test.ts` measures all six control heights at 20px, each adjacent gap at 4px, matching border radius, 10px text for hierarchy/status labels, and a hierarchy-only background tint. It also continues to cover scrolled focus/popover behavior and tall-entry wrapping.
- Manual check: `/tmp/nxmr-agenda-badge-visual-short.png` and `/tmp/nxmr-agenda-badge-visual-tall.png` were inspected. Short and tall cards show even spacing; hierarchy labels have a subtle tint, while the status and icon-only actions keep the neutral surface.
- Verification: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (72 tests), `pnpm build`, `pnpm check:workflow`, and `git diff --check` passed. The final isolated-server command `PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3101 pnpm exec playwright test --workers=1 --timeout=90000` passed all 28 tests in 2.5 minutes; focused ticket-context and weekly-agenda tests also passed after the final compact-icon sizing change.
- Transient E2E evidence: earlier full runs passed 20/28 with a 30-second timeout and 27/28 with a 90-second timeout; the latter had only an agenda-drag timing mismatch (expected 660, received 720), and the isolated drag rerun passed. The cause of these earlier failures was not established; no time-geometry change was made. The later full suite passed with no failures.
- Review evidence: `plannotator review --git --diff-type uncommitted --no-git-remote-check --json` returned `decision: approved` with “Code review completed — no changes requested.” M18 remains Complete.

### 2026-10-01 — Compact hierarchy contrast refinement

- Human feedback: hierarchy badges had poor contrast; request was to find a different color that fits the theme.
- Plan approval: `plans/today-agenda-badge-visual-consistency.md` was revised with a compact-only secondary-blue treatment and approved by `plannotator annotate plans/today-agenda-badge-visual-consistency.md --gate --json --require-approval` (`{"decision":"approved"}`) before code changes.
- Fact: the resolved Nuxt UI palette uses green `primary` and blue `secondary`. Compact hierarchy buttons now use the semantic secondary soft surface (`secondary/10`), with `secondary-700` label/icon foreground in light mode and `secondary-300` in dark mode. Other compact controls and all non-agenda hierarchy buttons remain neutral.
- E2E evidence: `ticket-context-popovers.test.ts` checks the secondary surface, neutral status/relation/link controls, and at least 4.5:1 contrast against the composited agenda-card surface in both color schemes. Existing 20px dimensions, 4px gaps, ordering, scrolling, wrapping, popover, keyboard, and adjacent geometry coverage remain passing.
- Manual check: `/tmp/nxmr-agenda-secondary-short.png` and `/tmp/nxmr-agenda-secondary-tall.png` were inspected. The blue hierarchy labels are more distinct from neutral controls and remain legible; geometry is unchanged.
- Verification: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (13 files / 72 tests), `pnpm build`, `pnpm check:workflow`, and `git diff --check` passed. The full `pnpm exec playwright test --workers=1 --timeout=90000` run passed all 28 tests; the focused agenda-week/context suite passed all 4 selected tests. Build output contained a nonfatal plugin-timings warning.
- Observation: the Playwright web server logged a non-failing Vue hydration-mismatch message during the full run; it was not investigated because this follow-up changes only compact badge presentation.
- Review evidence: `plannotator review --git --diff-type uncommitted --no-git-remote-check --json` returned `decision: approved` with “Code review completed — no changes requested.” M18 remains Complete.

## Verification

Plan review:

- [x] `pnpm check:workflow` — passed; required milestone structure is complete.
- [x] `git diff --check` — passed.
- [x] `plannotator annotate docs/milestones/m18-agenda-layout-and-weekly-add.md --gate --json --require-approval` — approved on 2026-09-29 after one annotated revision.

Implementation (only after plan approval):

- [x] `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm lint`, `pnpm format:check`, `pnpm test` (13 files, 72 tests), `pnpm build`, `pnpm check:workflow`, and `git diff --check` passed.
- [x] Final full E2E after the Plannotator follow-up fixes: `PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3101 pnpm exec playwright test --workers=1 --timeout=60000` — all 27 tests passed on an isolated NXMR server. The Week test covers 30-minute and 60-minute scroll behavior, 90-minute wrapping, badge keyboard scrolling, compact visible status controls, and adjacent 30-minute blocks with unchanged 54px geometry. Day coverage checks 30-minute controls and adjacent entries. `ticket-context-popovers.test.ts` verifies all four compact agenda triggers are no more than 20px high, the status label is 10px, and the filter/relation/external icons are centered within 1px; existing popover behavior remains intact.
- [x] E2E: mobile stacked Day/Week cards retain wrapping and no page-level horizontal overflow. Existing Day, Week, per-day Add, and drag-create tests passed.
- [x] E2E: Week page-level Add defaults to anchor `2024-09-18`, permits another date in the configured Sunday-start week, disables dates outside that week, saves the entry on the chosen date, and leaves the anchor URL unchanged. Day Add still shows its work date as static text.
- [x] Manual screenshot walkthrough: reviewed `/tmp/m18-day-adjacent.png`, `/tmp/m18-week-mobile.png`, `/tmp/m18-week-add-calendar.png`, `/tmp/m18-week-final.png`, and `/tmp/m18-compact-actions-final.png`. At desktop Day/Week widths, 30-minute cards remain within their duration-derived blocks, adjacent entries stay distinct, hierarchy badges scroll horizontally in short blocks and wrap in 90-minute blocks, and compact title-filter/status/relation/link controls remain visible. The narrow stacked Week view wraps without page-level horizontal overflow; the Week Add calendar shows the configured seven-day bounds. Screenshots were temporary and were not added to the repository.
- [x] No API, schema, migration, dependency, or time-geometry changes were made. No new pure helper was extracted, so no unit-test changes were needed.

## Review status

- Current post-closeout context-control refinement: code review accepted via Plannotator on 2026-10-01; ADR 0039 is Accepted and ADR 0038 is Superseded.
- Compact hierarchy contrast refinement: code review accepted via Plannotator on 2026-10-01; M18 remains Complete.
- Plan review: Approved via Plannotator on 2026-09-29 (revised after annotated feedback)
- Code review: Accepted via Plannotator on 2026-09-29 (full uncommitted M16–M18 diff; no changes requested)
- Milestone completion declaration: Received from the human on 2026-09-29 — Complete

## Follow-ups

- M18 remains Complete as declared on 2026-09-29. Post-closeout refinements are tracked in `plans/today-ticket-status-badge-flow.md`, `plans/today-agenda-context-control-flow.md`, and `plans/today-agenda-badge-visual-consistency.md`; the ordered-control and contrast follow-ups are verified and their human code reviews are accepted.
- Mobile clarification (2026-09-29): the human was only asking whether mobile view had delayed the work, not requesting a mobile Week behavior change. Keep M16's approved stacked narrow-screen Week view; no separate scope-change plan is requested.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred.
- [x] Verification evidence recorded.
- [x] Human code review accepted via Plannotator on 2026-09-29.
- [x] Human completion declaration recorded in the journal and review status.
