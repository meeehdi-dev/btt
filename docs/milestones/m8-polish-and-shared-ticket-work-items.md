# M8 — Polish and shared ticket work items (Complete)

## Context

M7 is complete. M8 is a polish-only slice that improves Today time-entry readability and progress feedback, adds status changes from the agenda, and shares ticket/time presentation across Today, the board, and release cards. It also makes external-link labels optional, restores visible Clients/Projects page titles, and adds hierarchy quick links to release ticket cards. After first code-review feedback, the human explicitly expanded this same milestone to include Today/board visual parity, searchable filter menus, hierarchy-card counts and release progress, and corrected context-trigger presentation. On 2026-09-27 the human also requested a shared two-row project card on both the Projects list and client detail, then clarified to remove context count chips entirely. The final M8 decisions are consolidated in ADR 0020. Approved plan: `plans/next-milestone.md`.

## Approved scope

- Color tracked-time values with existing ratio bands: info/blue below 80%, success/green from 80% to below 100%, warning/orange from 100% through 120%, and error/red above 120%. Keep targets/estimates muted.
- Replace Today’s native progress bar with rounded `UProgressGroup`. Show proportional blue progress up to the workday target; above target, fill the bar and grow an orange segment by overtime share (110% = 90% blue / 10% orange; 200% = all orange). Provide one accessible progressbar summary with worked/target/overtime text; hide redundant segment semantics. Remove the separate overtime `+N` suffix.
- Add a focused shared ticket-work-item presentation for entry-duration and ticket-summary variants. Reuse it in Today, ticket-board, and release cards while keeping drag, edit, filtering, navigation, status, and relation-popover interactions in their current owners.
- Human-approved review addition: align Today and board card content order, placement, spacing, colors, and hierarchy-badge styling. Board client/project/release badges remain direct links rather than Today filter/open popovers. Preserve surface-specific time meaning (per-entry duration in Today; aggregate tracked/estimate usage on board), omit the board percentage badge, and do not reintroduce a board status-change or redundant status badge, per ADR 0013.
- Human-approved review addition: make every existing select-menu filter on Today and Tickets/board searchable (client, project, release, ticket, plus Today status) with useful search placeholders and no automatic mobile keyboard focus. Binary archive toggles, form selects, and action menus are unchanged.
- Human-approved review addition: client cards show active project/release/ticket counts; project cards show active release/ticket counts; release cards show active ticket count and an accessible progress bar for `Done` tickets / all active tickets. Counts are owner-scoped and exclude archived descendants and descendants under archived ancestors; archived parent cards omit child metrics. Active releases with no active tickets show `0 / 0 done` and an empty 0% bar.
- Human request (2026-09-27): use one shared two-row `ProjectCard` on the Projects list and client detail. Put project color/title on top; put the client link and active release/ticket counts below. Remove the client-detail project-card `View releases` subtitle.
- Visually separate adjacent agenda blocks without changing slot geometry or overlap rules. Today entry cards show only the current entry’s duration, not start/end times.
- Add a Today status menu with `Filter by status` and a nested `Change` submenu for all `ticketStatuses`; mark the current value with a check. Persist through existing `PATCH /api/tickets/:id`, refresh agenda/ticket data, and show accessible pending/error feedback.
- Make external-link labels nullable in storage and optional in request/forms. Migrate by dropping `NOT NULL` without rewriting existing labels. Display a custom label when present, otherwise the URL hostname including subdomains.
- Keep relation/external-link popover triggers as accessible icons without count chips, regardless of item count.
- Add client/project/release quick-link badges to release ticket cards using shared hierarchy presentation where appropriate.
- Add a release-detail `Mark release as done` action using the existing archive behavior. Warn and require confirmation when tickets are unfinished or the release is empty; after success, navigate to the parent project.
- Allow deletion from the Today time-correction modal using the existing DELETE API and a confirmation prompt; preserve existing history and overlap rules.
- Make Clients and Projects list headings visible; remove the redundant client-card subtitle `View projects and releases` and client-detail subtitle.
- Conduct a focused shared-component pass over these ticket/time-entry, hierarchy-badge, usage, and context-popover surfaces only.

## Out of scope

