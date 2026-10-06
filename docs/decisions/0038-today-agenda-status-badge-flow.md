# ADR 0038: Ordered status badge flow in Today agenda entries

- Status: Superseded by ADR 0039
- Date: 2026-10-01
- Supersedes: None
- Superseded by: [ADR 0039 — Keep Today agenda context controls in one flow](0039-today-agenda-context-control-flow.md)

## Context

M18 established conditional wrapping and horizontal scrolling for hierarchy badges in fixed-height desktop Day/Week timeline entries. The status selector remained a sibling outside the hierarchy group. In short blocks, the hierarchy scroller filled the available row width and pushed status toward the right edge, visually separating it from the client, project, and release badges.

## Decision

- In Today/Week time-entry cards, place the status badge immediately after the client, project, and release badges in one ordered badge strip.
- In fixed-height desktop entries under the existing 90-minute threshold, keep the combined strip on one line and allow horizontal scrolling within it when its contents overflow.
- At or above the existing threshold, allow the combined strip to wrap. Natural-height cards continue to wrap.
- Keep related-ticket and external-link icon actions outside the badge strip so they remain visible and operable.
- Preserve the existing status menu, hierarchy actions, compact styling, time-block geometry, and adjacent-entry behavior.

## Consequences

The status badge consistently follows the hierarchy badges instead of occupying a separate right-aligned position. Short entries may require horizontal scrolling to reach the status badge, so keyboard focus and scrolling must remain usable. No time-entry, status, API, schema, or dependency behavior changes.

## Alternatives considered

- Keep the status selector outside the hierarchy scroller: rejected because the flex-growing hierarchy group can separate it from the hierarchy badges.
- Put relation/external-link actions inside the scrolling strip: rejected because those controls should remain visible in short entries.
- Increase timeline scale or card minimum height: rejected because it changes time geometry and can visually overlap adjacent entries.

## Links

- `plans/today-ticket-status-badge-flow.md`
- `docs/milestones/m18-agenda-layout-and-weekly-add.md`
- [ADR 0031 — hierarchy badge wrapping](0031-hierarchy-badge-wrapping.md)
