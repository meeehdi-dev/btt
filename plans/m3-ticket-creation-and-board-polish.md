# M3 follow-up — ticket creation and board polish (approved)

## Context

M3's code review was accepted, but the milestone has not been declared complete. A ticket currently must be created before links/relations can be added on its detail page; estimates are entered as raw minutes; the seven status groups collapse to 2–3 grid columns or disappear behind one global empty state, inside a `max-w-6xl` dashboard shell. The requested outcome is a complete create form, a scannable seven-column board with empty lanes, friendlier estimates, and more useful horizontal space.

## Approach

- Extend ticket creation to accept optional links and related-ticket IDs together with the new ticket, validating and saving all or none in one transaction. Present repeatable link rows (label + URL) and a ticket picker on the create page; reuse the existing URL, ownership, relation and UUIDv7 conventions. Existing create clients with no extras must keep working. No database schema change anticipated.
- Render all seven status lanes even if empty, each with a visible placeholder. On desktop/tablet, keep all seven on one row with minimum lane widths and board-local horizontal scrolling if necessary; on mobile, render one stacked status section per row using Nuxt UI `UCollapsible`, all closed by default and showing each status's ticket count. Keep a useful global empty message without hiding the lane headers.
- Make all authenticated pages full-width by removing the dashboard header/main `max-w-6xl` and authenticated form page `max-w-2xl` wrappers, while retaining responsive page gutters and narrow paragraph text where helpful for readability. The unauthenticated login card remains deliberately centered rather than stretched.
- Use the small `parse-duration-ms` library (0.1.0; MIT, no runtime dependencies, Node >=20) for strict compound human-duration parsing; a thin app helper handles bare digit strings as minutes, converts milliseconds to **whole positive minutes** within the database integer range, and formats stored minutes compactly (`60 → 1hr`, `90 → 1hr 30m`). Accept `1hr`, `1 hr`, `45m`, `1h 30m`, `1.5h`, and bare `90`; reject invalid, negative, zero and fractional-minute input. Empty input remains a null estimate. Show a clock icon plus compact time on ticket cards, ticket detail and release ticket summaries; use a human-readable estimate field on create/edit, preserving raw-minute API payloads and the M4 domain model.
- Add browser/unit coverage and update the M3 journal/ADR. Human approved this follow-up in chat, including the dependency and API contract change. Open Plannotator code review after implementation; M3 completion remains pending.

## Files to modify

- `plans/m3-ticket-creation-and-board-polish.md` (this proposal); `docs/milestones/m3-tickets-mvp.md` (approved follow-up and evidence later)
- `server/domain/schemas.ts`, `server/api/tickets/index.post.ts`, possibly a focused reusable ticket validation helper under `server/domain/`
- `app/pages/tickets/new.vue`, `app/pages/tickets/[id]/edit.vue`, `app/pages/tickets/index.vue`, `app/pages/tickets/[id]/index.vue`, `app/pages/releases/[id]/index.vue` for creation, status columns and estimate presentation.
- `app/layouts/dashboard.vue` and authenticated create/edit pages under `app/pages/clients/`, `app/pages/projects/`, `app/pages/releases/`, `app/pages/tickets/` that currently use `max-w-2xl` wrappers; a pure `app/utils/ticket-estimate.ts` helper (or `shared/` if server reuse is needed).
- `package.json`, `pnpm-lock.yaml` for explicitly approved `parse-duration-ms` dependency; `tests/unit/` and `tests/e2e/tickets.test.ts`; ADR/index if a durable dependency/UI contract choice needs documenting.

## Reuse

- `server/api/tickets/[id]/links/index.post.ts` and `server/api/tickets/[id]/relations/index.post.ts`: current link URL validation, ownership, canonical relation ordering and UUIDv7 generation (reuse logic, not nested HTTP calls).
- `server/domain/decode.ts`, `server/domain/schemas.ts`, `server/domain/tickets.ts`: Effect schema decoding and owned/active target checks.
- `app/pages/tickets/[id]/index.vue`: existing label+URL and related-ticket controls; `app/pages/tickets/new.vue`: existing prerequisite handling; `app/pages/tickets/index.vue` and `shared/ticket-status.ts`: status grouping and order.
- `server/utils/validate-duration.ts` checks positive integer minutes (not a string parser); `tests/e2e/tickets.test.ts` supplies auth, ownership and narrow-viewport fixtures.
- Research: [`parse-duration-ms`](https://github.com/sindresorhus/parse-duration-ms) supports all requested unit forms, compound input, and decimals with strict full-string matching but returns `undefined` on bare `90`; a small wrapper handles bare minutes and whole-minute validation. [`ms`](https://github.com/vercel/ms) does not support compound `1h 30m` and interprets bare `90` as milliseconds; [`parse-duration`](https://github.com/jkroso/parse-duration) supports compound input but is intentionally permissive with noisy strings. [`UCollapsible`](https://ui.nuxt.com/docs/components/collapsible) defaults closed and exposes accessible open state/slots.

## Decisions and scope notes

- Human chose full-width authenticated pages, seven visible desktop lanes on one row, and mobile single-column status sections collapsed by default with counts. Human confirmed the above estimate grammar and requested a low-complexity library evaluation; the human approved implementation of this plan (including the proposed `parse-duration-ms` dependency) in chat.
- No ticket database columns/migration or auth changes; nullable integer estimate minutes and `ticketLink`/`ticketRelation` tables remain intact. No Jira integration. No new bulk link/relation editing feature outside creation.

## Steps

- [x] Get human approval for this follow-up (including the one dependency and API contract change) before coding.
- [x] Extend ticket creation schema/handler for optional link/relation arrays with ownership/URL checks and atomic persistence; test rejection/no partial insert and old clients.
- [x] Add repeatable links and related-ticket picker to create form; build duration input/output helper and apply to create/edit and card/details as agreed.
- [x] Change ticket list to seven visible lanes with empty states and single-row scrolling; apply scoped wider layout.
- [x] Add unit/browser coverage, run quality gates and record follow-up evidence.
- [x] Open Plannotator code review; approved with no changes requested. Do not close M3 without explicit human completion declaration.

## Verification

- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm exec playwright test --workers=1`, `pnpm build`, `pnpm check:workflow`.
- API/browser: create ticket with multiple links/relations or no extras, malformed URL/foreign/archived relation rollback and duplicate IDs; estimate conversion for `1hr`, `1 hr`, `1h 30m`, `1.5h`, `90` and invalid/partial-minute values; clock-icon compact display; all seven empty/populated lanes in one desktop row with board-local scroll, all seven mobile sections initially closed and individually toggleable with counts; full-width authenticated layouts without page overflow; navigation and existing edit/detail actions still work.
