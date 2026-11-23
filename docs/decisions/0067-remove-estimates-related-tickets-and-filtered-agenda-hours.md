# ADR 0067: Remove ticket estimates and related tickets; show filtered Agenda day hours

- Status: Accepted
- Date: 2026-11-23
- Supersedes: None
- Superseded by: None

## Context

Ticket estimates (and the usage ratios, Board ordering and Reports cohort built on them) and undirected related tickets were not wanted any more. The Agenda day progress bar ignored the active filters, and the Agenda had no way to create a ticket.

## Goal

Tickets carry no estimate and no ticket-to-ticket relations, so tracked time is simply shown. The Agenda day progress and worked hours describe what the user is currently looking at, and a ticket can be created from the Agenda.

## Decision

- Ticket estimates are removed everywhere: storage, API, forms, cards, detail, Reports and usage coloring. The `Estimate` workflow status is unrelated and stays.
- Related tickets are removed everywhere: storage, API, forms, popovers and Board highlighting. External links stay.
- Tickets are ordered by creation, newest first (ADR 0028).
- Each Agenda day shows its worked hours (for example `4.5h`, `7h`) to the right of the progress bar, always muted. The bar, hours, tooltip and accessible value use only the entries that pass the active filters; the target is unchanged. Overlap and drag rules still consider all entries.
- The Agenda toolbar has a labeled `New ticket` button, as on the Tickets page, prefilled with the active release filter.

## Consequences

Existing estimate and relation data is permanently deleted by the migration (human-approved). The Reports Done-estimate block disappears. Hours totals can differ from the day's real total while filters are active.

## Implementation notes (non-binding)

- One migration drops `ticket.estimate_minutes` and `ticket_relation`; the `parse-duration-ms` dependency is removed.
- Day minutes are computed in `WeeklyAgenda.vue` from the filtered rows; `formatHours` lives in `app/utils/agenda-week.ts`.

## Alternatives considered

- Keep the data and hide the UI: rejected by the human; the data is dropped.
- Server-side filtered totals: rejected; the client already holds the filtered rows.
- Scale the target with filters: rejected; the target is unchanged.

## Revisions

- 2026-11-23: Initial version (M51).
