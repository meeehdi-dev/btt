# ADR 0018: Ticket context and application UI consistency

- Status: Accepted
- Date: 2026-09-26
- Supersedes: None
- Superseded by: None

## Context

M7 review requested consistent ticket relations/external links across board, release, and Today cards, clearer estimate usage, and an app-wide icon, tooltip, and contrast pass. Existing board relations used different presentations for one versus multiple items; release and Today cards did not expose the same link context.

## Decision

- Use shared icon-triggered popovers for related tickets and external links in ticket board cards, release ticket cards, and Today entries, even when only one item exists. Overlay a count on the top-right of an icon only when that collection has more than one item.
- Related tickets are internal application links; board clicks retain the existing highlight/locate behavior when the target is visible. External destinations are native `<a>` elements with safe new-tab attributes so browser context-menu/open-in-new-tab behavior is preserved.
- Read relation and external-link metadata through the existing owner-scoped ticket and agenda APIs. Do not add persistence or alter ownership/archive policies.
- Show tracked time and estimate together where an estimate exists. Usage colors are blue below 80%, green from 80% to below 100%, orange from 100% through 120%, and red above 120%.
- Use matching icons on app action buttons and Nuxt UI tooltips for icon-only controls; retain native `title` only for truncated-content hints, not button tooltips. Use Nuxt UI semantic surfaces and borders for card/list contrast rather than raw palette colors. Keep client/project/release breadcrumbs inline before the current-page heading.

## Consequences

The ticket list and agenda responses include the context required to render these popovers without per-card requests. Popovers have consistent hover, keyboard, and touch entry points, while external links retain standard browser semantics. The shared usage palette and combined display are consistent between release cards and ticket time summaries. No schema, dependency, authentication, or stored-domain changes are introduced by this decision.

## Alternatives considered

- Show a direct relation link for one item and a count badge for multiple: rejected because the interaction and discoverability differ by count.
- Replace external anchors with router buttons or click handlers: rejected because native link behavior is required.
- Use hard-coded Tailwind palette colors for surfaces: rejected in favor of Nuxt UI semantic tokens that adapt to theme.

## Links

- `plans/m7-search-and-ui-polish.md`
- `docs/milestones/m7-search-and-ui-polish.md`
- `docs/decisions/0017-release-usage-and-ticket-detail-polish.md`
