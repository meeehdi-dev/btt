# M2 — Core data model: clients, projects, releases

## Context

M2 establishes the authenticated work hierarchy after M1: clients contain projects, and projects contain releases. It provides the persistence and CRUD foundation for M3 tickets without adding ticket or time-entry tables.

## Approved scope

- Clients, projects, and releases CRUD under the authenticated user.
- Optional release target date.
- Project color presets and custom six-digit hex colors.
- Archive filters, parent-visibility rules, restore/edit support for archived records.
- Mandatory archive before permanent deletion; child-first permanent deletion.
- Dedicated CRUD pages and responsive hierarchy navigation.

## Out of scope

- Tickets, time entries, agenda, search, comments, and reporting.
- Automatic archive/restore cascades.
- Automatic permanent-delete cascades.

## Source references

- `AGENTS.md`
- `docs/llm-workflow.md`
- `PLAN.md`
- `docs/milestones/m1-authentication-shell.md`
- `docs/decisions/0003-m1-authentication-and-database.md`
- `docs/decisions/0004-m2-core-data-model.md`
- `docs/decisions/0005-m2-domain-validation-and-ui-polish.md`
- `plans/m2-core-data-model.md`

## Approach

Use Drizzle PostgreSQL tables with restrictive child foreign keys and nullable archive timestamps. Server endpoints authenticate through Better Auth, resolve ownership through the hierarchy, validate request bodies, and expose separate archive/restore and permanent-delete mutations. Nuxt pages use protected layouts, server data fetching, dedicated create/edit routes, archive badges/filters, and Nuxt UI controls.

## Files to modify

- `server/db/schema.ts`, `drizzle/0001_cloudy_marten_broadcloak.sql`, `drizzle/meta/0001_snapshot.json`
- `server/utils/domain.ts`, `server/utils/domain-validation.ts`
- `server/api/clients/`, `server/api/projects/`, `server/api/releases/`
- `app/layouts/dashboard.vue`, `app/pages/clients/`, `app/pages/projects/`, `app/pages/releases/`
- `playwright.config.ts`, `tests/e2e/auth-shell.test.ts`, `tests/unit/domain-validation.test.ts`
- `docs/decisions/0004-m2-core-data-model.md`, `docs/decisions/README.md`, this file

## Reuse

- M1 session/auth patterns from `server/utils/auth.ts`, `server/utils/auth-test.ts`, and `app/middleware/auth.ts`.
- M1 Drizzle and migration configuration from `server/db/schema.ts` and `drizzle.config.ts`.
- Existing protected dashboard layout and Nuxt UI semantic styling.
- Nuxt UI `UColorPicker` with preset swatches.

## Decisions and ADR links

- Archive lifecycle, ownership, schema relationships, and deletion rules: `docs/decisions/0004-m2-core-data-model.md`.
- Better Auth and database baseline: `docs/decisions/0003-m1-authentication-and-database.md`.

## Implementation checklist

- [x] Confirm archive visibility and archived-parent selector behavior.
- [x] Add clients, projects, and releases schema, indexes, constraints, and migration.
- [x] Implement authenticated CRUD, ownership checks, archive/restore, filters, and guarded permanent deletion.
- [x] Implement dedicated list/detail/create/edit pages with project color selection.
- [x] Add validation, API/browser coverage, and quality-gate evidence.
- [x] Record durable decisions and update this milestone journal.
- [x] Follow-up: add client colors and migration-safe defaults.
- [x] Follow-up: replace color presets and improve required-picker empty states.
- [x] Follow-up: add Effect v4 request schemas and typed domain outcome mapping.
- [x] Follow-up: replace archive text rows with accessible icon controls.

## Journal

### 2026-09-21 — Implementation

