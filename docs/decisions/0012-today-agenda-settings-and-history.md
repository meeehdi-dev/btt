# ADR 0012: Agenda settings and historical work

- Status: Accepted
- Date: 2026-09-26
- Supersedes: None
- Superseded by: None

## Context

The agenda is the primary surface for completed work across tickets. Time entries belong to local calendar days and survive archiving, so a limited visible-hours preference must not hide history or block valid entries.

## Goal

The visible-hours window is a presentation preference only: it never hides or blocks historical work, and day progress follows the entries the active filters leave visible.

## Decision

- Each user has one settings record: visible window, workday target, and week start. Defaults when absent: 08:00–20:00 window, eight-hour target, week starting Monday (week start is Sunday 0 to Saturday 6; see ADR 0029).
- Visible bounds use 30-minute steps with 0 ≤ start < end ≤ 1440. The target uses 30-minute steps from 30 through 1440 minutes. API and database both enforce this.
- Day reads include all of the user's entries, including those outside the window or under archived tickets and ancestors. Progress, overtime and day hours use the filtered entries; the visible-hours window still never hides work, and overlap checks still see all entries.
- A dedicated owner-scoped agenda read returns entries with archived-hierarchy labels and status. Only active tickets are eligible for new work (ADR 0011).
- Navigating from a historical entry uses explicit archived-detail links. Project and release detail may traverse archived ancestors only with that explicit flag, which grants no write access and does not change default lists.
- Agenda entries use the same entity, status, and time icons as the ticket board.

## Consequences

Settings are a small per-user record and agenda queries must join the hierarchy for ownership and labels. Archived details can be read explicitly while ordinary navigation stays scoped to active entities.

## Alternatives considered

- Hide entries outside visible hours: rejected; the window is a preference, not a data filter.
- Reuse the ticket-scoped history endpoint for day queries: rejected; it cannot show all tickets on a date without per-ticket requests.

## Revisions

- 2026-11-21: Rewritten to goal-level form; folded in week start (ADR 0029); retitled from "Today agenda" since the route is now Agenda (ADR 0044); dropped milestone scoping chatter.
- 2026-11-23: Day progress and hours use the filtered entries instead of the complete total (ADR 0067); the visible-hours window still never hides work.
