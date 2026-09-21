# M1 — Authentication and protected shell

## Context

M0 is implemented and the user has confirmed its completion/code-review acceptance, although the milestone record still says review is pending. M1 should replace the development-only mock access with Better Auth GitHub authentication and provide the first usable protected application shell for the solo user.

This is a readiness/implementation plan only; no application code is changed during planning.

## Readiness snapshot

- Facts: `PLAN.md` defines M1 as login, Better Auth GitHub login, session handling, protected layout, and Today/Clients-Projects/Tickets/Settings navigation with empty states.
- Facts: M0 explicitly defers real authentication to M1 and currently contains mock session, auth middleware, login/dashboard shell, CI/tooling, and an Effect example.
- Facts: the repository workflow checker passes; the working tree contains only this new planning file; the M0 milestone still says code review is pending even though the user has now declared M0 complete.
- Fact: the current M0 automated checks are mixed: `pnpm test`, `pnpm typecheck`, `pnpm build`, `pnpm test:e2e`, `pnpm lint`, and `pnpm check:workflow` pass; `pnpm format:check` fails on four existing markdown/script files (`docs/decisions/README.md`, `docs/llm-workflow.md`, `docs/templates/review-template.md`, `scripts/check-workflow-docs.mjs`). This is a documentation/tooling readiness discrepancy, not an M1 auth failure.
- Fact: the configured registry currently reports Better Auth 1.7.5, `@better-auth/drizzle-adapter` 1.7.5, Drizzle ORM 0.45.3, Drizzle Kit 0.31.11, and `postgres` 3.4.9; exact compatibility must still be verified with the lockfile and Nuxt build.
- Facts: M0's mock session is currently exposed through `useMockSession`, `middleware/auth.ts`, `pages/login.vue`, and `pages/dashboard.vue`; `nuxt.config.ts` enables demo auth for every non-production `NODE_ENV`.
- Decision from user: M1 should implement Better Auth persistence and the PostgreSQL/Drizzle foundation together, not defer auth storage to M2.
- Decision from user: production OAuth host is `nxmr.meeehdi.dev`; automated auth tests may use a stub rather than real GitHub OAuth.
- Decision from user: local PostgreSQL runs in Docker and is exposed at `localhost:5432`; provide `.env.example` with the required `DATABASE_URL` and auth variables, keep `.env` ignored, and do not provision secrets or services in the repository.

## Approved scope

- Pending human approval.
- Better Auth server integration with GitHub provider.
- PostgreSQL connection, Drizzle ORM/Kit setup, Better Auth Drizzle schema, and migrations.
- Session-aware server protection and client session access.
- Login/callback/logout flow and protected shell.
- Responsive navigation for Today, Clients/Projects, Tickets, and Settings.
- Empty states for those core destinations.
- Test-only auth stub/fixture and tests/evidence for authenticated and unauthenticated behavior.
- Clarification of milestone completion/closeout workflow, including recording M0’s human completion decision and resolving the known formatting discrepancy.

## Out of scope

- Clients/projects/releases/tickets/time-entry CRUD (M2+); only Better Auth tables are created in M1.
- Application domain tables or foreign keys for the M2+ work hierarchy.
- Authorization beyond the single-user authenticated workspace.
- OAuth provider(s) other than GitHub.
- Agenda, ticket board, search, or product data features.
- Production deployment automation, secrets, or committing `.env` values; M1 documents the eventual production callback but runs migrations against the local Docker PostgreSQL instance.

## Source references

- `AGENTS.md`
- `docs/llm-workflow.md`
- `PLAN.md`
- `docs/milestones/m0-project-bootstrap.md`
- `docs/decisions/0001-llm-assisted-development-workflow.md`
- `docs/decisions/0002-m0-bootstrap-baseline.md`
- `docs/templates/milestone-template.md`
- Better Auth official Nuxt integration: <https://better-auth.com/docs/integrations/nuxt>
- Better Auth official installation/database guidance: <https://better-auth.com/docs/installation>
- Better Auth official Test Utils guidance: <https://better-auth.com/docs/plugins/test-utils>

