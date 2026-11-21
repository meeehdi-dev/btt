# ADR 0028: Stable collection ordering

- Status: Accepted
- Date: 2026-09-28
- Supersedes: None
- Superseded by: None

## Context

Collections sorted by `updatedAt DESC` moved records on every routine edit. Release ordering also differed between the API and project detail, and ticket-detail links/relations had no explicit order.

## Goal

Ordinary edits never reorder collections, so users can find items where they left them. Search is the one place where recency ranks.

## Decision

- Clients and projects: `createdAt` DESC, then ID DESC.
- Releases (one shared rule everywhere): undated first; then target date ASC; then name ASC; then `createdAt` DESC; then ID ASC only when creation times tie.
- Tickets: estimated before unestimated, then `createdAt` DESC and ID DESC within each group. Not by estimate amount.
- Global search ranks by `updatedAt` DESC with an ID tie-break.
- Agenda entries are chronological by start minute and ID. Ticket time history is date DESC, start minute DESC, ID DESC.
- Ticket-detail external links by label ASC/ID ASC; related tickets by title ASC/ID ASC.
- `updatedAt` keeps updating on edits but is not used for ordering except search.
- Release detail partitions its tickets into unfinished first (including On hold), then a full-width separator labeled Done and a Done section below, keeping API order within each section. Empty sections and the separator are omitted; with no tickets, the single empty state shows. A status change across the Done boundary moves the card after refresh. Done tickets stay visible and fully interactive; there is no filter or collapse. Completion counts use the full list.

## Consequences

Edits do not reorder lists; a status change still moves a ticket to the right Board lane or release section, and changing estimate presence moves it between estimate groups. Release API and project detail agree. Completed work stays visible without burying unfinished work. No schema or stored order field.

## Implementation notes (non-binding)

Release ordering is the shared `compareReleases`. The Done partition lives in the Release detail page; after a card crosses the boundary, focus is not recovered automatically.

## Alternatives considered

- Keep `updatedAt` ordering: rejected; edits reorder lists.
- Persisted user-controlled position: deferred; needs separate approval and a migration.
- Creation-order search: not chosen; recency ranking was kept deliberately.
- Sort the ticket API by status for the Done grouping: rejected; it is a Release-only presentation choice.
- Hide or collapse Done tickets: rejected; completed work must stay visible.

## Revisions

- 2026-11-21: Rewritten to goal-level form; folded ADR 0063's Done-section ordering clause.
