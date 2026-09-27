# ADR 0023: Server Effect boundary and HTTP failure mapping

- Status: Accepted
- Date: 2026-09-27
- Supersedes: None
- Superseded by: None

## Context

Application API handlers performed Drizzle and Better Auth Promise operations directly. Expected domain failures and unexpected infrastructure/runtime failures did not share a typed boundary; request-body decoding also translated every failed Effect to HTTP 400. ADR 0021 requires typed expected failures and explicit boundary handling for meaningful fallible work.

## Decision

- Compose application-owned server request handling as Effect v4 programs and run them at one shared `defineEffectHandler` boundary. Use `Effect.tryPromise` with operation context for rejectable Drizzle and Better Auth calls, preserving the original cause in a typed infrastructure error.
- Map expected failures consistently: validation to 400, no authenticated session to 401, owner-hidden/missing records to 404, and domain conflicts to 409. Preserve framework-generated H3 request errors and their existing statuses.
- Return a generic 500 for infrastructure failures, defects, mixed/unclassified causes, and runner failures. Keep causes in server-only diagnostics; never include them in the HTTP error response or convert them into client errors/successful empty results.
- Keep Better Auth's catch-all handler and application database startup configuration outside the application API wrapper. No auth policy, schema, API-success payload, dependency, or deployment change is implied.

## Consequences

Expected HTTP outcomes are explicit in Effect error types, while rejected persistence/session operations remain distinguishable from invalid user input. Application-owned routes share a safe translation/logging policy. Handler logic must preserve owner-scoped SQL, transaction semantics, and existing response contracts when expressed as Effects. Better Auth continues to own its catch-all HTTP behavior.

## Alternatives considered

- Map every rejected promise to validation or not-found: rejected because infrastructure failures must remain server failures and retain causes.
- Rewrite API responses from a global Nitro error hook: rejected because Nuxt documents a shared handler-wrapper pattern for custom handling, while the Nitro error hook is intended for observation/logging rather than response rewriting.
- Expose exception messages or causes to clients: rejected because they may contain internal database/auth details.
- Convert Better Auth's catch-all into the app wrapper: rejected because it is a library-owned HTTP integration with its own response contract.

## Links

- `docs/decisions/0021-effect-for-fallible-operations.md`
- `docs/milestones/m10-server-effect-reliability.md`
- `plans/wide-app-composability-effect-pass.md`
- [Nuxt 4 server directory and handler wrapper](https://nuxt.com/docs/4.x/directory-structure/server)
- [Effect v4 running effects](https://effect.website/docs/v4/getting-started/running-effects)
- [Effect v4 expected errors](https://effect.website/docs/v4/error-management/expected-errors)
