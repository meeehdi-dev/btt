# M44 — Entity creation modals, inline editing, and action toasts

> **Status: M44 is complete. The original scope and approved amendments are implemented, verified, and code-reviewed; ADRs 0056–0059 are Accepted. The user-reported modal-shortcut follow-up was approved in Plannotator session `pn-c4e6ca`, and the human completion declaration is recorded below.** Original decisions are recorded in [`plans/entity-modals-and-action-toasts.md`](../../plans/entity-modals-and-action-toasts.md); amendment scope and evidence are in [`plans/hierarchy-detail-presentation-consistency.md`](../../plans/hierarchy-detail-presentation-consistency.md), [`plans/settings-modal-amendment.md`](../../plans/settings-modal-amendment.md), and [`plans/modal-actions-and-keyboard-shortcuts-amendment.md`](../../plans/modal-actions-and-keyboard-shortcuts-amendment.md).

## Context

Client, project, release, and ticket creation currently use separate pages and successful creation navigates directly to the new detail route. Client, project, and release editing also use separate routes. The user wants creation to use modals with no automatic navigation, and wants the new item available through a success notification link. Client, project, and release detail pages should be directly editable instead of opening edit modals. Ticket detail remains the normal editable page; ticket creation becomes a modal.

The user also wants bottom-right success notifications for nearly all explicit server-backed actions. The policy must preserve current request failures, partial-success/refresh-retry behavior, modal usability, same-tab invalidation, archive hierarchy context, and existing server/data rules.

### Observed facts

- Create routes are `app/pages/clients/new.vue`, `app/pages/projects/new.vue`, `app/pages/releases/new.vue`, and `app/pages/tickets/new.vue`; each currently navigates to the new detail route on success.
- Edit routes exist for clients, projects, and releases. Their forms provide client name/color; project name/color; release name/target date; archive state; and archived-only permanent deletion. Project/client and release/project ownership associations are not currently editable.
- Existing create CTAs are on Clients, client detail, project detail, release detail, Ticket Board, and the Agenda's empty-ticket prompt. The Agenda's **Create a ticket** CTA appears inside Add completed work when there are no active tickets; today it navigates to `/tickets/new`. The contextual parent is preselected but changeable.
- Ticket detail already has field-scoped edits and title, external-link, and relation modals. The ticket editor route was retired in M25. The New ticket page currently stages external links and related tickets inside its main form.
- `app/app.vue` wraps the application in Nuxt UI `UApp`, whose toaster defaults to bottom-right. `useToast()` supports toast actions; no app code currently uses it.
- Client requests use `runClientRequest`/`patchTicket`; targeted same-tab reads use `useAppDataInvalidation`. ADR 0024 governs safe failures and write-success/refresh-failure handling. ADR 0051 governs same-tab invalidation after successful writes.

## Approved scope

### Creation modals and routes

- Replace standalone create pages with local, non-URL-backed modals. Direct visits to `/clients/new`, `/projects/new`, `/releases/new`, and `/tickets/new` return 404; do not add compatibility redirects or modal deep links.
- Convert the create CTAs on Clients, client detail, project detail, release detail, and Ticket Board to modals. Remove the Agenda Add completed work modal's **Create a ticket** action when no active tickets are available; leave a non-actionable empty-state message. Ticket creation remains available from Ticket Board and Release detail.
- Preserve all current form fields, validation, and parent selection behavior. When launched with a client/project/release context, preselect it but allow changing it.
- On successful creation, close the create modal and remain on the originating page. Do not navigate to the new item automatically. Show a success toast with an **Open client/project/release/ticket** action to the new detail route. Creation toasts last approximately 10 seconds.
- If ticket creation lacks active releases, projects, or clients, preserve the ticket form draft and guide through sequential client → project → release creation modals, then reopen/resume ticket creation with the created release selected. Keep only one hierarchy-creation modal active at a time during this handoff to avoid stacked modal focus traps.
- Inside the New ticket modal, add external links and related tickets through nested add-link/add-relation modals. These are draft data until ticket submission; do not show separate server-success toasts for draft-only items. Ticket creation gets one **Open ticket** toast.

### Direct editing and lifecycle actions

- Retire `/clients/:id/edit`, `/projects/:id/edit`, and `/releases/:id/edit` with 404s and no compatibility redirects.
- Make the existing editable fields directly editable on each entity detail page and save each field independently on change/blur, with field-level pending/error feedback:
  - Client: name and color.
  - Project: name and color.
  - Release: name and optional target date.
- Preserve current validation, API fields, ownership, and archived-ancestor behavior. Do not add editing of client/project/release parent associations; those are not editable in the existing forms.
- Keep Archive/Restore and archived-only permanent Delete as separate detail-page actions, in the entity header action group. Preserve confirmation and current parent/list navigation after deletion. Preserve or update `?archived=true` route context after archive/restore, including archived ancestors.
- Ticket detail stays a normal editable page. Keep its current title/status/description/estimate/release/priority edits and its title/link/relation modal interaction; add the approved toast feedback without changing ticket editing semantics.

### Success notifications

- Mount/use a consistent Nuxt UI toast convention at the bottom right, reusing the existing `UApp` toaster and adding a small shared helper/composable only if useful. No dependency changes.
- Show success feedback for confirmed writes from:
  - Entity creation and client/project/release field edits, archive/restore/delete.
  - Ticket field/status/priority changes, including a changed description saved on blur.
  - External-link and related-ticket add/remove on existing tickets.
  - Explicit time-entry creation, correction, and deletion; time-entry movement/resizing performed directly by Agenda drag/resize remains quiet.
  - Release completion and Settings saves.
- Link/relation success toasts have no **Open** action. Only entity-creation toasts link to the created entity. Inside New ticket, nested link/relation modals update the local ticket draft only; the ticket POST produces one ticket-created toast with **Open ticket**, not separate link/relation toasts.
- Do not show error toasts for failed writes; retain existing inline accessible errors. If the write succeeds but invalidation/refresh fails, show one partial-success toast and preserve the existing actionable retry UI; never suggest repeating a successful write. Creation partial-success toasts still include the **Open** action.
- Use approximately 5 seconds for non-creation toasts and 10 seconds for creation toasts. No success toasts for reads/search or login/logout.

#### Approved amendment — consistent hierarchy detail presentation (2026-10-14)

Approved via Plannotator session `pn-880e5d`; see [`plans/hierarchy-detail-presentation-consistency.md`](../../plans/hierarchy-detail-presentation-consistency.md).

