# ADR 0015: Compact navigation and mobile control columns

- Status: Accepted
- Date: 2026-09-26
- Supersedes: None
- Superseded by: None

## Context

M7 adds universal search and removes redundant page introductions. The human requested a desktop sidebar, a full-screen mobile menu, and clarified in plan review that spaced horizontal control rows should become columns on mobile rather than wrapping unevenly.

## Decision

- Use a top search bar and a desktop left navigation rail, collapsed to labeled icons by default; persist its expanded state in browser local storage. Place Settings, user identity and sign-out at the rail bottom. On mobile use a top-bar menu button opening a full-screen, accessible navigation/search menu rather than retaining the rail. Keep search authenticated and owner-scoped on the server; no auth or schema changes.
- On list/Today/Settings views, prioritize content over decorative page headings/descriptions. Keep accessible page names, meaningful empty/error messages and compact entity title/breadcrumb/actions on details and forms.
- On wider screens spread action/control groups where appropriate; on mobile stack **each touched spaced row** as an ordered vertical column, keeping tightly related controls such as previous/date/next grouped inside their column item. Use this mobile-column convention on future views too unless a reviewed design calls for another arrangement.
- On Today, progress always uses the unfiltered day total (ADR 0012) and sits between day controls and Add in that mobile column. On ticket board keep status in lane headings, not card badges; preserve drag/edit status behavior (ADRs 0010/0013).

## Consequences

Compact layouts free vertical space on desktop, while mobile controls remain ordered and reachable without horizontal scroll. Search and menu need keyboard/touch/focus checks; the sidebar preference is device-local rather than user-account data. Historical entries remain accessible via Today/history even when ordinary search excludes archived ancestors.

## Alternatives considered

- A permanent mobile icon rail: rejected because it consumes the working area.
- Wrapping horizontal toolbars on mobile: rejected in human plan review in favor of explicit column layout.
- Persist sidebar state in the database: unnecessary schema change for a browser-local preference.

## Links

- `plans/m7-search-and-ui-polish.md`
- `docs/milestones/m7-search-and-ui-polish.md`
- `docs/decisions/0012-today-agenda-settings-and-history.md`
- `docs/decisions/0013-board-status-control-removal.md`
