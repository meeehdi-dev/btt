# ADR 0032: Client-led project navigation

- Status: Superseded
- Date: 2026-09-29
- Supersedes: None
- Superseded by: ADR 0033 — no compatibility route for the removed Projects collection

## Context

The product hierarchy is Client → Project → Release → Ticket, but the application exposed both Clients and Projects as top-level collections. Client detail already lists its projects and provides the contextual project-creation action. Keeping a separate all-projects page duplicates the collection entry point.

## Decision

- Clients is the only top-level navigation entry point for project discovery and setup. Project cards and the New project action remain on each client detail page.
- `/projects` redirects to `/clients`; it no longer renders an all-projects collection. Individual `/projects/:id`, `/projects/new`, and `/projects/:id/edit` routes remain available.
- Keep project entity results in global search and hierarchy links; they continue to navigate directly to project details.
- Route collection-return and project-prerequisite actions to Clients or the relevant parent client/project, preserving archived context.
- Do not change project persistence, APIs, ownership, archive rules, or the create form's current client selector.

## Consequences

The shell has no Projects navigation item or `g`-then-`p` shortcut. Projects are discovered from client detail, where active and independently archived projects under visible clients remain represented by ProjectCard. Parent archive visibility remains governed by ADR 0004. The `/projects` redirect preserves older links/bookmarks without preserving the duplicate collection UI. No schema, API, dependency, or authentication change is introduced.

## Alternatives considered

- Keep separate Clients and Projects collections: rejected because client detail already provides the project collection and creation context.
- Return 404 for `/projects`: rejected to avoid breaking existing links/bookmarks and any stale collection destinations.
- Remove project detail routes or project search results: rejected because projects remain first-class entities in the hierarchy.
- Force project creation to require a locked client context: rejected for this focused change; keep the current selector and form behavior.

## Links

- `docs/milestones/m19-client-led-project-navigation.md`
- `PLAN.md` — M19 client-led project navigation
- ADR 0004 — M2 work hierarchy and archive lifecycle
- ADR 0015 — compact navigation and mobile control columns