- Standardize Client/Project/Release/Ticket entity-card padding at 8px through `EntityCard`, including the `/clients` collection; preserve the Ticket Board's explicitly compact 4px padding.
- Extract the repeated client/project/release detail field-grid, feedback ordering, divider, and attached-item section into shared presentation components. Share the Client/Project name-color editor too, while keeping draft state, field mutations, page-specific errors/dialogs, and entity-specific card content in their current page owners.
- Update `AGENTS.md` and `docs/llm-workflow.md` with a sibling-surface audit/shared-presentation rule, document it in ADR 0057, and test visual parity.

#### Approved amendment — Settings modal (2026-10-14)

Approved via Plannotator plan review session `pn-e2e142`; see [`plans/settings-modal-amendment.md`](../../plans/settings-modal-amendment.md).

- Open Settings from the persistent header as a shell-level modal over the current page, without changing its URL or replacing it.
- Preserve the current fields, explicit save, validation, toast, inline-error, refresh-retry, and settings/Agenda invalidation behavior. Load lazily and retain retryable partial-success state in the shell.
- Retire direct `/settings` visits with an authenticated 404; Settings is available only through the shell modal. This route choice was recorded in plan-feedback session `pn-77f1bd`.
- Add browser coverage for modal behavior, unchanged route/context, direct-route 404, saves/retries, and localized weekday options. Record the route/modal policy in ADR 0058 and accept it after code review.

#### Approved amendment — modal actions and keyboard shortcuts (2026-10-14)

Approved via Plannotator session `pn-5c524e`; see [`plans/modal-actions-and-keyboard-shortcuts-amendment.md`](../../plans/modal-actions-and-keyboard-shortcuts-amendment.md).

- Align modal action groups at the right edge, with the primary action farthest right and secondary actions before it.
- Escape dismisses the topmost modal, including ticket creation; preserve outside-click protection and in-flight operation guards. Nested-dialog Escape must not close its parent.
- Command+Enter (Meta+Enter) and Ctrl+Enter submit the active modal form via existing validation. Keep action-only confirmation dialogs button-driven.
- Add E2E coverage for alignment/order, shortcuts, validation, and nested Escape. ADR 0059 records this policy and was accepted after code review.

## Out of scope

- API, server contract, database/schema, auth, ownership, validation-rule, dependency, or deployment changes.
- Changing ticket-detail editing behavior, hierarchy ownership associations, entity search/detail route behavior, or existing create-form fields.
- Toasts for failed writes, reads/search, login/logout, and direct drag/resize writes.
- Changing archive/delete policy, ticket status/priority rules, time-entry rules, or same-tab invalidation semantics.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- Approved M44 amendment: [`plans/hierarchy-detail-presentation-consistency.md`](../../plans/hierarchy-detail-presentation-consistency.md), approved via `pn-880e5d`.
- Approved Settings-modal amendment: [`plans/settings-modal-amendment.md`](../../plans/settings-modal-amendment.md), approved via `pn-e2e142`.
- Approved modal-actions/keyboard amendment: [`plans/modal-actions-and-keyboard-shortcuts-amendment.md`](../../plans/modal-actions-and-keyboard-shortcuts-amendment.md), approved via `pn-5c524e`.
- [`plans/entity-modals-and-action-toasts.md`](../../plans/entity-modals-and-action-toasts.md) — discussion facts and Plannotator decisions
- ADR 0024 — `docs/decisions/0024-effect-aware-client-fetch-boundary.md`
- ADR 0040 — `docs/decisions/0040-ticket-detail-inline-editing.md`
- ADR 0050 — `docs/decisions/0050-e2e-verification-and-server-handoff.md`
- ADR 0051 — `docs/decisions/0051-same-tab-api-data-invalidation.md`
- ADR 0057 — `docs/decisions/0057-sibling-ui-consistency-and-shared-presentation.md`
- ADR 0058 — `docs/decisions/0058-settings-in-shell-modal.md`
- ADR 0059 — `docs/decisions/0059-modal-action-placement-and-keyboard-shortcuts.md` (Accepted)
- M25 — `docs/milestones/m25-ticket-detail-overhaul.md`
- M38 — `docs/milestones/m38-same-tab-api-data-invalidation.md`
- Plannotator discussion sessions `pn-f8b317`, `pn-34ffc3`, `pn-a29a9d`, `pn-f62ec7`, `pn-a31786`, and `pn-d33675`

## Approach

1. **Shared toast convention:** reuse `UApp`'s app-level toaster and add a minimal typed helper for action-specific success/partial-success notifications. Keep failure and retry presentation in the existing page/modal feedback paths. Creation toasts accept an entity label and detail route; link/relation toasts do not expose a navigation action.
2. **Create modal ownership:** replace route links with page-owned create modal state and preserve each form's existing data dependencies. Reuse focused form components where they prevent duplication without moving page-owned navigation/invalidation into a new global state layer. The client → project → release → ticket flow retains the ticket draft and opens one modal at a time.
3. **Direct hierarchy editing:** move client/project/release fields from their standalone edit pages into the matching detail pages. Save changed fields independently on change/blur through existing PATCH APIs, use per-field pending/error state, and apply targeted invalidation after successful writes. Present archive/restore and archived-only delete as separate actions in the entity header action group.
4. **Mutation feedback:** integrate toast outcomes with existing Effect result and invalidation paths. Show normal success only after successful write and refresh; show partial-success toast plus the existing retry affordance after write-success/refresh-failure. Keep failed writes inline. Do not toast direct drag/resize writes; do toast a changed ticket description after its blur-triggered PATCH succeeds.
5. **Tests and durable records:** update route/form E2E tests to exercise page actions rather than direct create/edit form URLs; cover nested add-item modals, hierarchical prerequisite creation/resume, toast text/actions/lifetimes, field failures and retries, and navigation. Update `PLAN.md`; draft/index ADR 0056 for entity detail editing and action-toast policy, leaving it Proposed until code review.

## Files to modify

