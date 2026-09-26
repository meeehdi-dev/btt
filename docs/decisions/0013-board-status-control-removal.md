# ADR 0013: Remove next-status control from ticket board

- Status: Accepted
- Date: 2026-09-26
- Supersedes: 0010 (only its next-status-arrow requirement; other board drag and metadata decisions remain)
- Superseded by: None

## Context

During M5 code review, the human requested removing the per-card next-status arrow after the board layout revision. The human clarified that the ticket edit form must remain unchanged and that the removal is limited to that board button and dedicated code. ADR 0010 previously retained this arrow as the board's only direct mobile/keyboard status control.

## Decision

- Remove the next-status arrow and its dedicated handlers/focus code from desktop and mobile ticket board cards. Preserve desktop drag-and-drop for status moves, including the existing save/retry behavior.
- Keep the ticket edit form's status selector as-is for mobile and keyboard users. Do not add touch drag or another board status control in this cleanup.

## Consequences

The board itself no longer has a non-drag status action. Mobile/keyboard users can change status through ticket detail → edit, but that is not equivalent to a board action. Designing a direct accessible board control remains an explicit follow-up. No API, enum or persistence rule changes.

## Alternatives considered

- Keep the next-status arrow: rejected by human review direction.
- Remove the edit form's status selector or add mobile touch drag: rejected by human clarification and existing desktop-only drag policy.

## Links

- `docs/milestones/m5-today-agenda.md`
- `docs/decisions/0010-board-drag-and-compact-ticket-metadata.md`
