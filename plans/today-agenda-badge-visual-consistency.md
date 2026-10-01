# Plan — Unify Today agenda badge styling and improve hierarchy contrast

## Context and observed facts

- ADR 0039 and the latest implementation place hierarchy, status, related-ticket, and external-link controls in one Today/Week strip. The strip already uses a 4px (`gap-1`) gap between its direct children.
- `TicketContextPopovers.vue` applies a 2px (`gap-0.5`) gap between related-ticket and external-link triggers in compact entries. That makes the last two controls feel tighter than the hierarchy/status badges despite being in the same flow.
- In compact agenda entries, the controls otherwise share Nuxt UI soft/neutral buttons, 20px compact height, and 12px icons. Hierarchy/status labels use 10px text and 4px horizontal padding; icon-only controls retain square 20px hit areas.
- The human says the whole hierarchy and all context badges should feel like one component with consistent spacing. A subtle hierarchy-only color tint is suggested as the only visual distinction.

## Requested outcome and proposed scope

- Give every adjacent item in the agenda strip the same 4px horizontal spacing, including between related-ticket and external-link triggers.
- Keep a common compact badge treatment: 20px height/hit area, soft rounded neutral controls, 10px label text, 12px icons, and consistent internal icon/text spacing. Preserve square hit areas for icon-only controls; their content remains icon-only.
- Distinguish hierarchy badges only with a subtle primary-tinted background in compact Today/Week entries; preserve readable muted text and keep status/relation/link controls on the neutral surface. Apply the tint only in this agenda context, not on Ticket Board, project, or release cards.
- Preserve the existing order, accessible names, interactions, 90-minute wrap/scroll threshold, and timeline geometry.

## Out of scope

