# ADR 0017: Release ticket usage and ticket-detail polish

- Status: Accepted
- Date: 2026-09-26
- Supersedes: None
- Superseded by: None

## Context

Release ticket cards did not show tracked time, the ticket-detail status controls competed with each other, and ticket-detail rows lacked contrast.

## Goal

Show how much time a release's tickets have used without extra requests per card, and keep ticket detail uncluttered.

## Decision

- The owner-scoped ticket list response includes tracked minutes per returned ticket, summed over all its time entries including historical ones; a ticket with none returns 0. This is one aggregate read, not a request per card.
- Release ticket cards show title, optional description, status, and tracked time.
- Ticket detail has no next-status action. Status changes go through the edit form, status menus and Board drag (ADR 0048). The status enum and API are unchanged.
- Ticket-detail time entries and link rows use subtle elevated semantic surfaces; its client/project/release links use the same muted-to-primary hover as Board navigation.
- Filter bars keep icon-leading accessible inputs and an icon-only Clear control.

## Consequences

The ticket list read does one extra grouped sum scoped by the owner/active-ancestor query. Ticket detail has fewer competing status controls. Colors stay semantic across light and dark themes.

## Implementation notes (non-binding)

- Icons come from the locally bundled Lucide collection (`@iconify-json/lucide`), a dev dependency.

## Alternatives considered

- One request per release ticket for tracked time: rejected as N+1.
- Keep the ticket-detail quick status action: rejected by the human.
- Hard-coded palette colors: rejected for semantic surfaces.

## Revisions

- 2026-11-21: Rewritten to goal-level form; the ADR 0007 next-status clause now lives in ADR 0007 (dropped the supersession line); the compact-filter mobile layout was dropped (ADR 0042).
- 2026-11-23: Estimate usage and related-ticket rows removed (ADR 0067); release cards show tracked time only.
