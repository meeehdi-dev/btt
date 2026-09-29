# M20 — Login and ticket board toolbar polish

> **Status:** Complete — implementation, verification, human code review, and completion declaration recorded.

## Context

M19 is complete. This bounded UI-polish milestone covers two issues reported by the user: the sign-in card appears left of center, and the ticket-board filters occupy a separate row from the Archived and New ticket controls.

Observed facts:

- `app/layouts/default.vue` vertically centers its page content and constrains it to `max-w-3xl`, but its flex container does not horizontally center its child. `app/pages/login.vue` renders a `w-full max-w-md` card, so the card starts at the left of that constrained content area.
- `app/pages/tickets/index.vue` renders the archive/New ticket action row separately from the filter `UCard`. The filter card contains the existing client, project, release, and ticket selectors plus Clear filters.
- `useHierarchyFilters` owns the existing cascading filter behavior, and `ArchiveFilterButton` owns the archive toggle.
- ADR 0015 calls for touched spaced control rows to become ordered columns on mobile. ADR 0016 records the board's existing hierarchy filter choices and compact presentation.
- The user requests only these two layout refinements; no authentication or ticket behavior change is requested.

## Approved scope

**Approved via Plannotator on 2026-09-29.**

- Horizontally center the login card in the available viewport while preserving its current vertical centering, width constraints, session handling, redirect behavior, and login content.
- At desktop widths where the controls fit, place the four existing ticket-board filters and Clear filters on the same top toolbar line as Show/Hide archived and New ticket. The approved arrangement is filters and Clear filters in the flexible space on the left; archive and New ticket in a compact action group on the right.
- At narrower widths, arrange the same toolbar controls into a clear responsive stack/column without page-level horizontal overflow, following ADR 0015. The one-line arrangement is for desktop, not a requirement to compress mobile controls.
- Preserve filter search, cascade/reset semantics, archive behavior, clear behavior, New ticket destination (including its release query), accessible names, and all board content/interactions.
- Record M20's goal and acceptance criteria in `PLAN.md`; keep this milestone file as the execution journal.
- Add focused browser assertions for login alignment and responsive board-toolbar layout/behavior.

## Out of scope

- Changes to authentication, session handling, authorization, redirects, ticket data, board lanes/status behavior, filter options/logic, APIs, or persistence.
- Changes to Today filters or other pages' control rows.
- New dependencies or a broader shell, login, or ticket-board redesign.
- Forcing the full desktop toolbar into one row at widths where it would clip or become unusable.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- `docs/milestones/m19-client-led-project-navigation.md` — immediately prior completed milestone
- `docs/decisions/0015-compact-navigation-and-mobile-columns.md` — responsive control-row convention
- `docs/decisions/0016-agenda-correction-control-and-board-filters.md` — board filters and compact filter behavior
- `app/layouts/default.vue`, `app/pages/login.vue`
- `app/pages/tickets/index.vue`, `app/components/ArchiveFilterButton.vue`, `app/composables/useHierarchyFilters.ts`
- `tests/e2e/auth-shell.test.ts`, `tests/e2e/filter-search.test.ts`

## Approach

1. **Login alignment:** horizontally center the existing slot content in `app/layouts/default.vue` (for example, by centering the flex child). Leave its max-width, vertical alignment, page padding, and login card sizing unchanged.
2. **Board toolbar:** consolidate the action row and filter card in `app/pages/tickets/index.vue` into one responsive toolbar. On desktop, let the filters occupy available width and keep the archive/New ticket actions together; on narrow screens, stack the controls in a predictable order. Reuse all current controls and state handlers.
3. **Regression coverage:** extend the authenticated browser coverage to compare the login-card center with the viewport center at desktop and mobile sizes. Extend focused ticket-filter browser coverage to assert that the selectors, Clear filters, archive toggle, and New ticket control share a toolbar row at a desktop width; at mobile width assert a usable stacked layout, no horizontal page overflow, and unchanged control behavior.
4. **Documentation and verification:** after approval, add the M20 goal/acceptance to `PLAN.md`, record execution evidence here, run focused and project quality checks, and submit the completed diff for human code review. No ADR is proposed because this is a local layout adjustment within existing responsive and filter decisions.

## Files to modify

- `app/layouts/default.vue` — horizontally center content in the unauthenticated/default layout.
- `app/pages/tickets/index.vue` — combine the existing action and filter areas into a responsive top toolbar.
- `tests/e2e/auth-shell.test.ts` — assert horizontal login-card centering at desktop/mobile viewport sizes.
- `tests/e2e/filter-search.test.ts` — assert desktop toolbar alignment, mobile stacking/no overflow, and preservation of existing filter/action behavior.
- `PLAN.md` — add M20 scope and acceptance criteria.
- `docs/milestones/m20-login-and-ticket-board-toolbar-polish.md` — maintain the approved scope, journal, verification, and review/closeout status.

