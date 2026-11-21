# ADR 0039: Keep Agenda entry context controls in one flow

- Status: Accepted
- Date: 2026-10-01
- Supersedes: ADR 0038
- Superseded by: None

## Context

In short fixed-height Agenda entries, a flex-growing hierarchy group pushed trailing controls (status, related-ticket and external-link icons) to the right edge, visually separating them from the client, project and release badges. ADR 0038 moved the status badge into the strip but left the icon triggers outside it.

## Goal

An Agenda entry's context controls read as one left-to-right group, without changing the fixed time geometry.

## Decision

- In Agenda entries, the available context controls form one ordered strip: client, project, release, related-ticket trigger, external-link trigger. The status control is not in the strip; it is the icon beside the ticket title (ADR 0048).
- In fixed-height entries shorter than 90 minutes, the strip stays on one line and scrolls horizontally on overflow. From 90 minutes up, and in natural-height cards, it wraps.
- Related-ticket and external-link triggers stay icon-only with their existing popovers, accessible names, filter/open actions and safe external anchors.
- This applies to Agenda entries only; other card surfaces keep their layout. Time-block geometry, durations, overlap behavior and adjacent-entry placement are unchanged.

## Consequences

Short entries may need horizontal scrolling to reach trailing icons, so keyboard focus and popover activation must remain usable. No API, schema or domain-rule changes.

## Implementation notes (non-binding)

- Implemented in `TodayAgendaEntry.vue` with `TicketHierarchyBadges.vue`.

## Alternatives considered

- Keep relation/link triggers outside the strip: rejected; they stay separated at the row's right edge.
- Apply the flow to every card surface: rejected; the need is Agenda-specific.
- Increase timeline scale or minimum card height: rejected; it changes time geometry and can overlap neighbors.

## Revisions

- 2026-11-21: Rewritten to goal-level form; folded in ADR 0044's status-menu clause and ADR 0048 (status is now the title icon, not a strip badge); renamed Today to Agenda; ADR 0038 is history.
