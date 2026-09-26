# ADR 0012: Today agenda settings and historical work

- Status: Accepted
- Date: 2026-09-26
- Supersedes: None
- Superseded by: None

## Context

M5 makes Today the primary surface for completed work across tickets. M4's records belong to local calendar days and survive archival; a limited visible-hours preference must not hide historical work or prevent valid entries. The M5 plan was approved via Plannotator.

## Decision

- Persist one settings row per authenticated user (user ID primary key, cascade on account deletion). Default to an 08:00–20:00 visible window and eight-hour workday target when the row does not exist. Visible bounds use aligned 30-minute steps with `0 ≤ start < end ≤ 1440`; target uses 30-minute steps from 30 through 1440 minutes. API and database checks enforce these rules. Start-of-week is deferred until a weekly view needs it.
- Treat the visible window as presentation only. Day reads include all owned entries, even when ticket or ancestors are archived; entries before/after the window remain accessible. Day progress and overtime use the complete unfiltered tracked total; filters only affect rendered rows.
- Use entity/status/time icons alongside ticket metadata in the Today agenda, aligned with the ticket board's visual language. When other app views display the same metadata, follow this icon convention as they are touched; do not broadly redesign unrelated pages within M5.
- Preserve the ticket-scoped history endpoint. Use an owner-scoped day read for agenda data, with archived-hierarchy labels and status. Active tickets only are eligible for new work (ADR 0011). Historical badge navigation uses explicit archived detail URLs; project/release detail reads may traverse archived ancestors only with that explicit flag, without granting write access or changing default lists.

## Consequences

Settings are a small per-user schema addition, and day queries must join the hierarchy for ownership as well as display. M6 can rely on the same window without changing the fixed entry grid. Archived details can be read explicitly while ordinary navigation remains scoped to active entities.

## Alternatives considered

- Hide entries outside visible hours: rejected because the window is a preference, not a data filter.
- Reuse ticket-scoped history for day queries: rejected because it cannot show all tickets on a date without per-ticket requests.
- Persist start-of-week now: deferred until a weekly view uses it.

## Links

- `docs/milestones/m5-today-agenda.md`
- `docs/decisions/0011-manual-time-entry-history-and-slots.md`
- `PLAN.md`
