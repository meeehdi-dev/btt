# ADR 0061: Reports time allocation and period semantics

- Status: Proposed
- Date: 2026-10-15
- Supersedes: None
- Superseded by: None

## Context

BTT stores ticket-linked, date-only time entries, estimate minutes, and an owned client → project → release hierarchy. Existing read APIs do not aggregate arbitrary selected and previous periods across that hierarchy. The human approved M45 in Plannotator session `pn-edefcf` to add a Reports page focused on where time went, including archived history and estimated Done-ticket context.

## Decision

- Add an authenticated `/reports` page and an owner-scoped aggregate API. The report selects one week, month, or year; weeks follow the user's configured start day, and months/years use calendar boundaries. Compare each selected period with the immediately preceding equivalent period. Require the browser's supported `timeZone` in report requests and return the effective zone; missing/invalid zones receive HTTP 400 rather than falling back to the server's zone.
- The successful current report response owns both visible date labels, aggregates, comparison, estimate context, and adjacent-period navigation. Reports does not fetch settings separately or treat a failed Settings read as Monday. Weeks shift by calendar multiples of seven days from the returned start; month/year shifts retain calendar semantics. Current-period state uses inclusive containment of browser-local today in the returned range.
- Require initialized browser date/zone and Nuxt's public success state, with no pending/error, before showing report values. Idle/key transitions, loading, and errors show neutral period status, hide values, and disable adjacent navigation; grouping/filter controls stay mounted. Reports retries only its own read. Independent Settings failures and read-only partial-success recovery remain in the Settings modal. Keep the settings invalidation resource so successful settings writes still refresh mounted Reports.
- Aggregate period minutes on the server and return only summaries, grouped values, hierarchy labels/archive markers, and hierarchy paths needed for cascading filter options—not raw time-entry history.
- Use Clients / Projects / Releases tabs to select the comparison dimension. Keep the grouping controls mounted during loading/errors so automatic keyboard activation retains focus. The shared client/project/release filters narrow the same report scope. Clicking a row remains on Reports and applies its corresponding hierarchy filter, including parent filters.
- Preserve valid selections across empty periods. Return bounded owner-scoped selected-filter names and effective archive state independently of period activity; keep the period-derived paths unchanged. Merge only selected options into the Reports controls and keep their clear actions enabled. Retain only current selected display labels while pending/failed, reconcile them with successful reads, and use a neutral unavailable label without disclosing foreign metadata.
- Include historical entries for archived tickets and hierarchy by default. Mark a breakdown row archived when its entity or an ancestor is archived; do not drop historical work from the totals.
- Show selected-period total and change from the previous period. Rank breakdown rows by selected-period minutes descending with deterministic name/ID tie-breaks; show exact duration, share of the filtered selected-period total, and same-entity previous-period change. Keep a previous-only entity visible and handle a zero previous total without infinity/NaN.
- For each breakdown entity, show estimate context only for estimated tickets that are currently `Done` and whose `ticket.updatedAt` falls within the selected local-calendar period in the requested time zone. Convert the inclusive start midnight and exclusive following-period midnight independently to UTC, accounting for DST; normalize comparisons explicitly for the existing UTC-valued SQL timestamps. Use the same predicate for cohort-derived paths. Date-only time-entry bounds are unchanged. Compare that cohort's all-time tracked minutes with its summed estimates; keep this separate from the selected-period total/share. `updatedAt` is a proxy, so a later ticket edit or archive/restore can change the inferred completion period. No `doneAt` field or schema change is part of this decision.
- Use simple accessible proportional bars without a chart dependency or separate within-period time-series chart. Track report reads against existing `time-entries`, `tickets`, `hierarchy`, and `settings` invalidation resources; settings changes can affect the configured weekly interval.
- Append Reports after existing Agenda / Tickets / Clients header navigation and map `g` then `r` to `/reports`. This narrowly extends ADR 0035's navigation and shortcut mapping; its other shell decisions remain unchanged.

## Consequences

- Reports can answer allocation questions for a chosen calendar period without disclosing raw entry history to the browser or changing existing entry semantics.
- Archived history can be restated with visible archive context; filters and grouping remain separate controls with consistent denominators.
- Estimate comparison is an explanatory lifetime metric for a best-effort Done cohort, not a reporting-period budget or a period-only logged-time measure. The `updatedAt` caveat is visible in the UI and tests.
- Ticket-level grouping, matched-entry drill-down, arbitrary date ranges, separate trend charts, billing, and exports remain out of scope. No schema change or dependency is introduced.

## Alternatives considered

- Exclude archived work or add an include-archived toggle: rejected because archiving should not rewrite historical allocation totals.
- Use one expandable hierarchy instead of grouping tabs: rejected after the human confirmed that tabs select the comparison level while filters narrow the data.
- Add an explicit completion timestamp: rejected for M45; the human accepted `updatedAt` under the assumption that Done tickets are not touched afterward.
- Add a chart package or separate time-series chart: rejected for this slice because ranked proportional bars and period comparisons do not require charting.
- Send raw time entries to the browser and aggregate there: rejected in favor of a server aggregate.

## Links

- Approved [M45 milestone](../milestones/m45-reports-time-allocation.md) — Plannotator approval session `pn-edefcf`.
- Approved [review-fix amendment](../../plans/m45-reports-review-fixes.md) — Plannotator session `pn-f60bf4`. This ADR remains Proposed pending separate human code review.
- [Response-range corrective amendment](../../plans/m45-reports-response-range-fix.md) — human-selected response-authoritative correction of R1; this ADR remains Proposed.
- [Reports product discovery](../../plans/reports-discovery.md).
- [ADR 0035: Three-block header navigation](0035-three-block-header-navigation.md) — narrow proposed supersession for the Reports entry and shortcut.
- ADR 0011: manual time-entry history and slots.
- ADR 0012: archived history and configured week start.
- ADR 0028: stable API item ordering.
- ADR 0051: same-tab API data invalidation.
