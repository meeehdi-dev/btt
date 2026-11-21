# ADR 0045: btt product name, no header branding

- Status: Accepted
- Date: 2026-10-08
- Supersedes: None
- Superseded by: None

## Context

The project was named `nxmr` in package metadata and the sign-in UI, and the header began with an `nxmr` home link. The human asked for the name `btt` and for the header to start with the menu. Deployment and repository identifiers still use `nxmr`.

## Goal

The product is called `btt`, and the header leads with navigation rather than branding. Deployed identities are not renamed as a side effect.

## Decision

- The current product name is lowercase `btt` in package metadata, the README heading, and the sign-in page.
- The authenticated header shows no wordmark or logo; navigation is its first content (ADR 0035).
- Production hostname, OAuth callback, repository slug, database names, and other operational identifiers keep their existing values. Renaming them needs its own explicit plan.

## Consequences

Active labels say `btt` while history and operations may still say `nxmr`. A future host or repository rename must account for OAuth, deployment, links, and existing local data.

## Alternatives considered

- Keep the `nxmr` header link: rejected; the menu should come first.
- A `btt` wordmark instead: rejected; the header leads with navigation.
- Rename host, repository, and database too: not approved; risks OAuth, deployment, and data.

## Revisions

- 2026-11-21: Rewritten to goal-level form; the header clause is now also stated in ADR 0035.
