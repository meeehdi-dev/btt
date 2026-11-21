# ADR 0066: Runtime and dependency freshness

- Status: Accepted
- Date: 2026-11-21
- Supersedes: [ADR 0060](0060-pnpm-dependabot-tracking.md), [ADR 0065](0065-node-26-and-release-cooldown.md)
- Superseded by: None

## Context

The project should follow the active Node LTS without a manual bump per major. Separately, installing or updating to a version published minutes earlier exposes the project to compromised or yanked releases, which are usually pulled within days. Some majors cannot be adopted yet because the framework or tooling depends on the older one. Package build scripts run arbitrary code at install, and the package manager itself must be kept current.

## Goal

Run on the active Node LTS and take new dependency releases only after a cooldown, keeping install-time code execution and version drift deliberate.

## Decision

- Follow the active Node LTS for local development, CI, and Docker. `engines.node` is a minimum, raised only when code needs a newer major.
- New releases wait a 7-day cooldown before install or update PRs, for both package installs and Dependabot (npm and GitHub Actions).
- A breaking dependency major may be deferred only with a recorded reason and a lift condition.
- Package build scripts run only with explicit per-package (and version) approval; nothing is approved by wildcard or in advance.
- The package manager version is tracked by Dependabot, and its pins are kept aligned when it updates.

## Consequences

A new LTS major is picked up automatically, so builds are less reproducible over time and a major can surface as a CI failure without a code change. Updates, including security fixes outside Dependabot security updates, arrive at least 7 days after release; a younger version fails to install until it ages in or the cooldown is deliberately overridden. Deferred-major Dependabot PRs fail and should be closed or ignored until the lift condition is met.

## Implementation notes (non-binding)

- Node: `mise.toml` (`node = "lts"`, latest Corepack), CI `setup-node` with `lts/*`, Docker `node:lts-bookworm-slim`, `engines.node` `>=26.0.0`. Node 26 images lack Corepack, so the Dockerfile installs pnpm with `npm install -g`.
- Cooldown: `minimumReleaseAge: 10080` (minutes) in `pnpm-workspace.yaml`; `cooldown.default-days: 7` in `.github/dependabot.yml`.
- Build scripts: `allowBuilds` in `pnpm-workspace.yaml` lists exact package versions.
- pnpm tracking: pnpm is an exact devDependency matching `packageManager`, Knip-ignored, and pinned in CI and Docker.
- Deferred majors: `h3` stays 1.x until Nuxt moves to h3 v2 (Nuxt 5 / Nitro 3); `typescript` stays 6.x until `vue-tsc` supports TypeScript 7, which `pnpm typecheck:tsgo` already covers.

## Alternatives considered

- Fixed Node major bumped deliberately: rejected; the project wants the latest LTS.
- Cooldown for a single upgrade only: rejected; config covers every future install.
- Adopting h3 v2 or TypeScript 7 now: rejected; both break checks without a small fix.
- Keeping pnpm only in `packageManager`: rejected; Dependabot did not propose pnpm updates from it.

## Revisions

- 2026-11-21: Rewritten as "Runtime and dependency freshness"; absorbs ADR 0060 and ADR 0065 (the Node 24 clause of ADR 0002 is now this ADR's); configuration and deferred majors moved to implementation notes.
