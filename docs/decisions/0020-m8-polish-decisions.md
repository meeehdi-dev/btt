# ADR 0020: Muted tracked time, link labels and hierarchy metrics

- Status: Accepted
- Date: 2026-09-27
- Supersedes: None
- Superseded by: None

## Context

Several presentation refinements were consolidated here: tracked time needed a consistent presentation, link labels were mandatory, hierarchy cards lacked metrics, and count badges were clipped in overflow-constrained cards. They change presentation and optional link-label storage, not ownership, archive, time-entry or status rules.

## Goal

Make time usage, hierarchy size and ticket context readable at a glance with consistent, compact presentation.

## Decision

### Tracked-time color

- Tracked time is muted/neutral everywhere (ticket cards, ticket detail, Agenda entries). There is no estimate, usage ratio, color or percentage (ADR 0067).

### Optional external-link labels

- Link labels are optional; URLs stay required and validated. An omitted label on create is stored as NULL; on PATCH, omitting preserves it and explicit `null` clears it. Blank form labels are omitted.
- A link shows its custom label, otherwise the URL hostname (including subdomains).

### Hierarchy metrics and layout

- Client and project cards show active child counts; release cards show active ticket count plus accessible Done/total progress (an empty release shows 0/0 and 0%). Archived descendants and descendants of archived ancestors are excluded; archived cards omit child metrics.
- Card metadata is left-aligned and wraps. Projects and client detail use the same project card.

### Ticket context triggers

- Each nonempty external-link collection has an accessible icon-only trigger with no count chip. Safe external anchors are preserved.

## Consequences

Usage reads consistently across Board, release and detail views, and tracked time never implies a positive or negative state. Metrics derive from existing owner-scoped data. Optional labels need a nullable column but keep existing labels.

## Implementation notes (non-binding)

- `TicketTrackedUsage.vue` renders muted tracked time.
- The Agenda's per-day workday progress is now a progress bar rather than colored text.

## Alternatives considered

- A separate ADR per refinement: consolidated at the user's request.
- Count chips on context triggers: rejected for consistent icon-only triggers.
- Counting archived descendants or persisting progress: rejected; ticket status is the source of truth.
- Primary color for tracked time: rejected; it implies a positive state.

## Revisions

- 2026-11-21: Rewritten to goal-level form; absorbed ADR 0019 (usage contrast; the Today summary clause is dropped as the Agenda now uses progress bars) and ADR 0047 (neutral tracked time without an estimate); removed the "supersedes parts of 0017–0019" line.
- 2026-11-23: Usage-ratio colors, percentages and related-ticket triggers removed with estimates and relations (ADR 0067); tracked time is always muted. Link labels and hierarchy metrics unchanged.
