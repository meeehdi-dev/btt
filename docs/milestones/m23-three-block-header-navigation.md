# M23 — Three-block header navigation

## Context

M22 is complete. Its follow-up names first-release deployment as the next planning task, but the user has now asked to prioritize this small UI overhaul; deployment remains separate and is not authorized by this plan.

The current authenticated shell in `app/layouts/dashboard.vue` reserves a persistent desktop sidebar and uses a full-screen mobile menu. `AccountMenu.vue` places Settings and sign-out inside a popover. The user wants to remove the sidebar and make one header with three blocks: left, `nxmr` and navigation ordered Today, Tickets, Clients; center, workspace search; right, the signed-in name/avatar plus direct Settings and logout buttons. The intent is to regain content width and avoid a popover for account actions.

## Approved scope

**Approved via Plannotator on 2026-09-29 with no feedback.**

- Replace the sidebar and mobile menu with one responsive, full-width application header composed of three logical blocks:
  1. **Left:** `nxmr` home link, then Today, Tickets, Clients in that order.
  2. **Middle:** the existing universal search.
  3. **Right:** signed-in user's avatar and visible name, a direct Settings button/link, and a direct Sign out button.
- At roomy desktop widths, keep the three blocks on one row with search centered between left and right. At narrow widths, stack the same blocks in left/search/right order; keep all navigation and account actions available, keep search full-width, and prevent page-level horizontal overflow. This is the proposed mobile layout for review.
- Remove the desktop sidebar, its expand/collapse control and persisted expanded preference, the mobile menu trigger/modal and duplicate mobile search instance, and the account popover. An unused old `nxmr-sidebar-expanded` localStorage value may remain in existing browsers but will no longer be read or written.
- Keep the existing navigation destinations and keyboard behavior: `/` and Ctrl/⌘K focus search; `g` then `t`, `c`, or `b` still navigate to Today, Clients, or Tickets respectively. Navigation's visual order changes to Today, Tickets, Clients; shortcut mappings do not.
- Preserve authenticated owner-scoped search, keyboard/touch accessibility, current-route styling, avatar-image/fallback behavior, and logout as the existing POST to `/api/logout`.
- Update focused browser tests, the roadmap's current-shell description, and durable navigation guidance. Create ADR 0035 to replace ADR 0015's sidebar/mobile-menu/account-placement decision while retaining its unrelated compact-page and mobile-column guidance.

## Out of scope

- Auth/session policy or endpoints, API/search behavior, ownership, database/schema, migrations, dependencies, or settings behavior.
- Changes to page-specific layouts or content beyond using the width freed by removing the sidebar.
- A replacement drawer/menu, new command palette, new navigation destinations/shortcuts, or redesign of search results.
- Deployment, first-release automation, production database migration, or changes to M22's deployment follow-up beyond prioritizing this milestone first.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- `docs/milestones/m7-search-and-ui-polish.md` — existing shell/search behavior and accepted review history
- `docs/milestones/m19-client-led-project-navigation.md` — current three top-level destinations and removal of Projects collection
- `docs/milestones/m22-documentation-reconciliation.md` — complete prior milestone and deployment follow-up
- `docs/decisions/0003-m1-authentication-and-database.md` — session-aware shell and POST-only logout
- `docs/decisions/0015-compact-navigation-and-mobile-columns.md` — existing shell and still-applicable mobile/page layout guidance
- `docs/decisions/0033-no-compatibility-route-for-project-collection.md` — Clients/Tickets/Today remain the current navigation scope
- `app/layouts/dashboard.vue`, `app/components/AccountMenu.vue`, `app/components/GlobalSearch.vue`
- `tests/e2e/auth-shell.test.ts`, `tests/e2e/search.test.ts`, `tests/e2e/ticket-status-moves.test.ts`

## Approach

1. Refactor `app/layouts/dashboard.vue` into a full-width shell with one responsive header and the existing page slot. Remove sidebar expansion persistence and mobile-modal state. Keep one `GlobalSearch` instance and have existing keyboard shortcuts focus it directly.
2. Replace the account popover with a direct header account-controls component. Show the avatar and name together, link Settings directly, and keep Sign out as a native POST form action to `/api/logout`; preserve an avatar fallback and accessible action names.
3. Render one shared navigation list in the requested Today, Tickets, Clients order, with active-route styling. Preserve the current shortcut-to-route mapping and avoid adding a menu on mobile.
4. Update E2E coverage for desktop/mobile layout, navigation order and visibility, direct account actions, search focus/selection, keyboard navigation, logout, and absence of sidebar/menu controls. Replace any test that uses the old mobile menu button as a drag target with a neutral target without changing the ticket-board behavior under test.
5. After plan approval, update `PLAN.md`, mark ADR 0015 superseded with its remaining applicable guidance preserved in ADR 0035, update the ADR index, and record implementation/verification/review evidence here.

