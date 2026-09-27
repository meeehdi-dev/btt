# M9 — Shared card composition and hierarchy filters

## Context

This is the first implementation phase in the approved umbrella plan, `plans/wide-app-composability-effect-pass.md`. ADR 0021 (accepted) sets the wider Effect direction; Effect migration is not part of M9 and will have separately approved M10/M11 plans.

Human-approved direction is to make Client/Project and Release/Ticket card families feel like one system: two logical rows, with a visually consistent context row containing links, actions, labels, or counts. The project-card title should not change color independently on hover; use the client card's border-only hover as the reference. M9 also consolidates the genuinely duplicated hierarchy filters on Today and the ticket board.

Research facts:

- Client cards are currently inline in `app/pages/clients/index.vue`. `ProjectCard.vue` is already shared by Projects and client detail. Both have a heading row and a context/count row.
- Project release cards live in `app/pages/projects/[id]/index.vue`; they currently have a heading/action row, a hierarchy/count row, and a horizontal progress row. Release ticket cards in `app/pages/releases/[id]/index.vue` and board cards in `TicketBoardCard.vue` already have a title/usage row and context row. Board cards are draggable and intentionally keep card navigation on the ticket title; the other cards have full-card navigation with nested controls taking precedence.
- `ProjectCard.vue` currently adds `group-hover:text-primary` to its title. Client cards change the border on hover without changing the title color.
- `TicketHierarchyBadges.vue` already provides shared hierarchy links and `HierarchyCounts.vue` displays noninteractive counts, but their context-item presentations are not fully aligned.
- Today and Tickets duplicate hierarchy-filter option/state/reset/clear and touch-aware search configuration. Today also has status filtering; that remains page-specific.
- Existing regression coverage is in `tests/e2e/auth-shell.test.ts`, `tests/e2e/hierarchy-card-metrics.test.ts`, `tests/e2e/ticket-context-popovers.test.ts`, and `tests/e2e/filter-search.test.ts`.
- The read-only async inventory across `app/` finds Nuxt `useFetch` reads for lists/details/forms/settings/agenda/search/time entries/session, plus `$fetch` mutations for CRUD, agenda corrections/status changes, board moves, release completion, ticket links/relations, and settings. `GlobalSearch.vue` and Better Auth actions have their own error paths. These paths are recorded for M10/M11; M9 changes none of them.
- Planning checks passed before this plan: `pnpm lint`, `pnpm typecheck`, `pnpm test` (12 files, 54 tests), `pnpm check:workflow`, and formatting checks. No application code has been changed.

## Approved scope

- Add a small, slot-based shared card frame (proposed `EntityCard.vue`) to make heading and context-row layout, spacing, semantic surface/border treatment, and hover/focus behavior consistent across Client, Project, Release, and Ticket cards.
- Extract `ClientCard.vue` from the Clients list and compose the shared frame in the Client and Project cards, project-release cards, release-ticket cards, and ticket-board cards where it preserves the existing semantic and interaction owners.
- Standardize the bottom context row so clickable links/actions and noninteractive labels/counts use consistent icon sizing, alignment, spacing, typography, and semantic surface treatment. Reuse/update `TicketHierarchyBadges.vue` and `HierarchyCounts.vue`; preserve link, button, status, popover, and label semantics rather than making informational items clickable.
- Align Project card hover/focus with the Client card: keep the card border/focus treatment, remove the title-only hover color change, and avoid introducing other per-title hover behavior.
- Keep two logical rows at desktop and mobile widths. Replace the release card's horizontal progress bar with a compact circular completion ring in the context row, retaining the ticket icon and numeric done/total fraction. Omit the visible “done” suffix and percentage; the ring still exposes an accessible progressbar name/value/value text describing completion, including the 0/0 case.
- Extract the shared hierarchy filter behavior in Today and Tickets into `app/composables/useHierarchyFilters.ts` (or an equivalent focused composable), including hierarchy options, dependency resets, clear behavior, and touch-aware searchable filter input configuration. Today status filtering stays local to Today.
- Record the app-wide fallible-work inventory for the follow-up M10/M11 plans; do not migrate any async workflows in M9.
- Preserve all data, routes, loading/error/empty states, archive rules, counts/progress, board drag/highlight/locate behavior, agenda interactions, and nested-control precedence. Add regression tests for visual consistency and behavior.

