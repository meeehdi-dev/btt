# ADR 0026: Hierarchical breadcrumb navigation

- Status: Accepted
- Date: 2026-09-28
- Supersedes: None
- Superseded by: None

## Context

Client, project, release, and ticket pages each built hierarchy navigation differently, with separate back-links on forms. A shared trail should show the real entity hierarchy without repeating collection navigation already in the app header.

## Goal

Hierarchy pages show one consistent ancestor trail that reflects the actual Client → Project → Release → Ticket hierarchy, including archive context.

## Decision

- No collection-root "Clients" crumb. Client detail is title-only; project detail shows client › project; release detail client › project › release; ticket detail client › project › release › ticket.
- Ancestors are links; the current page is not, is marked as current, and the page keeps a single visible heading.
- A crumb destination carries `archived=true` when the destination or one of its ancestors is archived, so archived entities stay reachable.
- Release read responses include the client id/name needed for the trail (additive display fields only).

## Consequences

Detail pages have a consistent trail; the header remains the collection navigation. Pages own hierarchy data and routes. No schema, ownership, or archive-rule change.

## Implementation notes (non-binding)

Implemented by the presentational `HierarchyBreadcrumbs` component, fed by each page.

## Alternatives considered

- Hand-built links per page: rejected; they drift.
- Clients root link in every trail: rejected; the header already provides it.
- Reuse card hierarchy badges as breadcrumbs: rejected; they carry filter behavior.
- Separate client fetch per release page: rejected in favor of extending existing release queries.

## Revisions

- 2026-11-21: Rewritten to goal-level form; create/edit page clauses dropped because those routes were retired (ADR 0056); component name moved to notes.
