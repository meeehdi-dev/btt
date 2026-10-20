# M47 amendment: remove Release status focus recovery

## Status and goal

Pending human approval; planning only. No application changes, tests, database operations, or service management performed in this session.

Remove the newly added Release status focus-restoration block rather than maintaining special DOM recovery for cards crossing Done sections. Keep all shortcuts and existing control behavior. This is a small amendment to open M47, not a general accessibility or keyboard rewrite.

## Authority and preserved references

- Original approved plan: [release-done-tickets-bottom.md](release-done-tickets-bottom.md), approved in `pn-d7538f`.
- [Independent review](../reviews/release-done-tickets-bottom-20261020T170744Z.md): no actionable findings under the original requirements.
- [Human feedback report](../reviews/release-done-tickets-bottom-feedback-20261020T171500Z.md): F1 asks what the focus block does; explanation was correct, not a defect finding.
- Subsequent human direction supplied to Plan: plan its removal, relax R5, and assess similar complexity. Latest clarification: **“no keep the global shortcuts too, i was more talking about code such as this focus thing, i want to avoid complexity.”** No shortcut removal is authorized or proposed.
- Implementation evidence remains in [M47](../docs/milestones/m47-release-done-tickets-bottom.md). Preserve original reports and historical evidence. Human code acceptance and completion remain pending.
- Current worktree contains uncommitted M47 code/tests/docs; preserve it and unrelated M45 work. Inspection found the same tracked implementation scope listed in the independent review, plus its untracked artifacts.

## Findings classification and current-state evidence

- **F1 — confirmed intended behavior, not a bug:** `app/pages/releases/[id]/index.vue:195–205` clears pending state, waits for Vue, detects a Done-boundary crossing and body focus, then queries the moved ticket's replacement combobox and focuses it. This fulfills the old R5. Removing it is a human-requested simplification with a known interaction tradeoff, not a corrective bug fix.
- **Confirmed test coupling:** `tests/e2e/release-ticket-status.test.ts:180–270` names focus preservation, checks `toBeFocused()` after each boundary move, and relies on restored focus to open the second selector. Removing only the assertions would leave that second interaction targeting the wrong element.
- **Confirmed documentation coupling:** original R5, implementation step 3, validation and risk text; M47's live requirements/risk summary; Proposed ADR 0063's focus promise; and the M47 roadmap bullet mention focus preservation or verification.
- **Broader cleanup assessment:** the inventory below found no other deletion needed for this goal. Broader removal would change established behavior, rather than merely remove M47's new machinery. Those surfaces are explicitly excluded by this proposed scope, subject to plan approval.

## Keyboard/focus inventory and disposition

