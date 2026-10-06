# ADR 0040: Make ticket detail the normal edit surface

- Status: Proposed
- Date: 2026-10-03
- Supersedes: Ticket-detail edit/status policy in ADR 0017 (partial; other decisions in ADR 0017 remain in force)
- Superseded by: None

## Context

Ticket detail currently presents several fields as read-only and sends users to a separate edit route for routine changes. It also keeps link/relation creation forms permanently visible and permits time-entry creation outside the primary Today work surface. The existing ticket PATCH and link/relation APIs support focused updates without schema or endpoint changes.

## Decision

- Make `/tickets/:id` the normal ticket editing surface. Save status, description, estimate, and release association independently through field-scoped PATCH requests; description saves on blur. Keep inputs and the archive lifecycle action at standard size; compact the page through reduced padding, margins, and gaps, and place the archive action at the upper-right of the detail header.
- Keep title editing in a dedicated title-only modal. Create external links and related-ticket associations in separate on-demand modals while keeping their lists visible.
- Retire `/tickets/:id/edit` without a compatibility redirect; the removed route returns 404.
- Keep tracked-time totals/history and existing correction/deletion controls on ticket detail, but do not allow creation of new time entries there. Today remains the only time-entry creation surface.
- Preserve existing API, ownership, status, archive/restore/delete, and time-entry rules, including archived hierarchy route context. Do not change status controls on Today, Release detail, or the board.

## Consequences

Routine ticket edits need not navigate away from detail. Each field update can report its own pending, validation, request-failure, and partial-success/refresh-retry state. Removing the edit route is intentionally breaking for direct visits and bookmarked `/edit` URLs. Ticket detail retains time-entry history and corrections, but users must use Today to create an entry. No API, database, schema, authentication, or dependency changes are introduced.

## Alternatives considered

- Keep `/tickets/:id/edit` as a compatibility route: rejected; the human-approved M25 plan explicitly retires it with a 404 and no redirect.
- Keep the detail page read-only and retain a full edit form: rejected because routine changes require unnecessary navigation and the existing partial PATCH supports direct field updates.
- Remove ticket time history or correction/deletion from detail: rejected; history and existing entry actions remain useful context, while creation is consolidated on Today.
- Keep link and relation forms permanently visible: rejected in favor of on-demand modals that preserve the visible lists and existing API behavior.

## Links

- [`docs/milestones/m25-ticket-detail-overhaul.md`](../milestones/m25-ticket-detail-overhaul.md)
- [ADR 0017 — Release usage and ticket-detail navigation polish](0017-release-usage-and-ticket-detail-polish.md)
- [ADR 0024 — Effect-aware client fetch boundary](0024-effect-aware-client-fetch-boundary.md)
- [ADR 0027 — Release ticket status badge actions](0027-release-ticket-status-actions.md)
