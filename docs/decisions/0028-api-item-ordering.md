# ADR 0028: Stable API item ordering

- Status: Accepted
- Date: 2026-09-28
- Supersedes: None
- Superseded by: None

## Context

Several collection APIs used `updatedAt DESC`. Since normal edits update that timestamp, records could move unexpectedly in client/project lists, ticket lanes, and Release detail. Release collections also had different ordering at the API and project-detail page. Ticket detail returned related tickets and external links without explicit ordering.

## Decision

- Order client and project collections by `createdAt DESC`, then ID DESC.
- Order release collections with the shared `compareReleases` rule: undated first; then target date ASC; then name ASC; then `createdAt DESC`; then ID ASC only when creation timestamps tie.
- Order ticket collections with estimated tickets first, then `createdAt DESC` and ID DESC within each estimate-presence group. Do not sort by estimate amount.
- Keep global search recency-ranked by `updatedAt DESC` with its existing ID tie-break. Search is the explicit exception to other entity collection policies.
- Keep agenda entries chronological by start minute and ID. Keep ticket time history by date DESC, start minute DESC, then ID DESC.
- Return ticket-detail external links by label ASC/ID ASC and related tickets by title ASC/ID ASC, matching the ticket list response.
- Continue updating `updatedAt` on edits for its other uses; do not use it for collection ordering except search.

## Consequences

Ordinary edits no longer reorder client, project, ticket, or release collections. Status changes leave a ticket's position stable in Release detail and within its board lane, although a status change still moves it to the correct lane. Changing estimate presence intentionally moves a ticket between the estimated and unestimated groups. Release list APIs and project detail share one order. Existing date/time ordering and search recency behavior remain explicit. No schema migration, dependency, or persisted manual-order field is required.

## Alternatives considered

- Continue sorting entity collections by `updatedAt`: rejected because a routine edit changes position.
- Add a persisted user-controlled position: deferred; this requires separate product approval and a data-model/migration plan.
- Change search to creation-time order: not selected; the user explicitly chose to retain updated-time search ranking.

## Links

- `docs/milestones/m15-api-item-ordering.md`
- `docs/milestones/m14-release-ticket-status-actions.md`
- [ADR 0027 — Release ticket status badge actions](0027-release-ticket-status-actions.md)
