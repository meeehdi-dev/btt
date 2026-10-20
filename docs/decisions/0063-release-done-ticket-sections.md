# ADR 0063: Release Done ticket sections

- Status: Proposed
- Date: 2026-10-18
- Supersedes: ADR 0028 only for Release detail presentation across the Done boundary
- Superseded by: None

## Context

Long-lived releases accumulate completed tickets that obscure unfinished work. ADR 0028 keeps API ordering stable and historically kept Release cards stationary on status changes.

## Decision

On every Release detail page, render a stable partition of the default ticket response: unfinished tickets first (including On hold), then a full-width horizontal separator labeled Done and a separate two-column Done grid. Preserve API response order within each section. Omit empty sections and the separator when there are no Done tickets; preserve the single empty state when there are no tickets.

Crossing the Done boundary moves a card after refresh. Section remounts use default browser/component focus behavior, without automatic focus recovery; users may need to explicitly focus/tab to the replacement control. Keep writes, errors, invalidation, retry, and full-list completion counts page-owned.

## Consequences

Done cards remain visible and fully interactive, including old Done tickets in undated releases. API order, other routes, and ADR 0046's Board-only visibility policy are unchanged. No data, schema, dependency, filter, or collapse control is introduced. ADR 0028's remaining ordering rules continue to apply; its historical text is preserved.

## Alternatives considered

- Sort the API response by status: rejected because this is a Release-only presentation choice.
- Hide or collapse Done: rejected because completed work must remain visible.
- Duplicate card markup: rejected in favor of a page-local group iteration using existing components.

## Links

- [Approved plan](../../plans/release-done-tickets-bottom.md), [approved focus amendment](../../plans/release-focus-simplification.md), [M47 evidence](../milestones/m47-release-done-tickets-bottom.md)
- [ADR 0028](0028-api-item-ordering.md), [ADR 0027](0027-release-ticket-status-actions.md), [ADR 0046](0046-quiet-done-ticket-board-visibility.md)
