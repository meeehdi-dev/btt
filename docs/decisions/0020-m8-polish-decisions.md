# ADR 0020: M8 presentation decisions

- Status: Accepted
- Date: 2026-09-27
- Supersedes: Specific presentation rules in ADRs 0017–0019, only as stated below; those records remain unchanged
- Superseded by: None

## Context

Six M8 decisions were initially recorded separately during review. At the user's request, they are consolidated here; the existing decision records and index entries remain intact. These decisions affect presentation and optional link-label storage, not ownership, archive, time-entry, estimate, or status rules.

## Decision

### Tracked-time color

- Color tracked-time values by the existing usage ratio bands: info below 80%, success from 80% to below 100%, warning from 100% through 120%, and error above 120%. Keep estimates and targets muted.
- Use the same ratio bands for Today workday progress text; preserve its existing unfiltered daily total and target behavior.

### Optional external-link labels

- Ticket-link labels are nullable and optional while URLs remain required and validated. Omitted create labels become SQL `NULL`; PATCH omission preserves a label and explicit `null` clears it. Blank form labels are omitted.
- Display a custom label when present, otherwise the URL hostname, including subdomains. The migration drops `NOT NULL` without rewriting existing labels.

### Hierarchy metrics and metadata layout

- Show active project/release/ticket counts on client and project cards, and active ticket count plus accessible Done/total progress on release cards. Exclude archived descendants and descendants beneath archived ancestors; archived parent cards omit child metrics. An active empty release shows 0/0 and 0%.
- Keep card metadata left-aligned and allow it to wrap on narrow screens. Use the shared two-row project card on both Projects and client detail.

### Ticket context triggers

- Keep accessible icon-only related-ticket and external-link triggers for each nonempty collection, with no count chips at any count. Preserve internal navigation/board locate behavior and native safe external anchors.

### Release ticket usage

- Board and release-detail ticket cards omit the percentage badge while retaining tracked time, estimate, ratio-colored tracked text, and an accessible usage label. Ticket detail retains its percentage display.

## Consequences

These changes update selected M8 presentation details without rewriting the earlier ADRs. Hierarchy counts are derived from existing owner-scoped data and archive rules. Optional labels add a nullable column migration but preserve existing custom values. No new completion state or time-entry persistence behavior is introduced.

## Alternatives considered

- Create a separate ADR for each M8 refinement: rejected at the user's request; these related decisions are consolidated here.
- Retain count chips or show them only for multiple items: rejected in favor of consistent icon-only triggers.
- Show usage percentages on compact board or release-detail cards: rejected; ticket detail retains its percentage.
- Count archived descendants or persist hierarchy progress: rejected to preserve archive semantics and use existing ticket status as the source of truth.

## Links

- [ADR 0017 — release usage and ticket-detail polish](0017-release-usage-and-ticket-detail-polish.md)
- [ADR 0018 — ticket context and application UI consistency](0018-ticket-context-and-application-ui-consistency.md)
- [ADR 0019 — ticket usage contrast and context count badges](0019-ticket-usage-contrast-and-context-count-badges.md)
- `plans/next-milestone.md`
- `docs/milestones/m8-polish-and-shared-ticket-work-items.md`
