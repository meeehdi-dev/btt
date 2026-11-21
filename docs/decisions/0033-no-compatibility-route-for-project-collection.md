# ADR 0033: Client-led project discovery; removed routes return 404

- Status: Accepted
- Date: 2026-09-29
- Supersedes: [ADR 0032](0032-client-led-project-navigation.md)
- Superseded by: None

## Context

Projects were a top-level collection duplicating what Client detail already shows (its projects and the New project action). The collection was removed; a first version kept `/projects` as a redirect to Clients, but the human clarified that the app is still in MVP and legacy URLs need no compatibility.

## Goal

Projects are discovered and created from their Client, and removed routes simply disappear rather than leaving compatibility aliases.

## Decision

- Clients is the only top-level entry point for project discovery and setup. Client detail lists project cards and offers New project.
- There is no `/projects` collection route; it returns the normal 404.
- Individual project detail routes, project search results, and hierarchy links remain. Return and prerequisite actions route to Clients or the relevant parent, preserving archived context.
- General rule: when a route is removed, it returns 404 with no redirect, alias, or legacy fallback. Active application flows (the root landing redirect, login redirect) are not aliases.
- Project persistence, APIs, ownership, and archive rules are unchanged.

## Consequences

Old bookmarks to removed routes break by design. Individual project URLs stay valid. Later route removals (for example `/today`, the standalone create/edit pages, `/settings`) follow the same rule.

## Alternatives considered

- Keep both Clients and Projects collections: rejected; Client detail already provides them.
- 302 redirect from `/projects`: rejected; unnecessary compatibility in MVP.
- Remove project detail routes or search results: rejected; projects remain first-class entities.

## Revisions

- 2026-11-21: Rewritten to goal-level form; absorbed ADR 0032's intent (client-led discovery) and added the general no-alias rule; dropped the stale partial-supersession by ADR 0044 (root landing now targets the Agenda).
