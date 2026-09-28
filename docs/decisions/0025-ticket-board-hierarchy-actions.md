# ADR 0025: Ticket board hierarchy badge actions

- Status: Accepted
- Date: 2026-09-27
- Supersedes: None
- Superseded by: None

## Context

M8 aligned ticket-board cards visually with Today while retaining direct links on board client/project/release badges. Today hierarchy badges already use a shared action popover with filter and open choices. The board has the same hierarchy filters and can reuse that behavior without moving state into card components.

## Decision

- Ticket-board client, project, and release badges open the shared hierarchy action popover, offering `Filter by <item>` and `Open <item>`.
- The filter action uses the Tickets page's existing hierarchy filters, including ancestor selection and dependent-filter resets. The open action navigates to the badge's existing entity-detail route.
- Keep filter state in the Tickets page, badge presentation in `TicketHierarchyBadges`, and board drag/title-navigation behavior in the existing card/page owners.
- This revises only the M8 board direct-link interaction. Today behavior, Release/Project card links, ticket detail breadcrumbs, board status policy, card data, and persistence rules are unchanged.

## Consequences

The first activation of a board hierarchy badge now offers choices rather than navigating immediately. Filtering and navigation are consistent with Today while retaining the existing board filter semantics and card interaction ownership. No API, data, schema, or dependency change is required.

## Alternatives considered

- Keep direct links on the board: rejected because the approved M12 plan requests the same filter/open choice available on Today.
- Duplicate the action popover inside `TicketBoardCard`: rejected because `TicketHierarchyBadges` already owns both link and filter-action modes.
- Move filter state or filtering logic into the card: rejected because the Tickets page already owns the filter state and `applyFilter` behavior.

## Links

- `docs/milestones/m12-ticket-board-hierarchy-actions.md`
- `docs/milestones/m8-polish-and-shared-ticket-work-items.md` (historical M8 interaction)
- [ADR 0013 — board status control removal](0013-board-status-control-removal.md)
- [ADR 0022 — shared entity-card presentation shell](0022-shared-entity-card-presentation.md)
