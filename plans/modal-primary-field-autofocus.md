# Modal primary-field autofocus

## Status and authority

Approved by the human in Plannotator `pn-ea7d71`. This is a focused UI follow-up to M44; implementation evidence lives in `docs/milestones/m49-modal-primary-field-autofocus.md`. M44 remains completed and its historical evidence is unchanged.

## Request and observed facts

The user requests immediate title focus on New ticket and equivalent behavior for any create/update item modal.

- `TicketCreateForm.vue`, `ProjectCreateForm.vue`, and `ReleaseCreateForm.vue` lack title/name autofocus; hierarchy selectors precede those fields.
- `ClientCreateForm.vue` and ticket detail's Edit title already use Nuxt UI `autofocus`.
- `TicketCreateModal.vue` preserves its ticket form with `v-show` during prerequisite creation; returning to it does not remount its title input. The hierarchy forms load data asynchronously.
- Nested link/relation forms exist both in ticket creation and ticket detail.
- Agenda Add completed work already opens and focuses Ticket search (M41). Correction has date/time/description fields, not a title.
- Workspace settings retains mounted content between openings. Confirmation dialogs have no editable form and must not gain typing focus.

## Requirements and acceptance criteria

On each open, focus the primary editable control once it is rendered and enabled, without requiring a click:

| Modal                                                           | Initial target                                     |
| --------------------------------------------------------------- | -------------------------------------------------- |
| New ticket (Board and Release detail)                           | Title                                              |
| New client/project/release, including ticket prerequisite steps | Name                                               |
| Edit ticket title                                               | Title (preserve existing behavior)                 |
| Add external link, draft and persisted                          | URL, the required field rather than optional label |
| Link related ticket, draft and persisted                        | Open Ticket picker and focus search                |
| Agenda Add completed work                                       | Existing Ticket search behavior, unchanged         |
| Correct time entry                                              | Start time, ready for keyboard editing             |
| Workspace settings                                              | First editable setting, Visible start              |

- Reopening a modal and returning to the preserved ticket draft focus the relevant primary field. Draft values remain intact.
- Loading/error/prerequisite-only states do not attempt to focus unavailable controls. A form becoming available after loading/retry receives initial focus.
- Async completion in a hidden parent must not steal focus from a nested dialog. Closing a nested dialog retains ordinary focus restoration to its launcher, not a forced title jump.
- Ordinary typing, validation failures, saving, and data refreshes must not repeatedly reset focus.
- Preserve Escape, Command/Ctrl+Enter, focus trapping/restoration, pending guards, and validation.

## Approach and ordered steps

1. Inspect installed Nuxt UI/Reka focus APIs and existing picker-open patterns. Prefer native component autofocus and modal lifecycle hooks; add targeted explicit focus only for retained/async content that requires it. Avoid a global focus manager or new dependencies.
2. Apply the smallest complete changes to shared entity forms and their modal owners, then nested link/relation and correction/settings forms. Audit all `UModal` uses for parity; leave action-only confirmations alone.
3. Add focused Vitest component/unit coverage for any non-trivial lifecycle handling: reopen, delayed form availability, retained ticket-step return, and hidden/nested-parent protection. Cover target parity without introducing browser tooling.
4. Create the M49 milestone record from the repository template, link this plan from the roadmap, and record actual implementation/check evidence. No new ADR is expected for this small focus refinement.
5. Run retained checks on the final worktree and hand off for separate human code review. Human manual application checks stay pending until reported.

## Files and reuse

Expected application files:

- `app/components/{TicketCreateForm,TicketCreateModal,ClientCreateForm,ProjectCreateForm,ReleaseCreateForm,SettingsModal}.vue`
- `app/pages/tickets/[id]/index.vue`, `app/pages/agenda.vue`
- Existing modal owners under `app/pages/clients/` and `app/pages/projects/` only if lifecycle wiring is required.
- Focused tests under `tests/unit/` or `tests/nuxt/`; a small shared focus helper only if repeated lifecycle code actually warrants one.
- `PLAN.md` and `docs/milestones/m49-modal-primary-field-autofocus.md` for routing/evidence.

Reuse Nuxt UI autofocus, existing `useSelectSearchInput`, M41 picker behavior, and `modalFormShortcutContent`; do not change submission handling.

## Non-goals

No modal redesign, new edit modals for inline fields, text auto-selection policy, API/schema/auth/dependency changes, E2E tests, app servers, or Git writes. Do not change destructive confirmation focus defaults.

## Risks and stop conditions

Focus timing must account for modal transitions, asynchronous form mounts, and retained hidden content. If a reliable fix requires replacing modal infrastructure or changing keyboard/submission semantics, stop for approval rather than broadening scope.

## Verification

Automated final-worktree gates: `pnpm format:check`, `pnpm lint`, `pnpm check:duplicates`, `pnpm check:unused`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, `pnpm build`, `pnpm check:workflow`, and `git diff --check`. Inspect test/environment setup before running; use only isolated disposable database resources for database-backed retained tests/migration verification. No migration change is planned. Record exact commands, first failures and results in M49.

Human manual cases (pending): type immediately in every target above; close/reopen; exercise prerequisite creation and Back with a retained draft; open nested link/relation dialogs and close them; retry failed loading; confirm keyboard submit/Escape and focus restoration. Check at the supported desktop width of at least 1280px. No automated browser suite or agent-owned app server.

Planning check: `node scripts/check-workflow-docs.mjs` — passed (`Workflow documentation structure looks complete.`).

## Sources

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`, `docs/milestones/README.md`.
- M44: `docs/milestones/m44-entity-modals-inline-editing-and-action-toasts.md`.
- ADR 0056 (entity modal/inline edit policy), ADR 0059 (modal shortcuts), ADR 0064 (manual application testing).
- Shared forms/modal owners listed above, installed Nuxt UI `Input.vue`/`Modal.vue`, and `vitest.config.ts`.
