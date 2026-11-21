# ADR 0053: Ticket priorities and Board ordering

- Status: Accepted
- Date: 2026-10-12
- Supersedes: None
- Superseded by: None

## Context

Tickets had a status but no priority. Users want an optional Low, Mid, or High priority, editable wherever tickets are handled, with Board ordering favoring higher priority without changing other ticket lists. The first icon set looked unbalanced in the compact Board and Agenda control and needed manual alignment, so a simpler neutral icon set replaced it (formerly ADR 0054).

## Goal

Let users optionally mark tickets Low, Mid, or High, edit it from every ticket surface, and surface higher-priority work first on the Board, with a compact neutral icon-only display.

## Decision

- Priority is optional: none, low, mid, or high. Existing and new tickets start with none; the API accepts an explicit null to clear it. Priority is a current ticket property, not a time-entry snapshot. There is no "On hold" priority (that is a status, ADR 0055).
- Priority is editable from ticket creation, ticket detail, Board cards, and Agenda entries.
- Board cards and Agenda entries show only the current priority icon. Menus and form selectors show label plus matching icon. Icons are neutral: no per-value colors.
- Within each Board status lane, order High, Mid, Low, None. Ties keep the existing ticket order: estimated first, then newest created, then highest id. Other ticket lists (ADR 0028) and Agenda chronological order are unchanged.

## Consequences

- Existing rows need no backfill; an additive migration adds the nullable field, and ticket requests and responses carry priority.
- Higher-priority work leads each Board lane; other lists keep their ordering.
- Any future priority color needs separate design review.

## Implementation notes (non-binding)

- Icons: `lucide:minus` (none), `chevron-down` (low), `chevron-right` (mid), `chevron-up` (high); see `shared/ticket-priority.ts`.
- Board/Agenda trigger is a compact ghost button with no outline; no per-icon alignment tweaks.

## Alternatives considered

- A fourth "On hold" level: rejected; it is a status.
- Storing "none" as an enum value: rejected; null means unset.
- Reordering every ticket list: rejected; keeps ADR 0028 outside the Board.
- Colored icons: deferred.
- Labels on cards: rejected for compact icon-only display.
- The `signal-*` icon family with alignment fixes: rejected after repeated visual iteration; outlined circular trigger also rejected.

## Revisions

- 2026-11-21: Rewritten to goal-level form; absorbs ADR 0054 (neutral icon-only presentation, no per-value colors); status back to Accepted.
