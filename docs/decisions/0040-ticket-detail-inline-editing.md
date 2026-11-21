# ADR 0040: Ticket detail is the normal edit surface

- Status: Accepted
- Date: 2026-10-03
- Supersedes: None
- Superseded by: None

## Context

Ticket detail was largely read-only and sent users to a separate edit page for routine changes. Link/relation forms were always visible, and time entries could be created from places other than the Agenda. Existing partial ticket updates and link/relation APIs already support focused edits.

## Goal

Routine ticket changes happen on the ticket detail page without navigating away, and time entries are created only from the Agenda.

## Decision

- Status, description, estimate, and release are saved independently, field by field. Description saves on blur. The title is edited in a dedicated title-only modal.
- External links and related tickets are added in separate on-demand modals; their lists stay visible.
- There is no ticket edit route (404, no redirect; ADR 0033).
- Ticket detail keeps tracked-time totals/history and existing correction/deletion of entries, but cannot create entries; the Agenda is the only creation surface.
- The archive action sits in the detail header. Ownership, status, archive/restore/delete, and time-entry rules are unchanged.

## Consequences

Each field reports its own pending, validation, failure, and partial-success/retry state. Direct visits to the old edit URL break by design. No API or schema change.

## Alternatives considered

- Keep a separate edit route as a redirect: rejected; retired with a 404.
- Read-only detail plus full edit form: rejected; needless navigation.
- Remove history/corrections from detail: rejected; useful context.
- Always-visible link/relation forms: rejected in favor of modals.

## Revisions

- 2026-11-21: Rewritten to goal-level form; status changed Proposed → Accepted (verified implemented: field-level saves and `/tickets/:id/edit` returns 404); layout/spacing details dropped; the clause amending ADR 0017 is owned there.
