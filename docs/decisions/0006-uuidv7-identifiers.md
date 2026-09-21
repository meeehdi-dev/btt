# ADR 0006: UUIDv7 identifiers across auth and domain data

- Status: Accepted
- Date: 2026-09-21
- Supersedes: None
- Superseded by: None

## Context

M2 domain identifiers used UUIDv4 strings, while Better Auth generated opaque text identifiers. M3 will add more relationships, so the project needs one time-ordered identifier strategy before expanding the schema. The app is pre-MVP and undeployed; the local database may be reset.

## Decision

- Use RFC 9562 UUIDv7 for every generated entity identifier: Better Auth user, session, account, and verification IDs, plus application/domain IDs.
- Store generated IDs and all corresponding foreign keys in PostgreSQL native `uuid` columns through Drizzle's `uuid()` builder.
- Use the maintained `uuid` package's typed `v7()` API through `server/utils/id.ts` as the shared generator.
- Configure Better Auth's `advanced.database.generateId` callback to use that generator in production and test auth configurations.
- Keep semantic provider identifiers and opaque credentials/tokens, including `accountId`, session tokens, verification identifiers, and verification values, as text.
- Since no environment is deployed before MVP, reset the local database and apply a clean schema migration rather than introducing production backfill/rollback machinery now.

## Consequences

All generated entity IDs are canonical UUID strings at application boundaries and native UUID values in PostgreSQL. Better Auth and domain creation paths share the same generator. The `uuid` package is a direct dependency, and future migrations must use UUID-compatible IDs and foreign keys. Existing development records are disposable until the MVP deployment boundary.

## Alternatives considered

- Better Auth's built-in `advanced.database.generateId: "uuid"`: rejected because the installed implementation uses UUIDv4, not UUIDv7.
- PostgreSQL `gen_random_uuid()` defaults: rejected because they generate UUIDv4 and cannot satisfy the UUIDv7 requirement.
- Node's native `crypto.randomUUIDv7()`: not selected because the installed Node type declarations do not expose it; the maintained `uuid` package provides typed UUIDv7 support.
- Production-style dual-column backfill/cutover: deferred until an actual deployment boundary exists.

## Links

- `plans/m2.5-uuidv7-identifier-migration.md`
- `docs/milestones/m2.5-uuidv7-identifier-migration.md`
- `docs/decisions/0003-m1-authentication-and-database.md`
- `docs/decisions/0004-m2-core-data-model.md`
- `https://better-auth.com/docs/reference/options`
- `https://better-auth.com/docs/concepts/database`
- `https://github.com/uuidjs/uuid`
