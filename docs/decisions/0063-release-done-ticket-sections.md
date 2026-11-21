# ADR 0063: Release Done ticket sections

- Status: Accepted
- Date: 2026-10-18
- Supersedes: None
- Superseded by: None

## Context

Long-lived releases accumulate completed tickets that bury unfinished work. Stable API ordering (ADR 0028) must stay intact.

## Goal

Release detail puts unfinished work first while keeping completed work visible.

## Decision

- Release detail shows unfinished tickets (including On hold) first, then a full-width separator labeled Done and a separate Done section below. API order is preserved within each section.
- Empty sections and the separator are omitted; with no tickets, the single empty state shows.
- Crossing the Done boundary moves the card after refresh. Writes, errors, invalidation, retry, and full-list completion counts stay with the page.
- This is a Release-only presentation; the API order, other routes, and the Board's quiet-Done policy (ADR 0046) are unchanged.

## Consequences

Done cards stay visible and fully interactive, including old Done tickets in undated releases. No data, schema, filter, or collapse control. After a card changes section, focus is not recovered automatically.

## Implementation notes (non-binding)

Verified in the Release detail page, which groups tickets into unfinished and Done sections. ADR 0028 also records this rule next to the ordering rules.

## Alternatives considered

- Sort the API by status: rejected; Release-only presentation.
- Hide or collapse Done: rejected; completed work must stay visible.
- Duplicate card markup per section: rejected; iterate groups with existing components.

## Revisions

- 2026-11-21: Rewritten to goal-level form; status changed Proposed → Accepted (verified implemented in Release detail); ordering clause folded into ADR 0028 and the supersession of it dropped.
