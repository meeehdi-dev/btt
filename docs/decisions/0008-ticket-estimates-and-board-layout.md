# ADR 0008: Board lanes and atomic ticket creation

- Status: Accepted
- Date: 2026-09-25
- Supersedes: None
- Superseded by: None

## Context

The workflow statuses need a scannable layout, and tickets can be created with optional links in one step.

## Goal

See every workflow status at a glance on the Ticket Board.

## Decision

- The Board shows one lane per status, in status order, including empty lanes, in a single row that scrolls horizontally inside the Board rather than the page (desktop-only UI, ADR 0042).
- A ticket can be created together with optional links in one atomic API mutation. Safe URLs are validated first; an invalid extra saves nothing. Separate endpoints remain for later edits.

## Consequences

Every status has a visible lane.

## Implementation notes (non-binding)

- `app/utils/ticket-estimate.ts` now only formats durations.

## Revisions

- 2026-11-21: Rewritten to goal-level form; dropped the retired mobile stacked-lane and responsive-gutter clauses (ADR 0042), updated lanes for On hold, moved the library to notes.
- 2026-11-23: Retitled to its surviving goal; estimate input and its parser removed with ticket estimates (ADR 0067), related-ticket creation extras removed; Board lanes unchanged.