## Files to modify

- `app/layouts/dashboard.vue` — responsive three-block shell, navigation order, single search and direct keyboard focus.
- `app/components/AccountControls.vue` — renamed from `AccountMenu.vue`; direct identity and Settings/Sign out controls.
- `tests/e2e/auth-shell.test.ts` — authenticated shell, destination order, direct Settings/sign-out and responsive checks.
- `tests/e2e/search.test.ts` — single search instance on desktop/mobile, search shortcuts, navigation shortcuts and no mobile menu.
- `tests/e2e/ticket-status-moves.test.ts` — replace its mobile-menu drag target with a neutral target; preserve the existing non-drag status policy assertion.
- `PLAN.md` — add M23 status/summary and update the current shell feature description after implementation.
- `docs/decisions/0015-compact-navigation-and-mobile-columns.md` — mark superseded and link to ADR 0035, preserving surviving guidance in the replacement.
- `docs/decisions/0035-three-block-header-navigation.md` — new durable shell/navigation decision after approval.
- `docs/decisions/README.md` — index ADR 0035 and update ADR 0015 status.
- `docs/milestones/m23-three-block-header-navigation.md` — implementation journal, evidence, review and closeout.

No API, server, database, migration, dependency, or auth configuration files are planned. `GlobalSearch.vue` should remain unchanged unless implementation reveals a necessary presentation-only adjustment; any such adjustment must stay within the approved header scope.

## Reuse

- `app/layouts/dashboard.vue` already owns the navigation entries, keyboard shortcuts, authenticated session and page slot; reuse these boundaries while removing sidebar/menu-only state.
- `app/components/GlobalSearch.vue` already provides grouped universal search, debouncing, keyboard result selection, and an exposed `focus()` method. Keep its API/search logic intact.
- `app/components/AccountMenu.vue` already renders the Better Auth session image/name and the POST logout form. Reuse the avatar and logout patterns, but remove popover-only state and make Settings/sign-out direct controls.
- `app/utils/entity-icons.ts` contains the existing Today, Tickets, Clients and Settings icons.
- `tests/e2e/auth-shell.test.ts` and `tests/e2e/search.test.ts` already cover session, avatar, keyboard search, mobile navigation, and logout; adapt these rather than duplicating fixtures.

## Decisions and ADR links

- Existing auth decision retained: logout remains a POST action (`docs/decisions/0003-m1-authentication-and-database.md`).
- Durable decision: ADR 0035 is accepted and supersedes ADR 0015's shell arrangement and account-action placement. It preserves ADR 0015's independent guidance on compact page introductions and explicit mobile-column behavior.
- No other product, data, auth, or architecture decision is proposed.

## Open questions and tradeoffs

- The human approved the narrow-screen left/search/right stack in Plannotator with no feedback. Implementation uses one row at `lg` and stacks below it; account action labels become accessible icon buttons below `sm`, with Nuxt UI tooltips, while navigation labels and the user name remain visible.

## Implementation checklist

- [x] Human reviews and approves this plan in Plannotator before implementation.
- [x] Remove sidebar/mobile-menu shell and implement the responsive three-block header with the requested navigation order.
- [x] Provide direct avatar/name, Settings, and POST Sign out controls with accessible names and correct responsive behavior.
- [x] Preserve search behavior and keyboard shortcuts; update focused E2E assertions, including the existing mobile drag test target.
- [x] Update roadmap and ADR records within the approved scope.
- [x] Run verification, manually inspect desktop/mobile widths, and record results/deviations here.
- [x] Submit the full diff for human code review; address feedback before closeout.
- [x] Record human completion declaration before marking M23 complete.

## Journal

### 2026-09-29 — Planning research

