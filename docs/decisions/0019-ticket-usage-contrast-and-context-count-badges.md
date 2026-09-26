# ADR 0019: Ticket usage contrast and context count badges

- Status: Accepted
- Date: 2026-09-26
- Supersedes: None
- Superseded by: None

## Context

M7 code review confirmed that tracked and estimated durations were visually indistinguishable, Today’s worked duration and target used the same muted color, and count badges could be clipped by overflow-constrained ticket contexts. The human also requested tracked/estimate usage on ticket board cards, expanding the original M7 release-card-only display.

## Decision

- Show tracked time alongside estimate and usage percentage on ticket board cards as well as release ticket cards. Keep the tracked-time value visually emphasized with the primary semantic text color and the estimate muted; retain the approved percentage bands from ADR 0018.
- In Today’s workday summary, emphasize the worked duration with the primary semantic text color and keep the target muted. Preserve the existing unfiltered progress source from ADR 0012.
- Keep multi-item relation/external-link count badges overlaid at the icon’s top-right, but constrain the badge within the trigger bounds so overflow-constrained board and agenda contexts do not clip it.

## Consequences

The board and release card usage displays share one component and the same visual hierarchy. Daily progress clearly distinguishes completed work from its target. Relation and external-link counts remain visible inside horizontal-scrolling or clipped cards. No schema, authentication, persistence, or dependency changes are required.

## Alternatives considered

- Leave board cards estimate-only: rejected because the human requested the same tracked/estimate distinction on the board.
- Keep the full half-outside count badge: rejected because it is clipped in overflow-constrained contexts.
- Color tracked time with raw palette utilities: rejected in favor of the existing Nuxt UI semantic `text-primary` and `text-muted` tokens.

## Links

- `docs/decisions/0012-today-agenda-settings-and-history.md`
- `docs/decisions/0018-ticket-context-and-application-ui-consistency.md`
- `plans/m7-search-and-ui-polish.md`
- `docs/milestones/m7-search-and-ui-polish.md`
