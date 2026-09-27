# M8 implementation plan — Polish and shared ticket work items

> **Status:** Approved M8 plan; scope expanded by direct human approval on 2026-09-26 during code review. Implementation is tracked in `docs/milestones/m8-polish-and-shared-ticket-work-items.md`.

## Context

M7 is recorded complete in `docs/milestones/m7-search-and-ui-polish.md` (human declaration dated 2026-09-26). The next work should be a bounded polish pass, not a new product area. The user wants the Today agenda's time-entry and ticket-summary presentations to share a coherent reusable layout, while retaining current interactions and matching the ticket board's estimate-usage colors.

Source facts: ticket-link labels are non-null in Drizzle, required in `TicketLinkCreate`, and required by ticket creation and link POST/PATCH handlers. Ticket-list and agenda APIs include labels in popover data. The safe data change is nullable label storage; existing custom labels can remain unchanged. The UI fallback can derive `URL.hostname`, which retains subdomains.

`TodayAgendaEntry.vue` owns the time-entry article and filter/edit interactions. Ticket board and release cards already share `TicketTrackedUsage.vue` and `TicketContextPopovers.vue`; `/api/tickets` provides aggregate minutes and hierarchy IDs/names, while `/api/agenda` provides per-entry context. Today already fetches ticket summaries, so the shared presentation needs no new read API. `shared/time-entry.ts` already exports the approved `usageColor` bands. Today currently uses native `<progress>`, fixed `text-primary` worked time, an overtime suffix, and start/end plus duration in each entry card. The Clients and Projects list headings are currently screen-reader-only. The client detail has the requested subtitle. Following initial code review, the human explicitly expanded this same polish milestone to include visual layout parity between Today and board cards, searchable Today/board filter menus, and hierarchy-card counts and release completion progress. The later user direction is to remove context count chips entirely; the initial chip-positioning request is superseded within M8.

Nuxt UI research: the project skill points to the maintainer skill pinned at commit `187c34f`; use semantic colors and inspect generated themes. `UProgressGroup` accepts colored segments; expose one accessible progressbar summary and hide redundant segment semantics. `UDropdownMenu` supports nested status actions, and `USelectMenu` supports searchable filters. Context triggers are icon-only in the final design, so no count-chip overlay remains.

## Approved scope