- Fact: the working tree was clean at commit `6995a98` (`feat: docs cleanup`); M22 is recorded complete.
- Fact: `app/layouts/dashboard.vue` currently reserves a desktop sidebar, uses separate desktop/mobile search refs, opens a full-screen mobile menu, and reads/writes `nxmr-sidebar-expanded`. Navigation currently displays Today, Clients, Tickets. `/`, Ctrl/⌘K and `g`-then-letter shortcuts are handled in the layout.
- Fact: `app/components/AccountMenu.vue` shows the session avatar/name as a popover trigger and puts Settings and POST `/api/logout` inside the popover. `GlobalSearch.vue` exposes `focus()` and already implements the search UI.
- Fact: existing shell/search coverage is in `tests/e2e/auth-shell.test.ts` and `tests/e2e/search.test.ts`; `tests/e2e/ticket-status-moves.test.ts` uses the mobile menu button as a neutral drag target and will need a replacement target when the menu is removed.
- Decision (user): remove the sidebar and use a three-block header with site/navigation on the left, search in the middle, and avatar/name plus direct Settings and logout controls on the right. Navigation order is Today, Tickets, Clients; there is no account popover.
- Decision (proposed): retain existing keyboard bindings and logout POST semantics; use left/search/right stacked blocks on narrow layouts so no action is hidden and no horizontal overflow is introduced.
- Evidence: read the workflow, roadmap, M7/M19/M22 records, ADRs 0003/0015/0033, the milestone template/conventions, shell/search/account components, and relevant browser tests. `node scripts/check-workflow-docs.mjs`, `pnpm exec oxfmt --check docs/milestones/m23-three-block-header-navigation.md`, and the untracked-file whitespace check passed. No application code or roadmap/ADR content was changed during planning.

### 2026-09-29 — Plan approval

- Fact: Plannotator returned `{"decision":"approved"}` with no feedback.
- Decision: the human approved M23 within the scope above. No implementation was started in this planning task.
- Evidence: `plannotator annotate docs/milestones/m23-three-block-header-navigation.md --gate --json --require-approval`.

### 2026-09-29 — Implementation and verification

