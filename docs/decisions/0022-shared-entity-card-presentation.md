# ADR 0022: Shared entity-card presentation shell

- Status: Accepted
- Date: 2026-09-27
- Supersedes: None
- Superseded by: None

## Context

Client, Project, Release, and Ticket cards had related but independently implemented heading and context rows. Their presentation drifted, while their interaction ownership intentionally differs: most cards provide whole-card navigation with nested controls, whereas board cards remain draggable and navigate through the ticket title. M9 approved a shared two-row presentation without erasing those differences.

## Decision

- Use a presentational, slot-based `EntityCard` shell for a heading row and a context row, with shared semantic surface, border, hover, and focus treatment.
- Keep entity data, navigation, actions, drag behavior, and nested-control precedence in the entity-specific wrappers. The shell must not fetch data or impose navigation semantics.
- Keep hierarchy metadata left-aligned and allow it to wrap on narrow screens. Contexts that intentionally need a single-line hierarchy (such as board and release-ticket cards) may own horizontal scrolling within their context row.
- Keep Project and Client title colors stable on hover; use the shared card border/focus treatment instead.
- Render release completion with a compact accessible SVG ring beside the retained ticket icon and numeric done/total fraction. Omit the visible “done” suffix and percentage; the progressbar value text continues to describe completion and percentage, including the active empty-release case. Do not add a dependency for a circular progress indicator.

## Consequences

Card wrappers can share spacing and visual treatment while preserving the existing meaning and behavior of links, buttons, labels, popovers, board dragging, and title navigation. Changes to the common two-row layout can be made once; domain-specific context and any responsive overflow behavior remain with the wrapper. The ring remains presentation-only and derives its values from the existing release response. No data, API, dependency, authentication, or stored-domain changes are introduced.

## Alternatives considered

- Continue maintaining independent card markup: rejected because it permits avoidable presentation drift.
- Put entity data, routing, and many domain-specific modes in one generic card component: rejected because wrappers must retain semantic and interaction ownership.
- Make board cards fully clickable: rejected because it would change the established title-navigation and drag interaction.
- Replace both the ticket icon and progress bar with a ring and visible percentage: rejected after the human's clarification; retain the icon and numeric fraction and omit only the visible suffix/percentage.
- Use a circular `UProgress` option or add a dependency: rejected because the installed Nuxt UI version has no circular variant and the SVG ring needs no dependency.

## Links

- `plans/wide-app-composability-effect-pass.md`
- `docs/milestones/m9-shared-card-composition.md`
- [ADR 0018 — ticket context and application UI consistency](0018-ticket-context-and-application-ui-consistency.md)
- [ADR 0020 — M8 presentation decisions](0020-m8-polish-decisions.md)