- Create launchers and modals: `app/pages/clients/index.vue`, `app/pages/clients/[id]/index.vue`, `app/pages/projects/[id]/index.vue`, `app/pages/releases/[id]/index.vue`, `app/pages/tickets/index.vue`, `app/pages/agenda.vue`.
- Direct editing/lifecycle: `app/pages/clients/[id]/index.vue`, `app/pages/projects/[id]/index.vue`, `app/pages/releases/[id]/index.vue`.
- Retired route files: `app/pages/clients/new.vue`, `app/pages/projects/new.vue`, `app/pages/releases/new.vue`, `app/pages/tickets/new.vue`, and client/project/release `[id]/edit.vue`.
- Ticket edits and existing-ticket link/relation mutations: `app/pages/tickets/[id]/index.vue`.
- Toast coverage: `app/pages/agenda.vue`, `app/pages/tickets/index.vue`, `app/pages/releases/[id]/index.vue`, `app/pages/settings.vue`, `app/components/TicketTimeEntries.vue`, plus the other entity/detail write owners.
- Shared notification/form components as warranted: `app/app.vue`, a small `app/composables/useAppToast.ts` or utility, and focused modal form components under `app/components/`.
- Tests: existing E2E coverage in `tests/e2e/auth-shell.test.ts`, `hierarchy-breadcrumbs.test.ts`, `tickets.test.ts`, `ticket-detail-overhaul.test.ts`, `data-invalidation.test.ts`, Agenda/time-entry/status/priority suites; add focused M44 coverage if existing files become too broad. Assert that the Agenda empty-ticket state has no create action and Ticket Board/Release detail still launch ticket creation.
- Durable planning: `PLAN.md`, new `docs/decisions/0056-entity-editing-and-action-toasts.md`, `docs/decisions/README.md`, this milestone journal, and the discussion record under `plans/`.

No API/server/schema/migration files or dependencies are expected to change.

## Reuse

- Existing create/edit form fields and validation from the current page routes.
- Existing `UModal` patterns in `app/pages/agenda.vue`, `app/pages/releases/[id]/index.vue`, and `app/pages/tickets/[id]/index.vue`.
- `UApp`/`useToast()` from installed Nuxt UI; no additional package is needed.
- Ticket detail's `mutateTicket` outcomes and field-scoped PATCH behavior as the model for client/project/release field saves.
- `runClientRequest`, `patchTicket`, `useAppDataInvalidation`, and current Effect failure mappings.
- Existing archived-context path logic from entity edit routes/detail pages and same-tab invalidation resource maps.

## Decisions and ADR links

- Human instructions and Plannotator feedback are recorded in the discussion plan. This milestone proposes local creation modals with no standalone URLs, direct client/project/release detail editing, and explicit mutation toasts.
- Ticket detail remains governed by ADR 0040; this milestone adds notifications without replacing its direct-edit or link/relation modal policies.
- ADRs 0024 and 0051 remain authoritative for request failures, partial success, and targeted invalidation. ADR 0050 and `docs/llm-workflow.md` govern complete local verification and server ownership/handoff.
- [ADR 0056](../decisions/0056-entity-modal-creation-inline-editing-and-action-toasts.md) records the cross-entity edit and notification policy. It was accepted after Plannotator code review session `pn-28ffa7`; existing accepted ADRs were not rewritten.
- [ADR 0057](../decisions/0057-sibling-ui-consistency-and-shared-presentation.md) is Accepted after Plannotator code review session `pn-a396bd`; it records the new sibling-surface audit/shared-presentation workflow rule.
- [ADR 0058](../decisions/0058-settings-in-shell-modal.md) is Accepted; it records the approved Settings modal entry and `/settings` route policy.
- [ADR 0059](../decisions/0059-modal-action-placement-and-keyboard-shortcuts.md) is Accepted; it records the approved modal action placement and form shortcut policy.
- The user's answers in sessions `pn-f8b317`, `pn-34ffc3`, `pn-a29a9d`, `pn-f62ec7`, `pn-a31786`, and `pn-d33675` are the current planning decisions. This formal plan was approved via `pn-4d4d72` before implementation.

## Decisions confirmed during plan review

- Place Archive/Restore and archived-only permanent Delete in the existing entity-detail header action group.
- Adding a link or relation to an unsaved ticket draft produces no separate toast; after the ticket POST succeeds, show one **Ticket created** toast with **Open ticket**. Existing-ticket link/relation API changes each get a success toast with no **Open** action.
- Remove the Agenda Add completed work modal's **Create a ticket** action when no active tickets are available. Keep ticket creation available from Ticket Board and Release detail.

## Implementation checklist

