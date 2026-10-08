# ADR 0046: Hide quiet Done tickets from the active Ticket Board

- Status: Accepted
- Date: 2026-10-08
- Supersedes: None
- Superseded by: None

## Context

Completed tickets can accumulate in the Ticket Board even after work on their release has ended. Automatically archiving or deleting them would change user data and make ticket visibility depend on a side effect. The default ticket-list API also serves Agenda, Release detail, ticket detail, and other workflows that need historical tickets.

## Decision

On the active Ticket Board only, hide an unarchived ticket when all of these conditions hold:

- Its status is `Done`.
- Its release has no target date.
- The later of `ticket.updatedAt` and the latest linked `time_entry.updatedAt` is at least seven elapsed days before server time.

Use a fixed seven-day threshold for every user. The Board may request the filtered list explicitly; the default `/api/tickets` response and all non-Board consumers retain their existing visibility. Explicitly archived tickets remain available through the Board's existing archived view. Hiding is presentation-only: do not archive, delete, alter status, or mutate timestamps.

## Consequences

- Qualifying quiet Done tickets no longer occupy lanes on the active Ticket Board.
- A later ticket edit or tracked-time update makes a ticket visible again until it is quiet for another week; a non-Done status or any release target date also keeps it visible.
- Release detail, search, direct ticket detail, and Agenda history continue to expose eligible tickets.
- No user setting, schema change, or migration is needed. The Board-only request path must stay distinct from the default ticket list.

## Alternatives considered

- Archive or delete tickets after inactivity: rejected because visibility must not mutate or remove user data.
- Apply the rule to every ticket-list consumer: rejected because Agenda history, Release detail, search, and direct ticket access must remain unchanged.
- Add a per-user threshold setting: rejected in favor of the approved fixed policy and no settings/schema changes.
- Measure only ticket updates or only tracked-time updates: rejected because both ticket changes and edits to recorded work are activity.

## Links

- Approved plan and implementation evidence: [M32](../milestones/m32-ticket-board-status-icons-cards-and-done-visibility.md)
- Board-only filtering: `server/api/tickets/index.get.ts`
- Eligibility rule: `server/domain/ticket-visibility.ts`
