# ADR 0018: Consistent ticket context and icon controls

- Status: Accepted
- Date: 2026-09-26
- Supersedes: None
- Superseded by: None

## Context

External links were presented differently on board, release, and agenda cards (one item versus many, missing on some cards). Icon-only controls lacked consistent tooltips.

## Goal

A ticket's external links look and behave the same on every card type, and icon-only controls explain themselves.

## Decision

- External links are shown on ticket board cards, release ticket cards, and agenda entries through the same icon-triggered popover, even when only one item exists. A count appears on the icon only when there is more than one item.
- External links are real links that open in a new tab with safe attributes, so browser open-in-new-tab behavior is preserved.
- Context metadata comes through existing owner-scoped ticket and agenda reads; no per-card requests.
- Tracked time is shown muted (ADR 0020).
- Action buttons use matching icons; icon-only controls have tooltips. Native `title` is only for truncated-text hints. Surfaces use semantic theme colors, not raw palette colors.
- Client/project/release breadcrumbs sit inline before the page heading (ADR 0026).

## Consequences

List and agenda responses carry the context needed to render popovers. Interaction is the same for one or many items, and external links keep native semantics. No schema or ownership change.

## Implementation notes (non-binding)

Popovers and tooltips use Nuxt UI components; hierarchy/link popovers are shared components.

## Alternatives considered

- Direct link for one item, count badge for many: rejected; discoverability differs by count.
- Router buttons instead of anchors for external links: rejected; native link behavior required.
- Hard-coded palette colors for surfaces: rejected in favor of theme tokens.

## Revisions

- 2026-11-21: Rewritten to goal-level form; usage color thresholds moved to ADR 0020's ownership, UI library details moved to notes.
- 2026-11-23: Related tickets and estimates removed (ADR 0067); the shared popover now covers external links only and tracked time is shown without an estimate.
