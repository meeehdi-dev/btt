# ADR 0003: Authentication and durable sessions

- Status: Accepted
- Date: 2026-09-21
- Supersedes: None
- Superseded by: None

## Context

The product needs real GitHub sign-in and durable sessions backed by the application database. Development and automated tests also need authenticated sessions without contacting GitHub, and that convenience must never weaken production authentication. The earlier bootstrap baseline (ADR 0002) used mock authentication that was not a security boundary.

## Goal

Only real GitHub-authenticated users reach application data, with sessions persisted server-side. Any test-only authentication path is impossible to enable in production.

## Decision

- Sign in with GitHub; persist users, sessions, accounts, and verification records in PostgreSQL.
- Protect application pages with a route guard. A failed session read is "unavailable", not "logged out" (see ADR 0024). Logout is a POST action only.
- Authenticated users land on `/agenda` (see ADR 0044); the legacy `/dashboard` and `/today` routes are not kept.
- Secrets and OAuth credentials are server-only environment variables and stay out of the repository. Runtime and migration configuration fail when the database URL is absent; only test setup may fall back to a local database.
- Test authentication uses a separate auth configuration with a test-session plugin. The production auth configuration never includes it, so test auth fails closed in production. Tests create sessions directly against the test database.

## Consequences

A running PostgreSQL instance and applied migrations are required before sign-in works. Tests can create authenticated sessions deterministically while the real login flow is configured per environment. Nothing in test auth is a security boundary; it must never protect real data.

## Implementation notes (non-binding)

- Better Auth with the Drizzle adapter and `pg`; mounted at `/api/auth/*`; Vue client with SSR session loading; route middleware `app/middleware/auth.ts`.
- Test configuration lives in `server/utils/auth-test.ts` (Better Auth `testUtils` plugin); production config in `server/utils/auth.ts`.
- Env vars: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`. Local base URL `http://localhost:3000`.

## Alternatives considered

- Keep mock authentication: rejected; real authentication is required.
- Production-enabled auth test bypass: rejected because it would weaken the authentication boundary.
- Defer persistence: rejected; durable auth and the database foundation land together.
- Preserve `/dashboard`: rejected before MVP deployment; clean routes over compatibility.

## Revisions

- 2026-11-21: Rewritten to goal-level form; folded in the landing-route change from ADR 0044 (`/agenda`), absorbed fail-closed test auth from ADR 0002, moved libraries and env vars to notes.
