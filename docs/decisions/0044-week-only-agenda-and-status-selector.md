# ADR 0044: Week-only Agenda route and direct status selector

- Status: Accepted
- Date: 2026-10-07
- Supersedes: ADR 0003 (authenticated landing route clause only); ADR 0030 (Day/Week view-preference policy); ADR 0033 (canonical-root landing target clause only); ADR 0016 (agenda status-filter clause only); ADR 0039 (status-menu structure clause only)
- Superseded by: None

## Context

The Agenda page currently combines duplicate Day and Week UIs, persists the view choice in browser storage, and is labeled Today despite allowing arbitrary week navigation. Its entry status control also offers a status filter and a nested status-change submenu, while the page has a separate status filter. The approved M29 plan simplifies this presentation without changing the weekly data, time-entry operations, API contracts, or fixed time-grid geometry.

## Decision

- Make `/agenda` the canonical, Week-only Agenda route. Use “Agenda” in page and shell navigation, route internal destinations there, and use `g` then `a` for navigation. Retire `/today` with a 404 and no compatibility redirect.
- Remove the Day/Week preference and its localStorage reads/writes. Ignore any existing `nxmr:agenda-view` value and leave that key untouched. Keep the selected-date query as the anchor for week navigation and retain the configured week start.
- Keep client, project, release, and ticket hierarchy filters; remove status from the Agenda filter set. A time-entry status trigger opens the fixed status choices directly in one flat selector, with the current status marked and archived/busy options disabled.
- Keep the existing weekly API, entry and ticket APIs, data ownership, archive behavior, status values, overlap rules, gestures, correction flows, and accessibility semantics. This is a UI/route policy, not a data or API change.
- Preserve earlier ADRs as historical records. Only the clauses named in the header are superseded; unrelated policies remain authoritative. ADR 0003's authenticated landing route and ADR 0033's former `/` landing target now point to `/agenda`; ADR 0033's no-compatibility decision for the removed `/projects` collection remains accepted.

## Consequences

The Agenda has one stable weekly presentation and no browser-local view preference. Deep links with a valid `date` continue to anchor the selected week. Links or bookmarks to `/today` intentionally stop working and return 404. Status can still be changed from an entry, but there is no status filter and no intermediate “Change” submenu.

No schema, stored data, API, auth, dependency, or time-grid geometry changes are introduced.

## Alternatives considered

- Keep Day/Week and default to Week: rejected; the Day UI and preference are duplicate presentation state.
- Redirect `/today` to `/agenda`: rejected by the human; legacy `/today` must return 404 with no compatibility route.
- Keep status filtering or the nested “Filter by …” / “Change” menu: rejected for the compact Agenda; hierarchy filtering remains, and the status trigger opens its choices directly.
- Delete the legacy localStorage key: rejected; old values are ignored but not cleared.

## Links

- `docs/milestones/m29-today-week-only-ui-polish.md`
- [ADR 0003 — M1 authentication and database baseline](0003-m1-authentication-and-database.md)
- [ADR 0016 — agenda correction control and compact hierarchy filters](0016-agenda-correction-control-and-board-filters.md)
- [ADR 0029 — weekly agenda and attempted-position conflict previews](0029-weekly-agenda-and-conflict-previews.md)
- [ADR 0030 — browser-local agenda view preference](0030-agenda-view-preference.md)
- [ADR 0033 — no compatibility route for the Projects collection](0033-no-compatibility-route-for-project-collection.md)
- [ADR 0039 — Today agenda context-control flow](0039-today-agenda-context-control-flow.md)
