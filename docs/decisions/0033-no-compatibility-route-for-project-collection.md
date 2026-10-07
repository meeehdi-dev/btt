# ADR 0033: No compatibility route for the removed Projects collection

- Status: Accepted
- Date: 2026-09-29
- Supersedes: ADR 0032 — client-led project navigation
- Superseded by: ADR 0044 (canonical-root landing-target clause only)

## Context

M19 removed Projects as a top-level collection but initially retained `/projects` as a 302 redirect to Clients for bookmark compatibility. During code review, the human clarified that the application is still in MVP and should not preserve this unused collection URL as a compatibility path.

## Decision

- Remove the `/projects` collection route entirely. A request to `/projects` receives Nuxt's normal 404; do not add a redirect, alias, or legacy fallback.
- Keep Clients as the only top-level entry point for project discovery/setup. Client detail continues to list project cards and provide **New project**.
- Retain individual project detail, create, and edit routes (`/projects/:id`, `/projects/new`, `/projects/:id/edit`), plus project search results and hierarchy links.
- Keep current contextual return/prerequisite paths to Clients or parent client/project pages.
- Do not change project persistence, APIs, ownership, archive rules, or project form behavior.

## Consequences

Existing bookmarks to the removed collection URL return 404; the product does not promise compatibility for pre-MVP collection navigation. Individual project URLs remain valid and are not confused with the removed index route. The canonical `/` landing redirect to `/today` and authentication return-to-login redirects remain; they are active application flows, not legacy Projects aliases. No schema, API, dependency, or authentication change is introduced.

## Alternatives considered

- Keep a 302 redirect from `/projects` to `/clients`: rejected because the project remains in MVP and compatibility for the removed collection URL is unnecessary.
- Keep the all-projects collection page: rejected because project discovery/setup is client-led.
- Remove individual project entity routes: rejected because projects remain first-class hierarchy entities.

## Links

- `docs/milestones/m19-client-led-project-navigation.md`
- `PLAN.md` — M19 client-led project navigation
- ADR 0032 — client-led project navigation (superseded)
- ADR 0004 — M2 work hierarchy and archive lifecycle
