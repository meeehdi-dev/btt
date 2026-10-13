# ADR 0055: On hold ticket status

- Status: Accepted
- Date: 2026-10-13
- Supersedes: None
- Superseded by: None

## Context

Tickets have seven fixed workflow statuses from Idea through Done. The user requests a distinct pause state at the far left of the Ticket Board, with a pause icon. This is a workflow status, not a ticket priority or a generic label.

## Decision

- Add the fixed status value and display label **On hold**, before Idea in the shared ordered status list. This is the leftmost Ticket Board lane; the existing order from Idea through Done remains unchanged.
- Use the neutral Lucide `pause` icon (`lucide:pause`) for On hold wherever an individual ticket status is displayed, including Board lanes, status menus, Agenda/Release/ticket-detail controls, and ticket identity surfaces.
- Include On hold in the existing status selectors and API validation. Do not add status-transition restrictions or a separate control path.
- Add On hold to the PostgreSQL ticket-status enum through an additive migration. Preserve existing ticket status values and keep the default for new tickets as Idea.
- Keep the New ticket form unchanged; new tickets created there continue to default to Idea.
- On hold is not Done: tickets in this state remain unfinished, remain eligible for the active Board's non-Done visibility, and count as incomplete in Release progress/completion behavior.
- Keep the priority model, status colors, archive rules, Done-specific quiet-visibility rule, and all existing status-write behavior unchanged.

## Consequences

- Paused work has an explicit, visible state and occupies the leftmost Board lane.
- The shared status list continues to drive type validation, persisted enum values, lane ordering, selectors, and status icons.
- Existing rows require no rewrite or backfill; the additive enum change permits the new value without changing the Idea default.
- No new endpoint, priority, label, status reason, workflow transition, dependency, or time-tracking behavior is introduced.

## Alternatives considered

- **Hold**: rejected in favor of the clearer state wording “On hold.”
- **Paused**: not chosen; the user asked for a Hold/On hold label, and “On hold” is also a familiar configurable workflow status in Jira.
- A label or priority: rejected because this represents a workflow state and must occupy a Board lane. Linear documents team-configurable issue statuses separately from categorization labels.
- **Blocked**: rejected as a synonym; On hold does not assert that work is blocked by an external dependency.
- Add On hold to the New ticket form: rejected for this milestone; keep the current form and Idea default, and use the existing status controls to change status after creation.

## Links

- Approved plan and implementation evidence: [M43 — On hold ticket status](../milestones/m43-on-hold-ticket-status.md)
- [ADR 0048 — Agenda and Ticket Board status icon menus](0048-agenda-and-board-status-icon-menus.md)
- [ADR 0046 — Hide quiet Done tickets from the active Ticket Board](0046-quiet-done-ticket-board-visibility.md)
- [ADR 0053 — Ticket priorities and Board ordering](0053-ticket-priorities.md) and [ADR 0054 — Ticket priority icon presentation](0054-ticket-priority-icon-presentation.md)
- [Linear workflows](https://linear.app/docs/configuring-workflows) and [Jira board columns and statuses](https://support.atlassian.com/jira-software-cloud/docs/manage-columns-with-multiple-statuses-in-a-team-managed-project/)
