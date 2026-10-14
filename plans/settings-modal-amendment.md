# M44 amendment plan — Settings modal

> **Status: Approved via Plannotator session `pn-e2e142` on 2026-10-14.** Implementation, local verification, and human code review are complete; only the M44 completion declaration is pending.

## Context

At amendment planning, the Settings control in `app/components/AccountControls.vue` was a direct link to `/settings`. That page contained the four Agenda preferences (visible start/end, workday target, and week start day), validated and saved through the existing `/api/settings` PATCH, refreshed settings/Agenda data, and reported inline errors, retryable partial success, and the M44 success toast.

The authenticated dashboard layout owns `AccountControls` on every application page. At amendment planning, browser tests navigated to `/settings` directly or through the header to verify settings saves, refresh failures, and localized weekday choices. ADR 0035 requires a directly available Settings control; opening a modal from that control can preserve its direct visibility while leaving the current page in place.

## Proposed scope

1. Change the authenticated-shell Settings control from navigation to a button that opens a shell-level Settings modal over the current route, without changing the URL or replacing the current page.
2. Move the existing Settings form into a reusable modal component. Preserve its fields, validation, API contract, explicit Save behavior, toast policy, inline write/read errors, retry UI, and same-tab settings/Agenda invalidation.
3. Load Settings data when the modal is first opened rather than adding a settings read to every authenticated page. Keep the modal state owned by the dashboard shell so closing/reopening it and navigating between authenticated routes do not lose a successful-write/refresh-failure retry path.
4. Preserve accessible modal naming, focus management, keyboard dismissal, and supported-width layout. Keep saving explicit; do not autosave or alter Agenda behavior.
5. Update browser tests to open Settings from the shell and verify modal behavior, preserved route/page context, saves, retry after refresh failure, and localized weekday choices.
6. Retire direct `/settings` visits with an authenticated 404; make the shell modal the only Settings UI entry point. Record the durable route/modal policy in ADR 0058, accepted after code review; update M44 planning/evidence and roadmap records.

## Human decision recorded

- In Plannotator session `pn-77f1bd`, the human chose to retire direct `/settings` visits with an authenticated 404. Settings will be available only through the shell modal; opening it from the header does not change the current URL.

## Out of scope

- Changes to settings fields, defaults, validation, storage, server/API behavior, authentication, schema, dependencies, or Agenda semantics.
- Automatic saving, changes to success/partial-success toast rules, or replacement of inline errors/retry controls.
- General conversion of other shell actions or routes to modals.
- Mobile-specific behavior below the supported 1280 CSS px viewport.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, and `PLAN.md`
- Current open M44 milestone: `docs/milestones/m44-entity-modals-inline-editing-and-action-toasts.md`
- Current M44 plan: `plans/entity-modals-and-action-toasts.md`
- ADR 0035 — three-block header navigation and directly available Settings action
- ADR 0042 — supported desktop viewport and spacing system
- ADR 0050 — full E2E verification and agent-owned server handoff
- ADR 0051 — same-tab API data invalidation
- ADR 0056 — explicit settings save success/partial-success notification policy
- ADR 0057 — sibling-surface audit and shared presentation guidance

## Approach

1. Use the dashboard layout as the owner of Settings-modal visibility and attach an open-settings event to `AccountControls`; retain the always-visible direct header control.
2. Extract the existing Settings form and mutation flow into `SettingsModal.vue`. Reuse the existing request, validation, toast, invalidation, and error-mapping helpers rather than changing the API behavior.
3. Make loading lazy on first open, then retain the component/state in the dashboard layout to keep retryable partial-success feedback reachable after dismissal. Preserve explicit Save and the existing status feedback.
4. Retire direct `/settings` visits with an authenticated 404 route stub and add a browser assertion for it.
5. Update existing tests that currently navigate directly to `/settings`, and add modal-focused assertions for open/close/focus, unchanged URL and underlying route, saving, retry, and localized options.
6. Run the approved M44 checks on the final worktree, including full Playwright E2E and a 1280×900 visual/keyboard review. Record evidence in the M44 milestone and submit the amendment for human code review. Do not close M44 without the human completion declaration.

## Files expected to change

- `app/components/AccountControls.vue`
- `app/layouts/dashboard.vue`
- New `app/components/SettingsModal.vue`
- `app/pages/settings.vue` (retire with an authenticated 404 stub)
- `tests/e2e/auth-shell.test.ts`
- `tests/e2e/data-invalidation.test.ts`
- `tests/e2e/client-effect-failures.test.ts`
- `tests/e2e/agenda-week.test.ts`
- `tests/e2e/search.test.ts`
- `PLAN.md`
- `docs/milestones/m44-entity-modals-inline-editing-and-action-toasts.md`
- ADR 0058 and `docs/decisions/README.md`

No API/server/schema/migration/dependency changes are expected.

## Reuse

