# ADR 0017: Release ticket usage and ticket-detail navigation polish

- Status: Accepted
- Date: 2026-09-26
- Supersedes: 0007 (ticket-detail next-status action only; ticket model and relations unchanged)
- Superseded by: None

## Context

In M7 code review the human requested release ticket cards show tracked time and estimate usage, ticket detail rows gain subtle contrast, hierarchy links use consistent navigation styling, the ticket-detail next-status action be removed, and the local Lucide icon collection be installed for reliable icons.

## Decision

- Add a bounded aggregate read to the existing owner-scoped ticket list response: sum tracked minutes for the ticket IDs already returned, including their historical entries. A ticket with no entries returns 0. Release ticket cards display title, optional description/estimate, status, tracked time and estimate percentage, using the existing `usageColor` thresholds from the ticket detail. No new schema or archive/ownership rule.
- Remove the ticket-detail next-status button and its dedicated action; retain the status selector in ticket edit and desktop board drag for status changes. Do not modify the underlying status enum or API.
- Use subtle semantic elevated surfaces for ticket-detail time entries, links and related-ticket rows; render its client/project/release links with the same muted-to-primary hover treatment as board navigation. Compact Today/board filter bars keep icon-leading accessible inputs, an icon-only Clear control at the right on desktop, and a stacked mobile layout.
- Add `@iconify-json/lucide` as a direct development dependency to bundle local Lucide icons used throughout the application.

## Consequences

The existing ticket list read now performs one additional grouped sum over tickets scoped by its owner/active-ancestor query; no per-card requests. Ticket detail has fewer competing status controls but keeps the edit form. Icon data adds development dependency/lockfile changes without changing runtime behavior. Existing colors remain semantic across light/dark themes.

## Alternatives considered

- One request per release ticket for tracked time: rejected due to N+1 reads.
- Keep ticket detail quick status action: rejected by human; board drag and edit form remain.
- Raw hard-coded palette colors for list contrast: rejected in favor of Nuxt UI semantic surfaces.

## Links

- `plans/m7-search-and-ui-polish.md`
- `docs/milestones/m7-search-and-ui-polish.md`
- `docs/decisions/0007-m3-ticket-model-and-relations.md`
- `docs/decisions/0011-manual-time-entry-history-and-slots.md`