## Approach

1. Treat the user’s declaration as the M0 completion decision, then repair the durable milestone record/workflow language so completion means implementation verification plus human code-review acceptance, with explicit closeout evidence.
2. Add the PostgreSQL/Drizzle baseline and Better Auth’s generated schema together. Keep auth configuration server-only, expose the official Nuxt Better Auth handler at `/api/auth/[...all]`, and configure GitHub OAuth with runtime secrets and the production callback host `https://nxmr.meeehdi.dev/api/auth/callback/github`.
3. Use Better Auth’s Vue client/session composable with SSR cookie forwarding for the shell. Replace the mock middleware with a server/session-aware guard that fails closed, while preserving a test-only stub seam that cannot be enabled in production.
4. Build a small responsive authenticated layout with navigation links for Today, Clients/Projects, Tickets, and Settings. Use route-level empty-state pages; keep product CRUD and domain schema outside M1.
5. Test the auth boundary deterministically using a local/stubbed auth mode or Better Auth test utilities, plus browser coverage for login redirect, successful test sign-in, navigation, session persistence, and logout. Document real GitHub OAuth setup without requiring secrets in CI.

## Files to modify

- `package.json`, `pnpm-lock.yaml` — Better Auth, Drizzle PostgreSQL adapter/driver, migration tooling, and approved test support.
- `nuxt.config.ts`, `.env.example`, `README.md` — runtime secrets, base URL/callback configuration, local database and OAuth setup.
- `server/utils/auth.ts` (or equivalent server-only auth module), `server/api/auth/[...all].ts`, `server/middleware/` or protected server helpers — Better Auth configuration, handler, and session protection.
- `server/db/` and `drizzle/` (or project-approved equivalent) — PostgreSQL connection, Better Auth schema, and migrations.
- `app/lib/auth-client.ts` (or equivalent), `app/middleware/auth.ts`, `app/composables/` — client session and route protection.
- `app/layouts/dashboard.vue`, `app/pages/login.vue`, `app/pages/{today,clients,tickets,settings}.vue` (exact route names to confirm) — authenticated shell and empty states.
- `tests/unit/`, `tests/nuxt/`, `tests/e2e/` — auth/session stubs and browser coverage.
- `docs/milestones/m1-authentication-shell.md`, a new auth/database ADR, and workflow/milestone docs clarifying completion/closeout.

## Reuse

- Reuse M0 `app/layouts/dashboard.vue`, `app/middleware/auth.ts`, `app/pages/login.vue`, and `app/pages/dashboard.vue` as migration points, not parallel implementations.
- Reuse Nuxt UI’s existing `UApp`/semantic color conventions and the existing OXC, Nuxt typecheck, Vitest, Playwright, build, and workflow-check scripts.
- Follow Better Auth’s official Nuxt integration: `server/api/auth/[...all].ts`, `better-auth/vue`, `useSession(useFetch)` for SSR, and `signIn.social({ provider: 'github' })`.
- Use Better Auth’s official Drizzle adapter/schema generation guidance and keep DB access server-only.
- Use the project-local Nuxt UI and Effect guidance where those APIs are touched; no new Effect domain layer is needed for basic auth plumbing unless an existing boundary requires it.

## Decisions and ADR links

- M0 mock authentication is development/test-only; M1 must establish the real-auth replacement without weakening production fail-closed behavior.
- Any auth, secret, persistence, dependency, or deployment decision requiring scope expansion must be approved and recorded in an ADR.

## Steps

