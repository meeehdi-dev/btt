# ADR 0054: Ticket priority icon presentation

- Status: Accepted
- Date: 2026-10-12
- Supersedes: ADR 0053's icon/trigger presentation choice only; all other ADR 0053 decisions are reaffirmed unchanged
- Superseded by: None

## Context

The `signal-*` glyphs appeared visually unbalanced in the compact Board and Agenda control and needed state-specific CSS translations. The user requested a different, simpler icon treatment without manual alignment or the circular trigger outline.

## Decision

- Reaffirm ADR 0053's nullable Low/Mid/High priority model, Board ordering, supported interaction surfaces, and all non-presentation decisions.
- Use the following neutral Lucide icons for the four display states:

  | State       | Icon            |
  | ----------- | --------------- |
  | No priority | `minus`         |
  | Low         | `chevron-down`  |
  | Mid         | `chevron-right` |
  | High        | `chevron-up`    |

- Board and Agenda controls remain icon-only and label their open-menu options. Remove the circular trigger outline and use a compact ghost button with subtle hover/active feedback.
- Do not add per-state icon translations or otherwise adjust individual glyph geometry.
- Keep labels and matching icons in the open menu and ticket create/detail form selectors. Keep priority icons neutral without priority-specific colors.

## Consequences

- The priority glyphs use centered, simple shapes and no longer depend on manual position corrections.
- The Board and Agenda trigger no longer has an outlined circular container.
- The menu, form, persistence, ordering, accessibility, and layout contracts established in ADR 0053 remain unchanged.

## Alternatives considered

- Keep the `signal-*` family and adjust its alignment: rejected after repeated visual iteration.
- Retain the outlined circular trigger: rejected in favor of a simpler ghost control.
- Show labels on Board/Agenda cards: not selected; compact icon-only display remains.

## Links

- [ADR 0053 — Ticket priorities and Board ordering](0053-ticket-priorities.md)
- [M42 — Ticket priorities on Board, Agenda, and ticket forms](../milestones/m42-ticket-priorities.md)
- [Approved visual refinement plan](../../plans/m42-priority-control-visual-refinement.md)
