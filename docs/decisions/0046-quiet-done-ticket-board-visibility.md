# ADR 0046: Hide quiet Done tickets from the active Ticket Board

- Status: Accepted
- Date: 2026-10-08
- Supersedes: None
- Superseded by: None

## Context

Completed tickets accumulate on the Ticket Board after their work has ended. Archiving or deleting them automatically would change user data and make visibility depend on a side effect. Other views (Agenda, Release detail, ticket detail, search) need historical tickets.

## Goal

Keep the active Board focused on current work by hiding long-quiet Done tickets, as a view filter only, never by changing data.

## Decision

On the active Ticket Board only, hide an unarchived ticket when all of these hold:

- Its status is Done.
- Its release has no target date.
- The later of the ticket's last update and its latest linked time entry's last update is at least seven elapsed days before server time.

The seven-day threshold is fixed for every user. Hiding never archives, deletes, or alters status or timestamps. Explicitly archived tickets stay in the Board's archived view. All non-Board consumers, including the default ticket list, keep their existing visibility.

## Consequences

- Quiet Done tickets stop occupying Board lanes.
- A later ticket edit or time-entry update makes the ticket visible again until it is quiet for another week; a non-Done status or any release target date also keeps it visible.
- Release detail, search, direct ticket detail, and Agenda history still show these tickets.
- No setting, schema change, or migration. The Board request path must stay distinct from the default ticket list.

## Implementation notes (non-binding)

- Board filtering: `server/api/tickets/index.get.ts`; eligibility rule: `server/domain/ticket-visibility.ts`.

## Alternatives considered

- Archive or delete after inactivity: rejected; visibility must not mutate user data.
- Apply the rule to every ticket list: rejected; history views must stay complete.
- Per-user threshold setting: rejected; fixed policy, no settings or schema.
- Measure only ticket updates or only time-entry updates: rejected; both are activity.

## Revisions

- 2026-11-21: Rewritten to goal-level form; file paths moved to implementation notes.
