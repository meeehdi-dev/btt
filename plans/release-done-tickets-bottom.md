# Release detail: move Done tickets below a separator

## Status and goal

Original plan approved in Plannotator `pn-d7538f`. No application code changed and no checks ran during original planning.

**Approved amendment — 2026-10-20:** Human approved [Release focus simplification](release-focus-simplification.md) in Plannotator `pn-781184` and explicitly instructed Build to begin. This relaxes only the automatic Release focus-recovery requirement below; original approval and historical verification remain preserved in M47.

Make long-lived maintenance releases easier to scan: on `/releases/:id`, show all unfinished tickets first, followed by a full-width horizontal separator labeled **Done**, then completed tickets. Apply this to every release, not just undated releases; there is no maintenance-release type in the current UI.

Implementation evidence belongs in [M47](../docs/milestones/m47-release-done-tickets-bottom.md). Approval of this plan also authorizes that milestone's referenced scope, not unrelated open M45 work.

## Current-state evidence

- `app/pages/releases/[id]/index.vue` fetches the default `/api/tickets?releaseId=…` response and renders one two-column ticket grid. It already computes a Done count and owns status writes, invalidation, pending/error feedback, and refresh retry.
- `server/api/tickets/index.get.ts` orders tickets estimated-first, then creation time descending and ID descending. Default visibility includes old Done tickets; only explicit Board requests apply quiet-Done filtering.
- `app/components/HierarchyDetailSections.vue` already separates entity fields/actions from child items with a horizontal rule. The new Done separator belongs inside Release detail's items slot, not this shared wrapper.
- Inspected sibling project detail and `app/components/TicketBoardCard.vue`: reuse existing `EntityCard`, `TicketWorkItem`, hierarchy badges, and context popovers. Release cards intentionally retain their own density and direct select; grouping does not justify unifying Board/Release wrappers.
- `tests/e2e/release-ticket-status.test.ts` covers keyboard interaction, pending controls, writes, failed writes, refresh failure/retry, Done-to-On-hold transitions, and navigation. `tests/e2e/api-item-ordering.test.ts` asserts release/API ordering with currently non-Done fixtures.
- ADR 0027 preserves page-owned Release status writes. ADR 0028 currently says status changes do not move Release cards; this request intentionally introduces one narrow exception: crossing the Done boundary moves cards between sections. API order and within-section order stay unchanged. ADR 0046's Board-only hiding policy remains unchanged.
- Working tree was clean at initial inspection. Recent release-page history includes M44 inline editing and shared invalidation, which must be preserved.

## Scope and decisions proposed for approval

- Use two stable partitions of the existing reactive ticket list: status exactly `Done`, and every other status (including On hold).
- Preserve response order within each partition; do not introduce priority sorting, update-time sorting, or change the API query.
- Render unfinished tickets in the existing two-column grid, followed by a separate two-column Done grid, so Done always starts a fresh row even with an odd unfinished count.
- Display a full-width horizontal separator with a quiet **Done** label immediately before a nonempty Done grid. Use existing Nuxt UI `USeparator`, with accessible separator semantics; read the upstream component reference before implementation.
- No Done tickets: no Done separator or empty Done section. All tickets Done: show the Done separator and grid without an empty unfinished placeholder. No tickets: preserve the existing single empty state, without a separator.
- Keep one source of card markup through a small page-local group iteration; reuse all existing card components and page handlers. Do not duplicate the card template or extract a speculative component/helper.
- Keep Done cards visible, expanded, and fully interactive. This is separation, not hiding or archiving.

## Requirements and acceptance criteria

- **R1 — Placement:** For mixed statuses, every non-Done card precedes the Done separator, and every Done card follows it in DOM and visual order. Done begins below both columns of unfinished cards.
- **R2 — Stable order:** Each section matches the relative order of its items in the default API response, including estimated/unestimated cases. Every eligible ticket appears exactly once. API response ordering is unchanged.
- **R3 — Edge states:** Empty, no-Done, all-Done, and mixed lists render as specified above, without blank section scaffolding. Old Done tickets in undated releases remain visible.
- **R4 — Reactive moves:** Successful status refresh moves a ticket into/out of Done without navigation or document reload; other non-Done changes preserve its section. New ticket creation/invalidation continues to place tickets correctly. Failed writes do not incorrectly move cards; refresh-failure/retry behavior remains unchanged. Completion confirmation still uses all tickets and the full Done count.
- **R5 — Interaction parity:** Both sections retain identical card density, usage values/colors, keyboard-operable status controls, navigation, hierarchy links, and related/external popovers. Section remounts use default browser/component focus behavior; automatic focus transfer is not required. Focus may return to the body, and users can explicitly focus/tab to the replacement control.
- **R6 — Layout:** At 1280 CSS px and a wider desktop viewport, inspect a mixed list with an odd unfinished count and long titles. Separator spans the item area, Done starts on a fresh row, and cards retain current wrapping/truncation and compact spacing. Light/dark presentation remains readable.

