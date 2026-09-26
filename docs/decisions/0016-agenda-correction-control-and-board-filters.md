# ADR 0016: Agenda correction control and compact hierarchy filters

- Status: Accepted
- Date: 2026-09-26
- Supersedes: 0014 (only the agenda's direct keyboard/mobile same-day Edit button requirement; all drag and server rules remain)
- Superseded by: None

## Context

In M7 code review, the human asked to remove the visible agenda entry Edit button and repetitive instructions, and to add hierarchy filters to the ticket board while compacting both filter bars. ADR 0014 had required a keyboard/mobile-accessible same-day Edit control on Today.

## Decision

- Remove only the per-entry Edit button from Today. Keep double-click correction on an entry and the existing same-day correction modal; retain ticket-detail editing for non-drag correction and date changes. The lack of a discoverable/mobile/keyboard same-day correction action on Today is acknowledged, not silently considered solved. Revisit mobile editing in a separate approved follow-up. Drag create/move/resize and overlap rules in ADR 0014 are unchanged.
- Keep Today filters client/project/release/ticket/status; add local cascading client/project/release/ticket filters to the board, **without** a status filter (lanes convey status). Display filter icons inside the inputs with accessible names and tooltips instead of separate label rows. Filtered-out board cards are not treated as locate targets; navigating a relation to one opens its ticket detail. Search and stored data rules are unchanged.
- Omit redundant filter headings, match-count prose and Today drag instructions; keep meaningful empty and error messages.

## Consequences

The agenda is more compact but direct same-day mobile/keyboard correction on Today is temporarily less accessible. Filtering the board is local to the current owned, active-ancestor board read and does not change board drag/status persistence. Both filter sets remain discoverable through icon tooltips and accessible input names.

## Alternatives considered

- Retain the edit icon: rejected in code review for density.
- Add a new mobile correction control immediately: explicitly deferred by the human.
- Add status as a board filter: explicitly declined; lane headings already group tickets by status.

## Links

- `plans/m7-search-and-ui-polish.md`
- `docs/milestones/m7-search-and-ui-polish.md`
- `docs/decisions/0014-agenda-drag-interactions.md`
- `docs/decisions/0015-compact-navigation-and-mobile-columns.md`
