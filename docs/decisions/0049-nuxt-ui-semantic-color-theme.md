# ADR 0049: Semantic color roles and contrast

- Status: Accepted
- Date: 2026-10-08
- Supersedes: None
- Superseded by: None

## Context

The default palette (green primary, slate neutral) was replaced by a warm amber primary and zinc neutral. Compact client/project/release hierarchy badges use the secondary role. Default shade 500 of amber on white has about 1.95:1 contrast, too low for normal text.

## Goal

Use semantic color roles (primary, neutral, warning, and the others) with readable contrast in light and dark mode.

## Decision

- Primary is amber and neutral is zinc. Secondary and info are blue, success is green, warning is orange, error is red.
- Role foregrounds use deeper shades in light mode and lighter shades in dark mode so normal text stays readable.
- Secondary blue stays the compact hierarchy badge accent. Tracked time stays muted (ADR 0020).
- Warning is orange everywhere.
- Stored client/project colors and their selector presets are separate user data and are not changed.

## Consequences

Warm amber accents, zinc chrome, and blue hierarchy badges with readable contrast in both modes. No API, data, or domain-rule change.

## Implementation notes (non-binding)

- Palette names are set in the Nuxt UI app config; shade overrides are CSS tokens (light 800, dark 300 for non-primary roles; primary amber-800 light, amber-200 dark).

## Alternatives considered

- Default shade 500 for amber primary: rejected; fails normal-text contrast.
- Zinc for secondary badges: rejected; blue is the established hierarchy accent.
- Default yellow warning: rejected; orange is the established warning color.
- Recolor stored client/project colors: rejected; they are user-managed.

## Revisions

- 2026-11-21: Rewritten to goal-level form; palette and shade details moved to implementation notes.
- 2026-11-23: Removed estimate usage-band references; ticket estimates were removed (ADR 0067).
