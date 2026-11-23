# ADR 0056: Modal creation, inline editing, and action toasts

- Status: Accepted
- Date: 2026-10-13
- Supersedes: None
- Superseded by: None

## Context

Separate create/edit routes interrupted the current workflow, and successful server-backed actions lacked consistent confirmation. Existing typed-failure request handling and same-tab invalidation must stay authoritative for failures and write-succeeded/refresh-failed outcomes.

## Goal

Creating and editing entities keeps users in their current workflow, with clear confirmation of success and recoverable failures.

## Decision

- Clients, projects, releases, and tickets are created in modals owned by the originating page. Standalone create routes are removed (404, ADR 0033). After creation the user stays put, and the success toast offers an **Open** action.
- Client name/color, project name/color, and release name/target date are edited inline on their detail pages. Ticket detail is editable per ADR 0040.
- Archive/restore and archived-only permanent delete stay separate detail-page actions with confirmation, archived-ancestor context, and existing destinations.
- Success and partial success of explicit server-backed actions show a toast. Failures stay inline, never as toasts. A write that succeeded but whose refresh failed keeps its retry UI and does not invite repeating the write. Draft-only ticket links have no toast; direct Agenda drag/resize writes stay quiet.
- APIs, validation, ownership, and invalidation are unchanged.

## Consequences

Create/edit pages cannot be addressed by URL. Ticket creation can guide through creating a missing client → project → release while keeping the ticket draft. Toasts supplement, never replace, inline errors and retry controls.

## Implementation notes (non-binding)

Toasts use the app-level Nuxt UI toaster.

## Alternatives considered

- Route-based forms navigating to the created entity: rejected; leaves the workflow.
- Edit modals for client/project/release: rejected; inline editing was approved.
- Error toasts or toasts for drag/resize: rejected; inline failures and quiet direct manipulation stay.

## Revisions

- 2026-11-21: Rewritten to goal-level form; library name moved to notes.
- 2026-11-23: Removed the draft relation reference; related tickets were removed (ADR 0067).
