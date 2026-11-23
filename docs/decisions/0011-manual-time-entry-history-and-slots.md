# ADR 0011: Manual time entry history and slots

- Status: Accepted
- Date: 2026-09-26
- Supersedes: None
- Superseded by: None

## Context

Time entries record actual work, not a scheduled draft, so archiving a ticket must not erase them. The human chose a fixed 30-minute grid and overlap prevention.

## Goal

Logged time is historical truth: it survives archiving, can be corrected, and never overlaps within a user's day.

## Decision

- An entry belongs to a required ticket and stores a local calendar date (not a timestamp) plus whole start and duration minutes.
- Starts are on 30-minute boundaries, durations are multiples of 30 and at least 30, and an entry ends no later than midnight (24:00). Entries never cross dates; adjacent entries are allowed.
- Overlapping half-open intervals are rejected across all of a user's tickets on that date, including archived tickets. Concurrent saves by one user are serialized, with database checks as a backstop.
- Archiving hides tickets from new-work views but keeps their entries and usage. Archived ticket detail stays reachable by explicit link even under an archived parent.
- Owned historical entries may be corrected or deleted. New entries, or reassignment, to an archived ticket or ancestor are disallowed. Permanent ticket deletion is blocked while entries exist.
- Ticket detail always shows the tracked total.

## Consequences

Day interpretation does not depend on server timezone. Conflict checks read all owned historical rows and serialize per user, which is conservative but fine for a solo-user app. Cleanup fixtures and deletion flows must account for the restrictive foreign key.

## Implementation notes (non-binding)

- Serialization locks the owner's user row inside one transaction; restrictive FK from entries to tickets; grid checks also exist as database constraints.

## Alternatives considered

- Permit overlaps until drag/drop existed: rejected.
- Cascade-delete time with archived tickets: rejected; logged time is historical reality.
- Configurable slot size and cross-midnight entries: deferred in favor of the fixed 30-minute rule.

## Revisions

- 2026-11-21: Rewritten to goal-level form; dropped milestone references and dependency/extension chatter; moved locking to notes.
- 2026-11-23: Removed the estimate usage clause; ticket estimates were removed (ADR 0067).
