# ADR 0007: Ticket model and external links

- Status: Accepted
- Date: 2026-09-25
- Supersedes: None
- Superseded by: None

## Context

Tickets are release-linked work items with external links. The work hierarchy already uses restrictive foreign keys, UUIDv7 IDs and archive-before-delete semantics (ADRs 0004 and 0006).

## Goal

A simple, safe ticket model that follows the existing hierarchy conventions: one release per ticket, a fixed workflow, and external links.

## Decision

- Each ticket belongs to exactly one release. Title and description are plain text.
- Status is one of a fixed, ordered list (currently On hold, Idea, Estimate, Develop, Review, Test, Deploy, Done; ADR 0055 added On hold). The list is shared by the database, API validation and UI, and is not customizable. The ticket detail page has no next-status action; status changes via the edit form, status menus and Board drag (ADR 0048).
- Tickets follow the archive/restore and explicit permanent-delete convention. Archiving a parent hides its tickets without changing them. A release cannot be permanently deleted while it has tickets. Deleting an archived ticket transactionally removes its links.
- External links store a label and a validated http(s) URL without embedded credentials (labels are optional, ADR 0020).
- IDs are UUIDv7 in native UUID columns; link foreign keys are restrictive.

## Consequences

Ticket lists and selectors exclude archived tickets and tickets under archived parents by default; archived detail needs an explicit archived view. All mutations verify ownership. Deleting a ticket removes its own links only.

## Implementation notes (non-binding)

- Status is a PostgreSQL enum via Drizzle `pgEnum` whose values come from `shared/ticket-status.ts`.

## Alternatives considered

- Cascade-deleting tickets from releases: rejected to preserve child-first cleanup.
- Arbitrary URL schemes: rejected to avoid unsafe links.

## Revisions

- 2026-11-21: Rewritten to goal-level form; folded in ADR 0017's removal of the ticket-detail next-status action, updated the status list for On hold, and returned to Accepted.
- 2026-11-23: Removed ticket estimates and related-ticket relations (ADR 0067); the relation clauses and the estimate field no longer apply; retitled to "Ticket model and external links".
