# ADR 0037: Searchable selectors for user-managed data

- Status: Accepted
- Date: 2026-10-01
- Supersedes: None
- Superseded by: None

## Context

The app has user-managed collections of clients, projects, releases, and tickets. Their selectors used basic `USelect` controls, which become difficult to use as those collections grow. Fixed code-defined choices such as ticket statuses are small, closed sets and do not need collection search.

## Decision

- Use searchable Nuxt UI `USelectMenu` controls for selectors backed by user-managed, data-driven entity collections.
- Use basic `USelect` controls for fixed, code-defined choices such as ticket status, duration presets, and agenda settings.
- Give each searchable selector an entity-specific search placeholder. Do not automatically focus its search field on touch devices, avoiding an unsolicited mobile keyboard.
- Preserve existing ownership/archive filtering, selection values, labels, form validation, and API contracts. Search is a client-side presentation behavior, not a change to data eligibility.

## Consequences

Entity selection remains practical as user-managed lists grow. Searchable pickers share a consistent keyboard and touch interaction pattern. Existing enum and fixed-choice controls remain simple selects; no API, schema, or dependency changes are required.

## Alternatives considered

- Keep basic selects for all forms: rejected because entity lists can grow and are not searchable.
- Make every fixed-choice select searchable: rejected because closed code-defined choices remain short and stable.
- Add server-side search endpoints: rejected for these already-loaded form choices; it would add API complexity without need.

## Links

- `plans/time-entry-ticket-choices.md`
- `docs/milestones/m5-today-agenda.md`
- `docs/decisions/0020-m8-polish-decisions.md`
