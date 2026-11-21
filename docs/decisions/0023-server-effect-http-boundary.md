# ADR 0023: Server error boundary and HTTP failure mapping

- Status: Accepted
- Date: 2026-09-27
- Supersedes: None
- Superseded by: None

## Context

API handlers once ran database and auth calls directly, so expected domain failures and unexpected infrastructure failures shared no typed boundary, and every body-decoding failure became HTTP 400. Request bodies were also accepted untyped.

## Goal

Request input is validated at the boundary, expected failures are typed and map to consistent HTTP statuses, and internal causes never reach clients.

## Decision

- Application API handlers run through one shared boundary. Request bodies are decoded and validated there before handlers touch persistence.
- Rejectable persistence and auth calls carry operation context and preserve the original cause in a typed infrastructure error.
- Expected failures map to: validation 400, no authenticated session 401, missing or owner-hidden record 404, domain conflict 409. Framework-generated request errors keep their statuses.
- Infrastructure failures, defects, unclassified causes, and runner failures return a generic 500. Causes go only to server diagnostics, never to the response, and are never turned into successful empty results.
- The auth library's own HTTP handler and database startup configuration stay outside this wrapper.

## Consequences

HTTP outcomes are explicit in error types, and rejected persistence stays distinguishable from invalid input. Handlers must preserve owner-scoped queries, transaction semantics, and response contracts. Centralized validation leaves handlers responsible only for persistence and ownership.

## Implementation notes (non-binding)

- Shared wrapper `defineEffectHandler` in `server/utils/effect-handler.ts`; Effect `Schema` decoding for bodies; tagged domain errors; `Effect.tryPromise` around Drizzle/Better Auth calls.

## Alternatives considered

- Map every rejected promise to validation or not-found: rejected; infrastructure failures must stay server failures.
- Rewrite responses in a global Nitro error hook: rejected; that hook is meant for observation, not response rewriting.
- Expose exception messages to clients: rejected; they may leak database or auth details.
- Wrap the auth library's catch-all handler: rejected; it owns its response contract.

## Revisions

- 2026-11-21: Rewritten to goal-level form; absorbed boundary-validation rules from ADR 0005; moved implementation names to notes.