- New product areas, weekly planning/reporting, unrelated visual redesign, or broad refactoring beyond the requested surfaces.
- Changes to status values/rules, time-entry persistence/overlap rules, estimate calculations, ownership, archive visibility, auth, or deployment.
- Dependencies or schema changes other than nullable external-link labels.
- Restoring a board next-status action or changing ticket-detail status controls.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`, `plans/next-milestone.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`, `docs/milestones/m7-search-and-ui-polish.md`
- ADRs 0012 (Today progress/history), 0013 (board status-control scope), 0018 (ticket contexts and ratio bands), and the consolidated M8 decisions in ADR 0020.
- Nuxt UI maintainer skill `.agents/skills/nuxt-ui/SKILL.md`; official ProgressGroup, Chip, SelectMenu, and DropdownMenu references linked in the approved plan.

## Approach

Use existing `usageColor`, `TicketTrackedUsage`, and `TicketContextPopovers` behavior. Extract a shared presentational ticket work item and hierarchy badges, keeping agenda/board/release wrappers responsible for their existing interactions. Use `UProgressGroup` with one outer accessible progressbar summary. Reuse ticket status constants and board status-update pending/error patterns. Make label optional end-to-end with a generated, reviewed, non-destructive Drizzle migration and a hostname fallback in link displays. Update the product roadmap and add/link ADRs for durable changes without rewriting accepted records.

## Files to modify

- `PLAN.md`
- This milestone file
- `app/components/{TodayAgendaEntry,TodayAgenda,TicketBoardCard,TicketContextPopovers,TicketTrackedUsage}.vue` and `app/components/ProjectCard.vue`
- New `app/components/TicketWorkItem.vue` and `app/components/TicketHierarchyBadges.vue` unless equivalent reusable components are identified
- `app/pages/today.vue`, `app/pages/tickets/index.vue`, `app/pages/releases/[id]/index.vue`, `app/pages/clients/index.vue`, `app/pages/projects/index.vue`, `app/pages/projects/[id]/index.vue`, `app/pages/clients/[id]/index.vue`
- Active hierarchy aggregation in `server/api/clients/index.get.ts`, `server/api/projects/index.get.ts`, and `server/api/releases/index.get.ts`; new `app/components/HierarchyCounts.vue` if useful for shared count rendering
- `app/pages/tickets/new.vue`, `app/pages/tickets/[id]/index.vue`; a small `app/utils/` hostname-label helper if useful
- `server/db/schema.ts`, `server/domain/schemas.ts`, `server/api/tickets/index.post.ts`, `server/api/tickets/[id]/links/index.post.ts`, `server/api/tickets/[id]/links/[linkId].patch.ts`, `server/api/tickets/index.get.ts`, `server/api/agenda/index.get.ts`
- Generated Drizzle migration and metadata: `drizzle/0008_*.sql`, `drizzle/meta/0008_snapshot.json`, `drizzle/meta/_journal.json`
- `tests/e2e/agenda.test.ts`, `tests/e2e/ticket-context-popovers.test.ts`, `tests/e2e/tickets.test.ts`, `tests/e2e/auth-shell.test.ts`, focused filter-search and hierarchy-card-metrics E2E tests, focused unit/schema/hostname tests
- `docs/decisions/README.md` and the consolidated M8 decision record `docs/decisions/0020-m8-polish-decisions.md`

## Reuse

- `shared/time-entry.ts` `usageColor`; `tests/unit/time-entry.test.ts` already covers 79/80/99/100/120/121% boundaries.
- `app/components/TicketTrackedUsage.vue` and `TicketContextPopovers.vue` already serve board/release/Today contexts.
- `TodayAgendaEntry.vue` owns entry duration, hierarchy filters/actions, and correction interactions; `TodayAgenda.vue` owns gesture geometry.
- `TicketBoardCard.vue` owns drag/highlight/locate behavior. `/api/tickets` already returns tracked aggregates and hierarchy IDs/names; Today already fetches ticket summaries.
- `shared/ticket-status.ts`, `app/pages/tickets/index.vue` `moveStatus`, and `server/api/tickets/[id].patch.ts` provide available statuses and the existing status update contract/pattern.
- `app/utils/ticket-url.ts`, current ticket-link request schemas/handlers, and Drizzle history provide URL validation and migration patterns.
- Installed Nuxt UI 4.11.1 `UProgressGroup`, `USelectMenu`, and `UDropdownMenu` APIs/themes; use semantic colors and documented searchable inputs.

## Decisions and ADR links

- Plan initially approved via Plannotator; the human explicitly approved the first-review scope additions on 2026-09-26. M8 status changes are offered in Today only; ADR 0013’s removal of the board next-status action remains intact.
- Preserve the existing 80/100/120% ratio thresholds and calculations. The workday bar uses blue progress up to target and an orange overtime share; tracked-time text uses ratio-band semantic colors.
- Preserve existing external labels; missing labels display the URL hostname. Nullable storage, PATCH omission/null behavior, and hostname fallback are recorded in ADR 0020.
- Today and board share visual card composition without conflating per-entry duration with aggregate ticket usage. Filter menus use documented searchable `USelectMenu` inputs. Counts include active descendants under active ancestors only; release progress is `Done` / active ticket total, and archived-parent visibility remains unchanged. These M8 policies are consolidated in ADR 0020.
- ADR 0020 consolidates the ratio-color, optional-label, hierarchy-count, left-alignment, icon-only-trigger, and release-percentage decisions. It supersedes only the corresponding portions of ADRs 0017–0019; other earlier rules remain in force.

## Implementation checklist

- [x] Human approved `plans/next-milestone.md` via Plannotator; create this milestone record from the template before code changes.
- [x] Extract/reuse ticket-work-item and hierarchy-badge presentation in Today, board, and release views without changing existing interactions.
- [x] Apply ratio-band colors, accessible segmented progress/overtime bar, remove overtime suffix, separate adjacent slots, and show only entry duration in Today cards.
- [x] Add agenda status `Change` submenu with a checkmark on the current status; preserve filtering and cover update/refresh/error behavior.
- [x] Make external-link labels nullable end-to-end; review/apply the non-destructive migration and verify hostname fallback.
- [x] Remove context count chips, add release hierarchy quick links, restore Clients/Projects headings, remove client-card/detail subtitles, and share two-row project cards between Projects and client detail.
- [x] Update `PLAN.md`, add/link required ADRs, add focused regression tests, run verification, and record results below.
- [x] Complete human-approved scope additions: Today/board visual parity, searchable Today/Tickets filters, active hierarchy counts/release progress, and icon-only context triggers; add regression coverage and record final evidence.
- [x] Add release-detail completion confirmation and Today correction-modal deletion with regression coverage.
- [x] Human code review completed with no changes requested; human milestone completion declaration recorded.

## Journal

### 2026-09-26 — Plan approved and milestone opened

- Fact: Plannotator approved `plans/next-milestone.md`, including the 90/10 blue/orange overtime split at 110%, all-orange bar at 200%, and a checkmark on the current agenda status.
- Decision: implementation is limited to the approved polish scope; all existing drag/edit/navigation/filter/archive and status rules remain unchanged.
- Evidence: `pnpm exec oxfmt --check plans/next-milestone.md` passed; `node scripts/check-workflow-docs.mjs` passed ("Workflow documentation structure looks complete."). No code changes preceded this milestone record.

### 2026-09-26 — Human-approved scope expansion during code review

- Fact: first Plannotator code review returned three findings: board card visual parity with Today, searchable filters, and hierarchy card counts/release progress. The human confirmed the desired visual parity (shared order, badges, colors, and placement but surface-specific actions), requested searchable filters and counts/progress in M8, and added a count-chip placement follow-up. The human explicitly said to keep these additions in M8 rather than split them into another polish milestone.
- Fact: current Today and board wrappers intentionally use different per-entry versus aggregate time values; only the board visual composition is being aligned. ADR 0013 still excludes board status changes. Today/Tickets filter menus explicitly suppress search with `:search-input="false"`.
- Fact: the official Nuxt UI Chip docs show `<UChip><UButton ... /></UChip>` and document `inset` for positioning inside the wrapped component; SelectMenu docs support a configurable `search-input`; Progress docs provide value/max progress.
- Decision: add the approved review requests to this existing M8 scope. Use `Done` as the completed status and count only active descendant records under active ancestors; archived parents do not expose child metrics. Show active empty releases as 0/0 at 0%.
- Evidence: fetched official docs at `https://ui.nuxt.com/docs/components/chip`, `https://ui.nuxt.com/docs/components/select-menu`, and `https://ui.nuxt.com/docs/components/progress`; inspected current board/Today components, list APIs, and archive ADR 0004. No code has yet been changed in response to review feedback.