- Fact: M1 supplies Better Auth, PostgreSQL, Drizzle, protected middleware, and browser test fixtures.
- Decision: parent archival changes only the parent row; descendants remain unchanged but are hidden while an ancestor is archived.
- Decision: archived records remain editable/restorable; permanent deletion is explicit, requires prior archive, and is child-first.
- Fact: added `client`, `project`, and `release` tables with ownership/parent foreign keys, archive timestamps, indexes, and a generated migration.
- Fact: added authenticated CRUD endpoints with ownership checks, archive filters, validation, and deletion conflicts.
- Fact: added dedicated CRUD pages, archive badges/filters, project color swatches/custom picker, and client/project/release hierarchy navigation.
- Deviation: Playwright now loads repository environment variables through Vite `loadEnv` so Better Auth Test Utils and the Nuxt server share the configured test secret.
- Deviation: moved the project list from `app/pages/projects.vue` to `app/pages/projects/index.vue` so Nuxt nested project detail routes render without a parent-page conflict.

### 2026-09-21 — M2 follow-up implementation

- Fact: added client color persistence with a migration-safe slate default and client create/edit/display support.
- Fact: Nuxt UI v4 `UColorPicker` does not support a `swatches` prop; added explicit accessible preset buttons plus the custom picker in shared `ColorSelector`.
- Fact: project and release creation now handle loading, request failure, empty prerequisites, stale query selections, and disabled submission states.
- Fact: archive filtering is now an icon-only tooltip-backed control in client/project list headers.
- Decision: hierarchy request payloads use Effect v4 Schema decoding and tagged domain outcome types at the HTTP boundary; see ADR 0005.
- Evidence: `pnpm db:migrate`, formatting, lint, typecheck, unit tests, browser tests, build, and workflow checks pass.
- Fact: updated all Nuxt `createError` call sites to the Nuxt 4 `status`/`statusText` API.
- Fact: Playwright now loads `.env` and fails fast when `DATABASE_URL` is absent; the local fallback was removed.
- Decision: UUIDv7 migration is tracked as a separate pre-M3 planning milestone; no identifier migration was performed here.

### 2026-09-21 — Release-list polish

- Fact: release lists default to active releases, support archived filtering, sort undated releases first and dated releases ascending, and expose target-date relative text/tooltips with overdue styling.
- Decision: “Done” uses the existing archive lifecycle by setting `archived: true`; no release status column or migration was added.
- Fact: added pending/error handling, shared target-date presentation, and date/sorting unit coverage.
- Evidence: `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test -- --run` (17 tests), `pnpm exec playwright test --workers=1` (3 tests), `pnpm build`, and `pnpm check:workflow` passed.

## Verification

- [x] `pnpm db:generate`: generated M2 migration successfully.
- [x] `pnpm db:migrate`: applied migration successfully to local PostgreSQL.
- [x] `pnpm format:check`: passed.
- [x] `pnpm lint`: passed.
- [x] `pnpm typecheck`: passed.
- [x] `pnpm test`: 6 files and 17 tests passed.
- [x] `pnpm test:e2e`: 3 browser tests passed, including release archive filtering and target-date presentation.
- [x] `pnpm build`: passed; Nuxt production build completed.
- [x] `pnpm check:workflow`: passed.
- [x] Manual/browser coverage: hierarchy creation, navigation, parent-hidden descendants, archive/restore, editing, and child-first permanent deletion passed in the M2 E2E flow.
- [x] Follow-up browser coverage: empty project/release prerequisite states and icon-only archive filter passed in the M2 E2E flow.

## Review status

- Plan review: Approved via Plannotator.
- Code review: Accepted by the human; no changes requested for the M2 follow-up changes.
- Milestone completion declaration: Pending explicit human declaration.

## Follow-ups

- M2.5 should settle and migrate the UUIDv7 identifier strategy before M3 adds more domain tables; see `docs/milestones/m2.5-uuidv7-identifier-migration.md`.
- M3 should add required release-linked ticket associations without weakening archive ownership rules.
- Consider richer confirmation UI for permanent deletion before expanding destructive cleanup flows.

## Closeout checklist

- [x] Approved checklist complete.
- [x] Verification evidence recorded.
- [x] Human code review accepted; no changes requested.
- [ ] Human completion declaration recorded in the journal and review status.
