# ADR 0026: Hierarchical breadcrumb navigation

- Status: Accepted
- Date: 2026-09-28
- Supersedes: None
- Superseded by: None

## Context

Client, project, release, and ticket detail pages assemble hierarchy navigation differently. Ticket detail splits a Tickets back-link from client/project/release metadata, while create/edit forms use separate back-links. A shared trail should express the actual entity hierarchy without repeating collection navigation already available in the app shell.

## Decision

- Use a presentational `HierarchyBreadcrumbs` component for hierarchy-aware pages. The owning page supplies item labels, entity kinds, and destination URLs; the component does not fetch data or own route state.
- Do not render a collection-root Clients item. Client detail is title-only; project detail shows client > project; release detail shows client > project > release; ticket detail shows client > project > release > ticket.
- On hierarchy-aware project/release/ticket create and edit pages, include available parent/entity context and the current form page. When a create form has no selected parent, retain its existing title/back-link treatment rather than showing a collection-root crumb. Client create/edit pages retain their existing title/back-link treatment.
- Render linked ancestors and a non-link current page with breadcrumb navigation/list semantics, entity icons, and `aria-current="page"`. Keep one visible page heading and avoid repeating the current entity title.
- Preserve archive access by adding `archived=true` to a breadcrumb destination when the destination or one of its ancestors is archived.
- Add the minimum client ID/name fields to existing release list/detail read responses needed to render these trails. This is response metadata only; do not change persistence, ownership, or archive rules.

## Consequences

Hierarchy detail pages have a consistent and complete parent trail while the app shell remains the collection navigation. Pages retain ownership of hierarchy data and routes, with presentation/accessibility shared in one component. The release read responses expose two additive display fields. No schema, dependency, or authentication change is introduced.

## Alternatives considered

- Keep hand-built links on each page: rejected because trails currently differ and drift.
- Add a Clients root link to every trail: rejected because the persistent app navigation already provides the collection route.
- Reuse `TicketHierarchyBadges` for page breadcrumbs: rejected because those controls are card badges/popovers with filtering behavior.
- Add a release client fetch per page: rejected in favor of selecting the needed context in the existing release queries.

## Links

- `docs/milestones/m13-hierarchy-breadcrumbs.md`
- ADR 0015 — compact navigation and mobile control columns
- ADR 0018 — ticket context and application UI consistency
