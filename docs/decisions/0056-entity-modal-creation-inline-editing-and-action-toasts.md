# ADR 0056: Entity modal creation, inline editing, and action toasts

- Status: Accepted
- Date: 2026-10-13
- Supersedes: None
- Superseded by: None

## Context

Separate create/edit routes interrupt the current workflow, and successful server-backed actions lack consistent confirmation. Existing Effect-aware request and same-tab invalidation patterns must remain authoritative for failures and write-success/refresh-failure outcomes.

## Decision

- Create clients, projects, releases, and tickets in page-owned modals. Retire the standalone create routes without compatibility redirects. Keep users on the originating page after creation and offer an **Open** action in the creation success toast.
- Make client name/color, project name/color, and release name/target date independently editable on their detail pages. Keep ticket detail as its existing editable page.
- Keep archive/restore and archived-only permanent deletion as separate detail-page actions, preserving confirmation, archived-ancestor context, and existing deletion destinations.
- Use the app-level Nuxt UI toaster for success and partial-success feedback on approved explicit server-backed actions. Keep failed writes inline. A successful write followed by refresh failure must retain its retry UI and must not invite repeating the write. Draft-only ticket links/relations do not get separate toasts; direct Agenda drag/resize writes remain quiet.
- Preserve existing APIs, schema, validation, ownership, and invalidation semantics.

## Consequences

- Create and edit forms are no longer addressable through their retired routes; creation state is local to the initiating page.
- Ticket creation may guide users through client → project → release creation while retaining the ticket draft and selecting the new release.
- Entity detail pages own field-level feedback and lifecycle controls. Toasts supplement, rather than replace, accessible inline errors and retry controls.
- No dependency, API, or schema change is required.

## Alternatives considered

- Keep route-based forms and navigate to the created detail page: not chosen because creation should not leave the originating workflow.
- Use edit modals for client/project/release details: not chosen; direct inline detail editing was approved.
- Show error toasts or toast direct drag/resize writes: not chosen; existing inline failure handling and quiet direct manipulation are retained.

## Links

- Approved plan and implementation evidence: [`docs/milestones/m44-entity-modals-inline-editing-and-action-toasts.md`](../milestones/m44-entity-modals-inline-editing-and-action-toasts.md)
- Planning discussion: [`plans/entity-modals-and-action-toasts.md`](../../plans/entity-modals-and-action-toasts.md)
- Related: [ADR 0024](0024-effect-aware-client-fetch-boundary.md), [ADR 0040](0040-ticket-detail-inline-editing.md), and [ADR 0051](0051-same-tab-api-data-invalidation.md).
