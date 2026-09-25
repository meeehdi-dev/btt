# M3 — Tickets MVP

## Context

M2 and M2.5 are recorded complete (human review and completion declaration in their milestone files). The roadmap's next milestone is M3: release-linked tickets with fixed workflow statuses, estimates, external links, related tickets, and a grouped list/board. This is planning only; implementation requires human approval.

## Approach

Implement the full roadmap M3 scope as one reviewable vertical slice, as requested: tickets belong to releases; CRUD for title, description, fixed status and optional minute estimate; quick next-status action; label/URL external links; non-hierarchical ticket relations; grouped-by-status ticket view and release-detail integration. Preserve M2 ownership/archival conventions and M2.5 UUIDv7. Use an ordered status constant shared by server/UI; advance stops at Done. Make estimate positive whole minutes when set, without time usage calculations until M4. Validate external links as non-empty labels plus http(s) URLs, and relation targets at API boundaries; keep relations between distinct tickets of the same owner (including across releases/projects), symmetric and deduplicated. Archive/restore tickets as M2 records do; keep archived descendants hidden under archived ancestors, allow editing archived tickets via explicit archived view, and require archive before permanent deletion. Remove a ticket's link/relation rows explicitly before permanent deletion in a transaction (linked peers remain); parent FK stays restrictive and release deletion is blocked while tickets remain. Do not add comments, generic non-ticket relation targets, time tracking, drag/drop, or ticket hierarchy.

## Files to modify

- `docs/milestones/m3-tickets-mvp.md` (new milestone plan/log from template)
- `server/db/schema.ts`, `drizzle/` (ticket, external-link and relation schema/migration; UUIDv7 PKs and restrictive parent FKs)
- `server/api/tickets/`, `server/domain/schemas.ts`, `server/domain/` or `server/utils/` (authenticated CRUD, linked-resource mutations, validation and status rules)
- Replace `app/pages/tickets.vue` with `app/pages/tickets/index.vue` and add `app/pages/tickets/new.vue`, `app/pages/tickets/[id]/index.vue`, `app/pages/tickets/[id]/edit.vue`; update `app/pages/releases/[id]/index.vue` (dashboard nav already links to Tickets).
- `tests/unit/`, `tests/e2e/` (coverage)
- ADR if a durable model/lifecycle decision is needed

## Reuse

- M2 hierarchy API, ownership and archive patterns in `server/api/clients/`, `server/api/projects/`, `server/api/releases/` (`docs/decisions/0004-m2-core-data-model.md`).
- Request validation conventions in `server/utils/domain.ts`, `server/utils/domain-validation.ts`, and `docs/decisions/0005-m2-domain-validation-and-ui-polish.md`.
- Shared UUIDv7 generator `server/utils/id.ts` and native UUID schema convention.
- `server/domain/decode.ts` and `server/domain/schemas.ts`: Effect v4 boundary schemas with 400 mapping; verify any new Effect API against official v4 docs before use per `.agents/skills/effect-development/SKILL.md`.
- `app/pages/releases/new.vue`, `app/pages/releases/[id]/edit.vue`, `app/pages/projects/[id]/index.vue`, `app/pages/projects/index.vue`: prerequisite selector states, CRUD forms, archive filter, list/detail pattern; `app/layouts/dashboard.vue` already links Tickets. Check Nuxt UI component references per `.agents/skills/nuxt-ui/SKILL.md`.
- `tests/e2e/auth-shell.test.ts`, `tests/unit/domain-schemas.test.ts`: auth fixture, child-first cleanup and schema test patterns.

## Scope notes

- The roadmap's “tickets/items” relations mean ticket-to-ticket links for M3 (no other linkable work-item type exists yet). A grouped list of seven statuses is sufficient; no drag/drop board is required. Allow choosing a different owned active release during editing, subject to ownership checks; new tickets require an active release. An archived ticket is excluded from normal selectors/list views, with explicit archived access as in M2.
- No new dependency is planned. Record any durable new schema/lifecycle choices in an ADR when implementing, without changing accepted M2/M2.5 decisions.

## Steps

- [x] Create/update M3 milestone file from template; get human approval before implementation.
- [x] Add ticket/link/relation tables, constraints, indexes and migration; confirm schema SQL before applying.
- [x] Add Effect schemas, status/next-status rules, authenticated list/detail/create/update/archive/delete and link/relation mutations with ownership and archived-parent handling.
- [x] Build responsive grouped tickets list, release-scoped creation/detail, edit/status advancement, links and related-ticket controls; preserve prerequisite/error/archived UI states.
- [x] Add validation/status unit tests and authenticated API/browser tests for CRUD, relationships, isolation, archive/delete and mobile layout; record command/manual evidence and ADRs in M3 journal for review.

## Verification

- `pnpm db:generate`, `pnpm db:migrate` (against local disposable development DB, after reviewing generated SQL).
- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test -- --run`, `pnpm exec playwright test --workers=1`, `pnpm build`, `pnpm check:workflow` (planning-time `node scripts/check-workflow-docs.mjs` passed).
- Manual desktop/mobile checks: release-linked creation, status progression, estimates, links/relations, archived-parent behavior, and ownership boundaries.