No ADR or application API, server, schema, migration, dependency, or auth changes are planned.

## Reuse

- `app/layouts/default.vue` already owns default-layout vertical centering and width constraints; retain these rather than adding login-specific positioning.
- `ArchiveFilterButton.vue` owns the archived toggle; do not duplicate it.
- `useHierarchyFilters` and the current `USelectMenu` controls own filter values, search, cascade, and reset behavior; preserve their current bindings.
- `auth-shell.test.ts` already covers unauthenticated login and authenticated shell flows. `filter-search.test.ts` already creates authenticated hierarchy fixtures and exercises filter selection, reset, and mobile behavior.
- ADR 0015's mobile-column convention and ADR 0016's board-filter policy remain authoritative.

## Decisions and ADR links

- **Approved layout:** one desktop toolbar line when there is adequate width, with filters on the left and archive/New ticket actions on the right; stack controls at narrow widths (approved via Plannotator on 2026-09-29).
- Keep the login card vertically centered and center it horizontally within the viewport; retain current auth/session behavior.
- No durable decision change is identified, so no ADR is planned.

## Implementation checklist

- [x] Human approves this plan through Plannotator before implementation.
- [x] Center the login card horizontally at desktop and mobile widths without changing authentication behavior.
- [x] Put the board filters and actions on a shared desktop toolbar line, with a usable narrow-screen stack.
- [x] Preserve current filter search/cascade/clear behavior, archive toggle, and New ticket navigation.
- [x] Add/update focused browser coverage for layout, responsiveness, and control behavior.
- [x] Update `PLAN.md`; record actual checks, outcomes, manual checks, deviations, and follow-ups here.
- [x] Submit the implementation for human code review and address the annotated finding.
- [x] Wait for and record the human completion declaration before closing M20.

## Journal

### 2026-09-29 — Planning research

- Fact: the default layout's main flex container uses `items-center` but not horizontal justification; the login card has `w-full max-w-md`. The page is therefore left-aligned inside a centered, max-width main area.
- Fact: the ticket page renders its archive/New ticket actions in a separate flex row immediately before a filter `UCard`; the existing filter card has four hierarchy selectors and a Clear filters action.
- Decision proposed: combine the existing controls into one desktop toolbar while retaining a stacked narrow-screen layout and all current handlers.
- Open question: the exact desktop breakpoint should be selected during implementation based on available width; the acceptance check will use a desktop viewport wide enough to fit the controls and a narrow mobile viewport.
- Evidence: inspected `app/layouts/default.vue`, `app/pages/login.vue`, `app/pages/tickets/index.vue`, `ArchiveFilterButton.vue`, `useHierarchyFilters.ts`, `auth-shell.test.ts`, `filter-search.test.ts`, ADRs 0015/0016, and the completed M19 record. The workflow check passed both before and after creating this milestone file. `oxfmt --check` and `git diff --no-index --check` passed for the plan. No application files were changed.

### 2026-09-29 — Plan approved

- Fact: Plannotator returned `{"decision":"approved"}` with no annotations.
- Decision: the approved scope is recorded above; implementation may proceed only under that scope and remains a separate task.
- Evidence: `plannotator annotate docs/milestones/m20-login-and-ticket-board-toolbar-polish.md --gate --json --require-approval` returned approval.

### 2026-09-29 — Human-directed code-review revision

