# ADR 0034: pnpm v12 package-manager baseline

- Status: Accepted
- Date: 2026-09-29
- Supersedes: The pnpm 10 version pin in ADR 0002 only
- Superseded by: None

## Context

The M0 bootstrap pinned pnpm 10.33.2 in `package.json` and CI. The user requested a focused milestone to upgrade the project package manager to pnpm v12. At implementation time, the npm registry lists pnpm 12.8.1 as the latest stable v12 release. CI currently uses Node 24, `pnpm/action-setup@v4`, and a frozen lockfile install.

## Decision

- Pin pnpm exactly to 12.8.1 in `package.json#packageManager` and the existing CI action configuration.
- Preserve Node 24, the existing GitHub Actions versions and workflow shape, and frozen installs.
- Do not upgrade application dependencies or change application code. Change the lockfile only if pnpm 12 requires it, and review any resulting package-resolution changes.
- Allow build scripts only for the exact versions `esbuild@0.18.20`, `esbuild@0.25.12`, `esbuild@0.27.7`, `esbuild@0.28.2`, and `vue-demi@0.14.10`, as approved by the human during M21. Keep `strictDepBuilds` enabled so other unreviewed scripts fail installation.
- This decision replaces only ADR 0002's pnpm 10 version pin. All other M0 baseline decisions remain authoritative.

## Consequences

Local development and CI use one reproducible pnpm v12 release. The approved build scripts run during installation only for the listed package versions; other unreviewed scripts continue to fail under pnpm's strict default. A pnpm-generated lockfile update may be needed; any such change must be limited to what pnpm 12 requires and must not hide unrelated dependency upgrades. Frozen installation and the existing quality suite remain the compatibility gates.

## Alternatives considered

- Keep pnpm 10: rejected because the user requested pnpm v12.
- Pin a floating `12`/`latest` version: rejected because reproducible local and CI installs require an exact patch version.
- Upgrade unrelated app dependencies or CI actions alongside pnpm: rejected to keep this milestone limited to the requested package-manager upgrade.

## Links

- `docs/decisions/0002-m0-bootstrap-baseline.md`
- `docs/milestones/m21-pnpm-v12-upgrade.md`
- `package.json`
- `.github/workflows/check.yml`
- [pnpm migration guide](https://github.com/pnpm/pnpm.io/blob/main/docs/migration.md)
- [pnpm releases](https://github.com/pnpm/pnpm/releases)
