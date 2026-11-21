# ADR 0037: Searchable selectors for user-managed data

- Status: Accepted
- Date: 2026-10-01
- Supersedes: None
- Superseded by: None

## Context

Selectors for clients, projects, releases, and tickets grow with user data and become hard to use as plain dropdowns. Fixed choices such as ticket status are small and closed.

## Goal

Choosing among user-managed entities stays practical as the lists grow, while fixed choices stay simple.

## Decision

- Selectors backed by user-managed entity collections are searchable, with an entity-specific search placeholder.
- Fixed, code-defined choices (ticket status, duration presets, agenda settings) use plain selects.
- Searching is client-side presentation only; ownership/archive filtering, values, labels, validation, and API contracts are unchanged.

## Consequences

Entity pickers share one interaction pattern. Plain selects stay for short closed sets. No API or schema change.

## Implementation notes (non-binding)

Searchable pickers use Nuxt UI `USelectMenu`; plain ones use `USelect`.

## Alternatives considered

- Plain selects everywhere: rejected; lists grow.
- Searchable fixed-choice selects: rejected; unnecessary.
- Server-side search endpoints: rejected; choices are already loaded.

## Revisions

- 2026-11-21: Rewritten to goal-level form; component names moved to notes; touch-autofocus clause dropped (desktop-only, ADR 0042).
