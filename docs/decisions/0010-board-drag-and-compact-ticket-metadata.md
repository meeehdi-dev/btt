# ADR 0010: Full-card desktop board drag and compact ticket metadata

- Status: Accepted
- Date: 2026-09-25
- Supersedes: 0009 (retains its desktop-only policy; replaces its M3.5 board-control requirement)
- Superseded by: None

## Context

The first M3.5 code review found that a dedicated drag handle showed only a handle-sized native drag preview and made the card harder to grab. The per-card arbitrary-status selector made the card too busy. The earlier ticket UI also displayed “No estimate” where no estimate was set. The reviewer explicitly requested full-card dragging, room to drop in populated lanes, removal of the selector, and compact display across the app, and deferred choosing a mobile alternative.

## Decision

- Dragging remains **desktop/tablet only** on the ticket board and for future agenda blocks. An active ticket card can be grabbed from any noninteractive surface; links and buttons remain ordinary interactive elements. Show a full-card drag image following the pointer, highlight the drop lane, and provide usable top/bottom lane drop space. Retain all-status destinations, board-local edge scrolling, server-backed saves and the accessible next-status arrow.
- Remove the per-card arbitrary-status selector. For now, the board has **no direct mobile/keyboard control for arbitrary moves** (rollback or moving out of Done); choosing a suitable alternative is an explicit follow-up. The existing ticket edit form is still available but is not being claimed as an equivalent board control. Do not introduce mobile touch drag to fill the gap. M6 must still define non-drag mobile agenda controls in its own plan.
- Suppress missing/undefined ticket estimates in the board, ticket detail and release detail (and any future use of the shared estimate component), including adjacent empty separators/footers. Display actual estimates with their clock icon and duration. Prefer compact but readable UI; avoid placeholder text that provides no useful information.

## Consequences

A desktop card can be dragged without aiming for an icon, while links/buttons remain clickable. Cards and summaries take less space when no estimate exists. Mobile/keyboard users still have the next-status arrow when available and the existing edit form, but there is no direct board action for skipping, reversing, or leaving Done until a later approved interaction design; this is a knowingly deferred accessibility/UX gap, not a solved requirement. No backend transition or auth changes are involved.

## Alternatives considered

- Retain the dedicated handle and per-card selector from the earlier approved M3.5 plan: rejected in first code review for discoverability and visual density.
- Treat the edit form as the approved mobile/keyboard board equivalent: explicitly rejected by the human; a later design is required.
- Touch drag on mobile: still rejected under the desktop-only policy.

## Links

- `docs/milestones/m3.5-ticket-board-status-moves.md`
- `docs/decisions/0009-desktop-only-drag-and-drop.md`
- `docs/decisions/0008-ticket-estimates-and-board-layout.md`
