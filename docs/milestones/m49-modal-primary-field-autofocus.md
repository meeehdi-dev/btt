# M49 — Modal primary-field autofocus

Status: Complete — automated verification passed, human code review approved (`pn-7921f0`), and the human reported successful manual testing and explicitly declared the milestone complete.

## Context

The user requested immediate typing focus for New ticket and consistent primary-field focus across create/update dialogs. M44's completed modal implementation remains the baseline.

## Approved scope

The focused plan [modal-primary-field-autofocus](../../plans/modal-primary-field-autofocus.md) was approved by the human in Plannotator `pn-ea7d71`. It defines the target control for every form dialog, including hierarchy prerequisites, nested links/relations, Agenda correction, and Settings.

## Out of scope

No APIs, schema, dependencies, new edit surfaces, destructive confirmation focus changes, E2E tests, app servers, or Git writes.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`.
- [Approved focused plan](../../plans/modal-primary-field-autofocus.md).
- [M44](m44-entity-modals-inline-editing-and-action-toasts.md); ADRs [0056](../decisions/0056-entity-modal-creation-inline-editing-and-action-toasts.md), [0059](../decisions/0059-modal-action-placement-and-keyboard-shortcuts.md), [0064](../decisions/0064-manual-application-testing.md).
- Human implementation authority: explicit approval of the focused plan in `pn-ea7d71`.

## Requirements and acceptance criteria

- Each opening focuses the plan's primary field once it is available.
- Retained draft/Settings forms refocus on return/reopen; loading/retry mounts receive focus.
- Hidden or non-topmost dialogs do not steal focus; ordinary updates and nested-dialog closure do not reset it.
- Existing keyboard, validation, pending, and focus restoration behavior remains intact.

## Risks and stop conditions

Modal/portal and picker integration was accepted through human manual testing. No broader keyboard or overlay infrastructure replacement was needed.

## Approach

A small local Vue directive on existing form elements chooses a marked primary control after the overlay's initial focus. It handles native inputs, select triggers, and segmented time controls, with visibility/topmost-dialog guards and scheduled-focus cancellation. Use existing selector search autofocus for related-ticket pickers. No global listeners or new wrappers.

## Files to modify

- `app/utils/modal-autofocus.ts`.
- Shared Client/Project/Release/Ticket create forms, `TicketCreateModal.vue`, `SettingsModal.vue`.
- `app/pages/tickets/[id]/index.vue`, `app/pages/agenda.vue`.
- Focused tests, `PLAN.md`, this evidence file, and the approved plan status.

## Reuse

Existing `UModal`, searchable picker state, `useSelectSearchInput`, and `modalFormShortcutContent`. Agenda Add completed work retains M41's existing Ticket-search behavior.

## Decisions and ADR links

- Approved plan supplies the focus targets. No new ADR is needed for this refinement.
- Use a shared local directive because retained/async forms need lifecycle handling and hidden-parent guards beyond mount-only Nuxt UI autofocus.

## Implementation checklist

- [x] Human plan approval before implementation (`pn-ea7d71`).
- [x] Implement primary-field focus across analogous forms.
- [x] Cover retained/async/hidden/nested lifecycle behavior with focused tests.
- [x] Run all retained final-worktree gates and record actual outcomes.
- [x] Obtain human code review (`pn-7921f0`, no changes requested).
- [x] Record human manual results and explicit completion declaration.

## Journal

### Implementation

- Fact: installed Nuxt UI Input/Select/InputTime autofocus is mount-only; Settings retains content and ticket prerequisite flow hides the retained ticket form with `v-show`.
- Decision: use one marked-control directive, activated explicitly for retained forms; do not refocus on normal updates. Related-ticket modal readiness opens its existing searchable picker, without watching mutation pending state.
- Evidence: initial focused run `pnpm exec vitest run tests/unit/modal-autofocus.test.ts` passed 9/9 tests. Targeted `pnpm exec oxfmt ...` formatted only changed source/test files.
- Disposable verification resource: container `btt-m49-verification`, existing local `postgres:18` image (`--pull=never`), isolated database `btt_m49`, loopback port 55449. No user-owned resource or app server used.
- `DATABASE_URL=postgres://postgres:verification@127.0.0.1:55449/btt_m49 pnpm db:migrate` passed; log `/tmp/btt-m49-verify/migrate.log`.

### Human acceptance and closeout

- Human code review approved in Plannotator `pn-7921f0`, with no changes requested.
- The human reported: “tested, looks good. i declare this milestone complete.” This records successful manual application testing and the explicit M49 completion declaration; no itemized test results were supplied.
- M49 is complete. Git writes remain human-owned.

## Verification

Planning check `node scripts/check-workflow-docs.mjs` passed before plan review.

Automated gates passed; logs under `/tmp/btt-m49-verify/`:

- `pnpm format:check`, `pnpm lint`, `pnpm check:duplicates`, `pnpm check:unused` — passed; duplication baseline unchanged.
- `DATABASE_URL=postgres://postgres:verification@127.0.0.1:55449/btt_m49 pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, and `pnpm build` (the same isolated database environment for each) — passed. Tests: 21 files, 127 tests, including 18 focused autofocus/parity cases. Build emitted plugin timing warnings, not errors.
- Focused test development: adding the nine declarative parity cases initially failed because Vite transformed a dynamic `new URL(..., import.meta.url)` into an undefined asset path. Importing Node's URL did not fix the transform; using the repository-relative filesystem path fixed all nine cases. The final focused run passed 18/18. No application test was weakened.
- `pnpm check:workflow` and `git diff --check` — passed.
- `docker stop btt-m49-verification && docker rm btt-m49-verification` — completed; `lsof -nP -iTCP:55449 -sTCP:LISTEN` found no listener, confirming released port 55449. No application server was started or stopped.

Human manual application testing: accepted; the human reported “tested, looks good.” Individual cases were not enumerated, so no separate per-case pass is claimed. No E2E tests or agent application server were run.

## Review status

- Plan review: Approved (`pn-ea7d71`).
- Build self-inspection: focused diff inspected; not an independent Review. Human diff comparison: current HEAD versus the complete worktree, including the new helper, test, milestone record, and plan (four untracked files total). Initial worktree was clean. Independent Review remains available if requested.
- Human code review: Approved (`pn-7921f0`), no changes requested.
- Milestone completion declaration: Complete — explicitly declared by the human in chat.

## Fresh-session handoff

- Approved input: `/Users/mehdi/code/btt/plans/modal-primary-field-autofocus.md`.
- Scope: primary-field focus only; automated checks, human code review, manual acceptance, and completion are recorded above.
- Next phase: none required for M49; no Git writes authorized.

## Follow-ups

- No outstanding milestone follow-ups. Individual manual test cases were not enumerated by the human.

## Closeout checklist

- [x] Approved checklist complete.
- [x] Final verification evidence recorded and disposable database cleaned up.
- [x] Human code review accepted.
- [x] Human completion declaration recorded.
