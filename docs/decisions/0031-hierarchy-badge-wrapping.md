# ADR 0031: Wrap hierarchy badge groups in cards

- Status: Accepted via Plannotator code review on 2026-09-29
- Date: 2026-09-29
- Supersedes: ADR 0022's horizontal-scrolling allowance for hierarchy badge groups only
- Superseded by: None

## Context

Several card contexts display client/project/release badges. Agenda entries, ticket-board cards, project-detail release cards, and release-detail ticket cards used horizontally scrollable context rows. Project cards already allowed their hierarchy context to wrap. The user requested consistent wrapping instead of horizontal scrolling in every card that displays hierarchy badges.

## Decision

- Allow hierarchy badge groups to wrap in Today/Week time-entry cards, Ticket Board cards, Project cards, project-detail release cards, and release-detail ticket cards when the card has natural or sufficient vertical space.
- Fixed-height desktop Day/Week timeline entries are a narrow exception. Reduce card padding and badge size; wrap hierarchy badges only when the time block can contain the additional row. Otherwise keep the hierarchy group on one line and allow horizontal scrolling within that group. Do not grow the card beyond its duration-derived block or allow adjacent entries to overlap visually.
- Keep full accessible names and existing hierarchy filter/open actions available while badges are compact or horizontally scrolled. Keep labels bounded/truncated where the card already has that treatment; wrapping concerns the badge group, not unrelated ticket-title or estimate/usage rows.
- Preserve other interactions, including status controls, relations, external links, card navigation, and board dragging.

## Consequences

Hierarchy context remains visible without vertical clipping. Natural-height and sufficiently tall contexts wrap; short time-scaled desktop entries may require horizontal panning within the hierarchy group. Time-entry geometry, stored data, API, and dependencies remain unchanged. Tests and manual checks verify badge visibility/accessibility and ensure adjacent entries remain distinct.

## Alternatives considered

- Keep horizontal scrolling in dense board/release contexts: rejected by the user's follow-up request for wrapping in all hierarchy-badge cards.
- Change ticket title/usage overflow behavior as part of the same work: rejected; those rows are unrelated to hierarchy badges.
- Change agenda entry duration/geometry to make room for badges: rejected; stored and rendered time geometry remains unchanged.

## Links

- `docs/milestones/m17-agenda-ui-refinements.md`
- [ADR 0022 — shared entity-card presentation shell](0022-shared-entity-card-presentation.md)