- Fact: Plannotator noted that the archive and New ticket buttons should not be inside the bordered filter group. Inspection confirmed that the M20 toolbar's `UCard` enclosed all controls; this was introduced by the implementation, while the approved plan did not specify that the actions share the filter card's border.
- Verdict: confirmed. The border should frame only the filter controls and Clear filters; the archive and New ticket actions should remain outside it while sharing the desktop toolbar row.
- Decision: after the finding was discussed, the human directed “go” to make this adjustment.
- Change: the responsive toolbar is now the outer group; `UCard` contains only the four filters and Clear filters. Show/Hide archived and New ticket are sibling controls outside the card. Added browser assertions that those actions are outside the accessible filter group.
- Manual check: inspected `/tmp/nxmr-m20-board-desktop-final.png` and `/tmp/nxmr-m20-board-mobile-final.png`; actions sit outside the filter-card border on desktop and mobile, with no page overflow. Temporary screenshots/capture code are not tracked.
- Evidence: focused `pnpm exec playwright test tests/e2e/auth-shell.test.ts tests/e2e/filter-search.test.ts --workers=1 --timeout=60000` passed (3 tests) after the change; the full E2E suite passed all 27 tests. `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (13 files / 72 tests), `pnpm build`, `pnpm check:workflow`, and tracked/new-file whitespace checks passed. Build emitted a non-fatal Vite `PLUGIN_TIMINGS` advisory. Manual screenshots are listed above.

### 2026-09-29 — Final human code review

- Fact: Plannotator reviewed the revised uncommitted diff and returned `{"decision":"approved","message":"Code review completed — no changes requested."}`.
- Decision: accept the code review; no further implementation changes are requested. M20 remains open until the human completion declaration is recorded.
- Evidence: `plannotator review --git --diff-type uncommitted --no-git-remote-check --json` returned approval.

### 2026-09-29 — Milestone completion declaration

- Fact: the human declared, “i declare this milestone complete.”
- Decision: M20 is complete; the approved scope, verification evidence, and accepted human code review are recorded above.
- Evidence: completion declaration received in the conversation on 2026-09-29.

### 2026-09-29 — Implementation and verification

- Fact: `app/layouts/default.vue` now horizontally centers its existing slot while retaining the current main width, padding, and vertical centering. No login/session/redirect code changed.
- Fact: the ticket-board filters and Clear filters share a toolbar with Show/Hide archived and New ticket. The flexible filter group is on the left; the archive/New ticket action group is on the right. The toolbar switches to a stacked layout below Tailwind's `lg` breakpoint (1024px), matching ADR 0015's mobile-column convention.
- Decision: use `lg` as the desktop one-row breakpoint. Browser coverage confirms a single line at both 1024px and 1440px; at 390px it confirms the controls stack in order without page-level horizontal overflow.
- Fact: regression tests check login-card centering at 1280px and 390px, desktop toolbar geometry at 1024px and 1440px, the mobile stack, Clear filters, archive toggle state, and New ticket hrefs with and without a release query. Existing searchable filter/cascade coverage remains in place.
- Evidence: focused `pnpm exec playwright test tests/e2e/auth-shell.test.ts tests/e2e/filter-search.test.ts --workers=1 --timeout=60000` passed (3 tests); focused filter suite passed after adding the 1024px assertion. The final full E2E run passed all 27 tests with that assertion included. `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, and `pnpm test` (13 files / 72 tests) passed. `pnpm build` passed with a non-fatal Vite `PLUGIN_TIMINGS` advisory. `pnpm check:workflow`, tracked `git diff --check`, and the no-index whitespace check for the new milestone passed. The focused auth-shell E2E logs a non-fatal Nuxt Router no-match warning when verifying the intentional `/projects` 404.
- Manual visual check: inspected temporary login screenshots `/tmp/nxmr-m20-login-desktop.png` and `/tmp/nxmr-m20-login-mobile.png`; login content appears horizontally centered at both sizes. The current post-review toolbar screenshots are `/tmp/nxmr-m20-board-desktop-final.png` and `/tmp/nxmr-m20-board-mobile-final.png`; the actions sit outside the filter-card border, desktop controls share one row, and mobile controls stack without horizontal overflow. Screenshots and temporary capture code are not tracked.
- Deviation: none. No ADR or changes to authentication, filters, APIs, or stored data were needed.

## Verification

Planning artifact, before Plannotator submission:

- [x] `pnpm exec oxfmt --check docs/milestones/m20-login-and-ticket-board-toolbar-polish.md` — passed before approval; rerun after recording approval.
- [x] `node scripts/check-workflow-docs.mjs` — passed before and after creating the milestone file.
- [x] `git diff --no-index --check /dev/null docs/milestones/m20-login-and-ticket-board-toolbar-polish.md` — passed for the new file.
- [x] Plannotator plan gate — approved on 2026-09-29 with no annotations.

Implementation, after approval:

- [x] `pnpm exec playwright test tests/e2e/auth-shell.test.ts tests/e2e/filter-search.test.ts --workers=1 --timeout=60000` — 3 tests passed after the Plannotator revision; covers login center checks at 1280px/390px, toolbar row at 1440px/1024px, card/action separation, mobile stacking/no overflow, archive toggle, filter clear/search/cascade, and New ticket routes.
- [x] `pnpm exec playwright test --workers=1 --timeout=60000` — all 27 tests passed after the Plannotator revision.
- [x] Manual visual inspection — desktop/mobile screenshots listed in the code-review revision journal; login alignment and toolbar/card separation are correct, with no mobile page overflow. Temporary screenshots are not tracked.
- [x] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, and `pnpm test` — passed; unit tests: 13 files / 72 tests.
- [x] `pnpm build` — passed; emitted a non-fatal Vite `PLUGIN_TIMINGS` advisory.
- [x] `pnpm check:workflow`, `git diff --check`, and the no-index whitespace check for the new milestone file — passed. The no-index command returns status 1 for a clean new-file diff; its output was empty.

## Review status

- Plan review: Approved via Plannotator on 2026-09-29; no annotations.
- Code review: Accepted via Plannotator on 2026-09-29 after addressing one finding; no further changes requested.
- Milestone completion declaration: Declared by the human in chat on 2026-09-29.

## Follow-ups

- None identified during planning.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in the journal and review status.
