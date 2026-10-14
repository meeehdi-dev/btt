# M44 amendment plan — modal actions and keyboard shortcuts

> **Status: Approved via Plannotator session `pn-5c524e` and code-reviewed with no changes requested via session `pn-ac0aea` on 2026-10-14; ADR 0059 is Accepted.** M44 remains open pending the human completion declaration.

## Context

The Settings-modal amendment and earlier M44 work are implemented, verified, and code-reviewed, but M44 remains open pending the human completion declaration. The user now requests consistent primary-action placement across modals and keyboard shortcuts to close and submit the current modal.

Observed in the current worktree:

- `app/components/SettingsModal.vue` places Save (and its read-retry button) at the body's left edge.
- The Add completed work and Correct time entry forms in `app/pages/agenda.vue` place their Save and Cancel buttons at the left, with Save first; the correction form also separates Delete to the far right.
- Most hierarchy, ticket-detail, and confirmation modal action groups already align to the right with their primary action last. Shared hierarchy creation forms use `CreateFormFooter.vue`.
- Nuxt UI `UModal` dismisses on Escape by default. `TicketCreateModal.vue` sets `dismissible=false`, so Escape currently does not close that modal; `tests/e2e/entity-modals-and-toasts.test.ts` asserts that behavior.
- Modal form submits already use existing `@submit` handlers and validation. Modal forms include Settings, Agenda add/correction, entity/ticket creation, ticket link/relation, and ticket-title editing. The release-completion confirmation is action-only, not a form.

## Web research and proposed convention

There is no single cross-platform dialog-button rule. For this web application, established design-system guidance supports placing a modal's action group at the trailing edge (right in this LTR UI), with secondary/cancel before the primary action:

