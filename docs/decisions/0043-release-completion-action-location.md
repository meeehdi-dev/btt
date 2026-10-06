# ADR 0043: Keep release completion on release detail

- Status: Accepted
- Date: 2026-10-06
- Supersedes: None
- Superseded by: None

## Context

Project detail release cards previously exposed a `Mark release as done` quick action beside each release title. Release detail already owns the release completion confirmation, unfinished-ticket warning, and archive mutation. During M28 live-app review, the human directed that a release should be marked done only from its Release detail page.

## Decision

- Offer the release-completion action only on `/releases/:id`.
- Keep project detail release cards focused on opening the release, displaying hierarchy context, and showing ticket-completion progress; remove the card-level mark-done shortcut.
- Preserve the existing Release detail confirmation, warning, archive semantics, ownership checks, API contract, and feedback behavior. Reaching the action now requires opening the release first.
- Keep historical milestone records unchanged; this decision records the current action location.

## Consequences

Release completion has one clear page-owned interaction surface. Project detail remains useful for scanning progress and navigating to releases without mutating them. No domain rule, API, schema, auth, or persistence behavior changes.

## Alternatives considered

- Keep a one-click mark-done shortcut on project cards: rejected by the human in M28 live-app review.
- Remove release completion entirely: rejected; the existing Release detail workflow remains available.

## Links

- `docs/milestones/m28-desktop-only-ui-cleanup.md`
- `docs/decisions/0022-shared-entity-card-presentation.md`
- `docs/milestones/m8-polish-and-shared-ticket-work-items.md` (historical project-card action scope)
