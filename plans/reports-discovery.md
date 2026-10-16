# Reports page — discovery brief and product questions

**Status:** Product discovery is complete; implementation approval is pending. This brief records the human answers but is not an approved implementation plan and does not authorize code, API, roadmap, or schema changes. The proposed implementation is in [M45 — Reports and time allocation](../docs/milestones/m45-reports-time-allocation.md), which must be approved separately before implementation.

## Product context and repository facts

- The request is for a new **Reports** page and a top-header navigation entry, with client/project/release filters, weekly/monthly/yearly reporting, hierarchy tabs, and a way to see how logged time is distributed.
- `PLAN.md` currently lists weekly/monthly summaries and review pages by client/project/release/ticket under **Later, post-MVP**; its feature inventory marks them undelivered. Treating Reports as the next feature would be a deliberate scope/roadmap change, not work already authorized by the roadmap.
- The app is a single-user work tracker. It has ticket-linked time entries (`date`, `durationMinutes`), hierarchy data, ticket estimates, and a configured start-of-week day. It has no billable flag, rates, revenue, team/member dimension, or capacity plan. The configured workday target currently powers Agenda progress; it should not be reinterpreted as utilization/capacity without a decision.
- Current reads do not provide an arbitrary-range hierarchy report: `GET /api/time-entries` requires `ticketId`; `/api/agenda/week` reads one seven-day interval; `GET /api/tickets` aggregates time per ticket across all time, not by report interval. If Reports needs period totals/trends, a new owner-scoped aggregate read is likely; schema changes do not appear inherently necessary, but the exact contract needs an approved plan.
- Time entries remain linked to their tickets when a ticket or ancestor is archived. Accepted [ADR 0012](../docs/decisions/0012-today-agenda-settings-and-history.md) preserves archived history in agenda reads. A report's archive policy therefore affects whether historical work remains visible in aggregates.
- The current shell navigation is defined in `app/layouts/dashboard.vue`; hierarchy select/filter patterns are in `app/pages/agenda.vue`, `app/pages/tickets/index.vue`, and `app/composables/useHierarchyFilters.ts`. The existing hierarchy filter helper includes ticket as well as client/project/release; the request names only the latter three.

## Web research: reporting patterns worth borrowing

Research was limited to product reporting documentation, to compare common information architecture rather than copy billing/team features that BTT does not have.