### 2026-09-26 — Shared ticket-work-item presentation

- Fact: added `TicketWorkItem.vue` with entry and ticket-summary variants and `TicketHierarchyBadges.vue` with Today filter/open and direct-link modes. Composed them in Today entries, board cards, and release cards; wrappers retain their status, drag, edit, navigation, filtering, and relation-popover ownership.
- Decision: release cards now expose client/project/release quick links through the shared hierarchy component. Today still shows its existing start/end plus duration until the approved duration-only agenda polish step.
- Evidence: `pnpm exec playwright test tests/e2e/agenda.test.ts tests/e2e/ticket-navigation.test.ts tests/e2e/ticket-context-popovers.test.ts --workers=1` passed (3 tests); `pnpm typecheck`, `pnpm lint`, `pnpm exec oxfmt --check` on the six changed source/test files, and `git diff --check` passed.

### 2026-09-26 — Ratio and agenda visual polish

- Fact: tracked-time text now uses the established `usageColor` bands. Today uses a rounded `UProgressGroup` with one accessible progressbar summary, blue progress below target, and a proportional orange overtime segment capped at 200%. Removed the +overtime suffix; Today entry cards now show duration only. Added a 1px vertical inset inside unchanged timeline wrappers for adjacent blocks.
- Evidence: `pnpm test -- tests/unit/time-entry.test.ts` passed (12 files, 54 tests; the package script runs the full unit suite). `pnpm exec playwright test tests/e2e/agenda.test.ts tests/e2e/agenda-progress.test.ts tests/e2e/ticket-context-popovers.test.ts --workers=1` passed (3 tests), covering 90/10 at 110%, all-orange at 200%, one accessible progressbar, all four ratio text colors, duration-only entry labels, and visual card gaps with unchanged wrapper bounds. `pnpm typecheck`, `pnpm lint`, `pnpm exec oxfmt --check` on the seven changed source/test files, and `git diff --check` passed.
- Follow-up during verification: settings require targets in 30-minute increments, so the 72-minute test fixture was corrected to 90 minutes; reloading Today also resets the add-dialog ticket selection, now explicitly restored by the overlap test. No product-scope deviation.

