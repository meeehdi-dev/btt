# ADR 0060: Track pnpm as a Dependabot dependency

- Status: Accepted
- Date: 2026-10-14
- Supersedes: ADR 0034's exact-version build-script allowlist only
- Superseded by: None

## Context

ADR 0034 pins pnpm 12.8.1 in `package.json#packageManager` and `.github/workflows/check.yml`, but the npm Dependabot ecosystem did not produce a pnpm update from the package-manager field alone. In the sibling `ccvavocats` repository, pnpm is also an exact devDependency; its grouped Dependabot PR included pnpm 12.10.1. The BTT manifest currently has no `devDependencies.pnpm` entry.

Adding pnpm as a devDependency exposes it to the existing weekly npm minor/patch update group. pnpm 12.8.1 declares `preinstall` and `postinstall` scripts that both run `node install.js`. The repository's strict `allowBuilds` policy blocks unapproved package scripts. The user approved allowing these scripts for exactly `pnpm@12.8.1` via Plannotator session `pn-cf4fcb`.

## Decision

- Declare `pnpm` as an exact devDependency at the same version as `packageManager` (`12.8.1`) so Dependabot can propose future npm-ecosystem updates.
- Add only `pnpm` to Knip's `ignoreDependencies`, because it is declared for Dependabot tracking and is not imported by application code. The user approved this exact exception through Plannotator session `pn-9e32e7`; existing unused-dependency checks remain enabled for all other packages.
- Allow build scripts only for `pnpm@12.8.1` in `pnpm-workspace.yaml`, so the pinned package can install under the existing strict policy. Other packages and pnpm versions remain unapproved.
- Keep the existing `packageManager` and CI workflow version pins. Review future pnpm Dependabot PRs for synchronization across the devDependency, `packageManager`, and `.github/workflows/check.yml`; automatic CI-pin synchronization is not part of this decision.

## Consequences

Dependabot can include pnpm in its grouped minor/patch PRs. Knip intentionally excludes only this non-code dependency from unused-dependency findings. The exact pnpm 12.8.1 install scripts may place/relink the package's bundled native pnpm executable; strict build-script handling remains in force for every other package/version. Future pnpm updates must keep the three version declarations aligned before merge.

## Alternatives considered

- Keep pnpm only in `packageManager`: rejected because the observed Dependabot updates did not include it.
- Allow pnpm scripts by wildcard or approve future versions in advance: rejected; approval is limited to the exact `12.8.1` package version.
- Change the CI action to derive its version from `packageManager`: deferred; this request is limited to Dependabot detection and does not change the workflow.

## Links

- [ADR 0034: pnpm v12 package-manager baseline](0034-pnpm-v12-package-manager.md)
- [Implementation plan](../../plans/expose-pnpm-to-dependabot.md)
- `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.github/workflows/check.yml`
