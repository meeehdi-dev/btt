# ADR 0021: Effect for meaningful fallible operations

- Status: Accepted
- Date: 2026-09-27
- Supersedes: The Effect-use guidance in ADR 0002 only; other M0 baseline decisions remain unchanged
- Superseded by: None

## Context

ADR 0002 says to use Effect deliberately for domain/server logic, “not sprinkled everywhere.” That wording can be read too narrowly. The human clarified that meaningful code which can fail should use Effect so expected errors are typed and handled, while trivial/infallible uses add no value. This pass also needs one consistent principle for server operations and client workflows.

## Decision

- Use Effect v4 for meaningful fallible application work where integration permits it, including validation, domain operations, persistence/auth/network boundaries, and UI-triggered requests or mutations.
- Model expected failures in the typed error channel and handle them at an explicit boundary appropriate to the layer (HTTP response or accessible UI state).
- Keep unexpected runtime/infrastructure failures distinct from expected domain failures. Preserve causes for server diagnostics, return safe external errors, and do not swallow or disguise failures as successful empty data.
- Keep pure, total calculations and static values as ordinary values; do not wrap them in `Effect.succeed` solely for uniform syntax.
- Preserve framework lifecycle and runtime requirements. If a fallible integration cannot use Effect without losing required behavior, document the evidence and obtain approval for an exception in the relevant milestone plan.

## Consequences

Fallible workflows should have typed outcomes and explicit recovery or reporting paths across server and client code. Shared adapters/composables may be added where they clarify framework integration. The migration should be phased and tested because broad conversion can affect error mapping, SSR/hydration, cancellation, loading state, and user-visible behavior. Effect does not prevent defects, outages, or programming errors; the policy is to model and handle them predictably, not claim they cannot happen.

## Alternatives considered

- Restrict Effect to selected server domain modules: rejected as the default because meaningful client-side and infrastructure failures also need typed, consistent handling.
- Wrap all functions and constants in Effect: rejected because pure/infallible work gains no useful typed failure path.
- Replace framework lifecycle APIs wholesale without preserving their behavior: rejected; Effect integration must retain the framework's required SSR, hydration, session, and UI semantics.

## Links

- `docs/decisions/0002-m0-bootstrap-baseline.md`
- `docs/decisions/0005-m2-domain-validation-and-ui-polish.md`
- `plans/wide-app-composability-effect-pass.md`
