# ADR 0014: Agenda drag interactions

- Status: Accepted
- Date: 2026-09-26
- Supersedes: None
- Superseded by: None

## Context

Completed work is manipulated on the Agenda's visible timeline. Creating a block (clamp at the first blocker) differs from moving one (a small imprecision near an occupied edge should not cause a failed drop). The no-overlap rule rules out broad auto-shifting of work.

## Goal

Let desktop users create, move and resize completed-work blocks by dragging, without ever overlapping or silently displacing other work.

## Decision

- Entries stay on a 30-minute grid, within one calendar day, non-overlapping and ticket-linked (ADR 0011); owner-scoped server checks stay authoritative. Dragging is desktop-mouse only and works inside the configured visible hours. Out-of-window times and date changes use the correction form and the ticket-detail editor. Moving between dates by drag is covered by ADR 0029.
- Create by dragging in either direction from a free slot. The preview clamps at the first occupied interval and never jumps past it. Persisting requires an active ticket in the prefilled add form.
- Move keeps the duration. A small near-edge imprecision (about one hand-width of pixels, currently 12 CSS px) snaps to the adjacent valid slot if the whole entry fits; a blocker is never skipped. Substantial overlaps are invalid: the invalid candidate is shown in conflict state (ADR 0029), nothing persists, and an accessible error is shown.
- Resize from either end with a 30-minute minimum, clamped at neighbors and visible bounds. A conflict or concurrent server rejection keeps the original entry and shows an error.
- Entries hidden by current filters are rendered semitransparent during a gesture and count for collisions. Archiving a ticket or ancestor does not archive its time entries or block correcting them; creating still needs an active ticket.
- Double-clicking an entry opens the correction form (ADR 0016); there is no per-entry Edit button.

## Consequences

Gesture state stays local to the Agenda on top of pure interval geometry; no schema or API change. Small pixel slips are forgiven, larger conflicts fail predictably, and filtered-out or historical work is never overwritten. Pointer gestures are not the only route: correction is available through the form and ticket detail. Direct keyboard/mobile same-day correction on the Agenda is not provided (ADR 0016).

## Implementation notes (non-binding)

- Geometry lives in `app/utils/agenda-drag.ts`; gestures in `WeeklyAgenda.vue`.

## Alternatives considered

- Auto-shift to a nearby free side (as in `tt`): rejected; it can move work away from the intended slot.
- Reject every pixel of overlap: rejected; pointer imprecision near a boundary should be tolerated.

## Revisions

- 2026-11-21: Rewritten to goal-level form; folded in ADR 0016's removal of the direct Edit button, refreshed for the weekly Agenda (ADR 0029, 0044) instead of single-day/Today, and returned to Accepted.
