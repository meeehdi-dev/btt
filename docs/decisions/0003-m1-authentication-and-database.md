# ADR 0003: M1 authentication and Better Auth database baseline

- Status: Accepted
- Date: 2026-09-21
- Supersedes: None
- Superseded by: ADR 0044 (authenticated landing-route clause only)

## Context

M1 replaces M0's development-only mock session with GitHub authentication and needs durable sessions. The product roadmap already selects PostgreSQL and Drizzle, and the user confirmed that authentication persistence and the database foundation should land together. Local development uses PostgreSQL in Docker on `localhost:5432`.

## Decision

- Use Better Auth 1.7.5 with GitHub social sign-in.
- Use Drizzle ORM 0.45.3, Drizzle Kit 0.31.11, `@better-auth/drizzle-adapter` 1.7.5, and the `pg` driver 8.16.3.
- Store Better Auth's user, session, account, and verification tables in PostgreSQL through Drizzle. M1 does not add product-domain tables.
- Require server-only environment variables: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GITHUB_CLIENT_ID`, and `GITHUB_CLIENT_SECRET`. The production base URL is `https://nxmr.meeehdi.dev`; local setup uses `http://localhost:3000`. Runtime and migration configuration fail when `DATABASE_URL` is absent; only test setup provides a local fallback.
- Mount Better Auth at `/api/auth/*`, use its Vue client with SSR session loading, protect application pages with a route middleware, and expose logout only through a POST action.
- Use Better Auth Test Utils with the local test database for deterministic session/unit and browser tests. Keep the test plugin out of production auth configuration.
- Treat the pre-deployment `/dashboard` removal as acceptable; `/today` is the authenticated landing route. The shell's project destination is `/projects`; client creation behavior remains future CRUD scope.

## Consequences

M1 requires a running PostgreSQL instance and a migration before the app can authenticate. OAuth credentials remain outside the repository. Test setup can create authenticated sessions without contacting GitHub, while the real login flow remains documented for local/production configuration.

## Alternatives considered

- Keep mock authentication: rejected because M1 is the real-authentication milestone.
- Defer persistence to M2: rejected by the user; durable auth and the PostgreSQL/Drizzle foundation are implemented together.
- Use a production-enabled auth test bypass: rejected because it would weaken the authentication boundary.
- Preserve `/dashboard`: rejected before MVP deployment; clean route structure is preferred over compatibility.

## Links

- `PLAN.md`
- `plans/m1-authentication-shell.md`
- `docs/milestones/m1-authentication-shell.md`
- `https://better-auth.com/docs/integrations/nuxt`
- `https://better-auth.com/docs/plugins/test-utils`