| Surface / exact references                                                                                     | Existing behavior                                                                                                                   | Proposed disposition                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/pages/releases/[id]/index.vue`, status handler `finally`                                                  | Conditional post-refresh DOM focus recovery across Done groups                                                                      | Remove the recovery and its `nextTick`; retain pending-state cleanup.                                                                                                                                                           |
| `app/pages/tickets/index.vue:240–358`                                                                          | `waitForBoardLayout`, visible-card lookup, status/priority focus recovery; layout helper also supports related-ticket scroll/locate | Keep. Established Board behavior has multiple callers and keyboard coverage (`ticket-status-moves.test.ts`, `ticket-priority.test.ts`, `ticket-navigation.test.ts`). Do not remove shared layout/lookup machinery incidentally. |
| `app/layouts/dashboard.vue:6–60`                                                                               | `/`, Meta/Ctrl+K, and `g` then `a/b/c/r`, with input guards and prefix timeout                                                      | Keep all, per latest human instruction. `tests/e2e/search.test.ts` remains unchanged.                                                                                                                                           |
| `app/components/GlobalSearch.vue:156–192,197–220`                                                              | Exposed search focus, open-on-focus, close-on-focusout, Escape blur/dismiss, arrows/Enter result selection                          | Keep: powers retained shortcuts and accessible result interaction.                                                                                                                                                              |
| `app/composables/modal-form-shortcuts.ts` and existing modal/form callers                                      | Meta+Enter and Ctrl+Enter via form validation, capture handling and disabled/pending guards                                         | Keep both modifier variants and all callers/ARIA hints. Ctrl+Enter compatibility is not an open decision now that shortcuts remain unchanged. ADR 0059 stays untouched.                                                         |
| Existing Nuxt UI modals in entity creation, Settings, Agenda and ticket detail                                 | Dialog focus containment/return, nested dismissal, topmost Escape                                                                   | Keep library defaults and pending policies; no replacement focus layer. Existing modal tests remain unchanged.                                                                                                                  |
| `app/pages/agenda.vue:110–114,196,691`, `useSelectSearchInput.ts`, `useHierarchyFilters.ts`                    | Ticket picker opens with Add modal; searchable selectors autofocus their search inputs                                              | Keep. Agenda behavior was explicitly delivered in M41; `agenda-week.test.ts` asserts it.                                                                                                                                        |
| `app/components/ClientCreateForm.vue:30`, ticket-detail title input                                            | Declarative autofocus                                                                                                               | Keep: tiny, ordinary control behavior, not a recovery algorithm.                                                                                                                                                                |
| `HierarchyNameColorDetailSections.vue:32`, Release name input, ticket estimate input                           | Enter commits an inline field                                                                                                       | Keep: normal field interaction, not a global shortcut.                                                                                                                                                                          |
| `app/components/WeeklyAgenda.vue:137–150`                                                                      | Escape cancels active pointer gesture and releases capture                                                                          | Keep: cancellation safety, separate from modal dismissal.                                                                                                                                                                       |
| `TicketContextPopovers.vue` focus handlers; focusable Agenda progress; links/buttons, focus rings and tabindex | Keyboard access to context actions and progress information                                                                         | Keep native/component keyboard access, focus styling and tests.                                                                                                                                                                 |
| Ticket-detail `descriptionFocused`; Agenda window `focus` listener                                             | Protect an editing draft from refresh; resynchronize current time when window returns                                               | Keep: data/draft correctness and clock freshness, not focus recovery.                                                                                                                                                           |

Inventory used repository searches for keyboard handlers, modifiers, focus/blur, autofocus, activeElement and focus-related templates, followed by inspection of the relevant handlers/callers and tests. It is not a dependency-internals audit or a proposal to remove all occurrences of the word “focus.”

## Requirements and acceptance criteria

- **S1 — Small deletion:** Release status handling retains `ticketStatusChangingId = null` in `finally` but has no added post-update `nextTick`, body-focus check, DOM query, or focus call. Do not replace it with a helper, ref registry, key-management rewrite, or another recovery algorithm.
- **S2 — Explicit R5 amendment:** Both sections retain matching density, usage, navigation, links/popovers and keyboard-operable status controls. Automatic focus transfer across a Done-boundary remount is no longer required. Browser-default focus loss to the body is accepted for that transition; a user can explicitly focus/tab to the replacement control. Do not require or assert body focus either, because library/browser behavior may vary.
- **S3 — Regression coverage:** Keep both keyboard-driven Done transitions and persisted refreshed grouping assertions, but explicitly focus the current replacement control before the second interaction. Remove only the automatic-focus assertions and focus-preservation wording. Keep no-reload, creation invalidation, ordering, edge states, failed-write/refresh-retry, completion-count and layout coverage.
- **S4 — No collateral behavior changes:** All shortcuts, including Ctrl+Enter, native keyboard interaction, modal focus safety, Board focus recovery and Agenda autofocus remain as-is. No API/data/schema/auth/dependency/CI changes.
- **S5 — Honest records:** Document the changed requirement and accepted focus tradeoff without rewriting historical verification as if the old checks never ran. M45 status and M47 acceptance/completion remain unchanged.

## Ordered Build checklist and affected files

1. Re-read this amendment, original plan, M47 and current worktree. Treat this amendment as overriding only the original automatic Release focus-recovery requirement; all other M47 requirements still apply.
2. Delete the recovery tail from `changeTicketStatus` in `app/pages/releases/[id]/index.vue`, retaining unconditional pending cleanup. Do not change grouping or mutation/error/invalidation logic.
3. Update `tests/e2e/release-ticket-status.test.ts`: rename the grouping scenario, remove its two post-move focus assertions, and explicitly focus the re-queried/reacquired combobox before the reverse transition. Wait for the moved control's refreshed enabled/status state as needed using existing assertions, not sleeps or increased timeouts. Preserve both keyboard submissions and all other assertions. No other application/test files need edits for this amendment.
4. Amend `plans/release-done-tickets-bottom.md` with a clearly labeled, approved amendment reference and date/authority actually available at Build time. Relax R5 and align step 3, validation focus check and risk wording with S2; preserve other requirements and original approval history. Do not replace the plan wholesale or alter input reviews.
5. Update Proposed `docs/decisions/0063-release-done-ticket-sections.md` to remove the focus-preservation promise and state that section remounts use default focus behavior. Link this amendment; keep the ADR Proposed. No new ADR is needed to revise an unaccepted proposal; do not edit accepted ADRs.
6. Align only M47's bullet in `PLAN.md` and its live scope/requirements/risk summary in `docs/milestones/m47-release-done-tickets-bottom.md`. Append the actual amendment approval, deletion and new verification evidence in M47. Preserve earlier focus-check results as historical evidence; do not mark code accepted, completion declared, or unrelated failures fixed.
7. Run the checks and manual cases below against the final worktree, then hand this amendment and original M47 scope to independent Review. Human diff review remains required.

## Validation — Build only

Use an isolated test PostgreSQL database and explicit test auth configuration, never a user database. Run non-browser gates first:

- `pnpm db:migrate` against that isolated database.
- `pnpm format:check`, `pnpm lint`, `pnpm check:duplicates`, `pnpm check:unused`.
- `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, `pnpm build`.
- `pnpm check:workflow`, `git diff --check`.

