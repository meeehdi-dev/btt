# M42 — Priority control visual refinement

## Status

**Approved via Plannotator session `pn-e73224` on 2026-10-12.** The user requested `minus` for No priority and `chevron-right` for Mid in feedback on session `pn-9f9eeb`; both changes are incorporated. This plan responds to the request to try a different icon family, avoid manual icon alignment, and remove the circular trigger border.

## Context

The current `signal-*` icons have visibly asymmetric glyph bounds, prompting per-state CSS translations and repeated visual correction. The current Board/Agenda trigger also has a circular outline. The user asked to try a completely different icon set and simplify the control.

The installed Lucide collection includes naturally centered paths for `minus`, `chevron-down`, `chevron-right`, and `chevron-up` (`node_modules/.pnpm/@iconify-json+lucide@1.2.140/node_modules/@iconify-json/lucide/icons.json`). Their paths are symmetric around the 24px viewBox center, so they should need no per-state translation.

## Proposed design

Replace only the Board/Agenda priority control visuals:

| State       | Proposed Lucide icon |
| ----------- | -------------------- |
| No priority | `minus`              |
| Low         | `chevron-down`       |
| Mid         | `chevron-right`      |
| High        | `chevron-up`         |

Remove the trigger's circular outline and render a compact, neutral, icon-only ghost control with a subtle hover/active background. Keep the open menu labels/icons, accessible tooltip/label, keyboard interaction, form selectors, priority behavior, and control placement unchanged. Do not apply manual translations or per-priority positioning. There will be no circle in the trigger or any priority state.

## Scope

- Update the shared priority icon mapping used by menus and forms.
- Simplify `TicketPriorityMenu.vue`: remove the state-specific transform and outlined circular trigger styling while preserving its accessible behavior and layout.
- Update unit/E2E assertions to check the new icon mapping, borderless trigger, and absence of per-state transforms; retain behavioral, ordering, placement, and compact-layout coverage.
- Record the visual decision and verification in M42.
- Because ADR 0053 is already Accepted, do not rewrite it to change its meaning. Add a proposed ADR 0054 that supersedes only ADR 0053's icon/trigger presentation choice; accept the new ADR only after human code review.

## Out of scope

- Any data-model, API, priority-ordering, persistence, form, Agenda chronology, or cache-invalidation changes.
- Priority-specific colors, text labels on Board/Agenda, menu behavior changes, status controls, or hierarchy-badge placement changes.
- Any per-icon CSS alignment offsets or viewBox/path modifications.

## Files expected to change

- `shared/ticket-priority.ts`
- `app/components/TicketPriorityMenu.vue`
- `tests/unit/ticket-priority.test.ts`
- `tests/e2e/ticket-priority.test.ts`
- `docs/decisions/README.md`
- `docs/decisions/0054-ticket-priority-icon-presentation.md` (new)
- `docs/milestones/m42-ticket-priorities.md`

## Implementation and review steps

1. After approval, replace the shared icon mapping with the proposed four-icon set.
2. Remove circular trigger border and all manual alignment math, preserving existing button semantics, neutral colors, compact sizes, and hover feedback.
3. Update unit/E2E assertions; inspect Board and Week Agenda screenshots at the supported 1280 CSS px width.
4. Run the approved checks, including the complete Playwright suite against an agent-owned server and isolated database; record results in M42.
5. Submit the final diff for human code review. Keep ADR 0054 Proposed until that review is accepted; leave the milestone incomplete pending the user's manual test and completion declaration.

## Verification

- [ ] Unit and focused priority E2E tests cover all four new icons and confirm no manual transforms or circular outline.
- [ ] Board and Week Agenda screenshots show a simple neutral icon-only control before hierarchy badges.
- [ ] Full local verification suite passes on the final worktree, including full E2E/browser tests.
- [ ] Agent-owned server/database are stopped only after all checks pass; confirm the server port is released and do not stop user-owned processes.

## User feedback incorporated

The user requested `minus` for No priority and `chevron-right` for Mid. The proposed mapping above includes both changes; the outer circular trigger is removed, and no state uses a circle glyph.