- **Today workday summary:** color the worked-time value by ratio to the configured workday target using existing bands (blue/info <80%, green/success 80–<100%, orange/warning 100–120%, red/error >120%). Keep the target muted and remove the separate overtime `+N` suffix so the tracked/target sum itself shows overtime. Use the rounded Nuxt UI `UProgressGroup`: below target, show the actual blue progress toward the target; above target, fill the bar and let the orange segment grow by the overtime percentage while the remaining share stays blue. Thus 110% of target is 90% blue / 10% orange, and 200% (100% overtime) is all orange. Expose one accessible progressbar summary with a value description covering tracked time, target, and overtime; avoid redundant per-segment announcements.
- **Shared ticket/time-entry presentation:** extract a focused reusable `TicketWorkItem` presentation with a time-entry variant showing only that entry's total duration and a ticket-summary variant showing tracked time and estimate. Compose it in Today entries, ticket-board cards, and release ticket cards while preserving each wrapper's drag, edit, filtering, navigation, status, and relation-popover interactions. Keep tracked-time ratio colors and muted estimates/targets. The board and release-detail card omit the percentage badge; ticket detail retains it.
- **Today/board visual parity (human-approved review addition):** match the board card's content order, placement, spacing, colors, and hierarchy-badge appearance to Today entries. Board client/project/release badges remain direct links rather than Today filter/open popovers. Preserve surface-specific time meaning (one entry's duration in Today; aggregate tracked/estimate usage on board). Do not restore a board status-change control or add a redundant status badge; ADR 0013 and existing board grouping remain in force.
- **Searchable filters (human-approved review addition):** enable the documented search input on every existing select-menu filter in Today and Tickets/board (client, project, release, ticket, and Today status), with useful placeholders and no automatic mobile keyboard focus. Do not change binary archive toggles, action menus, or form-select controls.
- **Hierarchy-card metrics (human-approved review addition):** client cards show active project/release/ticket counts; project cards show active release/ticket counts; release cards show active ticket count and a progress bar based on `Done` tickets / all active tickets. Counts are owner-scoped and include only non-archived descendants under active ancestors; hide descendant metrics on archived parent cards to preserve ADR 0004 archive visibility. Show `0 / 0 done` and an empty 0% bar when an active release has no active tickets. Use the same two-row project card on the Projects list and client detail: project color/title above, then client link plus release/ticket counts; remove the `View releases` subtitle.
- **Context triggers (final human direction):** retain accessible relation/external-link icons and popovers for one or many items, with no count chips.
- **Agenda details:** add a subtle visible separation between adjacent timeline blocks without changing slot geometry or overlap rules. On Today ticket-entry cards show total duration only; keep start/end times in edit controls and drag previews.
- **Agenda status action:** add a `Change` submenu with every value from `ticketStatuses` to the current status control, and show a checkmark on the ticket's current status in that submenu. Keep a separate `Filter by status` action in the same menu. Reuse `PATCH /api/tickets/:id`, refresh agenda/ticket data, and report failures accessibly; do not change status rules or board/detail controls.
- **Optional external-link labels:** make the label optional in storage, request validation, ticket creation and add-link form. Add a migration that drops `NOT NULL` without rewriting existing labels. In ticket details and context popovers, show a custom label when present; otherwise show the URL hostname (including subdomains, such as `jira.atlassian.com`).
- **Release ticket cards:** use the shared ticket presentation and show client/project/release quick-link badges, reusing Today hierarchy presentation where appropriate.
- **Page actions and polish:** make `Clients` and `Projects` list titles visible; remove redundant card subtitles. Add `Mark release as done` on release detail using the existing archive action; warn and confirm if any tickets are not Done (including an empty release), then return to the parent project. Add deletion to the Today correction modal through the existing DELETE endpoint and confirmation prompt. Use explicit entity edit labels in detail headers.
- **Focused shared-component audit:** inspect the relevant Today/board/release ticket presentation, hierarchy badges, usage, and context-popover uses across the app; consolidate only these repeated surfaces, not unrelated components.

## Out of scope

