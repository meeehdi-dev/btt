# ADR 0027: Release detail ticket status and release completion

- Status: Accepted
- Date: 2026-09-28
- Supersedes: None
- Superseded by: None

## Context

Release detail is a working surface for a release's tickets, yet ticket status was a static badge. Separately, project detail release cards once offered a one-click "mark release as done"; the human directed that completion happen only from the release itself, where the confirmation and unfinished-ticket warning live.

## Goal

Release detail is where a release's tickets change status and where the release is completed.

## Decision

- On active Release detail ticket cards, the status badge is a direct single-select over the fixed ticket statuses with the current one selected. No action menu, nested "Change" submenu, or status-filter action.
- The change uses the existing owner-checked ticket update. Pending, error, and refresh handling belong to the page (ADR 0024).
- A release can be marked done only from its Release detail page, with its existing confirmation, unfinished-ticket warning, and archive semantics. Project detail release cards only open the release, show hierarchy context, and show completion progress.

## Consequences

Status changes from a release need no trip to the ticket editor or Agenda. Completing a release requires opening it first, giving one clear owner for that action. No API, schema, or ownership change.

## Alternatives considered

- Keep the static badge: rejected; direct change was requested.
- "Change" submenu or "Filter by status" action: rejected; no status filter exists on Release detail.
- Keep a mark-done shortcut on project cards: rejected by the human.

## Revisions

- 2026-11-21: Rewritten to goal-level form; absorbed ADR 0043 (release completion only from release detail).
