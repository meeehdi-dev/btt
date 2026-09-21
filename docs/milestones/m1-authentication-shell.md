# M1 — Authentication and protected shell

## Context

M1 replaces M0's development-only mock access with Better Auth GitHub authentication and establishes the first usable protected shell for the solo user. The user approved implementing auth persistence and the PostgreSQL/Drizzle foundation together.

## Approved scope

- Better Auth 1.7.5 with GitHub sign-in and durable PostgreSQL sessions.
- Drizzle ORM/Kit schema and migration for Better Auth tables only.
- Protected session-aware Nuxt shell with Today, Projects, Tickets, and Settings.
- Mobile-ready layout with a comfortable desktop presentation and empty states.
- Test-only Better Auth Test Utils session fixture; no real OAuth credentials in automated tests.
- Workflow closeout clarification and M0 completion record.

## Out of scope

- Product domain tables and CRUD (M2+).
- Production service provisioning/deployment automation.
- OAuth providers other than GitHub.
- Agenda, ticket, search, or time-tracking features.

## Source references

- `AGENTS.md`
- `docs/llm-workflow.md`
- `PLAN.md`
- `docs/milestones/m0-project-bootstrap.md`
- `docs/decisions/0001-llm-assisted-development-workflow.md`
- `docs/decisions/0002-m0-bootstrap-baseline.md`
- `docs/decisions/0003-m1-authentication-and-database.md`
- `plans/m1-authentication-shell.md`
- Better Auth Nuxt integration and Test Utils documentation.

## Approach

- Use a server-only Better Auth instance mounted at `/api/auth/*` with the Drizzle PostgreSQL adapter.
- Use `better-auth/vue` and SSR-aware `useSession(useFetch)` for route protection and shell identity.
- Use a local Docker PostgreSQL database at `localhost:5432`; document variables in `.env.example` and keep `.env` ignored.
- Use Better Auth Test Utils against the local database to create sessions and inject fixture cookies in unit/browser tests.
- Remove the temporary M0 `/dashboard` route and use `/today` as the protected landing route.

## Files to modify

- Auth/database: `server/utils/auth.ts`, `server/utils/auth-test.ts`, `server/api/auth/[...all].ts`, `server/api/logout.post.ts`, `server/db/`, `drizzle/`, `drizzle.config.ts`.
- Client shell: `app/lib/auth-client.ts`, `app/middleware/auth.ts`, `app/layouts/dashboard.vue`, `app/pages/{index,login,today,clients,tickets,settings}.vue`; remove `app/pages/dashboard.vue` and M0 mock session code.
- Configuration/docs: `package.json`, `pnpm-lock.yaml`, `.env.example`, `README.md`, `.github/workflows/check.yml`, this file, `docs/decisions/0003-m1-authentication-and-database.md`, workflow closeout docs.
- Tests: `tests/unit/auth-session.test.ts`, `tests/e2e/auth-shell.test.ts`, `tests/e2e/production-access.test.ts`.

## Reuse

- M0 Nuxt UI shell, dashboard layout, auth middleware migration points, OXC/Vitest/Playwright scripts.
- Official Better Auth Nuxt integration and Test Utils patterns.
- Drizzle generated migration and schema conventions.

## Decisions and ADR links

- Auth/database choices: `docs/decisions/0003-m1-authentication-and-database.md`.
- M0 completion and workflow closeout: `docs/llm-workflow.md`, `docs/milestones/README.md`.
- No production test bypass; fixture auth is test-only.

## Implementation checklist

- [x] Reconcile M0 readiness and define explicit human completion declaration/closeout gate.
- [x] Add pinned Better Auth, Drizzle, PostgreSQL driver, and migration dependencies plus `.env.example`.
- [x] Create Better Auth Drizzle schema, config, and committed migration.
- [x] Implement Better Auth handler, GitHub configuration, SSR session client, and protected middleware.
- [x] Replace M0 login/dashboard migration points with redirect-preserving auth and `/today` landing.
- [x] Build responsive protected shell and empty-state routes.
- [x] Add Better Auth Test Utils unit/browser fixtures and forged-cookie coverage.
- [x] Complete final quality gates and prepare for human code review/closeout.

## Journal

### 2026-09-21 — Implementation

- Fact: M0 completion was confirmed by the human during M1 planning; its milestone record and workflow were updated to record that decision.
- Fact: Better Auth 1.7.5, Drizzle ORM 0.45.3, Drizzle Kit 0.31.11, adapter 1.7.5, and postgres 3.4.9 were installed and pinned.
- Decision: local PostgreSQL is Docker-provided at `localhost:5432`; `.env.example` documents the connection and auth variables.
- Fact: Better Auth Test Utils creates authenticated users/session cookies against the local migrated database; no GitHub OAuth request is used by tests.
- Fact: the temporary `/dashboard` route was removed; `/` redirects to `/today`.
- Deviation: logout uses a small POST server redirect endpoint (`/api/logout`) because a native form navigation reliably completes session invalidation across the SSR shell.
- Decision: the database driver is `pg`, and both runtime/database tooling require `DATABASE_URL`; only test setup supplies a local test fallback.
- Decision: logout is a POST-only action at `/api/logout`.
- Decision: the shell destination is `/projects`; client creation behavior remains a future product/CRUD decision.
- Evidence: reviewer feedback changes were implemented; frozen install, migration, formatting, lint, typechecks, unit tests, E2E tests, build, and workflow checks pass again.
- Evidence: Better Auth migration applied successfully to the local `nxmr` database.
- Evidence: final `pnpm install --frozen-lockfile`, formatting, lint, Nuxt typecheck, tsgo, unit tests, browser tests, build, and workflow checks all passed. The CI workflow now starts PostgreSQL, applies migrations, and runs the same gates.
- Evidence: mobile iPhone 13 and desktop Chrome login screenshots were captured; the responsive login layout and keyboard-addressable native controls were visually inspected.

## Verification

- [x] `pnpm db:migrate` with local PostgreSQL: migration applied successfully.
- [x] `pnpm test`: 3 files and 11 tests passed with local PostgreSQL.
- [x] `pnpm test:e2e`: 2 browser tests passed with local PostgreSQL.
- [x] `pnpm typecheck`: passed.
- [x] `pnpm install --frozen-lockfile` and `pnpm db:migrate`: passed against local Docker PostgreSQL.
- [x] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, `pnpm test:e2e`, `pnpm build`, and `pnpm check:workflow`: passed.
- [x] Manual mobile/desktop screenshot inspection: login shell is responsive and readable; browser tests cover keyboard-addressable navigation and controls.
- [x] Human code review: Plannotator review approved with no changes requested.
- [x] Human completion declaration: the human declared “I hereby declare M1 complete.”

## Review status

- Plan review: Approved.
- Code review: Accepted via Plannotator; no changes requested.
- Milestone completion declaration: Accepted; “I hereby declare M1 complete.”

## Closeout checklist

- [x] Approved checklist complete.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded.

## Follow-ups

- Configure real GitHub OAuth credentials and production env vars for `https://nxmr.meeehdi.dev/api/auth/callback/github`.
- Provision/apply the migration in the eventual deployment environment.
- Add M2 product-domain schema and CRUD after this shell is accepted.
