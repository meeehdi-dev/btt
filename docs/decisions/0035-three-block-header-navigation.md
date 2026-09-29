# ADR 0035: Three-block header navigation

- Status: Accepted
- Date: 2026-09-29
- Supersedes: ADR 0015 — compact navigation and mobile control columns
- Superseded by: None

## Context

M7's shell uses a persistent desktop sidebar and a full-screen mobile navigation/search menu. The sidebar reduces the page's available width, while the account actions require opening a popover. The human requested a single header with navigation at the left, universal search in the middle, and direct account actions at the right.

## Decision

- Use a full-width shell with one responsive header and no sidebar or mobile navigation drawer.
- At roomy desktop widths, place three blocks in one row: `nxmr` plus Today, Tickets, Clients navigation on the left; the existing owner-scoped universal search centered; and the signed-in user's avatar/name with direct Settings and Sign out controls on the right.
- At narrow widths, stack the blocks left/search/right in that order. Keep navigation labels and direct account controls available, make search full-width, and prevent page-level horizontal overflow.
- Keep current destinations, active-route indication and keyboard behavior: `/` and Ctrl/⌘K focus the one search field; `g` then `t`, `c`, or `b` navigate to Today, Clients, or Tickets. The visual navigation order does not change those shortcut mappings.
- Keep avatar-image/fallback behavior and the POST-only `/api/logout` action. Do not add auth/API/schema changes.
- Retain ADR 0015's guidance independent of shell placement: compact page introductions while preserving accessible page names and detail context; stack touched spaced controls vertically on mobile; keep Today progress based on the unfiltered day and ordered between date controls and Add; retain existing ticket-board status-control policy.

## Consequences

The content area no longer reserves sidebar width, and there is one search/navigation surface at desktop and mobile sizes. Narrow layouts use more vertical header space to keep navigation and account actions visible without a drawer. Browser-local sidebar expansion state is no longer read or written; any old key is inert. Search ownership, session behavior, route destinations, and logout semantics remain unchanged.

## Alternatives considered

- Keep the desktop sidebar and mobile drawer: rejected because the sidebar consumes page width and the user requested its removal.
- Hide mobile navigation or account actions behind a menu: rejected in favor of the same three-block structure and directly available controls.
- Keep Settings and sign-out inside an account popover: rejected because both actions should be direct controls.
- Change the search API, keyboard mappings, auth flow, or persist navigation preferences in user settings: not needed for this presentation change.

## Links

- `docs/milestones/m23-three-block-header-navigation.md`
- `docs/milestones/m7-search-and-ui-polish.md`
- `docs/decisions/0003-m1-authentication-and-database.md`
- `docs/decisions/0015-compact-navigation-and-mobile-columns.md` (superseded)
- `docs/decisions/0033-no-compatibility-route-for-project-collection.md`