- New product areas, weekly planning/reporting, universal navigation changes, or unrelated visual redesign.
- Changes to ticket status values/rules, time-entry persistence/overlap rules, estimate calculation semantics, ownership, or archive visibility.
- A broad app-wide refactor beyond common ticket/time-entry presentation, hierarchy badges, usage, and relation/link count controls on the requested surfaces.
- New dependencies, auth/deployment changes, or schema changes other than making the external-link label nullable.
- Implementation beyond the approved scope or before the M8 milestone record exists.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`, `docs/milestones/m7-search-and-ui-polish.md`
- ADR 0012 (unfiltered Today progress/history), ADR 0013 (status-control scope on the board), ADR 0018 (ticket contexts and ratio bands), ADR 0019 (usage contrast), and the consolidated M8 decision record ADR 0020.
- `.agents/skills/nuxt-ui/SKILL.md`; upstream pinned maintainer skill: <https://github.com/nuxt/ui/blob/187c34f0234a769da2c7c344f93d6c603d0bb514/skills/nuxt-ui/SKILL.md>.
- Nuxt UI docs: <https://ui.nuxt.com/docs/components/progress-group>, <https://ui.nuxt.com/docs/components/select-menu>, and <https://ui.nuxt.com/docs/components/dropdown-menu>; generated installed themes `.nuxt/ui/progress-group.ts` and `.nuxt/ui/dropdown-menu.ts`; installed implementation `node_modules/@nuxt/ui/dist/runtime/components/ProgressGroup.vue`.
- Initial user requirements recorded in Plannotator feedback; first code-review findings and the human-approved 2026-09-26 scope expansion are recorded in the M8 journal.

## Approach

1. **Shared ticket work item:** add `app/components/TicketWorkItem.vue` as a focused shared presentation primitive with `entry` and `ticket-summary` variants. Reuse `TicketTrackedUsage.vue`, `TicketContextPopovers.vue`, and a small shared `TicketHierarchyBadges.vue` where they fit. `TodayAgendaEntry.vue`, `TicketBoardCard.vue`, and release ticket cards keep their own outer semantics/interactions and compose the shared content; do not put drag/edit/status state into the shared presentation component.
2. **Ratio presentation:** use the existing `usageColor` helper for tracked-time text and ticket estimate usage. Leave target/estimate muted, omit percentage badges on board and release cards, and retain the ticket-detail percentage. Replace native progress with `UProgressGroup`: for `tracked <= target`, use one blue segment with value `tracked` and maximum `target`; for overtime, use blue value `target - min(tracked - target, target)` and orange value `min(tracked - target, target)`, with maximum `target`. This yields the requested 90/10 split at 110% and all orange at 200%. Wrap the decorative segments in one accessible progressbar summary with `aria-valuetext` for worked time/target/overtime. Keep tracked-time text colored by the existing info/success/warning/error bands. Remove the overtime suffix. Add a small visual inset/gap to timeline blocks without moving their geometric hit targets or stored intervals.
3. **Agenda status:** replace the status badge's filter-only popover with a documented `UDropdownMenu` nested submenu. Keep the filter action and add `Change` → each shared ticket status, with a checkmark on the current value. Emit a status-change event to Today; use the existing board `moveStatus` pattern for pending/error/accessibility, call the existing ticket PATCH endpoint, and refresh the agenda plus ticket data.
4. **Ticket links and context triggers:** make `ticket_link.label` nullable with a migration that preserves existing values; make the request schema and ticket create/detail forms optional; display label-or-`new URL(url).hostname` in detail and popovers. Keep context triggers icon-only, without count chips.
5. **Surfaces and headers:** add client/project/release quick links to release ticket cards using the shared hierarchy presentation. Expose the Clients/Projects list headings, remove redundant client-detail subtitles, and reuse a two-row `ProjectCard` on the Projects list and client detail. Preserve all unrelated page content and workflows.
6. **Durable docs:** update `PLAN.md`, maintain the M8 milestone journal, record migration and verification evidence, and consolidate M8's durable decisions in one ADR. Preserve earlier ADRs and state precisely which parts ADR 0020 supersedes.
7. **Review additions:** align board card layout with Today while keeping distinct actions and time semantics; enable searchable filter inputs in Today and Tickets; add active hierarchy counts and accessible release `Done / total` progress; keep context triggers icon-only with no count chips. Keep archived hierarchy descendants hidden, use the existing `Done` status, and make no schema/dependency changes for these additions.

## Files to modify

- `PLAN.md` — record the M8 polish slice and optional-link-label behavior.
- `docs/milestones/m8-polish-and-shared-ticket-work-items.md` — create from `docs/templates/milestone-template.md` before implementation; maintain the journal, decisions, verification evidence, and closeout.
- `app/components/{TodayAgendaEntry,TodayAgenda,TicketBoardCard,TicketContextPopovers,TicketTrackedUsage}.vue`, `app/pages/today.vue`, `app/pages/releases/[id]/index.vue`, `app/pages/clients/index.vue`, `app/pages/projects/index.vue`, and `app/pages/clients/[id]/index.vue`.
- New `app/components/TicketWorkItem.vue` and `app/components/TicketHierarchyBadges.vue` for shared ticket/time-entry presentation and hierarchy quick links; add `app/components/ProjectCard.vue` for the two-row project card shared between Projects and client detail.
- `app/pages/tickets/new.vue` and `app/pages/tickets/[id]/index.vue`; new small label-fallback utility under `app/utils/` if useful.
- Searchable filter configuration in `app/pages/tickets/index.vue` and `app/pages/today.vue`; visual parity in `app/components/TicketBoardCard.vue`, `app/components/TicketWorkItem.vue`, and `app/components/TicketHierarchyBadges.vue`; icon-only triggers in `app/components/TicketContextPopovers.vue`.
- Active aggregate fields in `server/api/clients/index.get.ts`, `server/api/projects/index.get.ts`, and `server/api/releases/index.get.ts`; card summaries in `app/pages/clients/index.vue`, `app/pages/projects/index.vue`, and release cards in `app/pages/projects/[id]/index.vue`; new `app/components/HierarchyCounts.vue` if it keeps repeated count presentation focused.
- `server/db/schema.ts`, `server/domain/schemas.ts`, `server/api/tickets/index.post.ts`, `server/api/tickets/[id]/links/index.post.ts`, `server/api/tickets/[id]/links/[linkId].patch.ts`, `server/api/tickets/index.get.ts`, and `server/api/agenda/index.get.ts` for nullable label typing/validation/serialization.
- Generated Drizzle migration `drizzle/0008_*.sql`, `drizzle/meta/0008_snapshot.json`, and `drizzle/meta/_journal.json`; inspect the SQL to confirm it only drops `NOT NULL` and leaves existing labels untouched.
- `tests/e2e/agenda.test.ts`, `tests/e2e/ticket-context-popovers.test.ts`, `tests/e2e/tickets.test.ts`, `tests/e2e/auth-shell.test.ts`, focused filter-search and hierarchy-card-metrics E2E tests, and focused unit tests (`tests/unit/time-entry.test.ts` plus label helper/schema coverage).
- `docs/decisions/README.md` and the consolidated M8 decision record ADR 0020; preserve all existing decision records and index entries, adding one M8 index entry only.

## Reuse

- `shared/time-entry.ts` exports `usageColor`; `tests/unit/time-entry.test.ts` already checks 79%, 80%, 99%, 100%, 120%, and 121% boundaries.
- `app/components/TicketTrackedUsage.vue` already centralizes board/release tracked-time, estimate, and percentage; `TicketContextPopovers.vue` is shared across board, release, and Today.
- `TodayAgendaEntry.vue` already formats entry duration and owns hierarchy filter/open actions and edit/double-click semantics; `TodayAgenda.vue` owns pointer gestures and slot geometry.
- `TicketBoardCard.vue` already owns board drag/highlight/locate behavior and renders hierarchy links; release page ticket rows already receive aggregate minutes and client/project/release IDs and names from `/api/tickets`.
- `shared/ticket-status.ts`, `app/pages/tickets/index.vue`'s `moveStatus`, and `server/api/tickets/[id].patch.ts` provide fixed status values, pending/error/refresh patterns, and the existing PATCH contract.
- Ticket-link validation in `app/utils/ticket-url.ts`, existing Effect request schema, Drizzle migration history, API batch insertion/CRUD, and Playwright fixtures provide the external-link implementation path.
- Installed Nuxt UI 4.11.1 `UProgressGroup`, `USelectMenu`, and `UDropdownMenu` documented APIs plus generated themes; use semantic colors rather than raw palettes or unsupported props.

## Decisions and ADR links

- User-requested behavior is captured in Approved scope; this plan recommends reusing one ticket-work-item presentation across Today, board, and release surfaces while wrappers retain interaction ownership. The new status menu is limited to Today and does not restore the removed board next-status action from ADR 0013.
- Keep existing 80/100/120% boundaries and all time/estimate calculations. Tracked-time values use matching semantic ratio colors; target/estimate remains muted. The workday bar separately represents progress to target in blue and overtime as a growing orange segment.
- Existing labels remain as stored; omitted/blank form labels are sent as absent and stored as `NULL`; the display fallback is the URL hostname including subdomains.
- `UDropdownMenu`'s nested `children` pattern supplies `Change` while preserving `Filter by status`. Status changes use the existing owner-scoped PATCH contract; no new status rule or endpoint is introduced.
- Human-approved review additions keep Today and board layouts visually aligned while preserving entry-duration versus aggregate-usage semantics and surface-specific interactions. Filter search uses documented `USelectMenu` input props. Hierarchy metrics are derived in existing owner-scoped list APIs; release progress is `Done` / non-archived ticket total, with archived ancestors still hiding descendant metrics. ADR 0020 records these M8 decisions.
- ADR 0020 consolidates M8 ratio colors, optional labels, hierarchy metrics, icon-only triggers, and release-card percentage behavior. It supersedes only the affected portions of ADRs 0017–0019; other earlier rules remain in force.

## Implementation checklist

- [x] Human approved this plan via Plannotator; created `docs/milestones/m8-polish-and-shared-ticket-work-items.md` from the template before code changes.
- [x] Extract/reuse the ticket-work-item and hierarchy-badge presentation in Today, board, and release views without changing drag, edit, navigation, filtering, or relation interactions.
- [x] Apply ratio-band color to workday/tracked values, use a rounded accessible segmented progress bar with overtime split and 200% cap, remove overtime suffix, separate adjacent agenda slots, and show only current-entry duration on Today cards.
- [x] Add agenda status `Change` submenu with every available status and a checkmark on the current value while retaining status filtering; persist via existing PATCH and cover pending/error/refresh behavior.
- [x] Make external-link labels nullable end-to-end; generate/review/apply the non-destructive migration; preserve existing labels and display hostnames for missing labels.
- [x] Remove context count chips and add hierarchy quick-link badges to release ticket cards; restore Clients/Projects headings and remove redundant subtitles.
- [x] Update `PLAN.md`, add/link any required ADR(s), add focused unit/API/browser coverage, run all agreed checks, and record actual outcomes in the M8 journal.
- [x] Complete the human-approved review additions and regression coverage, including searchable filters, hierarchy counts/progress, icon-only context triggers, and shared project cards.
- [x] Add release-detail completion confirmation and Today correction-modal deletion with regression coverage.
- [ ] Submit the implementation for human code review, address any findings, and wait for the human completion declaration before closing M8.

## Journal

### Planning research

- Fact: M7 is recorded complete; the user provided a polish-only scope through Plannotator after rejecting the initial scope-gathering draft.
- Fact: inspected the Nuxt UI maintainer skill, official Progress/ProgressGroup/Chip/DropdownMenu docs, generated themes, and installed `ProgressGroup.vue`. `UProgressGroup` supports colored segments with a shared maximum and rounded track. Its runtime renders each segment as a separate `ProgressRoot`; the plan therefore uses one outer progressbar accessible name/value description and hides redundant child semantics. dropdown items support nested submenus; the final user direction removes context count chips. Plannotator feedback requests a growing blue/orange overtime split (90/10 at 110%, all orange at 200%) and a checkmark on the current status.
- Fact: Today, board, and release share some existing usage/context components, but the agenda entry layout and ticket summary layout are not yet represented by one component. Ticket and agenda APIs already expose the fields needed for shared display and release hierarchy quick links.
- Fact: ticket-link labels currently require a schema/API/UI change and migration; existing values can be preserved by only dropping the database `NOT NULL` constraint.
- Decision: create a focused common ticket-work-item presentation for entry-duration and ticket-aggregate variants, keeping wrapper interactions local; scope the common-component pass to these three surfaces and shared context controls.
- Evidence: source paths and API contracts cited in Context, Approach, Files, and Reuse; no code was changed during planning. `pnpm exec oxfmt --check plans/next-milestone.md` passed; `node scripts/check-workflow-docs.mjs` passed ("Workflow documentation structure looks complete.").

### Shared presentation implementation

- Fact: added `TicketWorkItem.vue` with `entry` and `ticket-summary` variants and `TicketHierarchyBadges.vue` with agenda filter/open and direct-link modes. Composed them in Today entries, ticket-board cards, and release ticket cards; wrappers retain their status, drag, edit, navigation, filtering, and relation-popover ownership.
- Decision: release ticket cards now expose working client/project/release quick links through the shared hierarchy component; Today entry labels retain their existing start/end-plus-duration text until the approved duration-only step.
- Evidence: `pnpm exec playwright test tests/e2e/agenda.test.ts tests/e2e/ticket-navigation.test.ts tests/e2e/ticket-context-popovers.test.ts --workers=1` passed (3 tests); `pnpm typecheck`, `pnpm lint`, `pnpm exec oxfmt --check` on the six changed source/test files, and `git diff --check` passed.

### Ratio and agenda visual polish

- Fact: tracked-time text now uses the established `usageColor` bands; Today uses a rounded `UProgressGroup` with a single accessible progressbar summary, a blue under-target segment, and an orange overtime segment capped at 200%. The +overtime suffix is removed. Entry cards now show duration only, and inner cards have a 1px vertical inset while timeline wrapper bounds remain unchanged.
- Evidence: `pnpm test -- tests/unit/time-entry.test.ts` passed (12 files, 54 tests; the package script runs the full unit suite). `pnpm exec playwright test tests/e2e/agenda.test.ts tests/e2e/agenda-progress.test.ts tests/e2e/ticket-context-popovers.test.ts --workers=1` passed (3 tests), covering 90/10 at 110%, all-orange at 200%, one accessible progressbar, text colors across all four ratio bands, duration-only labels, and visual gaps without wrapper geometry changes. `pnpm typecheck`, `pnpm lint`, `pnpm exec oxfmt --check` on the seven changed source/test files, and `git diff --check` passed.
- Follow-up during verification: the settings validator requires workday targets in 30-minute increments, so a 72-minute test fixture was changed to 90 minutes; reloading Today also resets the add-dialog ticket selection, which the existing overlap test now explicitly restores. No product-scope deviation.

### Agenda status menu

- Fact: replaced the Today status filter-only popover with a `UDropdownMenu` containing `Filter by status` and a nested `Change` submenu for all `ticketStatuses`; current status is checkmarked. Updates use existing ticket PATCH and refresh both agenda and ticket data.
- Decision: disable status changes for archived tickets or archived hierarchy history, but keep status filtering available. Pending changes disable the trigger and announce through a polite live region; errors appear in an alert.
- Evidence: `pnpm exec playwright test tests/e2e/agenda-status.test.ts --workers=1` passed (1 test), covering every status, current checkmark, preserved status filtering, pending feedback, successful PATCH/refresh, accessible errors, and archive restrictions. `pnpm typecheck`, `pnpm lint`, `pnpm exec oxfmt --check` on the four changed files, and `git diff --check` passed.

### Human-approved review additions — implementation and verification

- Fact: the board card now shares Today’s information order, ratio colors, hierarchy badge treatment, and context controls while keeping direct hierarchy links, aggregate tracked/estimate usage, drag behavior, and no board status action. Constrained board labels visually truncate with their full text retained for accessible name/title; narrow cards wrap usage and hierarchy rows without overlap.
- Fact: Today/Tickets select-menu filters accept typed searches with useful placeholders. Search auto-focus is enabled on non-coarse-pointer devices and disabled on touch devices to avoid an automatic mobile keyboard; selection remains operable by keyboard and pointer.
- Fact: client/project list APIs include active descendant counts; release list data includes active and `Done` ticket counts. Cards display counts and release progress, with archived descendants/ancestors excluded and archived parent cards omitting child metrics. Active empty releases show 0/0 and 0%. ADR 0020 consolidates the M8 count and progress policy.
- Fact: relation/external-link context triggers are icon-only across Today, board, and release cards; no count chips are rendered.
- Evidence: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm check:workflow`, and `git diff --check` passed; `pnpm test` passed (12 files, 54 tests); `pnpm exec playwright test --workers=1` passed all 15 tests; `pnpm build` completed. Browser coverage includes filter search plus selection and no mobile auto-focus, counts/progress including empty/archived cases on desktop/mobile, board links at mobile width, and icon-only context triggers.
- Follow-up during verification: an initial full Playwright run found one stale test locator for the prior `Ticket parent relations` wrapper. Updated it to the shared `Ticket hierarchy` region; the complete suite then passed. No product-scope deviation.
- Manual visual review: inspected current desktop board and mobile board/Today plus client/project/release-card captures under `/tmp/nxmr-m8-review/`. Board titles and tracked/estimate usage remain legible, hierarchy labels do not overlap context icons, mobile pages have no horizontal page overflow, context icons remain visible without count chips, and 0/0 plus Done/total release progress render clearly. Temporary screenshot statements were removed from test code.