## Out of scope

- Any Effect migration, server/API/database/schema changes, dependency changes, auth/session changes, or changes to stored domain rules. These belong to later approved phases.
- New product behavior, changes to card contents/count calculations, release completion rules, status handling, or time-entry behavior.
- Making board cards fully clickable or changing the established distinction between whole-card navigation and ticket-title navigation.
- A generic card with many domain-specific Boolean modes or moving card actions/data fetching into the shared presentation shell.
- A broad redesign of Today, the ticket board, or other pages beyond the shared card/context-row and hierarchy-filter work.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- Approved umbrella plan: `plans/wide-app-composability-effect-pass.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`, completed M8: `docs/milestones/m8-polish-and-shared-ticket-work-items.md`
- ADR 0018 (shared UI/context consistency), ADR 0020 (M8 presentation behavior), ADR 0022 (accepted shared entity-card shell), ADR 0021 (Effect scope; later phases only)
- `.agents/skills/nuxt-ui/SKILL.md` and `.agents/skills/oxc/SKILL.md`
- Official Nuxt UI Progress reference: <https://ui.nuxt.com/docs/components/progress>; installed Nuxt UI 4.11.1 `Progress.vue` declares horizontal/vertical orientation and no circular variant. The maintainer component-selection guide lists `UProgress` as the progress indicator: <https://github.com/nuxt/ui/blob/v4/skills/nuxt-ui/references/guidelines/component-selection.md>.

## Approach

1. **Card composition:** use a presentational shared shell with named content/context slots; wrappers keep their existing entity data, HTML semantics, full-card or title-only links, drag attributes/events, and nested actions. Reuse existing work-item, hierarchy, usage, and count components. Align noninteractive context labels/counts with the existing neutral soft link/action style without changing their semantics.
2. **Circular release completion:** installed Nuxt UI 4.11.1 `UProgress` supports horizontal/vertical orientation but has no circular variant. Use a small custom SVG ring component (no new dependency) in place of the horizontal progress row. Retain the ticket icon and numeric done/total fraction beside the ring; omit a visible “done” suffix and percentage. Expose one accessible `progressbar` with useful value text, and render active empty releases as an empty 0% ring with `0 / 0`.
3. **Hierarchy filter composition:** normalize Today/Tickets records into a shared hierarchy shape, then use one composable for shared hierarchy filter state/options, selection-dependent reset, clear, and touch-aware search inputs. Keep status options and status behavior in `today.vue`; do not move board drag logic or agenda gestures.
4. **Regression and verification:** preserve data-test selectors where practical; update focused Playwright tests for the card family, title-hover parity, context-item styling, nested link/action precedence, release progress, filters, and mobile overflow. Record the app-wide async inventory for future phases. Manually inspect desktop/mobile cards and keyboard focus before handoff.

## Files to modify

