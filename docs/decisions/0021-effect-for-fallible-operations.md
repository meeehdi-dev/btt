# ADR 0021: Typed errors for meaningful fallible operations

- Status: Accepted
- Date: 2026-09-27
- Supersedes: None
- Superseded by: None

## Context

Meaningful code that can fail should surface expected errors as typed values handled at explicit boundaries, while trivial or infallible code gains nothing from the ceremony. One consistent principle is needed for server operations and client workflows.

## Goal

Meaningful fallible work has typed outcomes and explicit recovery or reporting paths, on server and client alike. Pure, total code stays plain.

## Decision

- Validation, domain operations, persistence/auth/network boundaries, and UI-triggered requests model expected failures in a typed error channel.
- Expected failures are handled at an explicit boundary for the layer: an HTTP response or an accessible UI state.
- Unexpected runtime or infrastructure failures stay distinct from expected domain failures. Causes are kept for server diagnostics, external errors are safe, and failures are never disguised as successful empty data.
- Pure, total calculations and static values stay ordinary values; they are not wrapped for uniform syntax.
- Framework lifecycle and runtime requirements are preserved. If a fallible integration cannot adopt the typed approach without losing required behavior, document the evidence and get approval for the exception.

## Consequences

Fallible workflows get predictable outcomes. Broad conversion can affect error mapping, SSR/hydration, cancellation, and loading state, so it should be phased and tested. Typed errors do not prevent defects or outages; they make them handled predictably.

## Implementation notes (non-binding)

- Effect (v4) is the current tool. Server boundary: ADR 0023. Client boundary: ADR 0024.

## Alternatives considered

- Limit typed errors to server domain modules: rejected; client and infrastructure failures need consistent handling too.
- Wrap every function and constant: rejected; pure work gains no useful failure path.
- Replace framework lifecycle APIs wholesale: rejected; SSR, hydration, and session semantics must survive.

## Revisions

- 2026-11-21: Rewritten to goal-level form; made the principle tool-neutral (Effect moved to notes); dropped the clause superseding ADR 0002 (ADR 0002 is now history).
