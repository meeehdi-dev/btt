# ADR 0011: Manual time entry history and slots

- Status: Accepted
- Date: 2026-09-26
- Supersedes: None
- Superseded by: None

## Context

M4 adds ticket-linked completed-work history before the Today agenda. Time is a record of actual work, not a scheduled draft; archiving must not erase it. The human approved fixed 30-minute slots, overlap prevention and protection against deleting history in chat and the M4 Plannotator plan.

## Decision

- Store date-only local calendar date and whole start/duration minutes on a required ticket, with UUIDv7 IDs and restrictive FK. For M4 require starts on 30-minute boundaries, durations in 30-minute increments and at least 30 minutes, and end ≤ midnight (24:00). Do not cross dates; allow adjacent intervals.
- Reject overlapping half-open intervals across all owned tickets on the date, including archived history. Serialize saves per owner in PostgreSQL by locking the owner user row before checking the date's entries and writing in one transaction; keep database slot checks as backstop. No new PostgreSQL extension or dependency.
- Archive hides tickets from normal new-work views but does not remove their entries or usage. Explicit archived ticket detail stays navigable even if a parent is archived. Allow corrections/deletion of owned historical entries, but disallow new entries or reassignment to an archived ticket/ancestor. Block permanent ticket deletion while entries exist; a restrictive FK protects against an accidental bypass.
- Always show tracked total on ticket detail; show estimate usage only when an estimate exists, with normal <80%, warning ≥80% and red ≥100%. A configurable slot increment, day agenda and drag/drop remain future milestones.

## Consequences

Day/time interpretation does not depend on server timezone. Cross-ticket conflict checks include all owned historical rows, and concurrent writes for the same user are serialized; this is intentionally conservative for a solo-user app. Existing child-first cleanup must account for the new restrictive FK in fixtures and future deletion workflows. Archived ticket details require an explicit archived flag; normal lists remain unchanged.

## Alternatives considered

- Permit overlaps until drag/drop: rejected by the human for M4.
- Cascade-delete time with archived tickets: rejected because logged time remains historical reality.
- Configurable 15/30-minute slots and cross-midnight entries immediately: deferred by the human in favor of a fixed 30-minute rule and midnight limit.

## Links

- `docs/milestones/m4-manual-time-entries.md`
- `docs/decisions/0004-m2-core-data-model.md`
- `docs/decisions/0007-m3-ticket-model-and-relations.md`