- [x] Reconcile M0 readiness: record the user’s human completion/code-review decision, define the missing closeout gate in workflow/milestone docs, and fix or explicitly document the four-file `pnpm format:check` discrepancy before relying on M1 CI evidence.
- [x] Pin and install compatible Better Auth, Drizzle PostgreSQL adapter/driver, and migration dependencies; keep `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GITHUB_CLIENT_ID`, and `GITHUB_CLIENT_SECRET` server-only, with `BETTER_AUTH_URL=https://nxmr.meeehdi.dev` for production and a localhost override for development.
- [x] Create the server-only PostgreSQL/Drizzle connection, generate the Better Auth Drizzle schema, add a committed migration, and document applying it locally/at deployment; do not add M2 domain tables.
- [x] Implement Better Auth at `server/api/auth/[...all].ts`, configure GitHub OAuth and the production callback `https://nxmr.meeehdi.dev/api/auth/callback/github`, and replace mock-only session handling with the official SSR-aware Vue client/session flow.
- [x] Replace the M0 auth middleware/login/dashboard migration points with redirect-preserving protected routes, logout, and fail-closed server checks; remove the demo bypass from the production path.
- [x] Build a mobile-ready `/today`, `/projects`, `/tickets`, and `/settings` shell with comfortable, polished desktop presentation, shared responsive navigation, user identity, logout, and clear empty states. Remove the temporary M0 `/dashboard` route rather than preserving a compatibility alias; breaking changes are acceptable before the complete MVP deployment.
- [x] Add a test-only Better Auth configuration/stub or fixture (never production-enabled), unit/route coverage, and Playwright coverage for redirect, authenticated shell navigation, reload/session persistence, logout, and forged-cookie rejection.
- [x] Resolve review feedback: require `DATABASE_URL`, use `pg`, make logout POST-only, and rename the shell destination to Projects.
- [x] Run all quality gates, manually inspect mobile/desktop/keyboard behavior, update the M1 milestone journal/verification and auth/database ADR, and submit the diff for human code review and formal milestone closeout.

## Verification

- [x] `pnpm install --frozen-lockfile` succeeds after approved dependency changes and the Better Auth schema migration is reproducible against PostgreSQL.
- [x] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm build`, and `pnpm check:workflow` pass; any environment-only limitations are recorded rather than hidden.
- [x] Manual responsive and keyboard check confirms navigation, identity/logout controls, and empty states at mobile and desktop widths.
- [x] Unauthenticated access redirects to login with a return target; the test-authenticated session reaches Today, Clients/Projects, Tickets, and Settings; reload preserves the session; logout invalidates access.
- [x] GitHub OAuth configuration uses the documented host/callback, while automated tests use only a test stub/fixture and no real credentials.
- [x] Production configuration has no demo/mock bypass; forged M0 cookies do not authenticate; secrets are documented but not committed.
- [x] The milestone is marked complete only after implementation evidence is recorded, reviewer findings are resolved, human code review is accepted, and the milestone closeout checklist is complete. The human declared “I hereby declare M1 complete”; the declaration was recorded in the milestone closeout. The declaration is the acceptance decision, not a substitute for verification evidence.

## Decisions confirmed by user

- PostgreSQL is local Docker PostgreSQL available at `localhost:5432`; migrations will be documented/run locally.
- `.env.example` will document `DATABASE_URL`, Better Auth secret/base URL, and GitHub credentials; `.env` remains gitignored and no secrets are committed.
- Pre-deployment breaking changes are acceptable; remove the temporary M0 `/dashboard` route rather than preserving it as an alias.
- Use the recommended Better Auth Test Utils approach with a test database/session fixture, keeping Test Utils out of production configuration.
- Milestone completion requires both evidence and human acceptance. The human can explicitly declare completion after review; the agent records that declaration and updates the milestone closeout fields.

## Review status

- Plan review: Pending
- Code review: Pending

## Follow-ups

- Record implementation evidence and deviations in `docs/milestones/m1-authentication-shell.md` once the plan is approved and implementation begins.
- Update `docs/llm-workflow.md`, `docs/milestones/README.md`, and `docs/templates/milestone-template.md` so “completed” explicitly means implementation checklist complete, verification evidence recorded, human code review accepted, and a human completion declaration recorded in the milestone journal/review status. The declaration can be a direct chat statement; the agent is responsible for transcribing it into the milestone record. Update M0’s review/closeout status to match the user’s decision.
