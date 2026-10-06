# M28 — Desktop-only UI cleanup

> **Status: Complete (2026-10-06).** The approved desktop-only cleanup and compact-spacing amendment are implemented; final local checks passed, including all 37 E2E tests. The final Plannotator live-app review returned no feedback, and the human declared M28 complete. ADRs 0042 and 0043 are accepted. M27 remains open and separate; no remote CI run was authorized.

## Context

The app still contains broad mobile/narrow-screen presentation paths despite the user now using it only on desktop. This cleanup proposes one desktop-first UI rather than maintaining separate desktop, narrow-screen, and touch-oriented layouts. Preserve the app's domain behavior and its desktop workflows while deleting mobile-specific markup, styling, device detection, and tests.

### Observed facts

- A repository search counted 135 Tailwind breakpoint utility occurrences across 22 Vue files.
- Runtime viewport/touch branching exists in `TodayAgenda.vue`, `WeeklyAgenda.vue`, `pages/tickets/index.vue`, `useSelectSearchInput.ts`, and `useHierarchyFilters.ts`. Mobile-specific markup also includes the stacked Week agenda, chronological Day agenda, collapsible Ticket Board, `showEdit` agenda buttons, and touch-enabled context popovers.
- Sixteen E2E files contain mobile/narrow viewport, touch, or mobile-overflow references. Some use a narrow browser context only incidentally (for example, API-ordering coverage), so retain those behavior tests and move them to the desktop test context rather than deleting them solely by filename or variable name.
- The working tree is clean on `main` at `bda8039` (`fix(e2e): wait for client mount before checking mobile agenda entries`).
- M27 remains open in `docs/milestones/m27-ci-browser-test-reliability.md`. GitHub Actions run [37372565389](https://github.com/meeehdi-dev/nxmr/actions/runs/37372565389), for that commit, was cancelled before a runner was assigned: the job reports `runner_id: 0`, no steps or logs, and no artifacts. The cause is unknown; this run provides no test result. A preceding run, [37365101184](https://github.com/meeehdi-dev/nxmr/actions/runs/37365101184), ran 40 browser tests and failed only the mobile agenda client-mount assertion; the latest commit adds a test-readiness wait and passes locally per the M27 log.

**CI hypothesis, not a conclusion:** Retiring mobile-only browser scenarios may reduce E2E work, but it cannot be assumed to fix runner assignment or other CI failures. This milestone is a product/UI cleanup, not an M27 runner or workflow remediation.

## Approved scope

**Approved by the human through Plannotator on 2026-10-06.**

- Establish one desktop layout across the authenticated shell, Today/Week, Ticket Board, hierarchy lists/details, ticket forms/details, and shared components. Target 1280 CSS px and wider; below that, mobile/narrow layouts are unsupported and may overflow. Remove breakpoint-specific mobile/narrow presentation variants throughout `app/`; choose the desktop treatment as the sole treatment rather than mechanically deleting one side of every class pair.
- Overhaul and harmonize app-authored padding, margin, gap, and stack spacing across all Vue UI and the Nuxt UI app theme, not only files that contain breakpoints. Use the approved compact 2px-based scale and role-based values; preserve time-grid geometry and document any necessary exception. The amendment specifically sets the agenda filter wrapper inset to 2px, reduces app page/section spacing, and preserves standard Nuxt UI select-trigger sizing.
- Keep a single-row three-block header with full navigation/account labels, desktop list/action rows, desktop card grids, the seven-lane Ticket Board, the time-scaled Day agenda, and the seven-column Week agenda. Remove the stacked header, stacked Week days, chronological narrow Day cards, and collapsible mobile Ticket Board.
- Remove viewport/touch detection and mobile-only rendering branches when no longer needed. Retire touch-specific E2E coverage and rewrite mixed tests around the supported desktop interactions; keep coverage for the underlying behavior and all supported desktop paths.
- Keep desktop pointer workflows (agenda create/move/resize and Ticket Board status drag/drop), ordinary click/popover interactions, keyboard navigation and semantic accessibility. Keep Day/Week selection, per-day Add actions, correction forms, filters, progress, hierarchy navigation, archived-history behavior, and all existing API/domain rules. Remove only a mobile-only presentation of an action, not the underlying product operation when it is used in the desktop workflow.
- Keep useful desktop-local overflow handling, including horizontal scrolling of the seven-lane Ticket Board. “Desktop-only” does not mean replacing content with a mobile layout or removing the board's established desktop scroll behavior.
- Update the roadmap and durable decision records to make desktop-only presentation the current product direction. Preserve completed milestone logs as historical records; do not rewrite their original approved scopes.
- Make no schema, API, auth, deployment, dependency, CI-workflow, Playwright timeout, worker-count, or retry-policy changes. Do not trigger or rerun GitHub Actions in this milestone without separate explicit authorization.

### Desktop viewport and spacing direction

- **Human's Plannotator answer (2026-10-06):** target 1280 CSS px and wider. Narrower viewports are unsupported and may overflow.
- **Spacing research:** Tailwind CSS v4 documents its default `--spacing` unit as `0.25rem` (4px at the browser default) and builds numbered spacing utilities as multiples of that unit ([Tailwind theme variables](https://tailwindcss.com/docs/theme)). Carbon's design-system guidance similarly uses a spacing scale with 2/4/8px increments and reserves spacing exceptions for justified cases ([Carbon spacing](https://www.carbondesignsystem.com/building-blocks/foundations/spacing/overview)); its larger-scale grid uses an 8px mini-unit ([Carbon 2x Grid](https://www.carbondesignsystem.com/building-blocks/foundations/2x-grid/overview)).
- **Original M28 spacing rule (superseded by the approved 2026-10-06 amendment):** Tailwind 4px base; avoid incidental 2px/6px values; page gutters/major gaps 24px and standard card/form padding 16px.
- **Approved compact amendment (Plannotator, 2026-10-06):** use a role-based 2px spacing scale (2, 4, 6, 8, 12, and 16px); avoid app-authored 24px layout spacing unless specifically justified and recorded. Target 16px page inset/largest section gaps, 8px standard card/form padding, 4px compact-card padding/related-control gaps, and 2px border-only filter/tool surfaces. Explicitly override Nuxt UI responsive `sm:p-6` card-body defaults where needed; preserve standard select-trigger sizing and pointer/keyboard hit targets. Keep the 1px time-grid exception and fixed agenda geometry unchanged.
- **Human-directed live-app follow-up (Plannotator, 2026-10-06):** make Today page-stack gaps consistent at 8px, reduce the Ticket Board filter-to-board gap to 8px, align the Agenda view control group to the other 32px toolbar controls, keep end-of-visible-hours labels fully inside their card without changing grid geometry, and vertically center the Settings panel. Remove the project-card release-completion shortcut so a release is marked done only on Release detail; preserve the Release detail confirmation/archive flow. Accepted ADR 0043 records that action-location decision.

## Out of scope

- Any server, API, database/schema, migration, auth/security, deployment, package/dependency, or data-model change.
- Changes to Day/Week data semantics, visible-hour settings, week-start preference, ticket status rules, hierarchy/archive behavior, overlap rules, estimate/time calculations, or persisted data.
- Replacing desktop interactions, adding new desktop product features, or changing keyboard bindings and destinations.
- Altering `.github/workflows/check.yml`, `playwright.config.ts`, M27's trace/artifact/no-retry policy, test timeouts, or worker counts. No claim that the cleanup fixes CI.
- Reworking historical completed milestone entries or removing user data/localStorage keys solely because a former mobile layout used them.
- Maintaining or testing mobile/tablet/touch-specific layouts after this milestone; those viewports are outside the approved support target.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- `docs/milestones/m5-today-agenda.md`, `m6-agenda-drag-blocks.md`, `m7-search-and-ui-polish.md`, `m16-weekly-agenda.md`, `m17-agenda-ui-refinements.md`, `m18-agenda-layout-and-weekly-add.md`, `m23-three-block-header-navigation.md`, `m25-ticket-detail-overhaul.md`, `m26-today-current-day-and-time-indicators.md`, `m27-ci-browser-test-reliability.md`
- `docs/decisions/0008-ticket-estimates-and-board-layout.md` — current desktop board and historical mobile layout decision
- `docs/decisions/0043-release-completion-action-location.md` — proposed Release detail-only completion action policy from live-app review
- `docs/decisions/0014-agenda-drag-interactions.md`, `0015-compact-navigation-and-mobile-columns.md`, `0029-weekly-agenda-and-conflict-previews.md`, `0031-hierarchy-badge-wrapping.md`, `0035-three-block-header-navigation.md`, `0041-ci-e2e-failure-diagnostics.md`
- `app/layouts/dashboard.vue`, `app/components/AccountControls.vue`, `GlobalSearch.vue`, `TodayAgenda.vue`, `WeeklyAgenda.vue`, `TodayAgendaEntry.vue`, `TicketContextPopovers.vue`, `app/composables/useSelectSearchInput.ts`, `useHierarchyFilters.ts`
- `app/pages/today.vue`, `app/pages/tickets/index.vue`, hierarchy collection/detail/edit/create pages, ticket detail/create pages
- Responsive spacing/layout implementations in all `app/**/*.vue` files; current inventory includes `app/pages/login.vue` and `app/pages/settings.vue` as well as the responsive files listed above
- Mobile/narrow E2E coverage in `tests/e2e/agenda-drag.test.ts`, `agenda-week.test.ts`, `agenda.test.ts`, `api-item-ordering.test.ts`, `auth-shell.test.ts`, `filter-search.test.ts`, `hierarchy-breadcrumbs.test.ts`, `hierarchy-card-metrics.test.ts`, `release-ticket-status.test.ts`, `ticket-board-hierarchy-actions.test.ts`, `ticket-context-popovers.test.ts`, `ticket-detail-overhaul.test.ts`, `ticket-navigation.test.ts`, `ticket-status-moves.test.ts`, `tickets.test.ts`, and `time-entries.test.ts`
- Official spacing references: [Tailwind CSS v4 theme variables](https://tailwindcss.com/docs/theme), [Carbon spacing scale](https://www.carbondesignsystem.com/building-blocks/foundations/spacing/overview), [Carbon 2x Grid](https://www.carbondesignsystem.com/building-blocks/foundations/2x-grid/overview)

## Approach

1. Use the answered target of 1280 CSS px and wider. Audit all breakpoints and device branches, distinguishing mobile-only variants from ordinary desktop fluid sizing and desktop-local overflow. Do not make broad textual replacements without reviewing the resulting desktop composition.
2. Convert the app shell and shared components to one desktop presentation. Keep the three-block header on one row and show account action labels. Remove mobile-only shortcut hints or touch behavior only when ordinary pointer and keyboard activation remain intact.
3. Simplify agenda components to their desktop time-scaled layouts. Keep Day and Week, seven-day headers/per-day Add, time-grid geometry, drag previews/persistence, out-of-window history and correction modal behavior. Remove only the narrow chronological/stacked renderings and their mobile-only action props. Verify any correction behavior formerly reached from a narrow-only button still has an equivalent desktop-accessible path.
4. Simplify the Ticket Board to its desktop seven-lane, horizontally scrollable board. Remove the narrow collapsible-status rendering and its viewport-driven status expansion/animation logic. Preserve drag gating for archived/busy tickets, drag/drop persistence, related-ticket locate/highlight, and keyboard-operable ticket detail status editing.
5. Replace breakpoint utility variants in all application Vue files with reviewed desktop-only classes/layouts. Simplify form/action rows and entity-card grids to the chosen desktop treatment; retain content sizing and desktop internal scrolling where necessary.
6. Re-audit every app-authored spacing declaration across `app/**/*.vue`, `app/app.config.ts`, and application CSS: padding, margin, `gap`, `space-*`, and explicit Nuxt UI surface-padding overrides. Apply the approved compact 2px-based scale by role; audit generated Nuxt UI responsive surface defaults (including `sm:p-6`) rather than relying only on source overrides. Reduce page gutters, section stacks, cards/forms, filter wrappers, and compact controls without mechanical replacement. Preserve select-trigger sizing, hit targets, timeline positioning/geometry, alignment (`auto`), and other non-spacing geometry. Review dense agenda cards carefully.
7. Update E2E tests: delete assertions whose only purpose is mobile layout/touch/no-overflow, remove mobile browser contexts and touch-only steps, and preserve their non-responsive domain assertions through desktop clicks, keyboard actions, or existing desktop drag flows. Do not remove a behavior test just because its local variable is named `mobile`. In particular, retire the M27 mobile correction readiness scenario and ensure date/time correction and deletion remain covered by desktop-accessible TicketTimeEntries actions and applicable Today pointer flows; do not weaken unrelated M27 gesture/persistence assertions. Keep the unit/API suites and all non-mobile browser assertions.
8. Add ADR 0042 for desktop-only UI support and the spacing rule, then accept it after human review; narrowly supersede only responsive/mobile commitments in ADRs 0008, 0029 and 0035. Update the ADR index and `PLAN.md`; keep historical milestone scopes intact. Do not modify M27's CI policy or declare M27 complete here.
9. Run local project gates and the E2E suite at the selected desktop viewport; manually inspect the shell, Day/Week agenda, board, forms, hierarchy pages, and spacing consistency across application routes. Record exact results, runner-related uncertainty, and any deferred responsive references in this log. Seek separate human code review before closeout.

## Files to modify

- **Application UI/spacing audit:** all Vue files under `app/` containing app-owned padding, margin, gap, stack-spacing, breakpoint, or touch-specific styles/branches, plus the Nuxt UI app theme config for generated card padding. This includes `app/layouts/`, `app/components/`, `app/composables/`, and every page; the inventory must be refreshed before implementation.
- **Structural hotspots:** `app/layouts/dashboard.vue`; `app/components/AccountControls.vue`, `GlobalSearch.vue`, `HierarchyBreadcrumbs.vue`, `TicketTimeEntries.vue`, `TodayAgenda.vue`, `TodayAgendaEntry.vue`, `WeeklyAgenda.vue`, `TicketContextPopovers.vue`; `app/composables/useHierarchyFilters.ts`, `useSelectSearchInput.ts`; Today, Ticket Board, and client/project/release/ticket pages.
- `app/assets/css/main.css` — inspect for application-owned spacing or media-query rules; current contents have no responsive rules, so no change is expected.
- **Pages:** `app/pages/today.vue`; `app/pages/tickets/index.vue`, `tickets/new.vue`, `tickets/[id]/index.vue`; `app/pages/clients/index.vue`, `clients/new.vue`, `clients/[id]/index.vue`, `clients/[id]/edit.vue`; `app/pages/projects/new.vue`, `projects/[id]/index.vue`, `projects/[id]/edit.vue`; `app/pages/releases/new.vue`, `releases/[id]/index.vue`, `releases/[id]/edit.vue`.
- **Tests:** the mobile/narrow E2E cases listed under Source references. Keep unrelated API, server, and unit tests unchanged unless implementation proves a direct dependency on deleted responsive UI.
- **Durable records:** `PLAN.md`; new `docs/decisions/0042-desktop-only-ui-and-spacing.md`; `docs/decisions/README.md`; and limited supersession-status/link updates in the affected ADRs after human approval. This file records implementation evidence and review/closeout.

No server, database, API, deployment, dependency, or CI workflow files are expected to change.

## Reuse

- Keep `dashboard.vue`'s existing single search instance, keyboard shortcuts, auth/session behavior, navigation destinations and POST logout.
- Keep `TodayAgenda.vue` / `WeeklyAgenda.vue` desktop pointer-capture interactions and `app/utils/agenda-drag.ts` geometry. Retain the `today.vue` page-level Add/correction forms and existing owner-scoped endpoints. Ticket-history `TicketTimeEntries.vue` already exposes keyboard-operable edit/delete buttons; retain those as the non-drag correction path.
- Keep `pages/tickets/index.vue`'s desktop `TicketBoardCard` drag/drop and existing move/error/refresh logic; remove only collapsible narrow-layout helpers.
- Keep shared `TicketContextPopovers`, `TicketHierarchyBadges`, entity cards, hierarchy filters, select-search behavior, and accessible click/keyboard activation; simplify their responsive/device-specific inputs rather than introducing replacements.
- Keep the current Playwright fixtures, semantic readiness helper, unit/API assertions, and ADR 0041's artifact/no-automatic-retry policy.
- Use Tailwind's fractional spacing utilities for the approved compact 2px-based scale; do not introduce a custom design-system dependency. Preserve Nuxt UI select-trigger sizing while explicitly overriding card surface padding where needed.

## Decisions and ADR links

- **Approved decision:** support one desktop presentation at the human-selected minimum viewport of 1280 CSS px; remove mobile/narrow layout branches and touch-specific UI paths. Keyboard accessibility and desktop data/product workflows remain in scope.
- **Original spacing decision, superseded only for spacing by the 2026-10-06 amendment:** harmonize app-authored layout spacing on a 4px base.
- **Approved amended decision:** use a compact role-based 2px spacing scale across app-authored padding, margins, gaps, and stacks; set border-only filter wrappers to 2px, use 16px page insets/large section gaps and 8px standard card/form padding, and preserve standard select-trigger sizing/hit targets.
- **Approved durable-record scope:** ADR 0042 will supersede only mobile/responsive presentation commitments in ADR 0008 (board layout), ADR 0029 (narrow Week presentation/alternatives), and ADR 0035 (responsive shell). Other decisions in those ADRs remain authoritative unless explicitly called out in ADR 0042. ADR 0031's desktop hierarchy fit/overflow rules remain applicable.
- ADR 0041 remains authoritative: no automatic Playwright retry, retain diagnostics on failure, and do not mask failing checks. M28 makes no CI policy or runner change.
- The original M28 plan and compact-spacing amendment were approved through Plannotator on 2026-10-06. The human's subsequent live-app annotations directly authorize the listed layout and release-action-location refinements; ADR 0043 records the latter.

## Implementation checklist

- [x] Human selected 1280 CSS px and wider and approved the revised plan through Plannotator on 2026-10-06 before implementation.
- [x] Remove mobile/narrow breakpoint presentation across the app and simplify the shell, agenda, board, forms, and entity layouts to the approved desktop target.
- [x] Remove viewport/touch detection and mobile-only branches that are no longer needed; preserve desktop mouse/click and keyboard/accessibility behavior.
- [x] Retire or rewrite mobile-only E2E scenarios; retain equivalent desktop coverage for all still-supported behaviors, including agenda gestures and keyboard-operable ticket-history correction/deletion. Move incidental narrow-context tests to desktop without dropping their assertions.
- [x] Complete the original 4px spacing audit before the amendment; this spacing rule is superseded by the approved compactness amendment.
- [x] Re-audit and reduce app-authored spacing throughout the UI on the approved compact 2px-based scale, account for Nuxt UI responsive surface defaults, document exceptions, and visually review all major routes.
- [x] Add/index and accept ADR 0042 after human review; supersede only the responsive/mobile decisions it replaces; update `PLAN.md`.
- [x] Run format, lint, both typechecks, unit tests, full E2E, build, workflow-doc checks, and diff checks; visually review the approved desktop viewport.
- [x] Do not trigger GitHub Actions without explicit authorization; no remote run was started, and the earlier cancelled-before-run result remains unrelated to M28.
- [x] Submit the initial full diff for human code review; Plannotator approved it with a non-blocking request for live-app visual review.
- [x] Implement the follow-up spacing, toolbar-height, end-label, release-action-location, and Settings-centering requests; audit similar grouped controls and preserve domain archive behavior/fixed agenda geometry.
- [x] Re-run all local project gates after the toolbar-height correction; full E2E passed all 37 tests.
- [x] Complete the final live-app visual review, accept the human review of follow-up changes, and record the M28 completion declaration.

## Journal

### 2026-10-06 — Planning research

- Fact: source inventory found 135 breakpoint-utility occurrences in 22 Vue files, runtime screen/touch checks in five application files, and touch-popover/edit-only branches in shared components. The desktop Day/Week grids, seven-lane board, and multiple page rows currently have distinct narrow-screen alternatives.
- Fact: mobile/narrow/touch-oriented browser scenarios appear in 16 E2E files. Several files combine desktop interaction tests with mobile-only presentation checks; remove only obsolete responsive coverage and keep desktop behavior assertions.
- Fact: local worktree was clean at `bda8039`. `node scripts/check-workflow-docs.mjs` passed before this plan was created.
- Fact: `gh run view 37372565389 --repo meeehdi-dev/nxmr --json status,conclusion,headSha,jobs,url` reports `conclusion: failure`; the `quality` job is actually `cancelled`, has no steps, and GitHub's job API reports `runner_id: 0`. `gh run view ... --log` returned `log not found`; the run has zero artifacts. Cause is unknown, so this is not evidence of an application/test failure or proof that responsive cleanup helps.
- Hypothesis: deleting redundant mobile-only E2E paths may reduce local/hosted browser test work, but cannot fix a job that is cancelled before runner assignment. Keep this separate from M27's diagnosis and do not alter CI settings.
- Decision proposed for review: one desktop-only presentation; preserve product/data behavior and keyboard access; make the support viewport an explicit Plannotator decision.
- Evidence: `rg` source/test inventories and GitHub CLI reads cited above. No application code, tests, workflow, roadmap, or ADR has been changed during planning.

### 2026-10-06 — Plannotator plan review and approval

- Fact: first `plannotator annotate docs/milestones/m28-desktop-only-ui-cleanup.md --gate --json --require-approval` returned `{"decision":"dismissed"}` with no feedback.
- Fact: after the human requested reopening, Plannotator returned annotations. The human selected 1280 CSS px and requested app-wide padding/margin harmonization using an established design-system spacing rule; both were incorporated.
- Research: Tailwind CSS v4's official theme documentation describes `--spacing` as the basis for numbered utility classes and its default unit is 0.25rem (4px). Carbon Design System documents a spacing scale using multiples of 2, 4, and 8, with exceptions discouraged, and an 8px 2x Grid. Proposed adaptation keeps Tailwind's native 4px base, uses 4px multiples for app-authored layout spacing with an 8px macro rhythm, and avoids strict powers-of-two-only values.
- Decision (human via Plannotator): the revised M28 plan is approved, including the 1280 CSS px target and spacing-system scope. Implementation is authorized within this plan.
- Evidence: Plannotator returned `{"decision":"approved"}` on 2026-10-06; [Tailwind theme variables](https://tailwindcss.com/docs/theme), [Carbon spacing](https://www.carbondesignsystem.com/building-blocks/foundations/spacing/overview), and [Carbon 2x Grid](https://www.carbondesignsystem.com/building-blocks/foundations/2x-grid/overview).

### 2026-10-06 — Implementation and local verification

- Fact: the authenticated shell, Today/Week agendas, Ticket Board, hierarchy pages/forms, shared components, and app-authored spacing now use a single desktop presentation. Runtime viewport/touch branches and app breakpoint utilities have been removed; desktop-local board overflow and the fixed time-grid remain.
- Fact (initial implementation, before the amendment): the 1px `py-px` timeline wrappers were the only documented sub-4px spacing exception; other app-authored layout-spacing utilities followed Tailwind's 4px base.
- Fact: mobile-only E2E scenarios were retired or rewritten at desktop viewports while preserving behavior coverage. Searches for responsive breakpoint utilities, viewport/touch branches, and `mobile|narrow|touch` E2E references returned no matches.
- Evidence: screenshots at 1280 CSS px were visually reviewed for Today Day and Week, the Ticket Board, client/project/release/ticket forms and details, and hierarchy collections. The seven-lane board retains its horizontal scroll; the desktop header, filters, form rows, and detail layouts render as intended. Temporary screenshot tests/files were removed from the repository.
- Evidence: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (13 files, 72 tests), `pnpm build`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and `git diff --check` passed.
- Evidence: `pnpm exec playwright test --workers=2` passed all 37 E2E tests. After correcting obsolete agenda locators, a default six-worker `pnpm test:e2e` run passed 36/37 and failed in auth-shell project creation; the full lower-parallelism run passed. This difference suggests possible load sensitivity but does not establish the cause. No Playwright configuration, timeout, retry, or CI policy was changed. Vite also logged `ResizeObserver loop completed with undelivered notifications` and Vue Router unmatched-route warnings during E2E. These local observations are not a remote CI result or a diagnosis of M27.
- Fact: no GitHub Actions run was triggered. M27 remains open and separate; M28 makes no claim about runner assignment or CI reliability.
- Follow-up at that point: ADR 0042 remained Proposed pending human review; this was closed by the final review and M28 completion declaration recorded below.

### 2026-10-06 — Compact-spacing amendment approved

- Fact: Plannotator live-app annotation on the correct Nxmr app route `http://localhost:3000/today` returned three concrete spacing annotations. At 2492×1282 CSS px, the filter wrapper had generated `sm:p-6 p-2` classes; the responsive Nuxt UI `sm:p-6` made the desktop inset 24px despite the source `p-2`. The Today root used `space-y-6` and the dashboard main used unequal `px-6 py-4`.
- Decision (human via Plannotator): replace only M28's previous 4px spacing rule with the compact 2px-based role scale in `plans/m28-compact-spacing-amendment.md`; apply 2px to the filter wrapper and between-filter spacing, while preserving standard Nuxt UI select-trigger sizing/hit targets.
- Decision: Plannotator approved `plans/m28-compact-spacing-amendment.md` on 2026-10-06. Implementation is authorized. At the moment of approval, no source code had yet been changed for this amendment.
- Evidence: live-app Plannotator returned three annotations; plan gate returned `{"decision":"approved"}`. Planning `oxfmt --check` and `node scripts/check-workflow-docs.mjs` passed.

### 2026-10-06 — Compact-spacing implementation and verification

- Fact: installed Nuxt UI 4.11.1 generates Card header/body/footer padding of `p-4 sm:px-6`, `p-4 sm:p-6`, and `p-4 sm:px-6`. The official [Card theme documentation](https://ui.nuxt.com/docs/components/card) confirms app-level slot customization, and the v4.9 release documents function slot classes as replacing defaults. `app/app.config.ts` uses replacement functions to set shared Card slots to 8px (`p-2`); Today and Ticket Board filter cards locally use `p-0.5` (2px). This removes the generated responsive `sm:p-6` rather than stacking an ineffective base-only override.
- Fact: compact spacing is applied across the shell, all hierarchy and ticket pages/forms, shared cards/popovers/search, and agenda/board. Dashboard page inset is now 16px all around; large section stacks are 16px or less; standard Cards/forms and draggable Ticket Board cards use 8px; compact hierarchy cards use 4px; filter surfaces use 2px. The 1px timeline wrappers and all time-grid dimensions remain unchanged.
- Evidence: temporary Playwright measurements at both 1280×900 and 2492×1282 CSS px, in light and forced `.dark` class modes, reported main padding `16px`, filter-card body padding `2px`, standard Card body padding `8px`, and all five select triggers at 32px. Day, Week, Ticket Board, client form/list/detail, project/release detail, ticket form/detail routes were visually inspected at 1280px; Day/Week/Board were also inspected at the annotated 2492px viewport. After setting compact hierarchy cards to 4px, client-list and project-detail routes were rechecked at 2492×1282; cards remained legible without clipping. Temporary tests and screenshots were removed.
- Limitation: `app/assets/css/main.css` sets `color-scheme: light`; the app has no configured dark-mode switch. Forced `.dark` class captures were used to inspect layout geometry only; this change does not add or claim supported dark-theme styling.
- Fact: durable E2E assertions protect the 2px agenda and Ticket Board filter insets, minimum 32px select-trigger height, 4px compact hierarchy-card padding, and 8px Ticket Board card padding. Compacting entity cards exposed brittle fixed-coordinate E2E gestures; the search test now activates the release link directly, and the drag test begins in the blank bottom-right card padding instead of a coordinate that intersects content.
- Fact: the first post-change full E2E run passed 35/37; the search timeout and drag-image assertion failures were both in tests using the prior fixed coordinates. The updated targeted tests passed, followed by the complete `pnpm exec playwright test --workers=2` run passing all 37 tests. Targeted hierarchy-card and board tests also passed with the explicit 4px/8px padding assertions. No timeout, worker, retry, Playwright, or CI configuration was changed.
- Evidence: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (13 files, 72 tests), `pnpm build`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and `git diff --check` all passed after implementation. No remote CI was run.

## Verification

Planning checks:

- [x] `node scripts/check-workflow-docs.mjs` — passed before and after plan revision.
- [x] `pnpm exec oxfmt --check docs/milestones/m28-desktop-only-ui-cleanup.md` — passed before and after plan revision.
- [x] `git diff --no-index --check /dev/null docs/milestones/m28-desktop-only-ui-cleanup.md` — no whitespace errors (exit 1 is expected while the file is untracked).
- [x] Revised `plannotator annotate docs/milestones/m28-desktop-only-ui-cleanup.md --gate --json --require-approval` returned `{"decision":"approved"}` on 2026-10-06.

Initial M28 implementation verification (before the approved compact-spacing amendment):

- [x] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, `pnpm build`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and `git diff --check` — passed. `pnpm exec playwright test --workers=2` passed all 37 E2E tests; the default six-worker run had concurrency-sensitive failures, documented in the journal.

Compact-spacing amendment verification:

- [x] Re-run applicable project checks after implementation; visually inspect at 1280 CSS px and the annotated 2492×1282 viewport. Light-theme layouts were inspected; forced `.dark` class captures were geometry-only because the app currently sets `color-scheme: light` and has no supported dark-mode switch.
- [x] At the human-approved viewport, verify desktop shell navigation/account labels, search, forms, list/detail layouts, Day and Week agenda, drag/create/correction, Ticket Board drag/status flows, popovers, filters, archive state, and keyboard access. Visual route inspection was performed at 1280 CSS px; E2E behavior coverage passed with two local workers.
- [x] Confirm no app breakpoint classes, viewport/touch media-query branches, mobile-only presentation props, or mobile-only E2E contexts remain in the approved scope; do not use a mobile viewport as an acceptance target.
- [x] Add and pass an E2E assertion that the Day/Week group, date/navigation buttons, and Today button remain at least 32px high with less than 2px of height variance.
- [x] Final post-correction checks: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (72 tests), `pnpm exec playwright test --workers=2` (37 tests), `pnpm build`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and `git diff --check`.
- [x] No remote CI run was authorized; M27 remains open and separate, and this milestone makes no claim about runner assignment.

### 2026-10-06 — Initial code review and live-app follow-up

- Decision: Plannotator approved the initial compact-spacing diff with non-blocking notes and asked to review the running app visually. The review instruction explicitly said not to revise the reviewed diff solely because of those notes unless the human requested changes.
- Fact: the first live-app session reported a local sign-in 403. `.env` had `BETTER_AUTH_URL=http://localhost:3000`; Nxmr was started with `pnpm dev --host localhost --port 3000`, and the Better Auth sign-in endpoint generated callback URI `http://localhost:3000/api/auth/callback/github`. A subsequent Plannotator session loaded authenticated Today, Tickets, Project detail, and Settings routes.
- Human direction (Plannotator live-app review, 2026-10-06): equalize/reduce Today's section gaps; reduce the Ticket Board filter-to-board gap; prevent the `20:00` label from clipping; remove project-card Mark as done and keep release completion on Release detail; vertically center Settings; check for similar spacing inconsistencies elsewhere.
- Fact: the next visual review found the Today spacing still looked uneven and identified the Agenda view group as 38px high. Its `p-1` wrapper and `size="sm"` buttons made it 6px taller than the 32px date/navigation buttons. An audit of semantic `role="group"` wrappers found no other toolbar-style padded border groups. Other `border`/`p-1` surfaces are GlobalSearch's absolutely positioned suggestions panel (out of flow), WeeklyAgenda's compact day-header cards (4px card inset), and positioned time-entry blocks whose `p-1` content remains inside the fixed timeline geometry; none affects the Today toolbar height.
- Human direction (Plannotator live-app review, 2026-10-06): fix the Agenda view group height and inspect similar components so they do not disrupt page spacing.
- Decision: use 32px buttons and a non-layout-affecting inset ring for the Agenda view group, keep the 8px Today/Ticket Board stack gaps, and apply the other direct requests within M28. Preserve select-trigger sizing, all time-grid dimensions/pointer geometry, and Release detail confirmation/archive/API/ownership behavior. Accepted ADR 0043 records the release-action-location policy.
- Evidence: affected-flow E2E runs passed (10 tests after the first fixes; 5 focused agenda/filter tests after the toolbar-height correction). The first full-suite attempt received Nuxt 404 HTML responses for API/page requests at `127.0.0.1:3000`; the transient cause was not established. Starting Nxmr explicitly and confirming `/api/health` before rerunning produced 37/37 passing tests. This is a local runner/setup observation, not a product failure or CI result. Final local gates pass.
- Fact: restarted Nxmr at the allowed `http://localhost:3000` origin; `/api/health` responded successfully and unauthenticated `/today` redirected to login. The final Plannotator live-app review completed with the output “User reviewed the document and has no feedback.”

### 2026-10-06 — Human review and M28 completion declaration

- Human declaration: “review done, i declare this milestone complete.”
- Decision: record M28 as Complete and accept ADRs 0042 and 0043. The human's final review/declaration accepts the live-app follow-up work; the initial code diff also received Plannotator code-review approval with non-blocking notes.
- Evidence: final local verification passed (format, lint, both typechecks, 72 unit tests, all 37 E2E tests, production build, workflow checks, and diff checks). No remote CI run was made; M27 remains open and separate.

## Review status

- Plan review: Original plan and compact-spacing amendment approved via Plannotator on 2026-10-06.
- Human review: Initial diff received Plannotator code-review approval with non-blocking notes. The final live-app review at `http://localhost:3000/today` returned no feedback; the human confirmed review was done and declared M28 complete on 2026-10-06. This is the human acceptance of the final follow-up work.
- Milestone completion declaration: Complete (2026-10-06).

## Follow-ups

- M27 remains open; M28 does not complete it or authorize a remote CI run. Record its next authorized review/verification step separately.
- Any later request to restore tablet/mobile/touch support requires a separately reviewed plan and a new decision record.

## Closeout checklist

- [x] Approved scope complete or explicitly deferred.
- [x] Verification evidence recorded for the amended spacing scope.
- [x] Human code review accepted; final human review acceptance recorded above.
- [x] Human completion declaration recorded in the journal and review status.