- This milestone file and the decisions index.
- `docs/decisions/0022-shared-entity-card-presentation.md`; record the human review decision before M9 closeout.
- New `app/components/EntityCard.vue`, `app/components/ClientCard.vue`, and `app/components/ProgressRing.vue` (or an equivalent focused SVG-ring component).
- `app/pages/clients/index.vue` to compose `ClientCard.vue`.
- `app/components/ProjectCard.vue` (used on Projects and client detail).
- `app/components/HierarchyCounts.vue` and `app/components/TicketHierarchyBadges.vue` for consistent context-row items, if confirmed as the simplest fit.
- `app/pages/projects/[id]/index.vue` for project-release cards and circular completion presentation.
- `app/pages/releases/[id]/index.vue` for release-ticket cards.
- `app/components/TicketBoardCard.vue` for board-card framing, without changing its drag/title navigation ownership.
- New `app/composables/useHierarchyFilters.ts`.
- `app/pages/today.vue` and `app/pages/tickets/index.vue` to consume the composable.
- Focused tests: `tests/e2e/auth-shell.test.ts`, `tests/e2e/hierarchy-card-metrics.test.ts`, `tests/e2e/ticket-context-popovers.test.ts`, `tests/e2e/filter-search.test.ts`; add a focused unit test only if the shared filter logic can be kept pure and independently testable.
- No product roadmap change is expected. Do not rewrite accepted ADR 0020; if the final shared-card contract establishes a durable UI rule, propose a new ADR using the template and record its review before M9 closeout.

## Reuse

- `ProjectCard.vue` is already reused on the Projects list and client detail; keep this one wrapper rather than forking it.
- `TicketWorkItem.vue` already standardizes ticket title/usage; retain it inside ticket cards rather than duplicating those fields.
- `TicketHierarchyBadges.vue`, `HierarchyCounts.vue`, `TicketTrackedUsage.vue`, and `TicketContextPopovers.vue` already own related presentation and interactions.
- Existing E2E tests assert hierarchy counts/progress, two-row ticket presentation, nested links/actions, context popovers, and searchable filters. Extend these rather than creating parallel fixtures.
- Use semantic Nuxt UI surface/color conventions already established in M8; no new UI dependency is needed. Use a custom SVG component for the ring rather than relying on an unsupported circular `UProgress` prop.

## Decisions and ADR links

- This milestone implements the human-approved card-consistency and project-hover feedback captured in `plans/wide-app-composability-effect-pass.md`.
- Two rows are the shared card structure. The final release-card display retains the ticket icon and numeric done/total fraction beside a compact circular progress ring; the ring replaces the horizontal bar. Per direct human clarification, omit the visible “done” suffix and percentage, while keeping accessible progress value text that describes completion and percentage, including 0/0. Use a custom SVG rather than an unsupported Nuxt UI prop or new dependency.
- Card wrappers own navigation and actions. A shared presentation shell must not swallow nested links/buttons or alter board dragging.
- Shared hierarchy filter behavior belongs in a composable; Today-only status filtering and each page's interaction ownership remain local.
- ADRs 0018 and 0020 continue to govern ticket/context semantics, ratio presentation, counts, and archive behavior. ADR 0021 governs future Effect phases, not this one. Accepted ADR 0022 records the shared card-shell presentation contract without changing ADR 0020.

## Implementation checklist

- [x] Human approves this M9 milestone plan via Plannotator before implementation.
- [x] Confirm the card shell and two-row/context-row design against all four card families before coding; implement and verify the release completion ring in the context row.
- [x] Extract ClientCard and shared card framing; reuse it across Client, Project, Release, and Ticket cards without losing full-card/title-only links, nested-action precedence, or drag behavior.
- [x] Normalize and extract shared hierarchy filter behavior; preserve all filter option, search, selection, dependency-reset, clear, and touch-focus behavior.
- [x] Add/adjust regression tests for card layout/hover/context consistency, hierarchy counts and circular progress (including 0/0), nested links/actions, board interactions, and filters.
- [x] Run and record all verification commands and manual checks below; document deviations or follow-ups.
- [x] Human reviewed and accepted ADR 0022 through Plannotator code review (2026-09-27; no changes requested).
- [x] Submit the code diff for human review and address any findings; Plannotator returned no changes requested (2026-09-27).

## Journal

### 2026-09-27 — M9 planning research