- Existing `AccountControls` placement in `app/layouts/dashboard.vue`.
- Existing Settings form, validation, `trackAppApiFetch`, `useAppDataInvalidation`, and `useAppToast` behavior from `app/pages/settings.vue`, now extracted into `app/components/SettingsModal.vue`.
- Existing Nuxt UI modal patterns and the repository's reviewed Nuxt UI guidance.
- Existing settings browser coverage in `tests/e2e/auth-shell.test.ts`, `data-invalidation.test.ts`, `client-effect-failures.test.ts`, `agenda-week.test.ts`, and `search.test.ts`.
- M44's final check sequence and agent-owned server handoff procedure.

## Decisions and ADR links

- User request: make the Settings page a modal.
- Approved interaction: open it globally from the existing header Settings action, keep the current page/URL, preserve explicit-save and retry semantics.
- Decision recorded in Plannotator session `pn-77f1bd`: direct `/settings` visits return an authenticated 404; Settings opens only from the shell modal.
- [ADR 0058](../docs/decisions/0058-settings-in-shell-modal.md) records the accepted route/modal policy and was Accepted after Plannotator code review session `pn-673ff2`.
- ADR 0035 requires the Settings action to remain directly available in the header; a modal trigger preserves that placement.

## Implementation checklist

- [x] Obtain explicit human approval of this amendment before application-code changes (Plannotator session `pn-e2e142`, 2026-10-14).
- [x] Record the chosen direct `/settings` behavior: authenticated 404, selected in Plannotator session `pn-77f1bd`.
- [x] Open Settings as an accessible shell-level modal without replacing the current page or URL.
- [x] Preserve settings load/save, validation, invalidation, toast, inline-error, and retry behavior; load lazily and retain retry state across close/reopen and route navigation.
- [x] Update route/UI tests and add modal, context-preservation, keyboard, and accessibility assertions.
- [x] Update M44/PLAN evidence and index ADR 0058 as Proposed before human code review.
- [x] Accept ADR 0058 after code review (accepted following Plannotator session `pn-673ff2`).
- [x] Run all approved non-browser checks and the full Playwright suite on the final worktree; complete visual/keyboard review at 1280×900.
- [x] Submit the amended worktree for human code review; Plannotator session `pn-673ff2` approved with no changes requested.
- [ ] Keep M44 open until the human completion declaration.

## Journal

### 2026-10-14 — Request captured and amendment approved

- Fact: the existing Settings action is a link to `/settings`; its page saves four Agenda preferences through existing APIs and invalidation paths.
- Fact: M44's implementation and prior code reviews were complete, but M44 remains open because the human completion declaration has not been given.
- User direction: make the Settings page a modal.
- Decision: open Settings from the persistent header over the current page, without a URL change.
- Human route decision: in Plannotator session `pn-77f1bd`, the human chose an authenticated 404 for direct `/settings` visits.
- The human approved this M44 amendment through Plannotator session `pn-e2e142` on 2026-10-14. Implementation and verification evidence are recorded below and in the M44 milestone.

## Verification

Planning artifact checks before approval:

- [x] `pnpm exec oxfmt --check plans/settings-modal-amendment.md` — passed.
- [x] `node scripts/check-workflow-docs.mjs` — passed.
- [x] Whitespace check of the new plan — passed.
- [x] Overall human approval of the amendment plan; direct-route behavior is recorded above.

Implementation verification:

- [x] `pnpm format:check` — passed on 357 files.
- [x] `pnpm lint` — passed with two pre-existing `consistent-function-scoping` warnings in `tests/e2e/ticket-context-popovers.test.ts`.
- [x] `pnpm typecheck` and `pnpm typecheck:tsgo` — passed.
- [x] `pnpm check:duplicates` and `pnpm check:unused` — passed; 98 baseline clones and no new clones.
- [x] `pnpm test` — 16 files / 79 tests passed.
- [x] `pnpm build` — passed; build timing diagnostics were non-blocking.
- [x] `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, tracked/untracked whitespace checks — passed.
- [x] Focused Settings/browser checks across `auth-shell`, `search`, `data-invalidation`, `client-effect-failures`, and `agenda-week` — 20 tests passed; the partial-success/reopen test also passed after verifying retry across navigation.
- [x] Full `PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002 pnpm test:e2e --workers=1 --retries=0` — all 52 tests passed in 2.4 minutes; no retries or timeout increases.
- [x] At 1280×900, visually inspected `/tickets` with the modal open in `/tmp/m44-settings-modal-1280.png`; controls fit, the dialog is centered, focus enters the dialog, Escape restores focus to Settings, and the route remains unchanged.
- [x] Verified authenticated direct `/settings` returns 404. The partial-success retry remains available after closing the modal and navigating to Tickets.
- [x] After all local checks passed and before review handoff, stopped only the agent-owned Nuxt server on port 3002 and verified ports 3000–3003 were released; preserved the isolated Postgres container on port 55432.

## Review status

- Plan review: Approved via Plannotator session `pn-e2e142` on 2026-10-14.
- Code review: Accepted via Plannotator session `pn-673ff2` on 2026-10-14 with no changes requested; ADR 0058 is Accepted.
- M44 completion declaration: Pending

## Follow-ups

- None proposed. The M44 completion declaration remains pending.
