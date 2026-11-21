# ADR 0004: Work hierarchy and archive lifecycle

- Status: Accepted
- Date: 2026-09-21
- Supersedes: None
- Superseded by: None

## Context

Tickets live in a Client → Project → Release hierarchy. Records must leave normal work views without losing recoverability, while still allowing intentional cleanup. Hierarchy pickers and color choices also need predictable states so users never face blank or stale selectors.

## Goal

A user-owned Client → Project → Release hierarchy where archiving is reversible and permanent deletion is explicit, ordered, and never accidental.

## Decision

- Clients are owned by the user; projects and releases inherit ownership through their parents.
- Archiving changes only the archived record. Descendants keep their own archive state but are hidden while an ancestor is archived; restoring the parent reveals those not independently archived.
- Archived records remain editable and restorable. Normal lists and selectors show active records; archive filters expose archived ones where the parent hierarchy is visible.
- Permanent deletion is a separate operation allowed only after archiving, child-first (releases, then projects, then clients). It never cascades, and the database enforces this with restrictive child foreign keys.
- Clients and projects have a validated six-digit hex color (default `#64748b`), chosen with one shared selector offering preset swatches and a custom hex value. Presets are accessible buttons.
- Required client/project selectors distinguish loading, failure, empty, stale-selection, and valid-selection states. Empty states link to the prerequisite creation page.
- The archive filter is an icon-only toggle with a tooltip and accessible name and pressed state.

## Consequences

UI and API must distinguish archive/restore from permanent deletion, and users delete in child-first order. Parent archival can hide active descendants without mutating them. One color selector keeps client and project UI consistent; users get actionable prerequisite states instead of blank selectors.

## Implementation notes (non-binding)

- Drizzle tables with nullable `archived_at`; color selector is `app/components/ColorSelector.vue` (16 presets plus Nuxt UI color picker; the picker takes no `swatches` prop, hence the custom preset buttons); archive toggle is `ArchiveFilterButton.vue`.

## Revisions

- 2026-11-21: Rewritten to goal-level form; absorbed ADR 0005 (color and selector-state rules; its validation rules moved to ADR 0023); storage and component details moved to notes.
