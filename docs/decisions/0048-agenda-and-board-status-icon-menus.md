# ADR 0048: Status icon menus and Board interactions

- Status: Accepted
- Date: 2026-10-08
- Supersedes: None
- Superseded by: None

## Context

The Board originally had a dedicated drag handle and a per-card status selector; review found the handle gave a tiny drag image and the selector made cards busy. A next-status arrow was later removed too. The Agenda showed a labeled status badge in each entry's context strip, while the status icon beside the title was part of the ticket link. The human asked for the title-adjacent icon to open a status menu on both surfaces so the two cards stay similar.

## Goal

A ticket's status can be changed directly and similarly from Agenda entries and Board cards, with minimal card clutter, while desktop drag stays the primary Board move.

## Decision

- On Agenda entries and Board cards, the status icon beside the ticket title is a separate icon-only trigger that opens a flat menu of the fixed statuses. The title link still navigates to ticket detail; the icon never navigates. The Agenda has no separate status badge.
- The menu marks the current status and disables options for archived or busy tickets. Each surface keeps its existing status write, refresh, error, retry and accessibility behavior; no API, schema or transition rules change.
- Board drag-and-drop is desktop-only (no touch drag) and remains: an active card can be grabbed from any non-interactive surface; the drag image follows the pointer; the target lane is highlighted with usable top/bottom drop space in populated lanes; every status is a valid destination; lanes scroll at edges and moves save to the server. The menu supplements drag.
- There is no next-status arrow and no per-card arbitrary-status selector on the Board.
- Adjacent empty separators/footers on cards, detail or release views are suppressed.

## Consequences

Agenda entries have one status action near the ticket identity. Board cards gain a pointer- and keyboard-accessible status action, closing the earlier gap where non-drag users had only the edit form. Title navigation is independent of status changes. Other ticket identity surfaces keep their presentation.

## Implementation notes (non-binding)

- Menu: `TicketStatusMenu.vue`; Board drag in `app/pages/tickets/index.vue`; card in `TicketBoardCard.vue`.

## Alternatives considered

- Keep the Agenda badge and make only its icon clickable: rejected as redundant.
- Agenda only: rejected; the human wanted both surfaces similar.
- Replace drag with the menu: rejected; the menu supplements it.
- Keep the icon inside the title link: rejected; nested interactive elements are inaccessible and one click cannot do both.
- Dedicated drag handle, per-card selector, next-status arrow, or touch drag: rejected in review (discoverability, density, desktop-only policy).

## Revisions

- 2026-11-21: Rewritten to goal-level form; absorbed ADR 0010 (full-card Board drag, no per-card selector, hidden missing estimates) and ADR 0013 (no next-status arrow); the earlier deferred non-drag gap is closed by the icon menu.
- 2026-11-23: Estimate display removed (ADR 0067); the missing-estimate placeholder rule is dropped; only empty separator/footer suppression remains.
