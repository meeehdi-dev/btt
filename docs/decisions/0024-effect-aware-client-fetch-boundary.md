# ADR 0024: Effect-aware client fetch boundary

- Status: Accepted
- Date: 2026-09-27
- Supersedes: None
- Superseded by: None

## Context

Client API reads need typed, safe failures without replacing Nuxt's SSR, hydration, reactive-query, dedupe, refresh, and cancellation lifecycle. Better Auth's session fetch must preserve request cookies during SSR. Imperative writes also need explicit failure handling, especially when a write succeeds but its follow-up read fails.

## Decision

- Wrap Nuxt's `createUseFetch` `$fetch` seam with Effect and typed client failures. Keep Nuxt `useFetch` as the owner of async-data state and lifecycle; use `useRequestFetch()` on the server to forward request cookies and headers.
- Run imperative client requests through a shared Effect boundary. Preserve expected 400/401/404/409 outcomes using safe public messages; project 5xx, network, defect, and unknown failures to generic user feedback without exposing raw causes.
- Treat session-read errors as unavailable, not proof of unauthenticated state. Fail closed without redirecting to login.
- Report write success plus refresh failure as partial success, and offer a read retry instead of inviting a duplicate write. Keep logout as the existing native POST form.

## Consequences

- SSR payload reuse, reactive request options, pending/error state, refresh, and abort handling remain Nuxt-owned.
- Better Auth continues using its `useSession(useFetch)` integration with SSR cookie forwarding.
- Client views must explicitly distinguish failed reads from empty data/not-found and handle post-write refresh outcomes.
- No Effect/Nuxt dependency, global retry/cache policy, server/API change, or logout behavior change is introduced.

## Alternatives considered

- Replace `useFetch` with a new Effect state/data layer: rejected because it would duplicate Nuxt SSR, hydration, request-key, and cancellation behavior.
- Keep raw `$fetch` and page-local `try/catch`: rejected because failure mapping, cause privacy, and partial-success handling would remain inconsistent.
- Redirect to login on any session error: rejected because a provider/network failure does not prove that the user is unauthenticated.

## Links

- `docs/milestones/m11-client-effect-workflows.md`
- `docs/decisions/0021-effect-for-fallible-operations.md`
- `docs/decisions/0023-server-effect-http-boundary.md`
- `app/utils/client-effect.ts`
- `app/composables/useApiFetch.ts`
