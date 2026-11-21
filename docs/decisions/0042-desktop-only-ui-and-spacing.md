# ADR 0042: Desktop-only UI and compact spacing

- Status: Accepted
- Date: 2026-10-06
- Supersedes: None
- Superseded by: None

## Context

The product is used on desktop. Responsive layouts, touch branches, and duplicated narrow-screen markup add complexity without serving the workflow. App spacing also needed one compact rule after live review showed large default padding in agenda filters.

## Goal

One desktop presentation, compact and consistent in spacing, without maintaining mobile or touch alternates.

## Decision

- Support desktop viewports only (roughly laptop width and wider). Smaller viewports are unsupported and may overflow; no mobile/tablet layouts are built or tested.
- No viewport- or touch-driven alternate UI paths. Keep desktop pointer workflows, keyboard accessibility, semantic controls, and desktop-local overflow handling such as the horizontally scrolling Ticket Board lanes.
- App-authored padding, margins, and gaps follow one shared compact spacing scale rather than ad-hoc values.
- Standard control sizing, hit areas, and keyboard behavior are not shrunk; reduce surrounding spacing instead.
- Fixed time-grid geometry is an exception, not a general spacing token.

## Consequences

The shell, agenda, board, hierarchy pages, and forms have one desktop composition. Behavior is checked at supported desktop sizes only. Time-grid geometry and domain semantics are unchanged.

## Implementation notes (non-binding)

- Current scale: 2px steps (2, 4, 6, 8, 12, 16px); 16px page insets and largest section gaps, 8px standard card/form padding, 4px compact cards and control gaps, 2px around border-only tool surfaces; 24px avoided. Minimum tested width is 1280px. The timeline uses 1px spacing around entries.

Spacing uses Tailwind's fractional utilities; card slot padding is overridden in the Nuxt UI theme config to 8px. No spacing dependency.

## Alternatives considered

- Keep responsive/touch layouts: rejected; desktop is the target.
- Reflow at every width: rejected; below 1280px is out of contract.
- Only 4px/8px multiples: rejected; filters and borders needed tighter 2px steps.
- Shrink select triggers by default: rejected; keep standard control sizing.

## Revisions

- 2026-11-21: Rewritten to goal-level form; the clauses superseding mobile parts of ADRs 0008, 0029, and 0035 were dropped (those owners folded them in); CI-scope remark and Tailwind/Nuxt UI specifics moved to notes.