- [x] Obtain explicit Plannotator approval of this M44 plan before changing application code (`pn-4d4d72`, 2026-10-13).
- [x] Add a shared bottom-right success/partial-success toast convention with correct **Open** actions and durations.
- [x] Convert all retained client/project/release/ticket creation entry points to local modals and retire all four standalone create routes with 404s.
- [x] Preserve preselected-but-changeable hierarchy context and prevent automatic navigation after creation.
- [x] Implement the client → project → release prerequisite modal chain from ticket creation, preserving the ticket draft and selecting each created parent.
- [x] Remove the Agenda Add completed work modal's **Create a ticket** action for the no-active-ticket state; retain a non-actionable empty-state message and verify Ticket Board/Release detail ticket creation remains available.
- [x] Use nested add-link/add-relation modals in New ticket; preserve existing ticket-detail add modals. Show no **Open** action on link/relation toasts.
- [x] Make client name/color, project name/color, and release name/target date directly editable with field-scoped saves and field-level pending/error feedback.
- [x] Move Archive/Restore and archived-only permanent Delete to separate detail actions; retire the three edit routes with 404s and preserve archived hierarchy context and delete destinations.
- [x] Add success toasts for all approved mutation groups; toast ticket description blur-autosaves, but keep direct Agenda drag/resize writes quiet.
- [x] Preserve existing inline failed-write errors and retry behavior; add partial-success toasts for write-success/refresh-failure without duplicate-write prompts.
- [x] Add focused unit/browser coverage for route 404s, every creation launcher, no redirect, creation actions, modal handoff/draft preservation, inline field edits, archive/delete, toast policy, error/retry, and existing workflows.
- [x] Update `PLAN.md`, draft/index ADR 0056 as Proposed, accept it after code review, and record implementation evidence in M44.
- [x] Run every approved local check, including the full Playwright suite, on the final worktree; complete keyboard/accessibility and 1280 CSS px review.
- [x] Submit the original M44 diff for separate human code review and address feedback; Plannotator session `pn-28ffa7` approved with no changes requested.
- [x] Submit the user-requested detail-layout refinement for final code review; Plannotator session `pn-649c81` approved with no changes requested.
- [x] Obtain approval for the consistent hierarchy detail presentation/workflow amendment before implementation (`pn-880e5d`, 2026-10-14).
- [x] Standardize hierarchy entity-card padding through `EntityCard` while preserving compact Ticket Board cards.
- [x] Extract and apply shared hierarchy detail-sections and Client/Project name-color presentation components.
- [x] Update sibling-surface workflow guidance; propose/index ADR 0057 and accept it after code review (`pn-a396bd`).
- [x] Add browser coverage for padding and detail layout parity; rerun all approved checks, including full E2E.
- [x] Submit the consistency/workflow amendment for human code review; Plannotator session `pn-a396bd` approved with no changes requested.
- [x] Obtain approval of the Settings-modal amendment before implementation (Plannotator session `pn-e2e142`, 2026-10-14).
- [x] Open Settings from the authenticated shell in an accessible modal while preserving the current route/page.
- [x] Preserve settings loading, validation, save, toast, invalidation, inline errors, and retry behavior; load settings lazily and retain retry state across close/reopen and route navigation.
- [x] Retire direct `/settings` visits with an authenticated 404; test the route and header modal entry points.
- [x] Add modal/context/keyboard/localization/save-retry browser coverage and record evidence.
- [x] Accept ADR 0058 after human code review (`pn-673ff2`).
- [x] Run all approved M44 checks, including full E2E and visual/keyboard review, on the final worktree.
- [x] Submit the Settings-modal amendment for human code review; Plannotator session `pn-673ff2` approved with no changes requested.
- [x] Obtain human approval of the modal-actions/keyboard amendment before implementation (Plannotator session `pn-5c524e`, 2026-10-14).
- [x] Draft/index and accept ADR 0059 after human code review (Plannotator session `pn-ac0aea`).
- [x] Standardize modal action placement and primary-action order.
- [x] Implement active-modal Escape and form-scoped Command/Ctrl+Enter behavior with existing validation and pending guards.
- [x] Add/adjust browser coverage for keyboard behavior, validation, nested modal dismissal, and action alignment.
- [x] Run approved local checks, including full Playwright E2E, and complete visual/keyboard review.
- [x] Submit the modal-actions/keyboard amendment for human code review; Plannotator session `pn-ac0aea` approved with no changes requested, and ADR 0059 was accepted.
- [x] Harden Command/Ctrl+Enter at modal content capture so focused modal chrome cannot close the dialog instead of submitting; suppress the shortcut when no enabled form submitter exists, including action-only confirmations.
- [x] Obtain human code review for the user-reported modal-shortcut follow-up; Plannotator session `pn-c4e6ca` approved with no changes requested.
- [x] Record the human completion declaration and close M44.

## Journal

### 2026-10-13 — Planning research and decisions

- Fact: inspected all current create/edit forms, their launch points and parent query behavior, entity detail pages, ticket detail mutation/modal patterns, Agenda and time-entry writes, Settings writes, `UApp`/`useToast`, targeted invalidation, and the relevant existing tests/docs. The Agenda Add completed work modal includes **Create a ticket** when no active tickets exist; today this link navigates to `/tickets/new`. No application code, roadmap, or ADR has changed.
- Decisions from Plannotator session `pn-f8b317`: local non-deep-linkable modal state; old standalone form routes return 404; every create CTA becomes modal-based; parent preselection stays changeable; one combined milestone.
- Decisions from session `pn-34ffc3`: client/project/release pages are directly editable with no edit modal; description blur-autosave gets a notification; link/relation add/remove get notifications but no **Open** action; create hierarchy through client → project → release modals and resume ticket entry; partial-success toast plus retry UI; no failure toasts; creation duration about 10 seconds and other toast duration about 5 seconds.
- Decisions from session `pn-a29a9d`: client/project/release fields save independently on change/blur with field-level pending/error; Archive/Restore and archived-only Delete are separate detail actions; New ticket uses nested add-link/add-relation modals.
- Decisions from session `pn-f62ec7`: put Archive/Restore and archived-only Delete in the existing detail header action group; do not toast draft-only link/relation additions separately—show one **Ticket created** toast with **Open ticket** after the POST. Existing-ticket link/relation API changes each get a toast without an **Open** action.
- Plan interpretation: draft-only link/relation additions inside New ticket do not call the server individually. Their server confirmation is the single Ticket-created toast after the parent POST.
- Facts: current mutation/read ownership is Effect-aware and Nuxt async-data-based; app-level UApp toaster is already mounted. No schema/API/dependency change is expected.
- Feedback from session `pn-a31786` asked whether ticket creation can be started during time-entry creation. Fact: the current Agenda modal provides a **Create a ticket** link, but it navigates away to the standalone form.
- Decision from session `pn-d33675`: remove the Agenda's no-active-ticket **Create a ticket** action; there is no need to resume that time-entry flow. Keep ticket creation available on Ticket Board and Release detail.
- M44 plan approved by the human via Plannotator session `pn-4d4d72` on 2026-10-13. No application-code implementation had started at plan approval.

### 2026-10-13 — Implementation underway

- Replaced the four standalone create-page implementations with local modal form components and 404 route stubs. Added the client → project → release prerequisite flow within the New ticket modal; the ticket form remains mounted while the hierarchy forms are exchanged.
- Added independent client/project/release detail field saves, archive/restore/delete actions, and the approved success/partial-success toast convention. Updated existing ticket, Agenda/time-entry, Release completion, and Settings write paths without changing server contracts.
- Updated browser tests and helpers for the modal routes and toast behavior. The retired-route assertions are in `tests/e2e/hierarchy-breadcrumbs.test.ts`; added Agenda's no-active-ticket empty-state test in `tests/e2e/entity-modals-and-toasts.test.ts`.
- Added Proposed ADR 0056 and an in-progress M44 roadmap entry. Full final verification, browser review, and manual keyboard/visual checks remain outstanding at this journal entry.

### 2026-10-13 — Verification and code review complete; declaration pending