### 2026-09-26 — Today status menu

- Fact: replaced the filter-only Today status popover with a `UDropdownMenu` containing `Filter by status` and a nested `Change` submenu for all `ticketStatuses`, with a checkmark on the current status. Updates use the existing ticket PATCH endpoint and refresh agenda plus ticket data.
- Decision: status changes are disabled for archived tickets or archived hierarchy history; status filtering remains available. Pending updates disable the trigger and announce through a polite live region; errors use an alert.
- Evidence: `pnpm exec playwright test tests/e2e/agenda-status.test.ts --workers=1` passed (1 test), covering all statuses, checkmark, preserved filtering, pending feedback, successful PATCH/refresh, accessible errors, and archive restrictions. `pnpm typecheck`, `pnpm lint`, `pnpm exec oxfmt --check` on the four changed files, and `git diff --check` passed.

### 2026-09-26 — Optional external-link labels

- Fact: `ticket_link.label` is nullable; `TicketLinkCreate` accepts omitted/`null` labels and `TicketLinkUpdate` preserves omitted fields while allowing explicit `null`. Ticket creation and link creation store missing labels as SQL `NULL`; both ticket forms omit blank labels. Detail and shared context-popover displays retain custom labels and otherwise use `URL.hostname` including subdomains.
- Decision: clear a label through the PATCH contract with explicit `null`; an omitted PATCH label leaves the stored custom label untouched. URL validation and ownership/archive rules remain unchanged.
- Evidence: `pnpm db:generate` created `drizzle/0008_spooky_cargill.sql`; inspection confirmed the sole statement is `ALTER TABLE "ticket_link" ALTER COLUMN "label" DROP NOT NULL;` (no data rewrite). `pnpm db:migrate` applied successfully. `pnpm test -- tests/unit/tickets.test.ts` passed (12 files, 54 tests). `pnpm exec playwright test tests/e2e/ticket-context-popovers.test.ts --workers=1` passed (1 test); `pnpm exec playwright test tests/e2e/tickets.test.ts --workers=1` passed (1 test), covering API/creation/form null persistence, custom-label preservation on partial PATCH, and subdomain hostname fallback on detail and shared popovers. Typecheck, lint, formatting, and `git diff --check` passed. The first ticket-form browser attempt ran immediately after reload before hydration and triggered native form submission; adding the existing project pattern `waitForLoadState('networkidle')` resolved this test-timing issue without product changes.

### 2026-09-26 — Count chips and hierarchy page polish

- Fact: both context count badges now use the documented `UChip` `lg` size with `inset`, removing the custom 16px badge override. Release ticket cards' hierarchy links (client, project, release) were added with the shared `TicketHierarchyBadges` presentation in the shared-component step. Clients and Projects list headings are visible; removed only the redundant client-detail subtitle.
- Evidence: `pnpm exec playwright test tests/e2e/auth-shell.test.ts tests/e2e/ticket-context-popovers.test.ts --workers=1` passed (3 tests). It checks visible title size, absence of the subtitle, release hierarchy hrefs, count badges under 16px and within trigger bounds across board/release/Today mobile, and that each count badge leaves its icon visible. An initial icon assertion assumed an SVG element; Nuxt UI's local `UIcon` root is marked `aria-hidden`, so the test now checks that actual rendered element instead. No product-scope deviation.

### 2026-09-26 — Roadmap and durable decision records

- Decision: updated the roadmap and initially recorded M8 decisions separately. Per the user's later instruction, these M8 decisions are consolidated in ADR 0020; earlier ADRs 0017–0019 remain, with only their supersession metadata updated.
- Evidence: `pnpm check:workflow` passed after the ADR index and roadmap updates. Formatting and final verification results are recorded below.

### 2026-09-26 — Final verification and visual review

- Evidence: `pnpm db:generate` created `drizzle/0008_spooky_cargill.sql`; the generated SQL contains only `ALTER TABLE "ticket_link" ALTER COLUMN "label" DROP NOT NULL;`. `pnpm db:migrate` applied successfully.
- Evidence: `pnpm test` passed (12 files, 54 tests); `pnpm exec playwright test --workers=1` passed all 13 tests; `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm lint`, `pnpm format:check`, `pnpm check:workflow`, and `git diff --check` passed. `pnpm build` completed; Nuxt reported a non-blocking plugin-timing diagnostic.
- Follow-up during verification: the first full Playwright run found three stale assertions expecting the old fixed `text-primary` rule (one Today under-target value and two 150%-usage values). Updated them to the approved semantic `text-info`/`text-error` classes; the full 13-test run then passed. The first repository-wide format check found only the newly generated Drizzle metadata needed Oxfmt formatting; the final check passed after formatting it.
- Manual visual check: a temporary authenticated Playwright fixture captured and then was removed after generating screenshots in `/tmp/nxmr-m8-review/` for desktop Today, board, release, board external-link popover, Today status submenu, and mobile Today. Inspected the screenshots: tracked/target progress and slot gaps are legible, custom and hostname link labels render, compact count chips leave icons visible, release hierarchy links are present, and the mobile page has no horizontal overflow. No unexpected visual issue found.

