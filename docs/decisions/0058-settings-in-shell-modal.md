# ADR 0058: Settings in a shell modal

- Status: Accepted
- Date: 2026-10-14
- Supersedes: None
- Superseded by: None

## Context

Settings was a standalone page reached from a persistent header control, so opening it replaced the user's current work surface.

## Goal

Users can adjust Settings from anywhere without losing their place.

## Decision

- Settings opens in an accessible modal owned by the authenticated shell, from the header control, without changing the URL or the page underneath. This is the only Settings entry point.
- Settings load on first open. Modal state outlives dismissal, so a successful write followed by a failed refresh can still be retried after reopening.
- `/settings` is removed: an authenticated visit returns 404 (ADR 0033).
- Fields, validation, explicit save, API contract, same-tab invalidation, toast policy, and inline failure/retry behavior are unchanged.

## Consequences

Settings are reachable from every page with route and page state preserved. Direct and bookmarked `/settings` visits no longer work. Loading stays lazy so other pages do not fetch settings. No server, API, or schema change.

## Alternatives considered

- Keep a full page: rejected; it replaces the work surface.
- Page plus modal: rejected; two presentations drift.
- Redirect `/settings` to the Agenda with the modal open: rejected; it changes the underlying page.

## Revisions

- 2026-11-21: Rewritten to goal-level form; verified `/settings` throws an authenticated 404.
