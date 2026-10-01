# ADR 0039: Keep Today agenda context controls in one flow

- Status: Accepted via Plannotator code review on 2026-10-01
- Date: 2026-10-01
- Supersedes: ADR 0038
- Superseded by: None

## Context

ADR 0038 placed the client/project/release and status badges in one conditional wrap/scroll strip but left related-ticket and external-link triggers outside it. In short fixed-height Day/Week entries, those icon triggers could still appear separated at the right edge.

## Decision

- In Today/Week time-entry cards, place all available context controls in one ordered strip: client, project, release, status, related-ticket trigger, external-link trigger.
- In fixed-height desktop entries under the existing 90-minute threshold, keep the strip on one line and allow horizontal scrolling when its contents overflow.
- At or above the threshold, allow the strip to wrap. Natural-height cards continue to wrap.
- Preserve the icon-only relation/external triggers and their existing popover behavior. Keep the strip's accessible names, filter/open actions, status menu, safe external anchors, and compact sizing.
- Apply this composition only to Today/Week entries. Other card surfaces retain their existing layout.
- Preserve time-block geometry, durations, overlap behavior, and adjacent-entry placement.

## Consequences

The hierarchy, status, relation, and external-link controls share one left-to-right flow instead of having trailing icon controls pinned outside the strip. Short entries may require horizontal scrolling to reach the trailing actions; keyboard focus and popover activation must remain usable. No API, schema, dependency, data, or domain-rule changes are introduced.

## Alternatives considered

- Keep relation/external-link triggers outside the strip: rejected because they can remain separated at the row's right edge.
- Move the controls into the strip on every card surface: rejected because the request concerns Today/Week time-entry cards only.
- Increase timeline scale or card minimum height: rejected because it changes fixed time geometry and can overlap adjacent entries.

## Links

- `plans/today-agenda-context-control-flow.md`
- `docs/milestones/m18-agenda-layout-and-weekly-add.md`
- [ADR 0038 — ordered status badge flow in Today agenda entries](0038-today-agenda-status-badge-flow.md)
- [ADR 0031 — hierarchy badge wrapping](0031-hierarchy-badge-wrapping.md)
- [ADR 0020 — M8 presentation decisions](0020-m8-polish-decisions.md)