- Fact: the final non-browser check sequence passed on the final application/test worktree: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm check:duplicates`, `pnpm check:unused`, `pnpm test`, `pnpm build`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and `git diff --check`.
- Outcomes: all 16 unit-test files and 79 tests passed. Lint retained two existing `consistent-function-scoping` warnings in `tests/e2e/ticket-context-popovers.test.ts`; the duplicate check reported 98 repository-baseline matches and no new clones under its configured threshold. Production build completed; plugin timing diagnostics were non-blocking.
- Fact: the final browser run used `PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 pnpm test:e2e --workers=1 --retries=0` and passed all 52 tests in 2.4 minutes. It targeted the agent-owned Nuxt server at port 3001 and isolated Postgres at port 55432. No retries or timeout increases were used.
- Verification correction: an earlier full run found an E2E assertion expecting a second success toast after retrying a refresh. The product correctly reports the refresh completion in inline `role=status`; the assertion was corrected to match that behavior. Tests that launch interactions immediately after `page.goto` now wait for client mount. The final complete run passed.
- Manual review: at 1280×900, checked client/project/release detail pages, client and ticket creation modals, and a creation success toast. The modals fit the viewport, controls and **Open** action are legible, the toast is bottom-right, and no page-level horizontal overflow was visible. Keyboard checks verified Name-field focus and Escape/Cancel behavior for the client modal, focus containment and Escape non-dismissal for the ticket modal, and successful cancellation. Durable coverage is in `tests/e2e/entity-modals-and-toasts.test.ts` and `tests/e2e/auth-shell.test.ts`. Temporary screenshots were captured and inspected at `/tmp/m44-client-create-1280.png`, `/tmp/m44-ticket-create-1280.png`, `/tmp/m44-client-detail-1280.png`, `/tmp/m44-project-detail-1280.png`, `/tmp/m44-release-detail-1280.png`, and `/tmp/m44-toast-1280.png`; they are not repository artifacts.
- Server handoff: after all checks passed, stopped only the agent-owned Nuxt server and verified that port 3001 was released. The isolated Postgres container remains running on port 55432 because ignored `.env.development.local` points to it. No user-owned server was stopped.
- Review fact: Plannotator session `pn-28ffa7` approved the complete diff with no changes requested. ADR 0056 is Accepted; the human completion declaration remains pending.

### 2026-10-13 — Detail-page spacing follow-up

- User-requested refinement: add a divider between each detail editor and its attached items, make color and name controls match in size where applicable, and increase attached-item card padding to 8px.
- Added semantic horizontal rules before the associated project, release, and ticket sections. The full-width color trigger now matches the 32px name input; `ProjectCard` accepts a per-use padding option so only the client-detail project cards expand. Release and ticket cards on their respective detail pages use the existing standard 8px padding.
- Added browser assertions in `tests/e2e/auth-shell.test.ts` for equal field dimensions, separators, and 8px padding on all three detail pages; updated `tests/e2e/hierarchy-card-metrics.test.ts` to expect the requested standard padding while leaving collection and Ticket Board cards compact.
- Measurement correction: the first browser assertion showed the default color button was 36px tall versus the 32px text input. Set the full-width trigger to `h-8`; the focused and full browser runs now verify matching dimensions.
- Visual check: reviewed 1280×900 screenshots at `/tmp/m44-client-detail-refined-1280.png`, `/tmp/m44-project-detail-refined-1280.png`, and `/tmp/m44-release-detail-refined-1280.png`. Dividers and increased card insets are visible, labels/controls align, and the three pages fit the viewport.
- Environment correction: initial E2E attempts against an agent server started without sourcing ignored `.env.development.local` returned unauthenticated `null` sessions/401 responses. Relaunched the agent-owned server with the local development environment sourced; no application auth or data code changed for this issue.
- Focused checks passed: `PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002 pnpm test:e2e tests/e2e/auth-shell.test.ts --workers=1 --retries=0` (4 tests) and the equivalent command for `tests/e2e/hierarchy-card-metrics.test.ts` (1 test). The first full-browser run then caught the old `p-1` assertion; after updating it to `p-2`, the final full run passed all 52 tests with `--workers=1 --retries=0`. No retries or timeout increases were used.
- Review fact: the first detail-layout refinement was approved with no changes requested in Plannotator session `pn-649c81`. M44 remains open pending the human completion declaration.

### 2026-10-14 — Consistency/workflow amendment implemented and verified

- Decision: the human approved the amendment via Plannotator session `pn-880e5d`. `EntityCard` now defaults to standard 8px padding across hierarchy cards; Ticket Board cards retain explicit compact 4px padding. `HierarchyDetailSections.vue` centralizes the detail field grid, feedback/actions order, divider, and items slot. `HierarchyNameColorDetailSections.vue` reuses that layout and the common Client/Project name-color presentation while keeping drafts, saves, errors, and page behavior in the detail pages.
- Fact: the `/clients` collection Client card now renders at 8px, matching the Project/Release/Ticket cards on related detail pages. Explicit compact `TicketBoardCard` padding remains unchanged. E2E asserts the Clients card class and computed 8px, attached card dimensions/layout parity, and the existing Ticket Board `p-1` compact assertion.
- Decision: added the sibling-surface audit/shared-presentation rule to `AGENTS.md` and `docs/llm-workflow.md`. Added/indexed ADR 0057 as Proposed pending code review.
- Duplicate-check iteration: the first check exposed duplicated Client/Project name-color field markup; the final shared detail presentation removes new clones. Final `pnpm check:duplicates` passes with 98 baseline clones and no new clones.
- Verification fact: non-browser checks passed on the final application worktree: `pnpm format:check`, `pnpm lint`, both typechecks, `pnpm check:duplicates`, `pnpm check:unused`, `pnpm test`, `pnpm build`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and `git diff --check`. Unit tests: 16 files / 79 tests. Lint retains two existing `consistent-function-scoping` warnings; build reports non-blocking plugin timing diagnostics.
- Verification fact: focused `PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002 pnpm test:e2e --workers=1 --retries=0 tests/e2e/hierarchy-card-metrics.test.ts tests/e2e/auth-shell.test.ts tests/e2e/ticket-status-moves.test.ts` passed all 6 tests (25.4s).
- Verification fact: full `PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002 pnpm test:e2e --workers=1 --retries=0` passed all 52 tests (2.4m), without retries or timeout increases.
- Environment correction: initial focused runs against agent-owned servers started without explicitly sourcing ignored `.env.development.local` failed with 401/auth errors. Starting the verification server with `loadEnv('development')` on port 3002 used the configured isolated database/auth secret; the focused and full suites then passed. No application auth/data code changed for this setup issue.
- Manual review: at 1280×900, visually inspected `/clients`, client detail, project detail, and release detail. 8px client/attached-card insets align, field widths and dividers remain consistent, and no page-level horizontal overflow is visible. Temporary screenshots: `/tmp/m44-clients-consistency-1280.png`, `/tmp/m44-client-detail-consistency-1280.png`, `/tmp/m44-project-detail-consistency-1280.png`, `/tmp/m44-release-detail-consistency-1280.png`.
- Server handoff: after all checks passed, stopped only the agent-owned Nuxt processes on ports 3000, 3002, and 3003 and verified ports 3000–3003 were released. The isolated Postgres container `btt-m44-postgres-20261013-pi` remains running on port 55432 for ignored `.env.development.local`; no user-owned server was stopped.
- Review fact: Plannotator session `pn-a396bd` approved the amended worktree on 2026-10-14 with no changes requested; ADR 0057 is Accepted.
- M44 remains open pending the human completion declaration.

### 2026-10-14 — Modal actions and keyboard shortcuts plan approved

- Research fact: Carbon's web modal guidelines place the secondary action on the left and the primary on the right; Apple HIG places the default action on the trailing side. Platform conventions vary, so the approved web-app convention is right-aligned action groups with the primary farthest right.
- Decision: the human approved form-scoped Command+Enter/Ctrl+Enter and topmost-modal Escape behavior via Plannotator session `pn-5c524e`. Action-only confirmations remain button-driven; outside-click behavior and pending-operation dismissal guards are preserved.
- ADR 0059 was drafted and indexed as Proposed, then accepted after Plannotator code review session `pn-ac0aea` approved the worktree with no changes requested. The M44 completion declaration remains pending.

### 2026-10-14 — Modal actions and keyboard shortcuts implemented and verified

- Implementation fact: modal action groups are right-aligned, with secondary actions before the primary action. The Agenda correction group is ordered Delete, Cancel, Save correction; Settings Save/Retry and Agenda Add/Correct actions now follow the same trailing-edge convention. Existing already-correct groups remain unchanged.
- Implementation fact: modal forms use a shared capture-phase Command+Enter/Ctrl+Enter handler. It finds an enabled submitter and calls native `requestSubmit`, preserving required-field validation and existing `@submit` logic. The capture handler prevents and stops the shortcut so a focused select cannot also open/handle the same keystroke. Submit buttons expose the shortcut with `aria-keyshortcuts`.
- Implementation fact: Ticket creation is dismissible by Escape while idle and remains protected from outside-pointer dismissal. Ticket creation and prerequisite forms report pending state to the modal owner, preserving the in-flight Escape guard; nested link/relation modals remain on top and close first.
- Test fact: focused E2E coverage verifies invalid/valid client shortcut submission, both Meta and Control variants, Settings and Agenda modal submissions, nested-modal Escape, pending ticket-submit dismissal guard, outer ticket-modal outside-click protection and Escape, action-only confirmation remaining button-driven, and 1280px action ordering/alignment. Settings' failed-refresh Retry alignment is asserted against the alert edge.
- Verification correction: the first focused Playwright attempt used a manually started Nuxt server without loading ignored `.env.development.local`; authenticated requests returned 401 and login-fixture pages timed out. Kept the agent-owned server available for diagnosis, stopped only that known server, and restarted it with Vite `loadEnv('development')` from a temporary `/tmp` Node loader. No app auth/data change was made for this setup error.
- Test correction: the first correctly configured focused run exposed two issues: geometry tolerance was 2px while actual button/form edges differed by 2.06–3.07 CSS px, and Meta+Enter from a settings selector could open its listbox before the form shortcut ran. The alignment assertion now uses a 4px rendering tolerance; the keyboard listener runs on capture and stops propagation after handling. The focused rerun passed all 18 tests.
- Focused command: `PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002 pnpm test:e2e tests/e2e/entity-modals-and-toasts.test.ts tests/e2e/agenda-week.test.ts tests/e2e/data-invalidation.test.ts tests/e2e/tickets.test.ts tests/e2e/ticket-detail-overhaul.test.ts tests/e2e/auth-shell.test.ts --workers=1 --retries=0` — all 18 tests passed in 1.3 minutes; no retries or timeout increases. Focused follow-up for the Settings refresh-error retry alignment passed (1 test); the 1280×900 viewport check for the client, Agenda and Settings modal tests passed (3 tests).
- Manual visual/keyboard review at 1280×900: temporary screenshots `/tmp/m44-modal-actions-client-1280.png`, `/tmp/m44-modal-actions-settings-1280.png`, `/tmp/m44-modal-actions-agenda-add-1280.png`, and `/tmp/m44-modal-actions-agenda-correction-1280.png` show clear, unclipped dialogs and right-aligned footers; primary actions are farthest right, with Delete first in the correction modal. Settings fits vertically. E2E keyboard coverage exercises Escape and Meta/Ctrl+Enter through the forms' validation and submit paths; no timeout increases were used.
- Final verification: `pnpm format:check`, `pnpm lint`, `pnpm check:duplicates`, `pnpm check:unused`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, `pnpm build`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and `git diff --check` all passed. Unit tests: 16 files / 79 tests. Lint reports the same two pre-existing `consistent-function-scoping` warnings; duplicate checking found 96 clones against the 98-clone baseline and no new clones; build reported non-blocking plugin timing diagnostics.
- Final full E2E command: `PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002 pnpm test:e2e --workers=1 --retries=0` — all 52 tests passed in 3.1 minutes, no retries or timeout increases. At 1280×900, visually reviewed Client, Settings, Agenda Add, and Agenda Correct modal screenshots listed above. Final keyboard coverage verified Escape and Meta/Ctrl+Enter behavior, validation, nested modal closure, and pending-operation guards.
- Handoff: after all checks passed, stopped only agent-owned Nuxt PID 26089 and verified ports 3000–3003 are released. Preserved the isolated Postgres container `btt-m44-postgres-20261013-pi` on port 55432.
- Review fact: Plannotator session `pn-ac0aea` approved the worktree on 2026-10-14 with no changes requested; ADR 0059 is Accepted. The M44 completion declaration remains pending.

### 2026-10-14 — Settings-modal amendment implemented and verified

- Approval facts: the human approved `plans/settings-modal-amendment.md` through Plannotator session `pn-e2e142`; route-feedback session `pn-77f1bd` selected an authenticated 404 for direct `/settings` visits. ADR 0058 was Accepted after code review.
- Implementation fact: the authenticated dashboard header opens a lazily mounted Settings modal without changing the URL or replacing the current page. The modal retains the existing four preferences, explicit save, validation, invalidation, toast, inline errors, and refresh retry behavior. Its shell ownership preserves retry state when dismissed, reopened, or carried across authenticated route navigation.
- Route fact: direct authenticated `/settings` visits return 404; browser coverage confirms the modal is reachable from the shell and the underlying route remains unchanged.
- Test correction: the first focused browser run found that a dialog-scoped locator could not reach the portaled weekday option, and an accessible-region toast query could not find a toast outside the active modal. The test now locates the option at page scope and checks the rendered toast; inline status/errors remain inside the dialog. No timeout was increased. The focused Settings-related suite passed all 20 tests, and the partial-success retry test passed after adding close/reopen/navigation coverage.
- Visual/keyboard review: at 1280×900, inspected `/tickets` with Settings open in `/tmp/m44-settings-modal-1280.png`. The dialog is centered, all controls fit, keyboard focus enters the dialog, Escape closes it and restores focus to the Settings trigger, and the current page/URL remain intact.
- Final verification rerun after the M44 evidence and roadmap updates: `PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002 pnpm test:e2e --workers=1 --retries=0` passed all 52 tests in 2.4 minutes. No retries or timeout increases were used.
- Server handoff: after all local checks passed, stopped only the agent-owned Nuxt server on port 3002 and verified ports 3000–3003 were released. Preserved isolated Postgres container `btt-m44-postgres-20261013-pi` on port 55432 for `.env.development.local`; no user-owned server was stopped.
- Code review: Plannotator session `pn-673ff2` approved the full worktree with no changes requested; ADR 0058 is Accepted.
- M44 remains open pending the human completion declaration.

### User-reported modal-shortcut follow-up

- User report: Command+Enter in the Agenda time-entry modal could close the dialog without saving when focus was on modal chrome. The modal-content capture handler now owns the shortcut; it prevents native button activation and submits the visible modal form through its enabled submit button and existing `requestSubmit` path. If no enabled submitter exists—or the dialog has no form, as with the release-completion confirmation—the shortcut is suppressed without closing or confirming.
- Regression coverage: `tests/e2e/agenda-week.test.ts` presses Meta+Enter from the Add dialog close button both with Save disabled and after completing the form; the disabled form remains open, while the valid case confirms successful POST. The correction case confirms successful PATCH from the close button. `tests/e2e/auth-shell.test.ts` focuses the action-only release confirmation's primary button and verifies Meta+Enter does not activate it.
- Test correction: the first focused run expected the ticket search to retain focus after deliberately moving focus to the close button; the test now asserts initial focus before that interaction and restores the search focus before ticket selection. The rerun passed.
- Focused browser verification: the regression plus auth-shell and Settings tests passed (3 tests); the seven-file shortcut/M44 suite passed all 23 tests.
- Final full E2E: `PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002 pnpm test:e2e --workers=1 --retries=0` passed all 52 tests in 2.4 minutes, with no retries or timeout increases.
- Final non-browser verification: formatting, both typechecks, lint, duplicate/unused checks, unit tests (16 files / 79 tests), production build, workflow/docs checks, `git diff --check`, and untracked-file whitespace check passed. Lint retained the two pre-existing `consistent-function-scoping` warnings; duplicate checking found 96 clones with no new clones; build timing diagnostics were non-blocking.
- The initial development server had a Vite dependency-resolution error; it was replaced with the agent-owned Nuxt server started using the existing temporary development-env loader on port 3002. That server served the focused and full suites. No visual layout changed in this keyboard-only follow-up; modal viewport/action-layout assertions and the existing 1280×900 review remain applicable.
- Handoff: after all checks passed, stopped only agent-owned Nuxt PID 34141 and verified port 3002 was released; preserved the isolated database tunnel on port 55432.
- Review fact: Plannotator session `pn-c4e6ca` approved this follow-up with no changes requested.

### Human completion declaration

- Declaration: The human declared M44 complete in this conversation after the approved implementation and follow-up were verified and code-reviewed.
- Closeout: All approved scope, amendments, verification evidence, and review outcomes are recorded above. ADRs 0056–0059 are Accepted.

## Verification

Planning-artifact checks before Plannotator plan approval (2026-10-13):

- [x] `pnpm exec oxfmt --check docs/milestones/m44-entity-modals-inline-editing-and-action-toasts.md plans/entity-modals-and-action-toasts.md` — passed.
- [x] `node scripts/check-workflow-docs.mjs` — passed (“Workflow documentation structure looks complete.”).
- [x] `git diff --no-index --check /dev/null <each planning artifact>` — no whitespace diagnostics.
- [x] Plannotator approved the final M44 scope in session `pn-4d4d72`.

Implementation verification on the final application/test worktree (2026-10-13):

- [x] `pnpm format:check` — passed.
- [x] `pnpm lint` — passed; emitted the two pre-existing `consistent-function-scoping` warnings in `tests/e2e/ticket-context-popovers.test.ts` (`bounds` and `aligned`).
- [x] `pnpm typecheck` and `pnpm typecheck:tsgo` — passed.
- [x] `pnpm check:duplicates` — passed with the configured zero-new-clones threshold; reported 98 clone matches against the repository baseline.
- [x] `pnpm check:unused` — passed.
- [x] `pnpm test` — 16 files and 79 tests passed.
- [x] `pnpm build` — production client, server, and Nitro build completed. The build reported non-blocking plugin timing diagnostics.
- [x] `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and `git diff --check` — passed.
- [x] Focused Playwright coverage — creation/open actions, modal hierarchy draft preservation, retired routes, field/lifecycle edits, failure/retry feedback, and Agenda's no-active-ticket empty state passed.
- [x] Full `PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 pnpm test:e2e --workers=1 --retries=0` — all 52 tests passed against the agent-owned Nuxt server on port 3001 and isolated Postgres on port 55432. The first full run exposed an assertion expecting a toast for a refresh retry that correctly reports inline status; the assertion was corrected and the final full run passed. No retries or timeout increases were used.
- [x] Keyboard/focus/cancel and supported-width review — at 1280×900, the client modal focused its Name field, Escape and Cancel closed it, the ticket modal trapped focus and ignored Escape, and its Cancel action closed it. Document width stayed within the viewport. Inspected 1280×900 screenshots of client/project/release details, client/ticket creation modals, and the success toast; controls fit, no page-level overflow was visible, and the toast/action were readable at bottom-right. Temporary screenshots were captured under `/tmp/m44-*-1280.png` and were not added to the repository.
- [x] After the original M44 checks passed, stopped the original agent-owned app server and verified port 3001 was released. The agent-owned Postgres container remains running on port 55432 because ignored `.env.development.local` points to it. No user-owned server was stopped.
- [x] Follow-up detail-layout checks: `pnpm format:check`, `pnpm lint`, both typechecks, duplicate/unused checks, and `pnpm test` passed; lint retained the two existing warnings and duplicate check reported 98 baseline clones. The production build passed with non-blocking plugin timing diagnostics.
- [x] Follow-up full `PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002 pnpm test:e2e --workers=1 --retries=0` — all 52 tests passed against the agent-owned server on port 3002 and isolated Postgres on port 55432. No retries or timeout increases were used. The first full follow-up run found a stale compact-padding expectation; it was updated to standard 8px padding and the full suite passed on rerun.
- [x] Follow-up 1280×900 visual check: reviewed screenshots of client/project/release detail pages; the separator placement, aligned 32px name/color controls, and 8px attached-card padding are visible and fit the viewport. Screenshots are temporary `/tmp` files, not repository artifacts.
- [x] Follow-up server handoff: stopped the agent-owned Nuxt servers on ports 3000, 3001, and 3002 after all checks passed and verified all three ports were released. The isolated Postgres container remains running on port 55432 for ignored `.env.development.local`; no user-owned server was stopped.