- **Harvest — Time report:** [Harvest Help: Time report](https://support.getharvest.com/hc/en-us/articles/360048181692-Time-report) describes period totals and breakdowns by client, project, task, or team, with clickable client/project drill-down. Its billable/non-billable and money fields depend on data/permissions that BTT does not currently model.
- **Toggl Track — Summary report:** [Toggl Support: Summary Report](https://support.toggl.com/en/articles/10750064-summary-report) describes an aggregate/chart-first report with date filtering and grouping, separate from a detailed, individual-entry report. The official help page was discoverable in search; direct page retrieval was unavailable during this research.
- **Clockify — Summary report:** [Clockify Help: Summary report](https://clockify.me/help/reports/summary-report) documents a daily-hours bar chart plus a grouped breakdown table/chart, optional nested groupings such as client → project, and links from a summary item into a filtered detailed report. Its report also visualizes billability, which BTT cannot reproduce without new domain data.
- **Clockify — Dashboard:** [Clockify Help: Dashboard](https://clockify.me/help/reports/dashboard) separates a time-period chart from an activity breakdown. That separation is useful here: a trend answers _when did I log the time?_ and a hierarchy breakdown answers _where did it go?_

### Design synthesis

Common useful primitives are (1) a clear total for the selected period, (2) a trend across smaller time buckets, (3) a ranked breakdown by a chosen grouping, and (4) drill-down to the records behind an aggregate. For BTT, a reasonable first concept is a period control and the existing client/project/release filter pattern above a concise total/trend, followed by **Clients / Projects / Releases** views. A single ranked table/list with proportional horizontal bars, logged duration, and share of the filtered total could serve both as a breakdown chart and readable data table. That avoids duplicating the same numbers in a donut and a table, and remains legible when there are many entities.

Potential secondary values grounded in current data are prior-period change, count of unique tickets or time entries, and (if useful) estimated vs. logged time for estimated tickets. One caveat: ticket estimates are ticket-wide, not budgets tied to a reporting period, so comparing a week's logged time with a ticket's full estimate could mislead if the ticket spans several periods. Percentage share and time trend directly fit the stated allocation goal. Billing/revenue, billable utilization, team comparisons, and capacity-to-target are not currently grounded in the model.

## Nuxt UI charting and breakdown controls

- The Nuxt UI v4 component-selection guide recommends `UTabs` when switching views on the same page without separate URLs. That addresses the control pattern if the report uses grouping tabs; it does not decide whether tabs are the best information architecture here.
- Nuxt UI's [Community page](https://ui.nuxt.com/community) lists **Nuxt Charts** as a community integration, rather than a built-in Nuxt UI chart suite. Nuxt Charts v3's [installation docs](https://nuxtcharts.com/docs/getting-started/installation) currently instruct Nuxt apps to install `nuxt-charts@next`; its [theming docs](https://nuxtcharts.com/docs/customize/theming) say it uses Nuxt UI v4 semantic colors, surfaces, and dark mode. The v3 docs identify a prerelease install tag, so confirm its current release and compatibility with this project's pinned Nuxt/Nuxt UI versions before selecting it.
- For the current idea—a ranked list with a proportional horizontal bar per entity—Vue/CSS bars are sufficient and no chart dependency is needed. A richer line/bar/donut visualization could justify Nuxt Charts, but no package should be added without including it in the reviewed milestone plan and explicitly approving its exact version.
- The client/project/release filter bar narrows _which data_ is included; a grouping selector chooses _how that data is grouped_. Example: with no filter, a Clients grouping compares all clients; after selecting a client, a Projects grouping compares that client's projects. An expandable client → project → release table is an alternative to tabs, but needs clear expansion and percentage-denominator rules. Latest plan feedback asks us to resolve this choice in M45.

Sources: [Nuxt UI component-selection guideline](https://github.com/nuxt/ui/blob/v4/skills/nuxt-ui/references/guidelines/component-selection.md), [Nuxt UI Community](https://ui.nuxt.com/community), [Nuxt Charts installation](https://nuxtcharts.com/docs/getting-started/installation), and [Nuxt Charts theming](https://nuxtcharts.com/docs/customize/theming).

## Open questions for product direction

:::question
Should Reports be pulled forward as the next product feature?

`PLAN.md` currently defers weekly/monthly summaries and review pages to post-MVP. Your request sounds like a new feature now, so this determines whether we should draft a new implementation milestone after discovery.

- [x] Yes — make Reports the next planned feature; prepare a separate implementation milestone after these questions are settled
- [ ] Not yet — keep this as design exploration and leave Reports in post-MVP
- [ ] Other — tell me how it fits the roadmap

Recommended: Yes, if you want to proceed with the page now; implementation would still wait for a separately approved milestone plan.
:::

:::question
What is the main job you want Reports to do for you?

The default layout and metrics should follow the decision you make here. You can choose “Other” or add a note if more than one is important.

- [x] See where my logged time went across clients, projects, and releases
- [ ] Compare time across periods and spot changes or trends
- [ ] Compare logged time with ticket estimates / see estimate overruns
- [ ] Prepare client billing or invoices (would require new billable/rate/export decisions)
- [ ] Other — describe the decision you want Reports to help with

Recommended: See where my logged time went; make period comparison a secondary cue.
:::

:::question
What should “Weekly / Monthly / Yearly” select?

A selector could mean one calendar period at a time, with previous/next navigation and a trend inside it, or a rolling series of periods. This also sets chart bucket size. Weeks can follow the configured first day of week; there is no fiscal-calendar setting today.

- [x] One selected period — e.g. this week/month/year, with previous/next navigation and a trend inside it
- [ ] A rolling range — e.g. the last 12 weeks, months, or years
- [ ] Both — one-period detail plus a separate rolling trend/range
- [ ] Other — include custom dates, fiscal years, or another period rule

Recommended: One selected calendar period; week uses the configured start-of-week, month/year use calendar boundaries, and a later comparison can show the preceding equivalent period. For the trend, use days in a week, weeks in a month, and months in a year.
:::

:::question
How should the Clients / Projects / Releases tabs work with the client/project/release filter bar?

For example, choosing a client filter and the Projects tab could show only that client's projects; a release filter and Clients tab could show just its parent client. This makes the tabs select the breakdown dimension while the same filters narrow all report content.

- [x] Tabs select the breakdown dimension; the shared filters constrain the same report data across every tab
- [ ] Tabs are separate pages/sections and should not interact with the filter bar that way
- [ ] The tabs themselves should drill into the hierarchy, so the filter bar may be redundant
- [ ] Other — describe the interaction you expect

Recommended: Tabs select the breakdown dimension; filters constrain the data consistently across tabs.
:::

:::question-multi
Which additional data would be useful beside total logged time?

Possible columns/cards include an item's share of the selected total, change from the previous equivalent period, number of unique tickets/time entries, and estimated-vs-logged time. Keeping the first version focused may be more useful than showing every available metric.

- [x] Share of total time (percentage)
- [x] Change vs. the previous equivalent period (time and/or percentage)
- [ ] Number of unique tickets worked on
- [ ] Number of time entries
- [x] Estimated vs. logged time for estimated tickets only
- [ ] No extra metrics — show the time total only
- [ ] Other — describe a metric you want

Recommended: Share of total; optionally period-over-period change. Add estimate usage only if it serves your main goal.
:::

:::question
Which breakdown presentation would you rather use?

A ranked horizontal-bar list can show names and exact time clearly even with many entities. A donut emphasizes proportions, but labels and tiny slices become hard to compare as the list grows.

- [x] Ranked list/table with proportional horizontal bars, duration, and share (one combined view)
- [ ] Donut/pie for share, with a separate table for exact values
- [ ] Both a separate chart and table even if they repeat the same totals
- [ ] Other — describe the chart/table you have in mind

Recommended: One ranked list/table with inline bars; row order and exact values remain readable without duplicating the same breakdown.
:::

:::question
Should reports include time logged to archived tickets or archived clients/projects/releases?

Archiving does not erase time entries, and Agenda history intentionally retains that work. Excluding archived hierarchy would make older totals appear to change when an item is archived.

- [x] Include all owned time entries in the selected dates by default; mark archived entities in the breakdown
- [ ] Include archived history only behind an “Include archived” control
- [ ] Exclude archived tickets/ancestors from Reports
- [ ] Other — describe the expected behavior

Recommended: Include the historical time by default and visibly mark archived entities; decide separately whether filters can select them.
:::

:::question
What should clicking a breakdown row or chart segment do?

Summary dashboards become more useful when totals lead to the underlying work, but there are several possible destinations: entity details, a filtered Reports view, or individual time entries.

- [ ] Open the client/project/release detail page
- [x] Keep me on Reports and filter the other report content to this item
- [ ] Show the matching time entries (a detailed report/drill-down)
- [ ] Combination — describe which click/keyboard action should do each
- [ ] Other — describe the expected behavior

Recommended: Clicking a row selects that entity in the report and offers a clear link to its detail; add a matching-entry view if reviewing individual logs is a primary need.
:::

## Confirmed direction from Plannotator

The human answered all eight questions in Plannotator session `pn-48030d`:

- Reports is the next planned product feature; prepare a separate implementation milestone.
- The primary goal is seeing where logged time went across clients, projects, and releases.
- Weekly/monthly/yearly selects one period.
- Clients/Projects/Releases tabs choose the breakdown dimension; the shared client/project/release filters constrain the same report. After questioning whether tabs were redundant with filters in `pn-295876`, the human reaffirmed keeping the tabs in `pn-47f4bf` and `pn-168c2d`.
- Show share, change vs. the previous equivalent period, and estimate-vs-logged information for estimated tickets only.
- Use one ranked list/table with proportional horizontal bars, time, and share.
- Include all owned historical entries by default and mark archived entities.
- Selecting a breakdown row stays on Reports and filters the other report content to that item.
- Estimate comparison is limited to estimated tickets marked Done during the selected period, inferred from `ticket.updatedAt`; trust no post-Done ticket updates and do not add a completion field.
- No separate within-period time-trend chart in the first version.

Further plan feedback in Plannotator session `pn-5e9d25` clarified that the estimate comparison should appear only for tickets marked Done during the selected week/month/year, using `ticket.updatedAt` as the proxy; the human accepts the assumption that Done tickets are not touched afterward and does not want a separate completion field. The human also chose no separate within-period trend chart. M45 proposes comparing all-time tracked minutes with estimates for estimated tickets currently Done whose `updatedAt` is inside the selected period, while keeping period totals separate. Because ticket archive/edit actions also update `updatedAt`, the plan records that caveat for approval.

In follow-up plan feedback session `pn-295876`, the human asked whether grouping tabs are useful alongside hierarchy filters and what Nuxt UI recommends for charts. M45 explains the distinction: filters choose which records are in scope, while tabs choose the hierarchy level to compare (e.g. a client filter plus Projects compares that client's projects). Nuxt UI's maintainer guide uses `UTabs` for same-page view switching. Nuxt UI lists Nuxt Charts as a community integration, not a built-in chart component; Nuxt Charts v3 docs currently use `nuxt-charts@next` and describe Nuxt UI v4 theming. Simple ranked share bars need no chart package. The human reaffirmed the tab/grouping choice in Plannotator sessions `pn-47f4bf` and `pn-168c2d`.

## Proposed implementation direction

The planned page should add **Reports** to the authenticated header; use shared client/project/release filters and a single selected week/month/year; show total logged time and change vs. the immediately preceding equivalent period; and use a ranked, proportionally visualized breakdown. Use archived historical entries and mark archived hierarchy. A breakdown-row selection should remain on Reports and narrow the same report's data. M45 proposes an explicitly labelled lifetime estimate comparison for the selected-period Done cohort and excludes a separate within-period trend chart. The calendar-boundary details and row treatment for completed estimate cohorts without period entries remain subject to approval of that milestone plan. The tab/grouping decision is confirmed in Plannotator session `pn-47f4bf`.

No implementation files, roadmap entries, ADRs, APIs, migrations, or dependencies have been changed as part of this discovery. The human approved the separate M45 milestone plan in Plannotator session `pn-edefcf`; implementation may proceed within that approved scope, per `docs/llm-workflow.md`.
