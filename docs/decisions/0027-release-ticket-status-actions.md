# ADR 0027: Release ticket status badge actions

- Status: Accepted
- Date: 2026-09-28
- Supersedes: None
- Superseded by: None

## Context

Ticket status can already be changed through ticket editing, the Today agenda, and desktop board drag-and-drop. On `/releases/:id`, each ticket's status is shown as a static badge even though this view is a working surface for release tickets. M8's agenda-only status action described the scope at that time; adding release status selection extends the current interaction policy without changing the board policy in ADR 0013.

## Decision

- On active Release detail ticket cards, make the status badge a direct single-select control populated from the fixed shared `ticketStatuses` values. Show the current status as selected. Do not add an action menu, nested `Change` submenu, or status-filter action.
- Persist selection through the existing owner-checked `PATCH /api/tickets/:id` contract. Keep pending, error, and refresh handling page-owned, following ADR 0024.
- Keep the status control out of the ticket board; ADR 0013 remains unchanged.

## Consequences

Users can change ticket status from a release without navigating to the ticket editor or Today. The release page remains responsible for refreshing its ticket data and safely reporting partial success. No API, schema, status-transition, ownership, archive, or dependency change is introduced. The completed M8 record remains historical; its agenda behavior is unchanged.

## Alternatives considered

- Keep the status as a static badge: rejected because the user requested a direct status change from Release detail.
- Add a `Change` action with a nested submenu: rejected by Plannotator plan feedback in favor of a direct status selector.
- Add `Filter by status`: rejected because Release detail has no status filter.
- Add a status action to the board: out of scope and inconsistent with ADR 0013.

## Links

- `docs/milestones/m14-release-ticket-status-actions.md`
- `docs/milestones/m8-polish-and-shared-ticket-work-items.md`
- [ADR 0013 — remove next-status control from ticket board](0013-board-status-control-removal.md)
- [ADR 0024 — Effect-aware client fetch boundary](0024-effect-aware-client-fetch-boundary.md)