- Carbon Design System, [Modal guidelines](https://www.carbondesignsystem.com/building-blocks/core/components/modal/guidelines): for a two-button transactional modal, put the secondary button on the left and primary on the right; a single action is right-aligned.
- Apple Human Interface Guidelines, [Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts): place Cancel on the leading side and the default action on the trailing side.
- Microsoft Windows [Dialog controls](https://learn.microsoft.com/en-us/windows/apps/develop/ui/controls/dialogs-and-flyouts/dialogs) uses a different platform-specific order, confirming that this is not a universal OS convention.

**Proposed decision:** align all modal footer/action groups to the right and put the primary/submit action at the far right. Place secondary/cancel actions before it; when the correction modal also has Delete, keep Delete at the left of the right-aligned group, then Cancel, then Save correction. Leave in-body controls (for example, Add link beside a section heading) in their existing positions.

## Approved scope

1. Apply the proposed right-aligned action convention to all app-owned `UModal` form/action footers. Fix the Settings Save/Retry and Agenda Add/Correct rows; preserve already-correct rows and the primary action's semantic/color treatment.
2. Make Escape dismiss the topmost active modal. A nested modal closes by itself first; its parent stays open. Change Ticket creation's existing Escape behavior as requested while preserving its current outside-click protection. Preserve any existing guard that prevents dismissing a modal during an in-flight operation.
3. Add `Command+Enter` (Meta+Enter) to invoke the active modal form's existing submit/validation path. Also support Ctrl+Enter on non-Mac systems. Only a form with an enabled submit action responds; loading/error states without a form and action-only confirmation modals do not activate a potentially consequential action by shortcut. Invalid forms remain open and show their existing validation feedback.
4. Keep shortcuts scoped to the active modal form. Do not change page-level form shortcuts, APIs, data rules, autosave behavior, or action semantics.
5. Add regression coverage for button alignment/order, Escape including nested modals, and shortcut validation/submission. Update M44/`PLAN.md` evidence and add/index ADR 0059 as Proposed; accept it after code review.

## Out of scope

- Changing modal titles, content, fields, validation rules, confirmation copy, or success/error behavior.
- Making outside clicks dismiss modals that currently suppress outside dismissal.
- Binding Command/Ctrl+Enter to action-only confirmation dialogs or to forms outside a modal.
- Changes to browser-native `confirm()` dialogs, APIs, auth, schema, dependencies, or global keyboard navigation.
- Mobile or viewport-policy changes; supported width remains 1280 CSS px and wider.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- Current open M44 milestone: `docs/milestones/m44-entity-modals-inline-editing-and-action-toasts.md`
- Approved M44 Settings-modal amendment: `plans/settings-modal-amendment.md`
- ADR 0042 — desktop-only UI and keyboard accessibility
- ADR 0050 — full E2E verification and server handoff
- ADR 0056 — M44 modal creation and action feedback
- ADR 0058 — Settings shell modal
- Carbon Design System, [Modal guidelines](https://www.carbondesignsystem.com/building-blocks/core/components/modal/guidelines)
- Apple HIG, [Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts)
- Microsoft Learn, [Dialog controls](https://learn.microsoft.com/en-us/windows/apps/develop/ui/controls/dialogs-and-flyouts/dialogs)
- Nuxt UI's installed `UModal` and Reka UI dialog types/implementation

## Approach

1. Inventory all app-owned modal action rows and form boundaries; reuse `CreateFormFooter.vue` and the existing `UModal`/form event patterns.
2. Add a small shared form-key handler in the capture phase. It submits only when the current modal form has an enabled submit button, using native `requestSubmit` so browser and existing handler validation remain in force. Stop propagation for handled shortcuts so a focused select/input cannot also interpret Command+Enter as its own key command. Bind it only to forms rendered inside modals and expose the shortcut on submit buttons with `aria-keyshortcuts`.
3. Keep Nuxt UI's Escape handling for dismissible dialogs. For `TicketCreateModal`, permit Escape while preventing pointer interaction outside from dismissing the draft modal; verify nested-dialog stack behavior.
4. Right-align the inconsistent Settings and Agenda action rows and order each group with its primary action last. Add coverage that checks geometry at 1280 CSS px and verifies the modal action conventions on representative form and confirmation surfaces.
5. Update focused E2E coverage, then all approved local checks including full Playwright; perform 1280×900 visual and keyboard review. Record evidence in M44 and submit for human code review. M44 remains open until the human completion declaration.

## Files expected to change

- `app/composables/` — shared modal-form submit shortcut helper.
- `app/components/SettingsModal.vue`, `TicketCreateModal.vue`, `TicketCreateForm.vue`, and modal form/footer components as needed.
- `app/pages/agenda.vue` and modal owners in `app/pages/tickets/[id]/index.vue`; other modal owners only if the inventory finds an inconsistent action group.
- `tests/e2e/entity-modals-and-toasts.test.ts`, `agenda-week.test.ts`, `data-invalidation.test.ts`, `tickets.test.ts`, `ticket-detail-overhaul.test.ts`, `auth-shell.test.ts`, and `tests/e2e/helpers/modal-actions.ts`.
- `PLAN.md`, `docs/milestones/m44-entity-modals-inline-editing-and-action-toasts.md`, `docs/decisions/README.md`, and Proposed ADR 0059.

No API/server/schema/migration/dependency changes are expected.

## Reuse

- Existing `UModal` dismiss/Escape and nested dialog behavior from Nuxt UI/Reka UI.
- Existing `@submit.prevent` handlers and form-local validation in entity, ticket, Settings, Agenda, and ticket-detail modal forms.
- Existing `CreateFormFooter.vue` and right-aligned modal action groups.
- Existing 1280 CSS px authenticated E2E fixtures and keyboard/focus coverage in `tests/e2e/entity-modals-and-toasts.test.ts`, `auth-shell.test.ts`, `tickets.test.ts`, and `ticket-detail-overhaul.test.ts`.

## Decisions and ADR links

- User request: standardize modal primary-button placement and add Escape and Command+Enter shortcuts.
- Proposed action convention: right-aligned action groups; primary action at the far right, secondary/cancel before it.
- Proposed shortcut behavior: Escape closes the topmost dismissible modal; Meta+Enter/Ctrl+Enter submits an active modal form through existing validation. It does not trigger action-only confirmations.
- ADR 0059 records the durable modal action/keyboard conventions; it was accepted after human code review via session `pn-ac0aea`.

## Implementation checklist

- [x] Read required project workflow, roadmap, M44 evidence, relevant ADRs, and the approved Settings-modal amendment.
- [x] Research web modal-action guidance and inspect current modal/form implementations.
- [x] Obtain human approval of this amendment before application-code changes (Plannotator session `pn-5c524e`, 2026-10-14).
- [x] Standardize modal action alignment/order with primary actions at the far right.
- [x] Add Escape and Meta+Enter/Ctrl+Enter behavior to the active modal/form without bypassing validation or pending guards.
- [x] Add/adjust focused keyboard, nested-modal, validation, and action-alignment browser coverage.
- [x] Update M44 and `PLAN.md`; draft/index ADR 0059 as Proposed.
- [x] Accept ADR 0059 after human code review via Plannotator session `pn-ac0aea` (no changes requested).
- [x] Run approved non-browser checks, full Playwright E2E, and 1280×900 visual/keyboard review on the final worktree.
- [x] Stop only the agent-owned server after all checks pass, verify its port is released, and submit the worktree for code review.
- [x] Keep M44 open until the human completion declaration.

## Journal

### 2026-10-14 — Request captured and research completed

- User direction: make modal primary-button placement consistent, research an established convention, and add Escape/Command+Enter keyboard shortcuts.
- Fact: Carbon's web modal guidance places secondary left and primary right; Apple HIG places the default action at the trailing edge. Microsoft's Windows guidance differs, so this is a strong web/product convention rather than a universal platform law.
- Proposed convention: right-align modal action groups and place the primary action at the far right, matching Carbon/Apple guidance and the user's fallback.
- Fact: current `UModal` defaults to Escape dismissal, but `TicketCreateModal.vue` explicitly disables dismissal. Existing modal forms use their own submit handlers and validation.
- Decision: the human approved form-scoped Command+Enter/Ctrl+Enter behavior; action-only confirmation modals remain button-driven.
- Approval evidence: Plannotator session `pn-5c524e` approved this amendment on 2026-10-14. Implementation is authorized; no application code had changed before approval.

### 2026-10-14 — Implementation and final verification completed

- Implementation: standardized action alignment/order, added form-scoped Meta/Ctrl+Enter through native `requestSubmit`, enabled idle Escape dismissal for Ticket creation while preserving outside-click and pending-operation guards, and added regression coverage. Settings refresh-retry and release-completion confirmation actions are also covered by geometry assertions; action-only confirmation remains button-driven under Meta+Enter.
- Focused E2E: six target files passed all 18 tests; follow-up passes included the Settings refresh-error retry path (1 test), client/Agenda/Settings at 1280×900 (3 tests), and authenticated-shell Escape/confirmation assertions (4 tests). No retries or timeout increases.
- Manual 1280×900 review: Client create, Settings, Agenda Add, and Agenda Correct screenshots show clear, unclipped dialogs and right-aligned actions; Settings fits vertically. Temporary captures are under `/tmp/m44-modal-actions-*.png` and are not repository artifacts.
- Final full E2E: `PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002 pnpm test:e2e --workers=1 --retries=0` — all 52 tests passed in 3.1 minutes with no retries or timeout increases.
- Final non-browser checks passed: formatting, lint, duplicates, unused, Nuxt and tsgo typechecks, unit tests (79), production build, workflow structure, and `git diff --check`. Lint retains two pre-existing warnings; duplicate checking reports 96 clones against the 98-clone baseline with no new clones; build emits non-blocking plugin timing diagnostics.
- Handoff: after all checks passed, stopped only the agent-owned Nuxt process (PID 26089) and verified ports 3000–3003 are released. Preserved the isolated Postgres tunnel on port 55432.
- Review: Plannotator session `pn-ac0aea` approved the worktree on 2026-10-14 with no changes requested; ADR 0059 is Accepted. M44 remains open pending the human completion declaration.

## Verification

Planning-artifact checks before approval:

- [x] `pnpm exec oxfmt --check plans/modal-actions-and-keyboard-shortcuts-amendment.md` — passed.
- [x] `node scripts/check-workflow-docs.mjs` — passed.
- [x] Whitespace check of the plan — no diagnostics.
- [x] Human approval of this amendment via Plannotator session `pn-5c524e`.

Final implementation checks:

- [x] `pnpm format:check` — all 361 matched files pass.
- [x] `pnpm lint` — passed; two existing `consistent-function-scoping` warnings remain in `tests/e2e/ticket-context-popovers.test.ts`.
- [x] `pnpm check:duplicates` — passed; 96 detected clones against the 98-clone baseline, no new clones.
- [x] `pnpm check:unused` — passed.
- [x] `pnpm typecheck` and `pnpm typecheck:tsgo` — passed.
- [x] `pnpm test` — 16 files / 79 tests passed.
- [x] `pnpm build` — passed; build printed non-blocking plugin timing diagnostics.
- [x] `pnpm check:workflow` and `node scripts/check-workflow-docs.mjs` — passed.
- [x] `git diff --check` — no diagnostics.
- [x] Full Playwright E2E — 52 tests passed with one worker, zero retries, and no timeout increases.
- [x] 1280×900 visual and keyboard review — passed; captures recorded under `/tmp` and not added to the repository.
- [x] Stopped agent-owned Nuxt PID 26089 after all checks; verified ports 3000–3003 are released. Preserved the isolated database tunnel on 55432.
- [x] Human code review and ADR 0059 acceptance — approved in Plannotator session `pn-ac0aea` with no changes requested.

## Review status

- Plan review: Approved via Plannotator session `pn-5c524e` on 2026-10-14.
- Code review: Approved via Plannotator session `pn-ac0aea` on 2026-10-14 with no changes requested; ADR 0059 is Accepted.
- M44 completion declaration: Pending.

## Follow-ups

- None identified; confirmation-only dialogs remain button-driven because they have no form to validate.
