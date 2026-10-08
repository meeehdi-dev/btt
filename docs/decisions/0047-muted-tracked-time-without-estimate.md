# ADR 0047: Muted tracked time without an estimate

- Status: Accepted
- Date: 2026-10-08
- Supersedes: The no-estimate tracked-time emphasis guidance from ADR 0019
- Superseded by: None

## Context

Ticket usage displays color tracked time by the estimate ratio when an estimate exists. Without an estimate, the ratio has no meaning, and a primary-colored value can imply a positive usage state where none has been established.

## Decision

- Render tracked-time values with the muted semantic text color when their ticket has no estimate, in shared ticket usage displays and ticket-detail tracked-time summaries.
- When an estimate exists, retain the usage-ratio colors defined by ADR 0020; keep the estimate muted.

## Consequences

Unestimated tracked time has neutral emphasis across Board/release cards and ticket detail. Agenda time-entry labels are already muted and remain unchanged. No data, API, or persistence behavior changes.

## Alternatives considered

- Keep the primary color when no estimate exists: rejected because it implies a positive usage state without a ratio.
- Apply a ratio color without an estimate: not meaningful because there is no denominator.

## Links

- [ADR 0019 — ticket usage contrast and context count badges](0019-ticket-usage-contrast-and-context-count-badges.md)
- [ADR 0020 — M8 polish and shared-work decisions](0020-m8-polish-decisions.md)
- [M32 — Ticket Board status icons, card sizing, and quiet Done visibility](../milestones/m32-ticket-board-status-icons-cards-and-done-visibility.md)
