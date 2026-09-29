# ADR 0029: Weekly agenda and attempted-position conflict previews

- Status: Accepted via Plannotator code review on 2026-09-29
- Date: 2026-09-28
- Supersedes: ADR 0014's invalid-move snapback presentation only, if accepted
- Superseded by: None

## Context

M16 adds a weekly agenda while retaining date-only, non-overlapping time entries. A week needs an explicit first weekday and cross-date movement. The existing single-day drag policy snaps invalid moves back to the source, but the requested weekly interaction should make the attempted destination and conflict apparent.

## Decision

- Persist each user's week start as Sunday `0` through Saturday `6`, defaulting to Monday (`1`). Display full weekday names and numeric month/day in browser-locale order.
- Show separate daily progress using all work on each date, independent of filters and visible hours; do not calculate a weekly progress total.
- A time entry remains on exactly one calendar date. Creation, movement, and resizing cannot cross midnight. Moving between dates preserves duration and remains subject to the existing owner-scoped server overlap checks.
- During a move, render an invalid candidate at the attempted date/time in red with “Conflict” or equivalent wording. Keep the source authoritative and do not persist an invalid drop. Preserve the existing near-edge tolerance for valid placements and the accessible error on rejection.
- Keep mouse dragging desktop-only. Use per-day Add actions and the existing correction form with a work-date picker on narrow screens; do not add touch dragging.

## Consequences

Users can see the entire configured week and move entries between dates without changing date-only storage rules. The settings table and API gain a constrained weekday value. Invalid previews no longer visually imply that an entry returned to its source, while server-side checks remain authoritative. Mobile remains usable without a drag-only workflow.

## Alternatives considered

- Automatically shift a conflicting move to a nearby free slot: rejected because it can move work somewhere other than the attempted destination.
- Add a weekly tracked-time total: rejected; progress is meaningful per configured workday and must remain independent per date.
- Enable touch dragging: rejected in favor of explicit day Add and date-correction controls.

## Links

- `docs/milestones/m16-weekly-agenda.md`
- `docs/decisions/0011-manual-time-entry-history-and-slots.md`
- `docs/decisions/0012-today-agenda-settings-and-history.md`
- `docs/decisions/0014-agenda-drag-interactions.md`
