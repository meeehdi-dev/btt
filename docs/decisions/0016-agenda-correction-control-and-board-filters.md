# ADR 0016: Agenda entry correction and Board hierarchy filters

- Status: Accepted
- Date: 2026-09-26
- Supersedes: None
- Superseded by: None

## Context

In code review the human asked to remove the visible per-entry Edit button and repetitive instructions from the Agenda, and to add hierarchy filters to the Ticket Board while compacting both filter bars.

## Goal

Keep the Agenda and Board compact while still letting users correct an entry and narrow the visible work by hierarchy.

## Decision

- An Agenda entry is corrected by double-clicking it, which opens the correction form. There is no per-entry Edit button. Ticket detail remains available for correction and date changes. The lack of a discoverable keyboard/mobile same-day correction action on the Agenda is acknowledged, not solved; revisit in a separate approved follow-up.
- Agenda and Board both offer local, cascading client/project/release/ticket filters. Neither has a status filter: Board lanes already convey status, and the Agenda status control is a selector, not a filter (ADR 0044).
- Filter inputs show their icon inside the input with an accessible name and tooltip instead of label rows. Redundant filter headings, match-count prose and drag instructions are omitted; meaningful empty and error messages stay.
- Search and stored data rules are unchanged.

## Consequences

Both pages are denser. Board filtering is local to the current owned, active-ancestor read and does not affect drag or status persistence.

## Alternatives considered

- Keep the edit icon: rejected in review for density.
- Add a new mobile correction control now: deferred by the human.
- Add status as a Board filter: declined; lanes already group by status.

## Revisions

- 2026-11-21: Rewritten to goal-level form; folded in ADR 0044's removal of the Agenda status filter, dropped the claim of superseding ADR 0014 (0014 now owns drag rules and refers here), and replaced Today wording with Agenda.
- 2026-11-23: Removed the related-ticket locate rule; related tickets were removed (ADR 0067).