- Fact: the umbrella pass plan was approved via Plannotator. User feedback explicitly includes a generic/reusable card treatment across Client/Project and Release/Ticket cards, consistent two-row context content, and Project hover parity with Client.
- Fact: current card ownership differs: client/project/release/ticket-detail cards use full-card navigation with nested controls; the board card remains draggable and navigates via its title. Release cards currently expose `Done / total` and accessible progress across separate summary/progress rows.
- Fact: Today and Tickets have matching hierarchy filter logic; existing Playwright coverage exercises search and touch behavior.
- Fact: the `app/` async inventory found Nuxt `useFetch` reads, `$fetch` mutations, Better Auth session/sign-in/out operations, and GlobalSearch requests. M9 leaves these workflows unchanged; their Effect migration is for M10/M11.
- Fact: server writes commonly use `decodeBody`/Effect Schema, while several query validators and domain helpers directly translate tagged/ad-hoc errors to H3 errors; Drizzle/auth Promise operations are not currently composed through a shared Effect boundary. The endpoint-by-endpoint M10 scope still requires its own audit.
- Decision: M9 is limited to composability/UI. Server and client Effect adoption remain later milestones, each requiring its own plan and approval.
- Evidence: inspected `clients/index.vue`, `ProjectCard.vue`, project/release detail pages, `TicketBoardCard.vue`, shared metadata components, and existing card/filter tests. No application implementation changes have been made.
- Fact: official Nuxt UI Progress documentation and the installed 4.11.1 declarations expose horizontal/vertical `UProgress`; no built-in circular variant is available. A custom SVG ring avoids an unsupported prop or dependency change.
- Decision (initial; superseded by the clarification below): following Plannotator feedback, the release completion ring replaces the ticket icon and horizontal bar in the context row. The initial plan retained visible `Done / total` and percentage text with accessible progressbar name/value/value text, including empty releases.

### 2026-09-27 — M9 plan approval

- Fact: the human approved this milestone plan via Plannotator after the circular release-progress ring feedback was incorporated.
- Decision: implementation may proceed within the approved M9 scope. M10/M11 Effect phases remain unapproved and out of scope.

### 2026-09-27 — M9 implementation