- Fact: replaced the sidebar/full-screen mobile menu with a full-width, responsive header. Desktop uses one row with `nxmr` and Today/Tickets/Clients left, centered existing search, and avatar/name plus direct Settings/Sign out right; narrow layouts stack those blocks. The localStorage sidebar state is no longer read or written.
- Fact: `AccountControls.vue` reuses the existing session avatar/fallback and POST `/api/logout`; Settings and Sign out are direct actions, using icon-only accessible controls with Nuxt UI tooltips below `sm`. Search/API behavior and auth rules did not change.
- Fact: E2E now checks route order, desktop search centering, direct Settings/logout, the no-sidebar/no-drawer shell, single search/keyboard behavior, responsive block order and no page-level overflow at 390px and 320px. The mobile status-move guard now drops against a neutral point in `main`.
- Verification discovery: the first focused run timed out because the neutral drag target at the top of `main` was covered by the sticky header. Moving the target point below the header fixed the issue; the focused ticket-status test and subsequent full E2E suite passed.
- Evidence: `pnpm format:check` passed on 260 files; `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (13 files/72 tests), `pnpm check:workflow`, and whitespace checks passed. `pnpm exec playwright test --workers=1 --timeout=60000` passed all 27 tests. `pnpm build` passed with a nonfatal Rolldown plugin-timings warning. One earlier full browser run logged nonfatal Vite ResizeObserver loop notices during agenda tests.
- Manual visual check: inspected temporary Playwright screenshots at 1280×900, 390×844 and 320×844. The desktop search is centered; mobile shows the requested stacked blocks, visible navigation and name, direct account controls, and no horizontal overflow. Temporary screenshots/debug statements were removed. At 320px the existing Today date value wraps across lines; it is outside this shell scope and is listed as a follow-up.

### 2026-09-29 — Plannotator code-review feedback

- Fact: Plannotator noted that Settings and Sign out lacked visible hover feedback and asked whether they were buttons/links. Settings is a link (`UButton` with `to="/settings"`); Sign out is a form submit button preserving POST `/api/logout`.
- Verdict: Confirmed; introduced by M23. Both controls used neutral ghost styling on the same `bg-elevated` header surface, so the default `hover:bg-elevated` had no visible contrast. The superseded popover controls had explicit `hover:bg-accented` styling.
- Decision (human): “go” approved adding visible hover feedback while retaining the current direct link and POST button semantics.
- Change: added semantic `hover:bg-accented hover:text-highlighted` classes to both actions. Auth-shell browser coverage compares resting and hovered background colors for each.
- Evidence: `pnpm exec playwright test tests/e2e/auth-shell.test.ts --grep "authenticated shell session" --workers=1 --timeout=60000` passed (1 test). After the hover revision, format, lint, both typechecks, unit tests (13 files/72 tests), workflow/whitespace checks, and build passed; the full Playwright suite passed all 27 tests. The build emitted a nonfatal Rolldown plugin-timings warning. The final browser run logged a nonfatal Vue hydration-attribute mismatch for the disabled trigger in Today’s Add completed work modal; all tests passed, and no out-of-scope page code was changed. Full review resubmission is pending.

### 2026-09-29 — Plannotator follow-up feedback

- Fact: Plannotator reported that the right-side controls looked smaller than the left navigation and that Sign out lacked a pointer cursor.
- Verdict: Confirmed; both were introduced by M23. The controls used `size="sm"` while the nav uses `text-sm`/`py-2`; Sign out lacked `cursor-pointer` (the removed popover button had it).
- Decision (human): “go” approved matching the direct controls to the navigation size and restoring pointer feedback.
- Change: both actions now use medium text/icon sizing and `px-2 py-2` to match the navigation height; both direct actions use `cursor-pointer`. E2E checks equal rendered heights, pointer cursors, and hover-state contrast.
- Evidence: `pnpm exec playwright test tests/e2e/auth-shell.test.ts --grep "authenticated shell session" --workers=1 --timeout=60000` passed (1 test). After this revision, `pnpm format:check` (260 files), `pnpm lint`, both typechecks, `pnpm test` (13 files/72 tests), `pnpm check:workflow`, whitespace checks, and `pnpm build` passed. `pnpm exec playwright test --workers=1 --timeout=60000` passed all 27 tests. Build emitted the nonfatal Rolldown plugin-timings warning; the latest browser run logged repeated Vite ResizeObserver loop errors during agenda tests, with no test failures. A prior full run logged a nonfatal Vue hydration-attribute mismatch in Today’s Add completed work modal. Review resubmission remains pending.

### 2026-09-29 — Plannotator code review

- Fact: Plannotator returned `{"decision":"approved"}` with “Code review completed — no changes requested.”
- Decision: the reviewer’s findings have been resolved and no further code changes are requested by this review. Human acceptance and the milestone completion declaration are recorded below.
- Evidence: `plannotator review --git --diff-type uncommitted --no-git-remote-check --json`.

### 2026-09-29 — Completion declaration

- Fact: The human declared, “i declare this milestone complete.”
- Decision: Human acceptance of the reviewed implementation is recorded; M23 is complete. The documented 320px Today date wrapping and first-release deployment remain out-of-scope follow-ups.
- Evidence: Human completion declaration in this conversation; implementation checks and Plannotator code-review approval recorded above.

## Verification

Planning checks before approval:

- [x] `node scripts/check-workflow-docs.mjs` — passed: “Workflow documentation structure looks complete.”
- [x] `pnpm exec oxfmt --check docs/milestones/m23-three-block-header-navigation.md` — passed; all matched files use the correct format.
- [x] `git diff --no-index --check /dev/null docs/milestones/m23-three-block-header-navigation.md` — passed with no whitespace diagnostics (exit 1 is expected because the plan is untracked).
- [x] Human plan review in Plannotator — approved with no feedback.

Implementation checks after approval:

- [x] `pnpm format:check` — passed on 260 files; `pnpm lint` — passed.
- [x] `pnpm typecheck` and `pnpm typecheck:tsgo` — passed.
- [x] `pnpm test` — 13 files / 72 tests passed.
- [x] `pnpm exec playwright test --workers=1 --timeout=60000` — all 27 browser tests passed. Browser dev-server logs included nonfatal Vite ResizeObserver loop errors during agenda tests; a separate earlier run logged a Vue hydration-attribute mismatch on Today’s disabled Add completed work modal trigger. No test failed.
- [x] `pnpm build` — passed; emitted a nonfatal Rolldown plugin-timings warning.
- [x] `pnpm check:workflow`, `git diff --check`, and whitespace checks for new untracked files — passed.
- [x] Manual screenshots at 1280×900, 390×844 and 320×844 confirmed desktop centering, mobile block order, visible actions, full-width shell and no horizontal overflow. Existing Today date text wraps at 320px; unchanged and captured under Follow-ups.
- [x] Browser coverage verifies direct Settings navigation, POST sign-out to login, search focus/results and `g` navigation shortcuts, mobile navigation without a drawer, and neutral-target mobile drag behavior.

## Review status

- Plan review: Approved via Plannotator on 2026-09-29 with no feedback.
- Code review: Plannotator returned approval with no changes requested on 2026-09-29; human acceptance recorded with the completion declaration.
- Milestone completion declaration: Recorded on 2026-09-29; M23 complete.

## Follow-ups

- At 320px, the existing Today date-value control wraps its date across multiple lines. This is page-specific and outside M23's approved shell scope; consider a separate responsive-control fix if desired.
- First-release deployment remains a separate future planning task and is outside M23.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in the journal and review status.
