# ADR 0009: Desktop-only drag-and-drop interactions

- Status: Superseded
- Date: 2026-09-25
- Supersedes: None
- Superseded by: 0010-board-drag-and-compact-ticket-metadata.md

## Context

The M3.5 ticket board has seven adjacent status lanes on desktop but collapsible status sections on mobile. The original M6 roadmap also mentioned touch-dragging agenda blocks. During Plannotator review of the M3.5 plan, the human clarified that drag/drop should always be desktop-only, including for M6.

## Decision

- Use drag-and-drop for desktop board status moves in M3.5 and, when implemented, desktop agenda-block interactions in M6.
- Provide non-drag controls for equivalent mobile tasks. For M3.5 this is an accessible status selector on each active ticket card. The specific M6 mobile controls will be designed and approved in the M6 plan.
- Preserve a keyboard/assistive-technology route to status changes without requiring a drag gesture. Avoid introducing a touch drag library for these workflows.

## Consequences

Mobile users can move tickets between any statuses, but not by dragging between collapsible sections. M6's former touch-drag wording in `PLAN.md` must be updated; the M6 plan must specify mobile non-drag alternatives for block creation and editing. This decision does not otherwise change M6 scope, the ticket status model, or the API.

## Alternatives considered

- Touch drag on mobile board and agenda: rejected by human direction; the board does not display adjacent lanes on mobile and drag gestures would compete with touch scrolling.
- Drag-only status moves: rejected because mobile, keyboard and assistive-technology users need a non-drag action.

## Links

- `docs/milestones/m3.5-ticket-board-status-moves.md`
- `PLAN.md`
- `docs/decisions/0008-ticket-estimates-and-board-layout.md`
