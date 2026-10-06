# ADR 0042: Desktop-only UI and compact spacing system

- Status: Accepted
- Date: 2026-10-06
- Supersedes: responsive/mobile presentation clauses in ADRs 0008, 0029, and 0035 only
- Superseded by: None

## Context

The current product is used on desktop. Maintaining responsive layouts, touch-specific branches, and duplicated narrow-screen markup adds complexity without supporting the intended workflow. Application spacing also needs a consistent compact rule. The M28 plan was approved through Plannotator with a supported minimum viewport of 1280 CSS px. Its original 4px spacing policy was replaced by a human-approved compactness amendment on 2026-10-06 after live-app review exposed large Nuxt UI responsive surface padding in the agenda filters.

## Decision

- Support one application presentation at viewports 1280 CSS px and wider. Smaller viewports are unsupported and may overflow; do not maintain or test mobile/tablet-specific layouts.
- Remove viewport/touch-driven alternate UI paths. Preserve desktop pointer workflows, keyboard accessibility, semantic controls, domain behavior, and useful desktop-local overflow handling such as the seven-lane Ticket Board scroller.
- Use a compact role-based 2px spacing scale for app-authored padding, margins, gaps, and stack spacing: 2, 4, 6, 8, 12, and 16px. Target 16px page insets/largest section gaps, 8px standard card/form padding, 4px compact-card padding and related-control gaps, and 2px padding around border-only filter/tool surfaces. Avoid 24px layout spacing unless specifically justified and recorded; use Tailwind fractional spacing utilities rather than adding tokens or dependencies.
- Override the default Nuxt UI Card header/body/footer slot padding through the app theme config at 8px, replacing responsive defaults such as `sm:p-6`. Use local 2px body padding for agenda/board filter cards. Preserve standard Nuxt UI select-trigger sizing, hit areas, labels, and keyboard/pointer behavior.
- Preserve the 1px `py-px` timeline-entry wrapper spacing in Day and Week as a fixed time-grid geometry exception, not a general layout token.
- Supersede only: ADR 0008's stacked mobile lanes and responsive gutters; ADR 0029's narrow stacked Week/correction presentation and touch-specific alternatives; and ADR 0035's narrow stacked header. All other decisions in those ADRs remain authoritative.
- Keep M27 and CI separate. This UI decision makes no claim about GitHub Actions runner assignment and authorizes no remote CI run or CI-policy change.

## Consequences

The authenticated shell, agenda, board, hierarchy pages, and forms have one desktop composition. Mobile-only browser scenarios are retired; behavior coverage remains at supported desktop viewports. Timeline interaction geometry and data/domain semantics stay unchanged. The approved compact spacing scale reduces visual bulk while retaining standard interactive-control sizing and component-specific roles.

## Alternatives considered

- Continue responsive and touch-specific layouts: rejected because the supported product target is desktop-only.
- Replace mobile-specific views with simple reflow at every width: rejected because viewports below 1280 CSS px are outside the support contract.
- Enforce only 8px or 4px multiples: rejected because the human requested more compact border, filter, and component spacing; Tailwind's fractional scale already supports 2px steps.
- Shrink Nuxt UI select triggers by default: rejected in the approved amendment; reduce surrounding app-authored spacing and preserve standard control sizing and hit targets.
- Add a new spacing dependency: rejected; Tailwind's native scale is sufficient.

## Links

- `docs/milestones/m28-desktop-only-ui-cleanup.md`
- `docs/decisions/0008-ticket-estimates-and-board-layout.md`
- `docs/decisions/0029-weekly-agenda-and-conflict-previews.md`
- `docs/decisions/0035-three-block-header-navigation.md`
- <https://tailwindcss.com/docs/theme>
- <https://www.carbondesignsystem.com/building-blocks/foundations/spacing/overview>
- <https://www.carbondesignsystem.com/building-blocks/foundations/2x-grid/overview>
