# ADR 0005: M2 domain validation and hierarchy UI polish

- Status: Accepted
- Date: 2026-09-21
- Supersedes: None
- Superseded by: None

## Context

M2 follow-up work adds client colors, reliable preset selection, empty-state handling for required hierarchy pickers, and more explicit validation outcomes. Existing endpoints accepted untyped request bodies and the UI passed an unsupported `swatches` prop to Nuxt UI v4 `UColorPicker`.

## Decision

- Store client colors as six-digit hex values with `#64748b` as the migration/backfill default.
- Use explicit accessible preset buttons around `UColorPicker`; do not pass unsupported `swatches` props to Nuxt UI v4.
- Reuse one color selector for clients and projects.
- Required client/project selectors must distinguish loading, failure, empty, stale selection, and valid selection states; empty states link to the prerequisite creation page.
- Use an icon-only archive filter button with tooltip and accessible pressed/name state.
- Use Effect v4 `Schema` and `decodeUnknownEffect` for hierarchy request boundaries. Use tagged domain errors for validation, authentication, not-found, and conflict outcomes, mapping them to stable HTTP errors at the Nitro boundary.

## Consequences

Request validation is centralized and typed, while handlers remain responsible for persistence and ownership. Color selection has a small reusable UI surface instead of relying on unsupported component props. Users receive actionable prerequisite states instead of blank selectors.

## Links

- `plans/m2-domain-ui-polish.md`
- `docs/milestones/m2-core-data-model.md`
- <https://effect.website/docs/v4/schema/getting-started>
- <https://ui.nuxt.com/docs/components/color-picker>