### 2026-09-26 — Human-approved review additions implemented

- Fact: aligned the board card's information order, typography, ratio colors, hierarchy badge treatment, and context controls with Today while preserving direct board hierarchy links, aggregate tracked/estimate usage, drag behavior, and the absence of a board status action. Narrow board cards wrap labels and truncate visually with the full label retained as a title/accessible text; description remains above hierarchy links.
- Fact: Today and Tickets/board filters now have searchable inputs with entity-specific placeholders. Desktop menus focus search for immediate typing; touch devices suppress automatic focus so opening a menu does not summon the mobile keyboard. Filter selection continues to work by pointer/keyboard, and archive/form controls remain unchanged.
- Fact: client/project APIs now return active descendant counts; release list data supplies active and `Done` ticket totals. Client/project/release cards render the requested counts and release completion progress. Counts are owner-scoped, exclude archived descendants and descendants under archived ancestors, and archived parent cards omit child metrics. Empty active releases show `0 / 0 done` and an empty accessible 0% progress bar. ADR 0020 consolidates this policy.
- Fact: context chips now wrap complete trigger buttons, use documented compact `UChip` sizing with inset top-right placement, and remain inside trigger bounds without covering the icon. The existing containment/visibility test was updated for the complete-button wrapper.
- Evidence: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm check:workflow`, and `git diff --check` passed. `pnpm test` passed (12 files, 54 tests). `pnpm exec playwright test --workers=1` passed all 15 tests, including searchable-filter selection/touch focus, mobile board links/no page overflow, active/empty/archived hierarchy metrics, release progress, and count-chip containment. `pnpm build` completed successfully.
- Follow-up during verification: the first full E2E run exposed one stale geometry assertion querying the removed `Ticket parent relations` label; the test now checks the shared `Ticket hierarchy` region, and the complete 15-test suite passed on rerun. Aggregate-test development also confirmed ADR 0004's existing behavior of hiding descendants under archived ancestors; regression coverage now asserts those descendants stay absent and no child metrics leak. Search-filter selection tests type before choosing an option, and verify both desktop search focus and no automatic mobile keyboard focus. No product behavior or scope was changed to work around the assertions.
- Manual visual check: inspected current desktop board, mobile board, mobile Today, client list, project list, and project release-card captures in `/tmp/nxmr-m8-review/`. Board title/usage rows remain legible at narrow card widths, hierarchy labels truncate without overlapping the context icons, the desktop/mobile page has no horizontal overflow, count chips leave icons visible, and release counts/progress (including `0 / 0`) are clearly presented. The screenshots were produced using temporary test code that was removed. No unexpected issue found.

### 2026-09-27 — Client-card subtitle removal

- Fact: confirmed the client list rendered `View projects and releases` beneath every card heading; this explanatory subtitle predated M8's expanded review work.
- Decision: remove only that subtitle, retaining client-card navigation and the active hierarchy counts.
- Evidence: the authenticated client-hierarchy browser test now asserts that the exact subtitle is absent. `pnpm exec playwright test tests/e2e/auth-shell.test.ts --workers=1` passed (2 tests); `pnpm format:check`, `pnpm check:workflow`, and `git diff --check` passed.

### 2026-09-27 — Shared two-row project cards

- Fact: client detail had a separate project card with a `View releases` subtitle and no statistics; the Projects page already displayed the client name and active release/ticket counts.
- Decision: extracted `ProjectCard.vue` and reused it on both pages. The card has a project-color/title row and a lower client-link plus release/ticket-count row. Archived projects/ancestors continue to hide child metrics.
- Evidence: the authenticated hierarchy test checks the shared summary and row order on both pages, verifies `View releases` is absent, and exercises the client and project links; the client-detail card is checked at a 390px viewport and its summary remains one row. `pnpm exec playwright test tests/e2e/auth-shell.test.ts --workers=1` passed (2 tests); `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm check:workflow`, and `git diff --check` passed.
- Follow-up during verification: the initial `pnpm typecheck` caught that Nuxt serializes API `Date` values as strings in page props. `ProjectCard.vue` accepts both serialized strings and `Date` values for archive timestamps; all type checks passed on rerun.

### 2026-09-27 — Left-aligned project card summaries

- Fact: the shared `ProjectCard` used on client detail and Projects spaced its client link and counts to opposite edges. The human asked for a left-grouped lower row like the Clients card and identified that arrangement as the preferred direction for other cards.
- Decision: group the client link and counts from the left in the shared component, wrapping on narrower widths; retain links and archived-count behavior. ADR 0020 records the card direction without broadening this change to unrelated surfaces.
- Evidence: `pnpm exec playwright test tests/e2e/auth-shell.test.ts --workers=1` passed (2 tests); the browser checks lower-row positions on Projects desktop and client detail at 390px, navigation, and mobile page overflow. `pnpm exec oxfmt --check app/components/ProjectCard.vue tests/e2e/auth-shell.test.ts`, `pnpm lint`, `pnpm typecheck`, and `git diff --check` passed. An initial format check found a formatting-only change in the test, corrected with `pnpm exec oxfmt tests/e2e/auth-shell.test.ts` before the passing recheck.

### 2026-09-27 — Compact release cards on project detail

- Fact: the project-detail release card placed its mark-done button at the lower right and repeated ticket totals beside a separate progress row; its target date added another row. The human requested three compact, left-grouped rows.
- Decision: active release cards now show title and mark-done button together, `done / total` below, then a compact-height bar and percentage. Target dates remain on release detail; archived cards still hide progress and have no mark-done action. The accessible progress description and existing Done/count rules are unchanged.
- Evidence: `pnpm exec playwright test tests/e2e/hierarchy-card-metrics.test.ts tests/e2e/auth-shell.test.ts tests/e2e/search.test.ts --workers=1` passed (4 tests), including desktop/mobile row geometry, compact height, empty/archived cases, progress accessibility, tooltip, action, and no mobile overflow. `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm exec oxfmt --check app/pages/projects/'[id]'/index.vue tests/e2e/hierarchy-card-metrics.test.ts`, and `git diff --check` passed.

### 2026-09-27 — Full-width release progress and ticket icon

- Fact: the first three-row version capped the progress bar at 10rem and omitted the ticket icon in the count row; the human requested both corrections.
- Decision: retain the three-row layout, restore the ticket icon next to `done / total`, and let the compact-height progress bar fill the third row's available width beside the percentage.
- Evidence: `pnpm exec playwright test tests/e2e/hierarchy-card-metrics.test.ts tests/e2e/auth-shell.test.ts --workers=1` passed (3 tests), including desktop/mobile icon and bar-width checks. `pnpm exec oxfmt --check app/pages/projects/'[id]'/index.vue tests/e2e/hierarchy-card-metrics.test.ts`, `pnpm lint`, `pnpm typecheck`, and `git diff --check` passed.

### 2026-09-27 — Compact release-detail ticket cards

- Fact: release-detail ticket cards previously placed status in the heading, usage and description on separate lines, hierarchy links on another, and relation/link popovers at the far right. The human requested a two-row card.
- Decision: keep ticket title and tracked/estimate usage together on the first row; group existing soft hierarchy link buttons, status, and relation/external-link controls from the left on a single horizontally scrollable second row at narrow widths. The ticket description remains available in other contexts and on detail. Existing links, status, ownership, and time semantics are unchanged.
- Evidence: `pnpm exec playwright test tests/e2e/ticket-context-popovers.test.ts --workers=1` passed (desktop/mobile two-row geometry and existing popover/navigation assertions); `pnpm exec playwright test tests/e2e/ticket-navigation.test.ts tests/e2e/tickets.test.ts --workers=1` passed (2 tests). `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm exec oxfmt --check app/pages/releases/'[id]'/index.vue tests/e2e/ticket-context-popovers.test.ts`, and `git diff --check` passed.
- Open question: the request to apply these link buttons to client/project/release cards needs clarification: client cards have no parent link, and adding self-link buttons alongside whole-card navigation or extra content to the three-row release card would change the existing interaction/layout.

### 2026-09-27 — Release ticket status pill parity

- Fact: the release-ticket status used a bordered `subtle` badge without an icon, unlike the adjacent soft hierarchy buttons.
- Decision: render it as a non-interactive neutral `soft` badge with the existing status icon (`lucide:circle-dot`) and the same size/spacing as the link pills. Status behavior is unchanged.
- Evidence: `pnpm exec playwright test tests/e2e/ticket-context-popovers.test.ts --workers=1` passed (1 test), including desktop/mobile status icon, borderless style, and pill-height checks. `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm exec oxfmt --check app/pages/releases/'[id]'/index.vue tests/e2e/ticket-context-popovers.test.ts`, and `git diff --check` passed.

### 2026-09-27 — Shared hierarchy buttons on project and release cards

- Fact: the human clarified the earlier link-button request: use the ticket card's client-link presentation for the project card, and show client and project links on the release card before its ticket count.
- Decision: reuse `TicketHierarchyBadges` in the shared `ProjectCard` (both surfaces) and the project-detail release card. Keep full-card navigation and mark-done precedence, the three-row release layout and full-width progress, and archived-count visibility unchanged. Reuse already fetched project/client data; no new API or data rules.
- Evidence: `pnpm exec playwright test tests/e2e/hierarchy-card-metrics.test.ts tests/e2e/auth-shell.test.ts --workers=1` passed (3 tests), covering the soft button style, nested-link navigation, desktop/mobile row positions, no page overflow, and archived visibility. `pnpm exec playwright test tests/e2e/ticket-context-popovers.test.ts --workers=1` passed (1 test). `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm exec oxfmt --check app/components/ProjectCard.vue app/pages/projects/'[id]'/index.vue tests/e2e/auth-shell.test.ts tests/e2e/hierarchy-card-metrics.test.ts`, and `git diff --check` passed. The prior link-button question is resolved for these surfaces.

### 2026-09-27 — Release-card ticket count color

- Fact: after adding soft client/project link pills, the adjacent ticket count still used muted text while those pills use the semantic default text color.
- Decision: match the ticket count text/icon to the adjacent link text with `text-default`; keep the progress percentage muted and all count/interaction behavior unchanged.
- Evidence: `pnpm exec playwright test tests/e2e/hierarchy-card-metrics.test.ts --workers=1` passed (1 test), including computed text-color parity on the release card. `pnpm exec oxfmt --check app/pages/projects/'[id]'/index.vue tests/e2e/hierarchy-card-metrics.test.ts`, `pnpm lint`, `pnpm typecheck`, and `git diff --check` passed after formatting the updated assertion.

### 2026-09-27 — Remove relation/external-link count chips

- Fact: the shared context trigger put count chips on relation/external-link icons when there were multiple items. The human asked to remove these chips everywhere.
- Decision: remove count chips from shared triggers across Today, board, and release ticket cards. Keep icon visibility, accessible names, single/multi-item popovers, hover/focus/touch behavior, board relation highlight, and safe external links. ADR 0020 consolidates the final icon-only trigger rule; `PLAN.md` describes the same behavior.
- Evidence: `pnpm exec playwright test tests/e2e/ticket-context-popovers.test.ts --workers=1` passed (1 test) after correcting a test selector that initially matched the neighboring icon button rather than a chip. It covers no chips, icon visibility, and popovers for single/multiple items across board, release, and mobile Today. `pnpm exec playwright test tests/e2e/ticket-navigation.test.ts tests/e2e/ticket-status-moves.test.ts tests/e2e/agenda.test.ts --workers=1` passed (3 tests). `pnpm exec oxfmt --check app/components/TicketContextPopovers.vue tests/e2e/ticket-context-popovers.test.ts`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, and `git diff --check` passed.

### 2026-09-27 — Match project-card summary text color

- Fact: the shared project card (on client detail and Projects) displayed its client as a soft link with `text-default`, but its release/ticket counts were `text-muted`.
- Decision: use the default semantic text tone for counts only in `ProjectCard` so the whole bottom row matches; leave client-list count styling unchanged.
- Evidence: `pnpm exec playwright test tests/e2e/auth-shell.test.ts tests/e2e/hierarchy-card-metrics.test.ts --workers=1` passed (3 tests), including computed text-color parity on both ProjectCard surfaces and at 390px. `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm exec oxfmt --check app/components/HierarchyCounts.vue app/components/ProjectCard.vue tests/e2e/auth-shell.test.ts`, and `git diff --check` passed.

### 2026-09-27 — Release ticket heading usage without percentage

- Fact: the human requested release-detail ticket cards omit their ratio badge; a subsequent message clarified that tracked time / estimate belongs beside the title, not in the second row.
- Decision: keep tracked time / estimate in the compact first row, hide only its percentage badge on this surface, and retain the established ratio-based tracked-time color and accessible label. Board and ticket detail still display their percentage. ADR 0020 consolidates this display exception; `PLAN.md` reflects it.
- Evidence: `pnpm exec playwright test tests/e2e/ticket-context-popovers.test.ts tests/e2e/time-entries.test.ts --workers=1` passed (2 tests), checking desktop/mobile heading placement, no release percentage, and unchanged board/detail percentages. `pnpm exec playwright test tests/e2e/ticket-navigation.test.ts tests/e2e/tickets.test.ts --workers=1` passed (2 tests). The first time-entry run failed because Vue defaulted an omitted optional Boolean prop to `false`, hiding the board percentage too; explicit `showPercentage: true` defaults restored it, and both tests passed on rerun. `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, focused `pnpm exec oxfmt --check`, and `git diff --check` passed.

