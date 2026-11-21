# ADR 0044: Week-only Agenda and direct status selector

- Status: Accepted
- Date: 2026-10-07
- Supersedes: None
- Superseded by: None

## Context

The Agenda combined duplicate Day and Week UIs, persisted the view choice in browser storage, and was labeled Today although it allowed arbitrary week navigation. Its status control offered a filter and a nested change submenu, and the page had a separate status filter.

## Goal

One stable, simply named weekly Agenda with no view-mode state and a direct way to change a ticket's status.

## Decision

- `/agenda` is the Agenda route and is Week-only. It is named "Agenda" in page and navigation, and is the authenticated landing page. `/today` is retired and returns 404 with no redirect.
- There is no Day/Week preference. A stored legacy `nxmr:agenda-view` browser value is ignored and left untouched. The selected-date query anchors the week; the configured week start applies (ADR 0029).
- The Agenda has client/project/release/ticket filters and no status filter (ADR 0016). Status is changed through one flat selector of the fixed statuses, with the current status marked and archived/busy options disabled; there is no nested "Filter by" / "Change" submenu. The selector is opened from the status icon beside the title (ADR 0048).
- Weekly data, time-entry operations, APIs, ownership and archive rules, overlap rules, gestures, correction flows, accessibility semantics and the time-grid geometry are unchanged. This is a UI/route policy.

## Consequences

One weekly presentation and no browser-local view state. Deep links with a valid `date` still anchor the week. Old `/today` links and bookmarks stop working by design. No schema, data, API, auth or dependency changes.

## Alternatives considered

- Keep Day/Week defaulting to Week: rejected; Day UI and its preference are duplicate state.
- Redirect `/today` to `/agenda`: rejected by the human; 404, no compatibility route.
- Keep status filtering or the nested menu: rejected for compactness.
- Delete the legacy localStorage key: rejected; ignore it instead.

## Revisions

- 2026-11-21: Rewritten to goal-level form; removed the list of partial supersessions. Effects were pushed into their owners: ADR 0016 (no status filter), ADR 0039 (strip flow), ADR 0003/0033 (landing route), ADR 0030 (history). Selector trigger updated per ADR 0048.
