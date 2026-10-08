# ADR 0049: Nuxt UI semantic colors and contrast

- Status: Accepted
- Date: 2026-10-08
- Supersedes: None
- Superseded by: None

## Context

The app used Nuxt UI's default semantic color palettes: green primary, blue secondary/info, green success, yellow warning, red error, and slate neutral. The user requests amber primary and zinc neutral, and asks whether blue secondary is used and appropriate. Secondary is used by the compact client/project/release hierarchy badges. The app's estimate-usage policy already assigns info/blue below 80%, success/green from 80% to below 100%, warning/orange from 100% through 120%, and error/red above 120% (ADR 0020).

Nuxt UI's default semantic shade is 500 in light mode and 400 in dark mode. The installed Tailwind palette gives amber-500 only 1.95:1 contrast on white, insufficient for normal text. The planned amber-800 light / amber-200 dark primary shades give 5.73:1 on white and 12.41:1 on zinc-900.

## Decision

- Configure Nuxt UI semantic palettes as primary amber, secondary blue, info blue, success green, warning orange, error red, and neutral zinc.
- Override semantic CSS shade tokens to support readable foregrounds: use shade 800 in light mode and shade 300 in dark mode for secondary, info, success, warning, and error. Use primary amber-800 in light mode and amber-200 in dark mode.
- Continue using secondary blue for compact hierarchy badges. Preserve the existing tracked-time usage thresholds and the muted no-estimate behavior in ADR 0047.
- Do not change client/project color defaults, selector presets, or stored entity colors.

## Consequences

The app has a warm amber primary accent, zinc neutral surfaces/chrome, and blue compact hierarchy badges. Primary and semantic status foregrounds use deeper/light-mode and lighter/dark-mode palette shades to provide contrast. Warning becomes orange throughout its semantic UI uses, aligning it with the already-approved 100–120% tracked-time band. No API, data, dependency, or domain-rule changes are made.

## Alternatives considered

- Use the default shade 500 for amber primary: rejected because amber-500 on white is 1.95:1 and fails normal-text contrast.
- Use neutral zinc for secondary hierarchy badges: rejected in favor of blue's existing, complementary hierarchy accent.
- Keep the default yellow warning palette: rejected because warning represents the orange tracked-time band and is currently inconsistent with the documented meaning.
- Change stored client/project color values to match the application palette: rejected because those are separate user-managed colors, not Nuxt UI semantic roles.

## Links

- Approved plan and implementation evidence: [M35](../milestones/m35-nuxt-ui-color-theme.md)
- [ADR 0020 — M8 presentation decisions](0020-m8-polish-decisions.md)
- [ADR 0047 — muted tracked time without an estimate](0047-muted-tracked-time-without-estimate.md)
- [Nuxt UI maintainer design-system guidance](https://github.com/nuxt/ui/blob/187c34f0234a769da2c7c344f93d6c603d0bb514/skills/nuxt-ui/references/guidelines/design-system.md)
