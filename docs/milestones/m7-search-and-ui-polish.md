# M7 — Search and compact UI polish (Approved; implementation in progress)

## Context

M6 is complete. M7 delivers universal search and keyboard/mobile/empty-state polish together with the compact shell and page adjustments requested by the human. Product scope is updated in `PLAN.md`; focused plan: `plans/m7-search-and-ui-polish.md`. The plan was approved before implementation; this log records execution evidence.

## Approved scope

Approved: owner-scoped universal search, desktop top-search/collapsible persistent sidebar, mobile full-screen menu, compact list/Today/Settings headers, clickable project/release surfaces with independent nested controls, shared relation/external-link popovers on ticket board, release cards and Today entries (including one-item cases), icon-corner counts only for multiple items, app-wide icon/tooltip/semantic contrast audit, keyboard/touch and state polish. A human-approved post-review addition also adds tracked/estimate usage to ticket board cards, distinguishes tracked time from estimates and Today targets, and keeps count badges inside their trigger bounds (ADR 0019).

## Out of scope

Auth/schema changes, new data types, reworking board drag/status rules, agenda gesture/storage changes, major redesign of detail/edit forms, weekly/calendar views. **Approved code-review scope deviation:** local Lucide development dependency, release ticket-list aggregate, and removal of ticket-detail quick status action (human confirmed in chat; ADR 0017).

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`, `docs/milestones/README.md`, `docs/templates/milestone-template.md`, `plans/m7-search-and-ui-polish.md`.
- M6 closeout; ADRs 0007 (relations and visibility), 0010/0013 (board interaction), 0012 (agenda progress/history), 0014 (agenda gestures), 0015 (compact shell), 0016 (agenda edit/filter review decisions), 0017 (release usage/detail polish), 0018 (ticket context and UI consistency), 0019 (usage contrast and count badge fit).

## Approach

See focused plan. Reuse current auth-scoped DB joins and UI interactions; add a bounded search read API; restructure dashboard/layout and selected page presentation without changing persistence rules. Keep active data visibility defaults and archived detail behavior consistent with existing routes.

## Files to modify

- `PLAN.md` (planning update), this milestone journal, `docs/decisions/0015-compact-navigation-and-mobile-columns.md` and decision index.
- Dashboard/search component and endpoint, board card, list/Today/Settings pages, relevant tests; full paths in focused plan.

## Reuse

- `app/layouts/dashboard.vue` session/sign-out/navigation; `app/pages/tickets/index.vue` locate/highlight/board controls; `app/components/TicketBoardCard.vue` relation events and drag guard; `app/pages/today.vue` local day/progress/add; existing list endpoints and API ownership utilities.

## Decisions and ADR links

- Human in conversation: retain full M7 search/polish; desktop sidebar expanded state persists, default collapsed; mobile full-screen menu; keep compact entity title/breadcrumb on details; desktop top search/mobile menu search.
- Existing ADR 0012: unfiltered tracked time is the progress source. ADRs 0010/0013: keep board drag and edit-based status changes. ADR 0015 records compact navigation/mobile columns. ADR 0016 records the human-approved review deviation from ADR 0014's direct Today Edit button and adds board hierarchy filters. ADR 0017 records release usage, ticket-detail navigation/status action policy, and approved Lucide dependency.

## Implementation checklist

- [x] Human approves focused M7 plan via Plannotator (mobile column revision included).
- [x] Search endpoint and grouped, accessible keyboard/touch search UI with tests.
- [x] Responsive shell and compact Today/list/Settings presentation with tests.
- [x] Project/release navigation and board relation/status presentation with tests.
- [ ] Final state polish, verification evidence, human code review and completion declaration (review pending).

## Journal

### Planning

- Fact: M6 closeout says Complete; current dashboard has horizontal header navigation; no search endpoint exists. Current `PLAN.md` M7 scope was universal search, keyboard/mobile and state polish. Existing board relation link events already support highlight and locate.
- Decision (human): keep all M7 scope; use desktop persistent expanded-state rail and mobile full-screen menu; preserve compact titles/breadcrumbs on detail pages; search top bar on desktop, in mobile menu. Plannotator first review requested that **every touched spaced horizontal row switch to a vertical column on mobile**, not a wrapping row; incorporated into focused plan, roadmap, and verification before resubmission.
- Hypothesis: an owner-scoped bounded search read can use the current domain joins without schema changes; confirm via tests.
- Evidence (planning, before Plannotator submission): `node scripts/check-workflow-docs.mjs` passed (“Workflow documentation structure looks complete.”); `git diff --check` passed. No application code changed.

### Implementation — cards and ticket relations

- Fact: project/release cards use full-surface overlay links with separate higher-layer client/mark-done controls; project detail action bar stacks on mobile. Board status badge removed while lane heading and drag unchanged. Single related ticket retains icon link, multiple now use soft count/popover with icon/title and existing hover/locate events.
- Fact: desktop popover opens on hover; keyboard Enter and mobile click open it. Early hover/focus implementation opened on focus then toggled closed on click at mobile widths, causing moving popup links to detach; restricted hover to desktop hover-capable viewports and let click/Enter open on mobile/keyboard. The first mark-done browser check raced the async PATCH; final test awaits the PATCH response.
- Evidence: `pnpm typecheck` passed; `pnpm exec playwright test tests/e2e/search.test.ts tests/e2e/ticket-navigation.test.ts --workers=1` passed (2); `pnpm exec playwright test tests/e2e/ticket-status-moves.test.ts --workers=1` passed (1) after replacing removed visually-hidden page-heading drag target with visible top search.

### Implementation — compact page layout

- Fact: Today intro/settings shortcut removed; calendar controls, unfiltered progress, add action share a wide-screen spaced row and mobile vertical column. List page introductions removed in favor of screen-reader page headings and stacked mobile action controls. Settings form centered without decorative intro; detail/form identities retained.
- Evidence: `pnpm typecheck` passed; `pnpm exec playwright test tests/e2e/agenda.test.ts tests/e2e/search.test.ts --workers=1` passed (2); focused search browser test later asserted Today and Projects mobile column and Today desktop row (1 passed).

### Implementation — responsive shell and search UI

- Fact: dashboard now has persistent desktop icon rail, bottom account/settings/sign-out, top search, and a full-screen mobile modal with search/navigation/close. GlobalSearch groups debounced server results and supports focus/select/Escape. `/`, Ctrl/⌘K and `g` then t/c/p/b are available outside edit fields. Search result selects date-based Today context.
- Fact: initial account popover trigger was unreliable in browser verification (sign-out absent after click); replaced it with a directly available, labeled sign-out control beside the user identity at the bottom of the sidebar. No auth logic changed.
- Evidence: `pnpm typecheck` and `pnpm lint` passed (one preexisting test-style warning in new test to address); `pnpm exec playwright test tests/e2e/auth-shell.test.ts tests/e2e/search.test.ts --workers=1` passed (3). Initial auth-shell test timed out on sign-out when using the popover; reran successfully after direct control.

### Implementation — search API and date route

- Fact: added authenticated bounded five-type search using owner and active-ancestor predicates, deterministic result order and escaped wildcard matching; Today now accepts a valid `?date=` deep link for time-entry results. No schema/dependency change.
- Evidence: `pnpm typecheck` passed; `pnpm exec playwright test tests/e2e/search.test.ts --workers=1` passed (1). First run with date assertion failed only due to duplicate responsive timeline text; scoped assertion to Day timeline and reran successfully.

### Third human code review — release usage and compact filter strip

- Plannotator returned annotated feedback. Human approved in chat the three scope additions: release ticket cards should use the same ticket metadata language and show total tracked time/estimate usage, remove ticket-detail next-status button, and add `@iconify-json/lucide` as a dev dependency. Human also requested subtle Nuxt UI-semantic row contrast rather than loud colors, consistent ticket-detail hierarchy navigation, and both filters as a compact single desktop line (mobile columns). Existing item contrast/style and quick button were preexisting, while the board filter strip was new in M7. ADR 0017 captures these decisions and partial supersession of ADR 0007.
- Fact: owner-scoped `/api/tickets` list now sums minutes once for returned ticket IDs; release ticket cards show title/optional description, status, optional estimate, tracked time and percentage using existing `usageColor`. Ticket detail drops `advance()` and quick button, uses muted hover-primary hierarchy links and semantic `bg-elevated/50` rows in time entries/links/relations. Filter cards use Nuxt UI body padding override `p-2`, desktop inline inputs with icon-only Clear and mobile column. `pnpm add -D @iconify-json/lucide` installed version 1.2.137; Nuxt Icon now reports one locally discovered collection and a 43-icon client bundle. Install logged three deprecated transitive subdependency warnings; no other direct package changed.
- Evidence: `pnpm typecheck` and `pnpm lint` passed. Focused `pnpm exec playwright test tests/e2e/time-entries.test.ts tests/e2e/tickets.test.ts tests/e2e/ticket-status-moves.test.ts tests/e2e/agenda.test.ts --workers=1` passed (4). An early attempt to format the compact filter markup failed on missing closing divs; fixed nesting, formatted and typechecked. New browser coverage asserts owner-scoped 90-minute aggregate, release 150% usage and zero-minute card; ticket detail row contrast and no quick action. Revised full checks passed: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (12 files/54), `pnpm exec playwright test --workers=1` (10), `pnpm build`, `pnpm check:workflow`, `git diff --check`. Build emitted a nonfatal Rolldown plugin-timings performance warning; no local-icon availability warning. No separate manual visual session; fresh human review pending.

### Second human code review — compact filters and correction

- Plannotator returned annotated feedback. Human approved the two scope trade-offs in chat: **remove only the per-entry Edit button, keep double-click correction and defer mobile direct same-day correction**; **add board hierarchy filters but no status filter**. Other confirmed feedback: remove Today filter header/match count/instructions, widen workday progress, fix release card click surface, align release-ticket status and estimate, remove release grouped-tickets button, use icon-leading tooltip-labeled filters on Today and Tickets. This is an approved user-visible deviation from ADR 0014, now recorded in ADR 0016 (partial supersession). No auth/schema/dependency changes.
- Implementation: removed only entry Edit button while preserving double-click/modal event; Today filter bars now icon-leading, no redundant prose; board filters cascade locally across client/project/release/ticket and respect relation locate when target is filtered out; release card action row lets clicks through outside the mark-done button; release ticket metadata is flex-aligned and extra button removed.
- Evidence: `pnpm typecheck` and `pnpm lint` passed; `pnpm exec playwright test tests/e2e/agenda.test.ts tests/e2e/agenda-drag.test.ts tests/e2e/ticket-navigation.test.ts tests/e2e/search.test.ts --workers=1` passed (4) after updating old match-count/Edit assertions. Focused board-status test initially failed because an old assertion targeted the removed release ticket `<p>`; updated it to the flex metadata and it passed (1). Final revised checks passed: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (12 files, 54), `pnpm exec playwright test --workers=1` (10), `pnpm build`, `pnpm check:workflow`, `git diff --check`. No separate manual visual session; fresh human code review pending.

### First human code review — shell alignment and avatar

- Plannotator returned annotations rather than approval. Human confirmed in chat to proceed after verdict discussion. Confirmed M7-introduced issues: top search left-aligned, collapsed rail icons left-aligned, sign-out button lacked pointer cursor; static user icon had no interaction or GitHub avatar. `server/db/schema.ts` and Better Auth session support `user.image` already; no auth change required.
- Revision: desktop search/header and collapsed nav/toggle centered; reusable `AccountMenu` renders GitHub session avatar with icon fallback and Settings/Sign out (with icons and pointer cursor) in an accessible popover at the bottom of desktop sidebar and inside mobile full-screen menu. Removing separate Settings and sign-out controls follows the human's review clarification. Initial `AccountMenu` template multiline event expression caused a dev compiler 500; replaced it with a script handler. Browser auth test initially raced hydration after navigation; waits for `networkidle` before opening account menu.
- Evidence: `pnpm typecheck` passed; focused `pnpm exec playwright test tests/e2e/auth-shell.test.ts tests/e2e/search.test.ts --workers=1` passed (3). Browser checks now assert search and collapsed icon centering, GitHub avatar URL, desktop account menu settings/sign-out, mobile menu account Settings navigation. Full post-review checks passed: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (12 files, 54), `pnpm exec playwright test --workers=1` (10), `pnpm build`, `pnpm check:workflow`, `git diff --check`. During the full E2E run Vite dev server logged repeated `ResizeObserver loop completed with undelivered notifications` warnings from `@vite/client` while agenda-drag ran; all browser tests and build passed, but this nonfatal dev warning remains to monitor. No separate visual review. Fresh human code review pending.

### Fourth human code review — unified popovers, app-wide icons/tooltips/contrast

- Human direction in chat (approved scope): external links should appear in Today ticket entries as well as release/board ticket cards; both external links and related tickets always use icon-triggered popovers even for one item; external destinations remain native anchors for context-menu/open-new-tab behavior. A count badge overlays the icon only when item count >1. Audit all app icon-only button native `title` tooltips and replace with Nuxt UI tooltips; do an app-wide button+icon pass; do a full app-wide semantic contrast pass with Nuxt UI `bg-muted`/`bg-elevated` surfaces. Keep earlier responsive/sidebar/search and filter rules.
- Audit fact: app-wide Vue button actions now have a matching icon or meaningful symbol (color swatches/account avatar); icon-only controls use `UTooltip` (Archive, sidebar/nav, account, Today day navigation, mark-done, ticket-context and ticket-detail remove/unlink). No icon-button native `title` remains. Native `title` remains only for truncated ticket title/description and Today-entry descriptions. Visible list/card surfaces use Nuxt UI semantic surfaces/borders; no raw palette utility backgrounds/text/borders were found in app Vue files. Ticket-create link/relation rows use `bg-elevated/50`.
- Decision: share popover/count behavior in `TicketContextPopovers.vue` across `TicketBoardCard.vue`, release detail ticket cards, and `TodayAgendaEntry.vue`; keep parent entity detail screens as-is. ADR 0018 records the approved usage bands and UI consistency rules.
- Implementation fact: `/api/tickets` now returns sorted related-ticket and external-link metadata for owner-visible cards; `/api/agenda` returns owner-checked related-ticket metadata (including archive state) and external links for the day's entries. No schema or auth policy changed. Nuxt UI `UChip` overlays counts at top-right only for counts greater than one; internal links use `NuxtLink`; external items are native `<a target="_blank" rel="noopener noreferrer">` anchors. Hover has a close delay so the pointer can move into interactive content; keyboard focus/Enter/Escape and touch behavior are tested.
- Implementation fact: release ticket cards combine tracked/estimated time and percentage with blue `<80%`, green `80–<100%`, orange `100–120%`, and red `>120%` bands. Client/project/release breadcrumbs are inline before h1. Create/edit and modal action rows stack into mobile columns.

### Pre-review verification and polish

- Fact: search now uses distinct accessible result IDs/active descendants for concurrent desktop/mobile instances. Browser fixture covers all five types, foreign-owner isolation, archived descendants, 8-result limit, invalid/wildcard queries, date deep link, desktop/mobile searches, collapsed-state persistence, keyboard shortcuts, menu focus return, zero matches, Today/list mobile columns and nested card actions. Existing agenda/board tests cover gestures and status regressions. ADR 0015 records general mobile-column/navigation policy.
- Evidence: initial `pnpm format:check` failed on a newly edited test; formatted and reran. One `pnpm lint` warning about a nested helper was resolved by hoisting it. The first full E2E run had 9/10 pass; search card mark-done click raced client hydration after page.goto and awaited no PATCH. Waiting for `networkidle` before click and awaiting PATCH made focused search test pass twice. The then-current full verification passed with 10 Playwright tests; see the final verification entry below for the updated 11-test run. Human review pending.

### Fifth human code review — usage contrast and count badge fit

- Plannotator returned annotated feedback that the context count badge was clipped, tracked and estimated durations were not visually distinct, the ticket board lacked the tracked/estimate pair, and Today’s workday summary did not distinguish worked time from target. Code inspection confirmed all findings: chip positioning extended the badge beyond its icon in overflow-constrained board/agenda contexts; `TicketTrackedUsage.vue` applied `text-muted` to both durations; board cards rendered only the estimate despite `/api/tickets` already returning `trackedMinutes`; Today rendered both values in muted text.
- Human confirmed in chat to fix these findings and explicitly approved adding tracked/estimate usage to ticket board cards (an expansion from the original release-card-only M7 scope). ADR 0019 records the added display rules; PLAN.md and the focused plan now include them.
- Implementation: keep count badges overlaid but within the trigger bounds; show tracked durations in `text-primary` and estimates/Today target in `text-muted`; use `TicketTrackedUsage` on board cards with the existing owner-scoped aggregate. No API, schema, authentication, or dependency change.
- Focused evidence: `pnpm exec playwright test tests/e2e/time-entries.test.ts tests/e2e/ticket-context-popovers.test.ts tests/e2e/search.test.ts --workers=1` passed (3); tests assert board/release color separation, Today workday summary color separation, and count badge geometry. Full post-fix verification follows below.

### Final verification and touched-page review

- Fact: the auth-shell tooltip assertions initially targeted `role=tooltip`, which Nuxt UI uses for visually hidden accessible description text; the visible tooltip surface is `[data-slot="content"]`. The test now checks that visible surface and waits for `networkidle` before hover so the client interaction is hydrated. The client breadcrumb assertion now scopes to `<main>` because the collapsed sidebar contains another Clients link. These were test-only corrections; no application behavior changed.
- Evidence: after the tooltip/breadcrumb test corrections and the confirmed usage/badge changes, the focused `pnpm exec playwright test tests/e2e/time-entries.test.ts tests/e2e/ticket-context-popovers.test.ts tests/e2e/search.test.ts --workers=1` passed (3); final `pnpm exec playwright test --workers=1` passed all 11 tests, including agenda drag, search, popovers, navigation, status moves and time-entry regressions. `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (12 files/54 tests), `pnpm check:workflow`, and `git diff --check` passed. `pnpm build` passed; the final build emitted no plugin-timings or icon availability warnings (an earlier build emitted only a nonfatal plugin-timings notice).
- Manual visual spot-check: inspected temporary Playwright screenshots at 1440×900 and 390×844 for Today, the mobile full-screen menu, and the empty Tickets board; after the review fixes also inspected release usage, ticket-board usage and the mobile workday summary. The tracked values are visually emphasized, estimates/target stay muted, and board usage fits on its own row instead of being truncated by the card’s horizontal scroller. Count badge bounds and usage classes are asserted in E2E. Temporary screenshot/debug test files and the debug page were removed. Keyboard shortcuts, focus, menu dismissal/return, popover focus/click, and touch entry points are covered by the passing E2E suite; loading/error states were code-reviewed, not separately simulated.
- Status: verification evidence is complete and the final code review was accepted with no requested changes.

