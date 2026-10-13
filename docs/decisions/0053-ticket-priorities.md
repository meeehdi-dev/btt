# ADR 0053: Ticket priorities and Board ordering

- Status: Superseded
- Date: 2026-10-12
- Supersedes: None
- Superseded by: [ADR 0054](0054-ticket-priority-icon-presentation.md)

## Context

Tickets currently have fixed status but no priority. The user requests optional Low, Mid, and High priority, selectable from ticket creation and detail, Ticket Board cards, and Agenda entries. Board ordering should prioritize higher-priority tickets without changing the established ordering used by other ticket lists.

## Decision

- Add a nullable `ticket_priority` enum with `low`, `mid`, and `high`; SQL `NULL` represents no priority. Existing and newly created tickets default to `NULL`; API PATCH accepts explicit `null` to clear priority. Do not add “On hold” or other values.
- Allow priority changes from the ticket creation form, the ticket detail page's inline fields, Ticket Board cards, and Agenda entries. The Agenda priority action appears in the bottom context row immediately before hierarchy badges.
- Use Lucide icons `signal-zero`, `signal-low`, `signal-medium`, and `signal-high` for None, Low, Mid, and High. Defer priority-specific colors; use a neutral icon treatment for every value.
- On Ticket Board cards and Agenda entries, display only the current priority icon. Opening the priority menu shows the option label and matching icon, consistent with the status menu. Create/detail form selectors show labels and icons.
- Within each existing Ticket Board status lane, order by High, Mid, Low, then None. For equal priorities, preserve the current ticket order: estimated tickets first, then `createdAt DESC`, then `id DESC`. Keep the shared ticket collection ordering and Agenda's chronological ordering unchanged.

## Consequences

- Existing ticket data receives no backfill or status mutation; the nullable column makes existing rows unprioritized.
- Users can set or clear priorities from the approved surfaces. The priority field is a current ticket property, not a time-entry snapshot.
- Ticket Board lanes surface higher-priority work first while non-board ticket lists retain the existing ordering contract in ADR 0028.
- Priority icons remain neutral in this milestone. Any future priority-specific color mapping requires separate design/review.
- The database requires an additive migration; create/update request validation and ticket responses include priority.

## Alternatives considered

- Add a fourth “On hold” level: rejected by the user's clarification.
- Store “none” as a priority enum value: rejected; SQL `NULL` represents the optional/unset state.
- Reorder all ticket collections: rejected to preserve the established ADR 0028 ordering outside the Board.
- Use colored priority icons: deferred by the user; this decision does not assign priority colors.
- Show priority labels on Board/Agenda cards: rejected in favor of compact icon-only display; labels remain in menus and forms.

## Links

- Approved plan and implementation evidence: [M42 — Ticket priorities on Board, Agenda, and ticket forms](../milestones/m42-ticket-priorities.md)
- [ADR 0028 — Stable API item ordering](0028-api-item-ordering.md)
- [ADR 0048 — Agenda and Ticket Board status icon menus](0048-agenda-and-board-status-icon-menus.md)
- [ADR 0051 — Same-tab API data invalidation](0051-same-tab-api-data-invalidation.md)