### Consistency/workflow amendment verification (2026-10-14)

- [x] `pnpm format:check` — passed across 353 files.
- [x] `pnpm lint` — passed with the two pre-existing `consistent-function-scoping` warnings in `tests/e2e/ticket-context-popovers.test.ts`.
- [x] `pnpm typecheck` and `pnpm typecheck:tsgo` — passed.
- [x] `pnpm check:duplicates` — passed at the zero-new-clones threshold; 98 baseline clone matches, no new clones.
- [x] `pnpm check:unused` — passed.
- [x] `pnpm test` — 16 files / 79 tests passed.
- [x] `pnpm build` — passed; plugin timing diagnostics were non-blocking.
- [x] `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and `git diff --check` — passed.
- [x] Focused `PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002 pnpm test:e2e --workers=1 --retries=0 tests/e2e/hierarchy-card-metrics.test.ts tests/e2e/auth-shell.test.ts tests/e2e/ticket-status-moves.test.ts` — all 6 tests passed.
- [x] Full `PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002 pnpm test:e2e --workers=1 --retries=0` — all 52 tests passed in 2.4 minutes; no retries or timeout increases.
- [x] 1280×900 visual review of `/clients`, client detail, project detail, and release detail — 8px card insets, aligned shared fields, and divider placement are consistent; no horizontal overflow observed. Screenshots are temporary `/tmp/m44-*-consistency-1280.png` files.
- [x] After all checks passed, stopped only agent-owned app servers and verified ports 3000–3003 were released; preserved the isolated Postgres container on port 55432 required by `.env.development.local`.

### Settings-modal amendment verification (2026-10-14)

- [x] `pnpm format:check` — passed across 357 files.
- [x] `pnpm lint` — passed with two pre-existing `consistent-function-scoping` warnings in `tests/e2e/ticket-context-popovers.test.ts` (`bounds` and `aligned`).
- [x] `pnpm typecheck` and `pnpm typecheck:tsgo` — passed.
- [x] `pnpm check:duplicates` and `pnpm check:unused` — passed; 98 clone matches against the repository baseline and no new clones.
- [x] `pnpm test` — 16 files / 79 tests passed.
- [x] `pnpm build` — passed; plugin timing diagnostics were non-blocking.
- [x] `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, `git diff --check`, and whitespace checks for new files — passed.
- [x] Focused Playwright coverage across auth shell, search, data invalidation, client-effect failures, and Agenda week — 20 tests passed; the partial-success retry test also passed after adding close/reopen and cross-route retention assertions.
- [x] Full `PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002 pnpm test:e2e --workers=1 --retries=0` — all 52 tests passed in 2.4 minutes against the agent-owned app server and isolated Postgres on port 55432; no retries or timeout increases.
- [x] 1280×900 visual/keyboard review — inspected `/tmp/m44-settings-modal-1280.png`; controls fit, focus entry/Escape/focus restoration passed, and the current route remains unchanged.
- [x] After all local checks passed and before review handoff, stopped only the agent-owned Nuxt server on port 3002 and verified ports 3000–3003 were released. Preserved the isolated Postgres container for `.env.development.local`.