- Fact: added the slot-based `EntityCard` shell, extracted `ClientCard`, composed the shell in Client, Project, project-release, release-ticket, and board cards, and added an SVG `ProgressRing`. Existing whole-card navigation, board title navigation/dragging, nested controls, and archive/data behavior remain with their page/card wrappers.
- Fact: aligned hierarchy count surfaces and extracted Today/Tickets hierarchy options, selection cascades, clear behavior, and touch-aware search inputs into `useHierarchyFilters`. Today status options and status state remain page-local.
- Fact: expanded E2E coverage for Client/Project border-only hover parity, two-row context layout, circular progress accessibility and 0/0, dependent filter resets, Today status filtering, desktop autofocus, and mobile no-autofocus/overflow behavior.
- Fact: inspected Playwright screenshots of Client, Project, project-release, release-ticket, and board cards during the initial ring design. After the user-approved progress-display revision, re-inspected desktop project-release/release-ticket cards and 390px mobile project-release/Today views; the ticket icon and numeric fraction remain legible, no percentage or “done” suffix appears, and no page-level horizontal overflow was visible.
- Decision: documented the shared card-shell contract in ADR 0022, additive to ADRs 0018/0020; at that point its human review/status decision was pending.
- Fact: the first hover E2E attempt sampled a card while the pointer was already over it, so its border had already changed. The test helper now moves the pointer away before taking its baseline; focused and full E2E runs then passed.
- Fact: an initial `pnpm format:check` after adding ADR 0022 reported formatting only in `docs/decisions/README.md`; formatted the index and the subsequent full check passed.
- Fact: `pnpm build` completed successfully; Vite emitted a non-failing `PLUGIN_TIMINGS` advisory during both final builds.
- Evidence: after the progress-display clarification, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm format:check`, `pnpm lint`, `pnpm test` (12 files/54 tests), `pnpm check:workflow`, `git diff --cached --check`, and `git diff --check` passed. Focused Playwright (5 tests) and full Playwright (15 tests) passed, as did `pnpm build`. The build emitted a non-failing Vite `PLUGIN_TIMINGS` advisory.

### 2026-09-27 — Release progress display clarification

- Fact: the human confirmed that the updated release progress display is intentional: retain the ticket icon, show the numeric done/total fraction and circular ring, and omit the visible “done” suffix and percentage.
- Decision: update the M9 and umbrella plans, proposed ADR 0022, and Playwright assertions to document and verify that design. Keep the ring's accessible value text descriptive of done/total progress and percentage, including active empty releases.
- Evidence: the initial focused E2E run passed auth-shell and ticket-context tests but exposed an outdated visible-count assertion (`1 / 2 done` vs intended `1 / 2`). Updated the hierarchy regression helper to assert the ticket icon, numeric fraction, ring, absence of visible percentage, accessible progress values, and compact ring padding; the focused hierarchy and ticket-context tests then passed.

### 2026-09-27 — Plannotator code and ADR review

- Fact: Plannotator reviewed the updated code and documentation diff and returned “Code review completed — no changes requested.”
- Decision: accept ADR 0022 as the reviewed shared-card presentation contract and update its status/index entry. No implementation changes were requested; M9 completion declaration remains separate from this review.

### 2026-09-27 — M9 completion declaration

- Fact: the human declared in chat, “i hereby declare this milestone complete.”
- Decision: record M9 as complete. The approved scope, verification, ADR review, and code review are complete; M10/M11 remain separate, unapproved follow-up phases.

## Verification

- [x] `pnpm format:check`
- [x] `pnpm lint`
- [x] `pnpm typecheck` and `pnpm typecheck:tsgo`
- [x] `pnpm test` — 12 files, 54 tests passed.
- [x] Focused Playwright: `pnpm exec playwright test tests/e2e/auth-shell.test.ts tests/e2e/hierarchy-card-metrics.test.ts tests/e2e/ticket-context-popovers.test.ts tests/e2e/filter-search.test.ts --workers=1` — 5 tests passed.
- [x] Full Playwright: `pnpm exec playwright test --workers=1` — 15 tests passed.
- [x] `pnpm build`, `pnpm check:workflow`, `git diff --cached --check`, and `git diff --check` — passed.
- [x] Browser assertions retain active/archived hierarchy counts; the circular ring replaces the horizontal bar while the ticket icon and numeric done/total fraction remain visible, no visible “done” suffix or percentage is shown, and the ring exposes accessible progress values/text including 0/0; all card links/actions and board drag/context popovers remain functional at desktop/mobile widths.
- [x] Filter tests cover searchable options, applying and clearing hierarchy filters, dependent-filter resets, Today status filtering, desktop keyboard focus, and no automatic mobile keyboard focus.
- [x] Re-inspected final desktop and 390px mobile screenshots for the project-release card, release-ticket cards, and Today agenda after the clarified progress display; verified no page-level horizontal overflow, legible numeric progress, contextual surfaces, and locally scrollable hierarchy chips. Prior M9 screenshots cover Client, Project, and board cards; E2E assertions still verify accessible progress, nested-control precedence, and Project/Client hover parity.

## Review status

- Umbrella plan review: Approved via Plannotator (2026-09-27).
- M9 plan review: Initial plan approved via Plannotator (2026-09-27); the progress-display revision was approved directly by the human in chat (2026-09-27).
- ADR 0022: Accepted via Plannotator review (2026-09-27; no changes requested).
- Code review: Completed via Plannotator (2026-09-27); no changes requested.
- Milestone completion declaration: Received directly in chat (2026-09-27); M9 complete.
- Implementation: M9 complete within the approved plan and reviewed scope.

## Follow-ups

- Effect migration across server and client remains M10/M11 and must be separately planned and approved.
- Any card pattern that cannot share the shell without losing semantic/accessibility behavior should be documented with examples rather than forced into a generic API.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in the journal and review status.
