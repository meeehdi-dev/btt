# ADR 0035: Single header navigation

- Status: Accepted
- Date: 2026-09-29
- Supersedes: [ADR 0015](0015-compact-navigation-and-mobile-columns.md)
- Superseded by: None

## Context

A persistent sidebar consumed page width and kept account actions behind a popover. The human asked for one header: navigation left, universal search center, account actions right.

## Goal

One compact header gives direct access to navigation, search, and account actions without taking page width.

## Decision

- Full-width shell with one header and no sidebar or drawer. Three blocks in one row: navigation on the left, the owner-scoped universal search centered, and the signed-in user's avatar/name with direct Settings and Sign out on the right.
- The product shows no wordmark or logo; navigation is the first content in the header.
- Navigation destinations are Agenda, Tickets, Clients, and Reports, in that order, with the active route indicated.
- Keyboard: `/` and Ctrl/⌘K focus the search field; `g` then a destination letter navigates. Shortcuts are ignored while typing in an input.
- Settings opens the shell modal (ADR 0058); Sign out is a POST-only logout.
- Page introductions stay compact: keep accessible page names and detail context, but do not add decorative headings or descriptions to list pages.

## Consequences

Content gets the full width, with one search/navigation surface. Search ownership, sessions, and logout semantics are unchanged. Old browser-local sidebar state is ignored. The header is desktop-only (ADR 0042).

## Implementation notes (non-binding)

Current shortcuts: `g a` Agenda, `g b` Tickets (board), `g c` Clients, `g r` Reports; mapping is in `app/layouts/dashboard.vue`.

## Alternatives considered

- Keep the sidebar: rejected; it consumes width.
- Put Settings/sign-out in an account popover: rejected; direct controls requested.

## Revisions

- 2026-11-21: Rewritten to goal-level form; folded ADR 0044 (Agenda destination), ADR 0045 (no wordmark), and ADR 0061 (Reports entry, `g r`); mobile stacking clauses were already retired by ADR 0042 and are dropped.
