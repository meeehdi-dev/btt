# ADR 0049: Semantic color roles and contrast

- Status: Accepted
- Date: 2026-10-08
- Supersedes: None
- Superseded by: None

## Context

The default palette (green primary, slate neutral) was replaced by a warm amber primary and zinc neutral. Compact client/project/release hierarchy badges use the secondary role. Estimate usage already maps to semantic roles (ADR 0020): info below 80%, success from 80% to below 100%, warning from 100% through 120%, error above 120%. Default shade 500 of amber on white has about 1.95:1 contrast, too low for normal text.

## Goal

Use semantic color roles (primary, neutral, warning, and the others) with readable contrast in light and dark mode, while usage colors keep their meaning.

## Decision

- Primary is amber and neutral is zinc. Secondary and info are blue, success is green, warning is orange, error is red.
- Role foregrounds use deeper shades in light mode and lighter shades in dark mode so normal text stays readable.
- Secondary blue stays the compact hierarchy badge accent. Estimate-usage thresholds and the muted no-estimate behavior (ADR 0047) are unchanged.
- Warning is orange everywhere, matching the 100-120% usage band.
- Stored client/project colors and their selector presets are separate user data and are not changed.

## Consequences

Warm amber accents, zinc chrome, and blue hierarchy badges with readable contrast in both modes. No API, data, or domain-rule change.

## Implementation notes (non-binding)

- Palette names are set in the Nuxt UI app config; shade overrides are CSS tokens (light 800, dark 300 for non-primary roles; primary amber-800 light, amber-200 dark).

## Alternatives considered

- Default shade 500 for amber primary: rejected; fails normal-text contrast.
- Zinc for secondary badges: rejected; blue is the established hierarchy accent.
- Default yellow warning: rejected; it contradicted the orange usage band.
- Recolor stored client/project colors: rejected; they are user-managed.

## Revisions

- 2026-11-21: Rewritten to goal-level form; palette and shade details moved to implementation notes.