No database migration is planned. Any newly discovered API/schema/dependency requirement is outside scope and needs explicit approval before implementation.

## Review status

- Plan review: Approved via Plannotator session `pn-4d4d72` on 2026-10-13; feedback from `pn-f62ec7` and `pn-d33675` is incorporated.
- Original M44 code review: Accepted via Plannotator session `pn-28ffa7` on 2026-10-13; no changes requested.
- Follow-up detail-layout code review: Accepted via Plannotator session `pn-649c81` on 2026-10-13; no changes requested.
- Consistency/workflow amendment code review: Accepted via Plannotator session `pn-a396bd` on 2026-10-14; no changes requested.
- Settings-modal plan review: Approved via Plannotator session `pn-e2e142` on 2026-10-14.
- Settings-modal amendment code review: Accepted via Plannotator session `pn-673ff2` on 2026-10-14 with no changes requested; ADR 0058 is Accepted.
- Modal-actions/keyboard amendment code review: Approved via Plannotator session `pn-ac0aea` on 2026-10-14 with no changes requested; ADR 0059 is Accepted.
- User-reported modal-shortcut follow-up code review: Approved via Plannotator session `pn-c4e6ca`, with no changes requested.
- Milestone completion declaration: Declared complete by the human and recorded in the journal.

## Follow-ups

- None approved. Any scope expansion, especially API/schema/auth/dependency changes, requires a separate human-approved plan.

## Closeout checklist

- [x] Approved implementation scope is complete and code-reviewed; the human completion declaration is recorded.
- [x] Verification evidence for all approved amendments recorded.
- [x] Original M44 code review accepted via Plannotator session `pn-28ffa7`.
- [x] Follow-up detail-layout code review accepted via Plannotator session `pn-649c81`.
- [x] Consistency/workflow amendment code review accepted via Plannotator session `pn-a396bd`.
- [x] Settings-modal amendment code review accepted via Plannotator session `pn-673ff2`.
- [x] Human completion declaration recorded in the journal and review status.
