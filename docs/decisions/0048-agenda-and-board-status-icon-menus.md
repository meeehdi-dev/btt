# ADR 0048: Agenda and Ticket Board status icon menus

- Status: Accepted
- Date: 2026-10-08
- Supersedes: ADR 0013 (only its prohibition on another direct Ticket Board status control; the next-status arrow remains removed and desktop drag-and-drop remains)
- Superseded by: None

## Context

The Agenda currently offers a flat status menu from a labeled status badge in each entry's context strip, while the status-specific icon beside the ticket title is part of the ticket-detail link. The Ticket Board shows the same status-specific icon beside the linked title but offers direct status changes only through drag-and-drop. The human requests removing the redundant Agenda badge and making the title-adjacent icon open the menu, then asks for the same behavior on Ticket Board cards so the two card surfaces remain similar. ADR 0013 previously rejected an additional direct Board status control after removing the next-status arrow.

## Decision

- On Agenda entries, remove the visible status badge from the context strip and use the status-specific icon adjacent to the ticket title as an icon-only menu trigger.
- On Ticket Board cards, use the status-specific icon adjacent to the ticket title as the same icon-only menu trigger.
- Keep each status icon trigger separate from the ticket-title link. The title continues to navigate to ticket detail; activating the icon opens the flat fixed-status menu without navigating.
- Keep the existing fixed status options, current-status indication, archived/busy disabling, and each surface's existing status-write, refresh, error, retry, and accessibility behavior.
- On Ticket Board, direct menu selection supplements desktop drag-and-drop; it does not replace or alter it. Keep the next-status arrow removed.
- Reuse the existing Agenda and Board mutation paths. No API, schema, data, or status-transition changes are introduced.

## Consequences

Agenda entries have one status action near the ticket identity instead of a second context-strip badge. Ticket Board cards gain a direct pointer- and keyboard-accessible status action while retaining drag-and-drop. Title navigation remains independent of status changes. Other ticket identity surfaces retain their current presentation and status behavior.

## Alternatives considered

- Keep the Agenda status badge and make only its icon clickable: rejected because the visible badge is redundant and the requested trigger is the icon beside the title.
- Add the icon menu only to Agenda: rejected by the human's request for similar behavior on Ticket Board cards.
- Replace Ticket Board drag-and-drop with the menu: rejected; the menu supplements the established drag workflow.
- Make the status icon remain inside the ticket link: rejected because the same click cannot reliably navigate and open the menu, and nested interactive elements would be inaccessible.

## Links

- Approved plan and implementation evidence: [M34](../milestones/m34-agenda-board-status-icon-menus.md)
- [ADR 0013 — Remove next-status control from ticket board](0013-board-status-control-removal.md)
- [ADR 0044 — Week-only Agenda route and direct status selector](0044-week-only-agenda-and-status-selector.md)
