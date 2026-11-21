# ADR 0008: Human-readable ticket estimates and Board lanes

- Status: Accepted
- Date: 2026-09-25
- Supersedes: None
- Superseded by: None

## Context

Tickets persist positive integer estimate minutes, but asking users to type raw minutes makes common hour estimates awkward. The workflow statuses also need a scannable layout.

## Goal

Let people enter and read estimates in natural units, and see every workflow status at a glance on the Ticket Board, while keeping storage and API simple.

## Decision

- API and database estimates stay nullable positive integer minutes. The ticket form accepts human durations (`1hr`, `1 hr`, `45m`, `1h 30m`, `1.5h`) and bare numbers as minutes. Values resolving to fractional minutes, zero, or beyond the database integer range are rejected.
- Stored minutes display as compact hours/minutes with a clock icon when an estimate exists.
- The Board shows one lane per status, in status order, including empty lanes, in a single row that scrolls horizontally inside the Board rather than the page (desktop-only UI, ADR 0042).
- A ticket can be created together with optional links and related tickets in one atomic API mutation. Owned, visible relation targets and safe URLs are validated first; an invalid extra saves nothing. Separate endpoints remain for later edits.

## Consequences

Users type natural durations while the API keeps integer minutes. The parser is one small runtime dependency; no new tables or time-tracking changes.

## Implementation notes (non-binding)

- Parsing uses `parse-duration-ms` plus a small adapter in `app/utils/ticket-estimate.ts`.

## Alternatives considered

- `ms`: no compound input; bare numbers mean milliseconds.
- `parse-duration`: accepts noisy strings, too lax for form validation.
- Handwritten grammar: not worth maintaining.

## Revisions

- 2026-11-21: Rewritten to goal-level form; dropped the retired mobile stacked-lane and responsive-gutter clauses (ADR 0042), updated lanes for On hold, moved the library to notes.