### Final human code review

- Plannotator review approved the revised current diff with no changes requested.

### Human completion declaration

- On 2026-09-26, the human declared in chat: “i hereby declare this milestone complete.” M7 is complete.

## Verification

- [x] Search API ownership/archival/limits/empty query and time-entry routing tests.
- [x] E2E desktop/mobile shell, nested card controls, relation popover/highlight, Today progress and actions, touched spaced rows stacking on mobile, keyboard focus/results, board hierarchy filter selections and empty states; loading/error UIs reviewed in code, not separately simulated in browser.
- [x] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (12 files/54 tests), `pnpm exec playwright test --workers=1` (11 tests), `pnpm build`, `pnpm check:workflow`, `git diff --check` passed; manual visual spot-check completed at desktop/mobile sizes.

## Review status

- Plan review: Accepted (approved via Plannotator before implementation)
- Code review: Accepted via final Plannotator review (no changes requested)
- Milestone completion declaration: Declared complete by the human in chat on 2026-09-26

## Follow-ups

- Search relevance and additional shortcuts may be iterated after real-world use; no new schema/index changes without separate approval.
- Design a discoverable mobile/keyboard same-day agenda correction action after removing the per-entry Edit button (human-approved deferral, ADR 0016); current ticket-detail editor and desktop double-click remain.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in the journal and review status.