Start and track an agent-owned app server using `pnpm dev --host 127.0.0.1 --port <free-port>` with the isolated database/auth environment. For browser checks set `PLAYWRIGHT_SKIP_DEV_SERVER=1` and `PLAYWRIGHT_BASE_URL=http://127.0.0.1:<free-port>`.

- Focused suite: `pnpm exec playwright test tests/e2e/release-ticket-status.test.ts tests/e2e/api-item-ordering.test.ts tests/e2e/ticket-context-popovers.test.ts --workers=1`.
- Full suite: `pnpm test:e2e` with the same environment. The earlier human acceptance of M47's serial run is historical, not a claim that the new worktree passes default parallel execution. If those failures recur, retain evidence and request direction; do not silently change M45, CI, tests or timeouts to get green. A new serial-only acceptance requires explicit human direction.
- Manual: on Release detail, use keyboard to move a ticket across Done in each direction, explicitly reacquiring its control for the second move. Record actual focus behavior and verify ordinary Tab/control navigation still works. Confirm sections, compact layout and divider at 1280 CSS px and wider. Smoke-check a retained global search shortcut and modal Meta+Enter/Escape; rely on existing full-suite coverage for unchanged broader surfaces.

Keep the agent server through failures; stop it only after required checks pass or an explicit human verification decision changes the gate. Verify its port is released before Review. Never stop user-owned services. Record exact commands, first failures, outcomes and manual observations in M47. No tests or workflow check ran during Plan; the commands above are prospective.

## Risks, exclusions and stop conditions

- Known tradeoff: crossing sections can destroy the focused control and leave keyboard focus on the page body. Approval explicitly accepts removing this narrow recovery guarantee, not removing keyboard access or modal safety elsewhere.
- If preserving normal control access requires more than this deletion and test adjustment, stop and explain; do not invent a larger abstraction or rendering refactor.
- No further focus cleanup is proposed: Board recovery, search interactions, form submission, declarative autofocus and modal safety each support an existing behavior. Removing them needs a separate, evidenced request, not speculative simplification.
- No fixing parallel-browser reliability, M45 editing, dependency research/upgrades, code acceptance, completion bookkeeping or Git writes.
- No unresolved consequential design questions remain: the latest instruction preserves shortcuts, and plan approval decides the explicit Release focus tradeoff and narrow scope.

## Fresh-session Build handoff

After explicit approval, Build input: `/Users/mehdi/code/btt/plans/release-focus-simplification.md`. This amends `/Users/mehdi/code/btt/plans/release-done-tickets-bottom.md`; keep all original requirements except the specified automatic-focus guarantee. Make only the one-handler deletion, coupled test adjustment and listed M47 documentation updates. Preserve the current uncommitted implementation, original reports and M45 work. Record final-worktree checks/full browser/manual evidence in M47, then request independent review of the actual diff; leave Git writes and human acceptance/completion to the human.
