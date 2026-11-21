# ADR 0025: Ticket board hierarchy badge actions

- Status: Accepted
- Date: 2026-09-27
- Supersedes: None
- Superseded by: None

## Context

Board client/project/release badges were direct links, while agenda hierarchy badges offered a choice of filtering or opening. The board has the same hierarchy filters, so it can offer the same choice.

## Goal

Hierarchy badges behave the same on the Board and the Agenda: one activation offers Filter or Open.

## Decision

- Board client, project, and release badges open a small action popover with `Filter by <item>` and `Open <item>`.
- Filter applies the Tickets page's hierarchy filters, including ancestor selection and resetting dependent filters. Open goes to the entity's detail page.
- Filter state lives in the Tickets page; cards only present badges. Board drag and title navigation are unchanged.

## Consequences

First activation of a board badge no longer navigates immediately. Filtering and navigation are consistent with the Agenda. No API, data, or schema change.

## Implementation notes (non-binding)

`TicketHierarchyBadges` supports both link and filter-action modes; the Tickets page owns `applyFilter`.

## Alternatives considered

- Keep direct links on the board: rejected; Agenda parity was requested.
- Duplicate the popover inside the board card: rejected; the shared badge component already owns it.
- Move filter state into the card: rejected; the page owns it.

## Revisions

- 2026-11-21: Rewritten to goal-level form; component names moved to notes.
