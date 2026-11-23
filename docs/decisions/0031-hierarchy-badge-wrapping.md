# ADR 0031: Wrap hierarchy badge groups in cards

- Status: Accepted
- Date: 2026-09-29
- Supersedes: None
- Superseded by: None

## Context

Agenda entries, board cards, project-detail release cards, and release-detail ticket cards scrolled their client/project/release badges horizontally, while project cards already wrapped. Wrapping was requested everywhere.

## Goal

Hierarchy context stays fully visible in cards instead of hiding behind horizontal scrolling, without breaking the time-grid geometry.

## Decision

- Hierarchy badge groups wrap in agenda entries, Board cards, project cards, project-detail release cards, and release-detail ticket cards.
- Exception: fixed-height timeline entries keep their duration-derived size. They wrap badges only if the block can hold the extra row; otherwise the badge group stays on one line and may scroll horizontally within itself. Entries never grow or overlap neighbors.
- Accessible names and filter/open actions remain available when badges are compact or scrolled. Wrapping applies to the badge group only, not to titles or usage rows.
- Other card interactions (status, links, navigation, board drag) are unchanged.

## Consequences

Hierarchy context is visible in natural-height cards. Short time-scaled entries may need panning within the badge group. Time geometry, data, and API are unchanged.

## Alternatives considered

- Keep scrolling in dense cards: rejected by the follow-up request.
- Change title/usage overflow too: rejected; unrelated rows.
- Change entry duration/geometry to make room: rejected; time geometry is fixed.

## Revisions

- 2026-11-21: Rewritten to goal-level form; dropped the clause amending ADR 0022 (absorbed by ADR 0057) and process chatter in Status.
- 2026-11-23: Removed estimate and relation mentions (ADR 0067); wrapping is unchanged.