## Non-goals

No collapse toggle, counts, status filters, pagination, settings, special maintenance-release detection, changes to other routes, API/schema/auth/dependencies, ticket visibility/archive rules, or broader card refactor. Do not change M45 scope/status, CI policy, or historical accepted ADR text.

## Ordered implementation checklist

1. Re-read this plan, M47, applicable instructions, and current worktree. Read the installed Nuxt UI skill and upstream Separator reference. Preserve any intervening user changes.
2. In `app/pages/releases/[id]/index.vue`, derive the stable partitions and render the groups with the conditional Done separator and existing card markup. Keep mutation and error states page-owned. Derive the existing Done count from the Done partition if useful, without changing completion behavior.
3. Extend `tests/e2e/release-ticket-status.test.ts` with concise, isolated fixtures/assertions for mixed ordering, no-Done/all-Done/empty states, keyboard-driven Done transitions with explicit control reacquisition, and existing failure/retry behavior. Include an odd unfinished count and estimated/unestimated tickets; ensure cleanup removes every added record. Prefer a separate focused test over inflating the existing scenario's runtime. Retain existing `data-release-ticket-id` hooks; use only minimal group hooks needed for precise assertions.
4. Extend `tests/e2e/api-item-ordering.test.ts` to prove API ordering remains unchanged with mixed Done/non-Done fixtures while Release DOM order is the stable partition of that API order. Preserve existing Board/search/estimate ordering assertions. Use existing context-popover tests for interaction parity, adding targeted coverage only for a genuine gap.
5. Add/index the next available ADR (currently 0063) documenting this Release-only presentation exception to ADR 0028. Preserve the accepted historical ADR; keep the new ADR Proposed until human code review. Add a concise M47 roadmap entry to `PLAN.md` and record implementation/check evidence in M47, without duplicating this plan.
6. Run all validation below on the final worktree, inspect the supported desktop presentation, then hand the saved plan to independent Review. Human code review and explicit milestone completion remain separate gates.

## Validation (Build only)

Use an isolated test PostgreSQL database with explicit test environment configuration; never migrate/reset a user database. Follow existing repository auth-test setup.

Non-browser gates, before browser execution:

- `pnpm db:migrate` against the isolated test database.
- `pnpm format:check`, `pnpm lint`, `pnpm check:duplicates`, `pnpm check:unused`.
- `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, `pnpm build`.
- `pnpm check:workflow`, `git diff --check`.

Start and track an agent-owned app server with `pnpm dev --host 127.0.0.1 --port <free-port>` and the same isolated database/auth environment. Run focused tests with `PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:<free-port> pnpm exec playwright test tests/e2e/release-ticket-status.test.ts tests/e2e/api-item-ordering.test.ts tests/e2e/ticket-context-popovers.test.ts --workers=1`, then the full suite with the same environment and `pnpm test:e2e`.

Perform and record the R6 visual checks and R5 keyboard navigation with explicit control reacquisition on the verification server. Keep the agent-owned server running through any failure; preserve first-failure evidence, diagnose, rerun affected gates and the full suite after fixes. No automatic retries or global timeout increases. Stop only after all required checks pass on the final worktree, verify the server port is released, and never stop a user-owned server. Record exact commands/results and manual outcomes in M47 before Review.

## Risks and stop conditions

- Moving between separately keyed groups can recreate a card and lose keyboard focus. The approved amendment accepts default focus behavior; retain normal keyboard access without recovery machinery.
- Grouping must not accidentally replace the total ticket list used for completion or import Board-only visibility rules.
- If more than a narrow presentation/ordering exception, API/dependency changes, or broad shared-component changes seem necessary, stop for scope approval.
- No consequential open questions remain for planning; the proposed edge-state behavior is part of the approval review.

## Fresh-session Build handoff

After explicit approval, use `/Users/mehdi/code/btt/plans/release-done-tickets-bottom.md` as the Build input. Implement only the Release grouping, focused regression coverage, narrow ADR/roadmap bookkeeping, and M47 evidence described here. No tests or services were run in Plan, and no application changes exist from this session. Finish all required local checks/full E2E and manual acceptance before independent Review; leave Git writes and acceptance/completion declarations to the human.