### 2026-09-27 — Explicit entity edit labels and action order

- Fact: client/project detail headers used generic `Edit` labels, and the release header placed `New ticket` before `Edit`.
- Decision: label the actions `Edit client`, `Edit project`, and `Edit release`; keep Edit to the left of New on desktop and above it on mobile. Preserve existing action destinations and archive visibility.
- Evidence: `pnpm exec playwright test tests/e2e/auth-shell.test.ts tests/e2e/ticket-context-popovers.test.ts tests/e2e/time-entries.test.ts --workers=1` passed (4 tests), including responsive header-action order on all three detail pages. `pnpm exec playwright test tests/e2e/ticket-navigation.test.ts tests/e2e/tickets.test.ts --workers=1` passed (2 tests); `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, focused `pnpm exec oxfmt --check`, and `git diff --check` passed.

### 2026-09-27 — Release completion and agenda correction actions

- Fact: project detail already marks a release done by archiving it. The human requested the same action on release detail, with a warning if tickets are unfinished, and deletion from the Today correction modal.
- Decision: use the existing archive PATCH and return to the parent project after success. Confirm before archiving if any ticket is not Done, including the empty-release case. Delete only the selected time entry through the existing DELETE endpoint after confirmation; server authorization and overlap/history rules remain unchanged.
- Evidence: `tests/e2e/ticket-context-popovers.test.ts` covers the incomplete-ticket warning, confirmation cancellation, archive success after all tickets are Done, and visible error feedback when the archive PATCH fails. `tests/e2e/auth-shell.test.ts` covers the empty-release warning. `tests/e2e/agenda-drag.test.ts` deletes an entry from the correction modal and verifies it is absent from the agenda API response.

### 2026-09-27 — Full implementation review and decision consolidation

- Fact: review found that a failed archive request from the confirmation modal rendered its error behind the modal; the alert now appears inside the modal and a mocked-failure browser assertion covers it. Review also found the empty-release warning implied unfinished tickets; the modal now states that there are no tickets and that confirmation archives the release, covered by E2E. No unresolved implementation defect remains from this pass.
- Decision: omit percentage badges on both board and release ticket cards while keeping tracked time and estimate together; ticket detail retains its percentage. Consolidate the six new M8 ADRs into one ADR 0020, preserving their decisions and supersession scope. Existing ADRs 0001–0019 remain separate; the index keeps its existing structure and updates only the M8 entry.
- Evidence: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (12 files, 54 tests), `pnpm check:workflow`, `git diff --check`, `pnpm exec playwright test --workers=1` (15 tests), and `pnpm build` all passed. The human code review result is recorded below; the milestone completion declaration remains pending.

### 2026-09-27 — Human code review

- Fact: the human completed code review and requested no changes.
- Review status: accepted; no follow-up changes requested.

### 2026-09-27 — M8 completion declared

- Fact: the human declared, “i hereby declare this milestone complete”.
- Status: M8 complete; the approved scope, verification, and human code review are recorded above.

## Verification

- [x] Unit/API: ratio boundaries; optional/omitted labels and blank-form normalization; persisted `NULL`; hostname fallback including subdomains; existing-label preservation; migration only drops `NOT NULL`.
- [x] Playwright: progress summary accessibility and ratio coloring; 110% and 200% segment geometry; adjacent blocks are visually separated without persisted interval changes; agenda cards show duration without start/end.
- [x] Playwright: nested status menu retains filter, lists all statuses, checks current status, updates/refreshes ticket, and handles failures; existing history/archived behavior remains intact.
- [x] Playwright: shared presentation preserves drag/edit/navigation/popovers; release hierarchy links work; context triggers are icon-only with no count chips; Clients/Projects titles are visible and redundant subtitles are absent; shared project cards show client plus release/ticket counts in two rows on both surfaces and retain navigation; custom and fallback link labels render in detail/popovers.
- [x] Playwright: board/Today visual parity, searchable Today/Tickets filter menus, client/project/release counts, and release Done/total progress including zero/archived cases.
- [x] Manual desktop/mobile check of expanded board layout, filter search, hierarchy metrics/progress, and icon-only context triggers.
- [x] Manual desktop/mobile visual check of Today, board, release, segmented progress, status menu, adjacent slots, context icons, and hierarchy links (original scope).
- [x] Run and record `pnpm db:generate`, inspect migration, `pnpm db:migrate`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, `pnpm exec playwright test --workers=1`, `pnpm build`, `pnpm check:workflow`, and `git diff --check`.

## Review status

- Plan review: Accepted via Plannotator (2026-09-26); subsequent M8 scope additions were directly approved in chat.
- Agent review: Completed; one modal error-visibility finding was fixed and regression-tested. No unresolved implementation finding remains from this pass.
- Human code review: Accepted (2026-09-27); no changes requested.
- Milestone completion declaration: Recorded (2026-09-27); M8 Complete.
- Implementation and verification: Complete within the approved scope.

## Follow-ups

- Propose broader common-component cleanups outside the explicitly expanded Today/board/filter/card-metrics scope separately; do not expand M8 silently.

## Closeout checklist

- [x] Approved implementation checklist complete.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in the journal and review status.