### 2026-09-27 — Client-card subtitle removal

- Fact: the client list card showed the pre-existing explanatory text `View projects and releases` beneath the card heading. The human requested removing that redundant subtitle while retaining the hierarchy-count summary.
- Decision: remove only the subtitle; keep client card navigation and descendant counts unchanged.
- Evidence: added a browser assertion that the client list no longer renders the subtitle. The focused test and checks passed as recorded in the M8 milestone journal.

### 2026-09-27 — Shared two-row project cards

- Fact: client detail previously used a separate project card with a `View releases` subtitle and no hierarchy counts; the Projects list already showed project title, client, and active release/ticket counts.
- Decision: reuse one `ProjectCard` component on both surfaces. Keep it to two logical rows: color/title (and archive badge) above; client link and release/ticket counts below. Preserve archived-metric visibility and project/client navigation.
- Evidence: regression coverage checks shared content/two-row structure on both surfaces, absence of `View releases`, mobile client-detail layout, and card links. `pnpm exec playwright test tests/e2e/auth-shell.test.ts --workers=1` passed (2 tests); formatting, lint, both type checks, workflow validation, and `git diff --check` passed. Details are in the M8 milestone journal.

## Verification

- **Unit/API:** retain `usageColor` boundary tests; cover omitted/valid labels, blank form input normalized to absent, persisted `NULL`, hostname fallback (including subdomains), and existing-label preservation. Verify migration SQL is additive/non-destructive and all link response shapes remain valid.
- **Playwright:** Today workday values use ratio colors at under-80%, 80–<100%, 100–120%, and >120%; the accessible progress summary reports tracked time, target, and overtime. The segmented bar fills proportionally below target, shows a 90/10 blue/orange split at 110%, and all orange at 200%; overtime appears only in the tracked/target sum. Adjacent blocks have a visible gap without changing persisted intervals. Today entry cards show duration but not start/end. Status action retains filtering, exposes all nested statuses, checks the current status, updates the selected ticket, refreshes the row, and reports failure. Test active and archived-history rows against existing ticket PATCH behavior.
- **Playwright:** board and Today share visual row order, hierarchy badge styling/placement, colors, and context-link position while retaining direct links vs filter/open popovers and surface-specific time semantics; board status controls remain absent. Release ticket cards have working client/project/release quick links. Context triggers remain icon-only, without count chips, across desktop and mobile. Client/project/release cards show correct active descendant counts; release progress uses Done/total and remains accessible, including the zero-ticket case and archived-parent visibility. Today/Tickets filter menus accept typed searches without changing selection/form/archive controls. Clients/Projects headings are visible; the client detail subtitle is absent. Unlabeled links show `hostname` in details and popovers; custom labels continue to display unchanged.
- **Manual:** inspect Today, board, and release cards at desktop and mobile sizes; keyboard-navigate status and searchable filters; check card visual parity, hierarchy counts/progress, adjacent timeline blocks, progress color/rounded ends, icon-trigger legibility, and quick-link targets.
- **Commands:** `pnpm db:generate` (inspect generated migration), `pnpm db:migrate`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, `pnpm exec playwright test --workers=1`, `pnpm build`, `pnpm check:workflow`, and `git diff --check`. Record outcomes and any blockers/deviations in the milestone file.

## Review status

- Plan review: Accepted via Plannotator (2026-09-26).
- Code review: Pending.
- Milestone completion declaration: Pending.
- Implementation: in progress within the approved scope.

## Follow-ups

- Any broader common-component cleanup found during the focused audit but outside these surfaces should be proposed separately, not silently added.
