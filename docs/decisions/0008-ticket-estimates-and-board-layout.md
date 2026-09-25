# ADR 0008: Human-readable ticket estimates and responsive board

- Status: Accepted
- Date: 2026-09-25
- Supersedes: None
- Superseded by: None

## Context

M3 tickets persist positive integer estimate minutes, but asking users to enter raw minutes makes common hour estimates awkward. Seven statuses also need a scannable layout on desktop without making mobile columns too narrow.

## Decision

- Keep API and database estimates as nullable positive integer minutes. At the ticket create/edit UI boundary, parse human durations with `parse-duration-ms` 0.1.0 (MIT, no runtime dependencies) plus a small adapter for bare numbers as minutes and for enforcing whole positive minutes within PostgreSQL's integer range. Format stored minutes as compact hours/minutes and show a clock icon when an estimate exists. No time-tracking domain change.
- Display seven status lanes on one horizontally scrollable desktop/tablet row, including empty lanes. On mobile, stack seven accessible status sections, collapsed by default, with counts visible in their triggers.
- Let authenticated pages use available width with responsive gutters; keep the unauthenticated login card centered.
- Allow ticket creation with optional links and related tickets in one atomic API mutation, preserving existing separate endpoints for later editing. Validate owned, visible relation targets and safe URLs before persistence; do not partially save a ticket when extras are invalid.

## Consequences

The UI accepts `1hr`, `1 hr`, `45m`, `1h 30m`, `1.5h` and bare `90`, while the API continues to accept integer minutes. Values resolving to fractional minutes, zero, or overflow are rejected. The dependency adds a small runtime parser but no new tables, migrations, or Jira integration. The board scrolls locally on narrower desktop screens rather than expanding the entire page.

## Alternatives considered

- `ms`: does not support compound input and interprets bare numbers as milliseconds.
- `parse-duration`: accepts noisy strings, less appropriate for strict form validation.
- Handwritten duration grammar: rejected to avoid maintaining a bespoke parser for whitespace, decimals and compound expressions.
- Seven fixed columns on mobile: rejected in favor of collapsed one-column sections.

## Links

- `plans/m3-ticket-creation-and-board-polish.md`
- `docs/milestones/m3-tickets-mvp.md`
- `docs/decisions/0007-m3-ticket-model-and-relations.md`
- <https://github.com/sindresorhus/parse-duration-ms>
- <https://ui.nuxt.com/docs/components/collapsible>
