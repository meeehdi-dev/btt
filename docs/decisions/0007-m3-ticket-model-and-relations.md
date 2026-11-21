# ADR 0007: Ticket model and relations

- Status: Accepted
- Date: 2026-09-25
- Supersedes: None
- Superseded by: None

## Context

Tickets are release-linked work items with external links and related tickets. The work hierarchy already uses restrictive foreign keys, UUIDv7 IDs and archive-before-delete semantics (ADRs 0004 and 0006).

## Goal

A simple, safe ticket model that follows the existing hierarchy conventions: one release per ticket, a fixed workflow, and non-hierarchical relations between tickets.

## Decision

- Each ticket belongs to exactly one release. Title and description are plain text; the estimate is an optional positive integer number of minutes.
- Status is one of a fixed, ordered list (currently On hold, Idea, Estimate, Develop, Review, Test, Deploy, Done; ADR 0055 added On hold). The list is shared by the database, API validation and UI, and is not customizable. The ticket detail page has no next-status action; status changes via the edit form, status menus and Board drag (ADR 0048).
- Tickets follow the archive/restore and explicit permanent-delete convention. Archiving a parent hides its tickets without changing them. A release cannot be permanently deleted while it has tickets. Deleting an archived ticket transactionally removes its links and relation edges and keeps the peer tickets.
- External links store a label and a validated http(s) URL without embedded credentials (labels are optional, ADR 0020).
- Related items are tickets only, across releases/projects of the same user. Relations are undirected, unique, and cannot link a ticket to itself.
- IDs are UUIDv7 in native UUID columns; link and relation foreign keys are restrictive.

## Consequences

Ticket lists and selectors exclude archived tickets and tickets under archived parents by default; archived detail needs an explicit archived view. All mutations verify ownership. Deleting a ticket unlinks it from peers rather than deleting them. A future non-ticket relation type needs its own model.

## Implementation notes (non-binding)

- Status is a PostgreSQL enum via Drizzle `pgEnum` whose values come from `shared/ticket-status.ts`; a database check keeps estimates positive alongside API validation.
- Relation edges are canonicalized by UUID order.

## Alternatives considered

- Directional or parent-child ticket relationships: rejected; the roadmap specifies non-hierarchical links.
- Cascade-deleting tickets from releases: rejected to preserve child-first cleanup.
- Arbitrary URL schemes: rejected to avoid unsafe links.

## Revisions

- 2026-11-21: Rewritten to goal-level form; folded in ADR 0017's removal of the ticket-detail next-status action, updated the status list for On hold, and returned to Accepted.
