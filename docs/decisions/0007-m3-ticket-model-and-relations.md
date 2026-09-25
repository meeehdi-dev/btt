# ADR 0007: M3 ticket model and relations

- Status: Accepted
- Date: 2026-09-25
- Supersedes: None
- Superseded by: None

## Context

M3 introduces release-linked tickets, external links and related tickets. The existing work hierarchy uses restrictive foreign keys, UUIDv7 IDs and archive-before-delete semantics (ADRs 0004 and 0006).

## Decision

- Each ticket belongs to one required release; title and description are plain text, estimate is nullable positive integer minutes, and status is one of Idea, Estimate, Develop, Review, Test, Deploy, Done. Model the status as a PostgreSQL enum through Drizzle `pgEnum`, sharing its ordered values with Effect request validation and the UI rather than duplicating a text-column check. Keep the database check for positive estimates alongside API validation. The UI offers a next-status action, stopping at Done; statuses are not customizable.
- Tickets follow M2's archive/restore and explicit permanent-delete convention. Archiving a parent hides its tickets without changing them. Releases cannot be permanently deleted while they have tickets; deleting an archived ticket explicitly removes its links and relation edges transactionally, retaining linked peer tickets.
- Generic external links store only a label and a validated http(s) URL without embedded credentials. Related items in M3 are tickets only, across releases/projects but belonging to the same user; relation edges are undirected, canonicalized by UUID order, unique and prohibit self-linking.
- New IDs use the shared UUIDv7 generator and native PostgreSQL UUID columns. Link and relation foreign keys are restrictive. Time usage is deferred to M4.

## Consequences

Ticket list/selector reads exclude archived parents and archived tickets by default. Archived ticket detail requires an explicit archived view, and all mutation paths verify ownership. Deleting a ticket unlinks it from peers rather than deleting those peers. A future non-ticket relation type would need a separately designed model.

## Alternatives considered

- Directional or parent-child ticket relationships: rejected because the roadmap specifies non-hierarchical linked tickets.
- Cascade-delete ticket descendants from releases: rejected to preserve M2 child-first cleanup.
- Arbitrary URL schemes: rejected to avoid unsafe links in the UI.

## Links

- `plans/m3-tickets-mvp.md`
- `docs/milestones/m3-tickets-mvp.md`
- `docs/decisions/0004-m2-core-data-model.md`
- `docs/decisions/0006-uuidv7-identifiers.md`
