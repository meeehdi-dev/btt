# ADR 0055: On hold ticket status

- Status: Accepted
- Date: 2026-10-13
- Supersedes: None
- Superseded by: None

## Context

Tickets move through fixed statuses from Idea to Done. Users need a distinct pause state at the far left of the Ticket Board. It is a workflow status, not a priority or a label.

## Goal

Give paused work an explicit, visible, unfinished status as the leftmost Board lane, with Idea remaining the default.

## Decision

- Add the status **On hold**, ordered before Idea. The order from Idea through Done is unchanged.
- It uses a neutral pause icon wherever a single ticket status is shown.
- It is included in all status selectors and API validation, with no transition restrictions.
- New tickets still default to Idea; the New ticket form does not offer On hold.
- On hold is not Done: it stays unfinished, remains visible under the Board's non-Done visibility, and counts as incomplete in Release progress.
- Priority model, status colors, archive rules, and the quiet-Done rule (ADR 0046) are unchanged.

## Consequences

- Paused work is explicit and occupies the leftmost lane.
- The shared ordered status list drives validation, persistence, lane order, selectors, and icons.
- An additive enum migration adds the value; existing rows need no rewrite.
- No new endpoint, reason field, or workflow transition.

## Implementation notes (non-binding)

- Icon: `lucide:pause`. Status menus follow ADR 0048.

## Alternatives considered

- "Hold", "Paused", "Blocked": rejected; "On hold" is clearest and does not claim an external blocker.
- A label or priority: rejected; it must be a status occupying a lane.
- Offering On hold in the New ticket form: rejected; change status after creation.

## Revisions

- 2026-11-21: Rewritten to goal-level form; icon name and menu references moved to implementation notes.
