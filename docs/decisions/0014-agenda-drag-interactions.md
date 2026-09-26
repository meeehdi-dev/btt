# ADR 0014: Single-day agenda drag interactions

- Status: Accepted
- Date: 2026-09-26
- Supersedes: None
- Superseded by: None

## Context

M6 introduces desktop drag manipulation of completed work on Today's visible timeline. The approved plan and Plannotator revisions clarified the distinction between creating a block (clamp at the first blocker) and moving one (a small imprecision near an occupied edge should not cause a failed drop). `../tt` offers slot-origin UX inspiration, but its auto-shift behavior is too broad for this app's no-overlap rule.

## Decision

- Keep 30-minute aligned, one-day, non-overlapping ticket-linked entries (ADR 0011); the existing owner-scoped server checks remain authoritative. Use desktop mouse gestures only in the configured visible-hour timeline. Leave out-of-window and date corrections to non-drag controls, and cross-day dragging to the future weekly view.
- Create in either direction from a free 30-minute slot. Clamp the preview at the first occupied interval; never jump past it. Require an active ticket in the prefilled add form before persisting.
- Move an existing entry without changing its duration. Permit edge placement within a proposed 12 CSS px of the adjacent valid 30-minute slot if the full entry fits there; never skip a blocker. Reject substantial overlaps with snapback and an accessible alert. Resize from either end with a 30-minute minimum, clamped at neighboring blocks/visible bounds. Conflict or concurrent server rejection retains the original entry and shows an error.
- During a gesture render entries hidden by current filters semitransparently, and include them in collision detection. Ticket/ancestor archival does not archive time entries or prevent correction; creation still requires an active ticket. Keep a keyboard/mobile-accessible same-day edit action, the existing add form, and the ticket-detail editor for out-of-window/date changes and deletion.

## Consequences

Gesture state can remain local to Today, backed by pure interval geometry; no persistence schema, package or API contract changes. A few-pixel adjustment is visible in the preview, while bigger conflicts fail predictably. Historical and filtered-out work cannot be accidentally overwritten. Pointer gestures do not replace accessible controls.

## Alternatives considered

- Auto-shift an occupied drop to whichever side is free, as in `tt`: rejected for significant overlaps because it can unexpectedly move work away from the intended slot.
- Reject every pixel of overlap: rejected in plan review because ordinary pointer imprecision should be tolerated near a boundary.
- Drag to another date now: deferred until a weekly view provides a visible destination.

## Links

- `plans/m6-agenda-drag-blocks.md`
- `docs/milestones/m6-agenda-drag-blocks.md`
- `docs/decisions/0011-manual-time-entry-history-and-slots.md`
- `docs/decisions/0012-today-agenda-settings-and-history.md`