- Changing the wording/order/content of badges, popover contents, or relation/link/status behavior.
- Changing the 90-minute wrapping threshold, overflow behavior, time-block geometry, or adjacent-entry placement.
- Restyling hierarchy badges on non-agenda surfaces.
- Adding dependencies, APIs, schema, or domain behavior.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/m18-agenda-layout-and-weekly-add.md` — accepted compact styling and fixed-block geometry
- `docs/decisions/0039-today-agenda-context-control-flow.md` — accepted control order and shared flow
- `app/components/TicketHierarchyBadges.vue` — hierarchy badge sizing and strip spacing
- `app/components/TicketContextPopovers.vue` — compact related/external trigger spacing and sizing
- `app/components/TodayAgendaEntry.vue` — compact status badge styling and shared strip composition
- `tests/e2e/ticket-context-popovers.test.ts`, `tests/e2e/agenda-week.test.ts` — ordered controls, compact sizing, scrolling, and wrapping coverage

## Approach

1. Align the compact related/external trigger gap with the strip's existing 4px gap; keep the outer control gap and component composition intact.
2. Make compact hierarchy, status, and icon triggers share the same 20px height, rounded soft-button surface, 10px label/12px icon scale, and neutral baseline. Keep the subtle hierarchy-only tint and square geometry for icon-only triggers.
3. Apply a subtle primary background tint only to hierarchy badges in compact Today/Week entries. Preserve readable text contrast and all other surfaces.
4. Extend agenda E2E checks to measure each adjacent trigger gap and compact control height in a populated strip; verify hierarchy tint differs subtly from neutral controls without changing scrolling, wrapping, popovers, or keyboard access.
5. Inspect short Day/Week strips and a wrapping entry visually. Record implementation/verification in M18 without changing its Complete status; no new ADR is proposed for this presentational refinement.

## Files to modify after approval

- `app/components/TicketHierarchyBadges.vue` — apply the compact hierarchy tint while preserving other callers.
- `app/components/TicketContextPopovers.vue` — make compact related/external trigger spacing match the strip.
- `tests/e2e/ticket-context-popovers.test.ts` and, if needed, `tests/e2e/agenda-week.test.ts` — assert uniform spacing and preserve existing behavior.
- `docs/milestones/m18-agenda-layout-and-weekly-add.md` — append plan, implementation, verification, and review evidence; retain Complete status.
- `plans/today-agenda-badge-visual-consistency.md` — record approval, implementation, and verification.

## Reuse

- Reuse the existing `compact` prop and `compactTimeline` context; do not change any non-agenda component call sites.
- Reuse Nuxt UI `UButton` soft/neutral styling and the existing 20px compact hit areas.
- Reuse the shared strip ordering, gap, scroll/wrap policy, fixtures, and Playwright accessibility locators.

## Decisions and ADR links

- Preserve ADR 0039's one-flow ordering and M18's 90-minute wrap/scroll and time-geometry policy.
- Human-approved visual clarification: treat all controls as one consistent badge row, with only a subtle hierarchy tint to distinguish those labels. Plannotator approved this plan before implementation.
- No new durable domain or interaction decision is introduced; record this small styling refinement in M18.

## Implementation checklist

- [x] Human approves this focused plan via Plannotator before implementation.
- [x] Make all adjacent strip gaps consistent at 4px and align compact badge sizing/surfaces.
- [x] Apply a subtle hierarchy-only tint in compact Today/Week cards without reducing text contrast or affecting other surfaces.
- [x] Add/update E2E assertions for consistent spacing, control height, and 12px icons; preserve focus/popover/scroll/wrap behavior.
- [x] Visually inspect short and wrapping agenda entries; confirm no geometry changes.
- [x] Record verification evidence in M18 and run the full relevant checks.
- [x] Submit the diff for human code review.

## Journal

### Plan preparation

- Fact: source classes show a 4px gap in the shared hierarchy strip and a 2px compact gap between relation/external triggers; the compact buttons otherwise use the same soft/neutral treatment and 20px height.
- User direction: make hierarchy/status/relation/link items feel like one consistently spaced badge row; a subtle hierarchy-only color distinction is acceptable.
- Decision: use one 4px gap throughout and a subtle primary background tint only for hierarchy badges in compact agenda cards. Other controls, surfaces, and interactions remain unchanged.
- Approval: `plannotator annotate plans/today-agenda-badge-visual-consistency.md --gate --json --require-approval` returned `{"decision":"approved"}` before implementation.

### Implementation and verification

- Fact: `TicketContextPopovers.vue` now uses the same 4px inter-control gap as the surrounding strip. Compact hierarchy icons are 12px to match status/relation/link icons; all six controls use 20px height, 10px label sizing where labeled, and matching rounded soft-button geometry.
- Fact: compact hierarchy badges use a subtle `primary/5` background tint; status and icon actions retain their neutral surface and readable text. Non-agenda hierarchy styling is unchanged.
- E2E: `ticket-context-popovers.test.ts` measures all six control heights, 12px icon dimensions, matching border radii, exactly 4px adjacent gaps, and the hierarchy-only background difference. It also preserves popover/focus, short-strip scrolling, and tall-card wrapping checks.
- Manual screenshots: inspected `/tmp/nxmr-agenda-badge-visual-short.png` and `/tmp/nxmr-agenda-badge-visual-tall.png`; spacing is even and the hierarchy tint is subtle. No geometry change observed.
- Verification: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (72), `pnpm build`, `pnpm check:workflow`, and `git diff --check` passed. The focused 8-test agenda/context suite passed; after final icon sizing, the focused ticket-context test and weekly agenda layout test passed individually.
- Full Playwright: `PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3101 pnpm exec playwright test --workers=1 --timeout=90000` passed all 28 tests in 2.5 minutes. Earlier full attempts showed intermittent timeouts and one agenda-drag timing mismatch; the cause was not established, and the final run passed.
- Code review: `plannotator review --git --diff-type uncommitted --no-git-remote-check --json` returned `decision: approved` with “Code review completed — no changes requested.”

## Review status

- Plan review: Approved via Plannotator
- Code review: Approved via Plannotator with no changes requested.
- Implementation authorization: Approved via Plannotator plan approval

## Follow-ups

- Initial visual-consistency work had no follow-ups. The contrast refinement below was requested after implementation and review.

## Follow-up plan — Improve compact hierarchy badge contrast (2026-10-01)

### Finding and human direction

- Fact: compact Today/Week hierarchy badges currently use a `primary/5` surface but retain muted foreground text; the human reports poor contrast and requests a different theme-compatible color.
- Fact: the resolved Nuxt UI palette uses green for `primary` and blue for `secondary`. The built-in secondary soft-button variant provides a semantic blue-tinted surface and hover/active states.
- Human direction: find a different color that works with the theme. This follow-up changes only compact agenda hierarchy badges; status, relation, and external-link controls stay neutral.

### Approved change (Plannotator approved 2026-10-01)

- In compact Today/Week hierarchy buttons only, use Nuxt UI's `color="secondary"` / `variant="soft"` treatment for its theme-driven secondary-blue surface and interaction states.
- Give the compact badge label/icon a higher-contrast palette foreground: `secondary-700` in light mode and `secondary-300` in dark mode. Keep the secondary soft surface; do not introduce hard-coded hex colors or alter other control colors.
- Preserve the existing 4px strip gaps, 20px control geometry, 10px label sizing, icon sizing, order, scrolling/wrapping, interactions, and all non-agenda hierarchy styling.
- Extend the compact agenda E2E check to verify at least 4.5:1 foreground-to-composited-surface contrast in light and dark modes, while retaining the assertions that only hierarchy controls have a tinted surface. Visually inspect short and wrapping entries after implementation.

### Scope

- `app/components/TicketHierarchyBadges.vue` — apply the compact-only secondary variant and light/dark foreground classes to both hierarchy-button modes.
- `tests/e2e/ticket-context-popovers.test.ts` — verify the theme color, foreground contrast in light/dark mode, and unchanged neutral action surfaces.
- `docs/milestones/m18-agenda-layout-and-weekly-add.md` — append follow-up implementation and verification evidence without changing M18's Complete status.
- `plans/today-agenda-badge-visual-consistency.md` — record approval and outcome.

No ADR, API, schema, dependency, or non-agenda layout change is proposed.

### Approval and implementation checklist

- [x] Human approves this follow-up via Plannotator before code changes; `plannotator annotate plans/today-agenda-badge-visual-consistency.md --gate --json --require-approval` returned `{"decision":"approved"}`.
- [x] Implement the compact hierarchy-only secondary-blue treatment; preserve all geometry and behavior.
- [x] Verify at least 4.5:1 contrast in both color schemes, run relevant checks, and visually inspect short/wrapping entries.
- [x] Record evidence in M18.
- [x] Submit the resulting diff for human code review; Plannotator returned `decision: approved` with “Code review completed — no changes requested.”

### Implementation and verification evidence

- Fact: compact hierarchy buttons now use Nuxt UI's secondary soft surface (`secondary/10`) and blue `secondary-700` foreground in light mode / `secondary-300` in dark mode. Status, relation, and external-link controls remain neutral; non-agenda hierarchy buttons retain their existing neutral treatment.
- E2E: `ticket-context-popovers.test.ts` verifies the secondary soft surface, unchanged neutral controls, and computed foreground contrast of at least 4.5:1 over the composited agenda-card surface in both light and dark modes. Existing geometry, spacing, order, scrolling, wrapping, keyboard, and popover assertions remain passing.
- Manual screenshots: inspected `/tmp/nxmr-agenda-secondary-short.png` and `/tmp/nxmr-agenda-secondary-tall.png`. The blue hierarchy tint is distinct from the neutral actions, labels remain readable, and the compact row geometry is unchanged.
- Verification: the focused `ticket-context-popovers.test.ts` passed; the full Playwright suite passed all 28 tests. `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (72 tests), `pnpm build`, `pnpm check:workflow`, and `git diff --check` passed. The build reported a nonfatal plugin-timings warning.
- Observation: the Playwright web server logged a non-failing Vue hydration-mismatch console message during the full suite; it was not investigated as it is outside this style-only scope.

Status: implemented, verified, and human code review approved via Plannotator on 2026-10-01.
