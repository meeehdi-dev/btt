# ADR 0029: Weekly Agenda and attempted-position conflict previews

- Status: Accepted
- Date: 2026-09-28
- Supersedes: None
- Superseded by: None

## Context

The Agenda shows a whole week while time entries stay date-only and non-overlapping. A week needs an explicit first weekday and movement across dates. The earlier policy snapped invalid moves back to the source; for a weekly view the attempted destination and its conflict should be visible.

## Goal

Let users see and rearrange a whole week of completed work, and understand exactly why an invalid move is refused.

## Decision

- Each user has a week start setting, Sunday through Saturday, defaulting to Monday. Days show full weekday names and numeric month/day in the browser locale's order.
- Each day shows its own workday progress from the entries the active filters leave visible, independent of the visible-hours window. There is no weekly total.
- A time entry belongs to exactly one calendar date; create, move and resize cannot cross midnight. Moving between dates keeps the duration and is subject to the owner-scoped server overlap checks.
- While dragging, an invalid candidate is drawn at the attempted date/time in a conflict state labelled "Conflict". The source entry stays authoritative, nothing invalid persists, and the near-edge tolerance and accessible error from ADR 0014 apply.
- Dragging is mouse-only. Each day has an Add action, and the correction form includes a work-date picker (ADR 0016); there is no touch dragging.

## Consequences

Users can move work between dates without changing date-only storage. The settings table and API carry a constrained weekday value. Invalid previews no longer imply the entry returned to its source; server checks stay authoritative.

## Alternatives considered

- Auto-shift a conflicting move to a free slot: rejected; it can land work somewhere other than intended.
- A weekly tracked-time total: rejected; progress is meaningful per workday.
- Touch dragging: rejected in favor of day Add and date-correction controls.

## Revisions

- 2026-11-21: Rewritten to goal-level form; status normalized to Accepted; dropped the "supersedes 0014 snapback presentation" line (folded into 0014) and the retired narrow-screen clause (ADR 0042).
- 2026-11-23: Day progress follows the filtered entries instead of all work on the date (ADR 0067); the visible-hours window still never hides work.
