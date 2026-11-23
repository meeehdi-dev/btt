# ADR 0061: Reports time allocation

- Status: Accepted
- Date: 2026-10-15
- Supersedes: None
- Superseded by: None

## Context

Time entries are ticket-linked and date-only, under an owned Client → Project → Release hierarchy. No existing read compared arbitrary periods across that hierarchy. The human asked for a Reports page showing where time went, including archived history.

## Goal

Reports shows where time went in a chosen week, month, or year compared with the previous period, computed on the server, owner-scoped, without dropping archived history.

## Decision

- Authenticated `/reports` with an owner-scoped aggregate API. One period is selected: week (starting on the user's configured week-start day), month, or year (calendar boundaries). Each is compared with the immediately preceding equivalent period.
- The request requires an explicit, valid time zone; a missing or invalid one returns HTTP 400 and never falls back to the server's zone. The response returns the effective zone and the period's dates.
- Totals are aggregated on the server. The browser receives summaries, grouped values, hierarchy labels, archive markers, and the hierarchy paths needed for filter options, never raw time-entry history.
- Breakdown by Clients, Projects, or Releases; client/project/release filters narrow the same scope. Choosing a row applies the matching filter (with parents) and stays on Reports. Selected filters stay valid across empty periods, and unknown or foreign ids disclose nothing.
- Historical entries for archived tickets and hierarchy are included. A row is marked archived when its entity or an ancestor is archived; archiving never lowers totals.
- Show the selected-period total and its change from the previous period. Rank rows by selected-period minutes descending with deterministic name/ID tie-breaks. Each row shows exact duration, share of the filtered selected-period total, and change against the same entity's previous period. An entity active only in the previous period stays visible; a zero previous total shows no infinity or NaN.
- Report values are shown only after a successful read; loading and error states show neutral status, hide values, and offer retry for the report read only.
- Reports appears in the header navigation (ADR 0035). Report reads stay fresh after writes to time entries, tickets, hierarchy, and settings (ADR 0051).

## Consequences

Users can answer allocation questions without exposing raw history or changing entry semantics. Ticket-level grouping, drill-down, arbitrary ranges, trend charts, billing, and exports are out of scope. No schema change.

## Implementation notes (non-binding)

Proportional bars are plain accessible elements, no chart dependency. The period range is computed in `shared/report-period`; the endpoint is `server/api/reports`. Page state mechanics (keeping grouping controls mounted, neutral labels while pending) live in the Reports page.

## Alternatives considered

- Exclude archived work or add an include-archived toggle: rejected; archiving must not rewrite history.
- One expandable hierarchy instead of tabs plus filters: rejected; tabs choose the comparison level and filters narrow data.
- Chart dependency or separate time-series chart: rejected; ranked bars suffice.
- Aggregate in the browser from raw entries: rejected; server aggregate.

## Revisions

- 2026-11-21: Rewritten to goal-level form; status changed Proposed → Accepted (implemented; code review accepted 2026-10-16 per M45); UI state mechanics moved to notes or dropped; navigation entry folded into ADR 0035.
- 2026-11-23: Done-estimate cohort and completion bounds removed with ticket estimates (ADR 0067); period totals, shares and comparisons unchanged.
