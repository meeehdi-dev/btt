# ADR 0045: BTT project name and header wordmark removal

- Status: Accepted
- Date: 2026-10-08
- Supersedes: ADR 0035's left-block wordmark clause only
- Superseded by: None

## Context

The project was previously identified as `nxmr` in package metadata and sign-in UI, and the authenticated header placed an `nxmr` home link before its navigation. The human requested the project name `btt` and asked for the header to show the menu directly, without the `nxmr` branding. Existing deployment and repository identifiers still use `nxmr`.

## Decision

- Use lowercase `btt` as the current product and package name in `package.json`, the README heading, and the sign-in page.
- Begin the authenticated header's left block with the existing Main navigation. Do not show a project wordmark or replace it with another logo/home link.
- Preserve the existing navigation destinations and order, header search/account blocks, keyboard shortcuts, session behavior, and logout behavior from ADR 0035.
- Keep the production hostname and OAuth callback, GitHub repository slug, database names, other operational identifiers, and completed historical records unchanged. Those external/deployed identities are not implicitly renamed with the product label.

## Consequences

The active package/product label is `btt`, while historical documentation and operational configuration may continue to contain `nxmr`. The authenticated header gives the navigation direct prominence without changing its destinations or behavior. A future production-host or repository rename requires its own explicit plan and external identifiers.

## Alternatives considered

- Keep the `nxmr` header link: rejected because the user asked for the menu directly.
- Replace the old wordmark with a `btt` wordmark: rejected; the header should begin with navigation, not branding.
- Rename the production hostname, GitHub repository, or database identifiers together: not approved; doing so may affect OAuth, deployment, links, or existing local data.

## Links

- `docs/milestones/m31-project-name-and-header-navigation.md`
- `docs/milestones/m23-three-block-header-navigation.md`
- `docs/decisions/0035-three-block-header-navigation.md`
- `PLAN.md`
