# ADR 0024: Safe client read and write boundary

- Status: Accepted
- Date: 2026-09-27
- Supersedes: None
- Superseded by: None

## Context

Client API reads need typed, safe failures without replacing the framework's SSR, hydration, reactive-query, dedupe, refresh, and cancellation lifecycle. The session read must preserve request cookies during SSR. Writes need explicit failure handling, especially when a write succeeds but its follow-up read fails.

## Goal

Client reads and writes fail safely and visibly: a failed session read is never treated as "logged out", and a successful write is never invited to repeat because a refresh failed.

## Decision

- Client reads keep the framework as owner of async-data state and lifecycle; typed failure handling wraps the fetch seam, and server-side reads forward request cookies and headers.
- Imperative client requests share one boundary. Expected 400/401/404/409 outcomes show safe public messages; 5xx, network, defect, and unknown failures show generic feedback without raw causes.
- A session-read error means "unavailable", not "unauthenticated": fail closed without redirecting to login.
- A write that succeeded but whose refresh failed is reported as partial success with a read retry, not a duplicate write.
- Views distinguish failed reads from empty data and not-found. Logout stays a native POST form.

## Consequences

SSR payload reuse, reactive options, pending/error state, refresh, and abort stay framework-owned. No global retry or cache policy is introduced.

## Implementation notes (non-binding)

- `app/utils/client-effect.ts` and `app/composables/useApiFetch.ts` wrap Nuxt `createUseFetch` with Effect; Better Auth's `useSession(useFetch)` integration forwards SSR cookies via `useRequestFetch()`.

## Alternatives considered

- Replace `useFetch` with a custom state layer: rejected; duplicates SSR, hydration, key, and cancellation behavior.
- Raw `$fetch` with page-local `try/catch`: rejected; failure mapping and partial-success handling would diverge.
- Redirect to login on any session error: rejected; a provider or network failure does not prove the user is unauthenticated.

## Revisions

- 2026-11-21: Rewritten to goal-level form; moved framework and file details to notes.
