# ADR 0058: Settings in a shell-level modal

- Status: Accepted
- Date: 2026-10-14
- Supersedes: None
- Superseded by: None

## Context

The Settings editor is a standalone `/settings` page even though its entry point is a persistent control in the authenticated dashboard header. Opening it replaces the current work surface. The Settings action should instead keep the user in context while preserving the existing Agenda preference API and save/retry behavior.

## Decision

- Open Settings in an accessible modal owned by the authenticated dashboard shell. The header control remains directly available and opens the modal without changing the current URL or replacing the underlying page.
- Load settings on first open, then retain the shell-level modal state so a successful write followed by a failed refresh can still be retried after the modal is dismissed and reopened.
- Retire direct `/settings` visits with an authenticated 404. The header modal is the only Settings editor entry point.
- Preserve the existing settings fields, validation, explicit save, API contract, same-tab invalidation, toast policy, and inline failure/retry behavior.

## Consequences

- Users can adjust Settings from any authenticated page without losing the current route or page state.
- `/settings` is no longer a navigable or bookmarked editor route; direct visits receive an authenticated 404.
- Modal loading must remain lazy so every dashboard page does not fetch settings unnecessarily. The shell owns retryable partial-success state across modal open/close cycles.
- No server, API, schema, dependency, or Agenda behavior changes are required.

## Alternatives considered

- Keep Settings as a full page: rejected because it replaces the user's current work surface.
- Keep a full-page fallback in addition to the modal: rejected because two editor presentations could drift and direct navigation is not required.
- Redirect direct `/settings` visits to Agenda with the modal open: rejected because it changes the underlying page and does not restore the user's prior context.

## Links

- Approved amendment plan: [`plans/settings-modal-amendment.md`](../../plans/settings-modal-amendment.md), approved via Plannotator session `pn-e2e142`.
- M44 implementation evidence: [`docs/milestones/m44-entity-modals-inline-editing-and-action-toasts.md`](../milestones/m44-entity-modals-inline-editing-and-action-toasts.md).
- Related: [ADR 0035](0035-three-block-header-navigation.md), [ADR 0051](0051-same-tab-api-data-invalidation.md), [ADR 0056](0056-entity-modal-creation-inline-editing-and-action-toasts.md), and [ADR 0057](0057-sibling-ui-consistency-and-shared-presentation.md).
