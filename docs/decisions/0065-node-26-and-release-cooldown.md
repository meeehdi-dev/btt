# ADR 0065: Node 26 baseline and 7-day release cooldown

- Status: Accepted
- Date: 2026-11-04
- Supersedes: The Node 24 clause in ADR 0002 only
- Superseded by: None

## Context

ADR 0002 set Node 24 as the runtime baseline. Node 26 is now the target runtime, and the local development environment already runs it. The repository also configured no minimum package age: pnpm installs and Dependabot could pick a version published minutes earlier, which exposes the project to compromised or broken releases that are pulled within days.

Open Dependabot PRs for `h3` 2.x and `typescript` 7.x cannot be merged today. Nuxt 4.6 runs on h3 v1 through `nitropack` 2, and installing h3 v2 directly breaks typing across the app. `vue-tsc`, used by `nuxt typecheck`, loads `typescript/lib/tsc`, which TypeScript 7 no longer exports.

## Decision

- Node 26 is the minimum and target runtime: `package.json` `engines.node` (`>=26.0.0`), the CI `setup-node` version, the Dockerfile base image (`node:26-bookworm-slim`), and `@types/node` 26.x.
- Set a 7-day release cooldown in config: pnpm `minimumReleaseAge: 10080` (minutes) in `pnpm-workspace.yaml`, and a Dependabot `cooldown` with `default-days: 7` for both the npm and github-actions ecosystems. Versions published less than 7 days earlier are skipped by installs and update PRs.
- Node 26 images no longer ship Corepack, so the Dockerfile installs the pinned pnpm with `npm install -g pnpm@12.16.1` instead of `corepack enable`.
- Keep `h3` on 1.x until Nuxt moves to h3 v2 (expected with Nuxt 5 / Nitro 3).
- Keep `typescript` on 6.0.x until `vue-tsc` supports TypeScript 7. TypeScript 7 stays covered by `pnpm typecheck:tsgo` through `@typescript/native-preview`.

## Consequences

Dependency updates arrive at least 7 days after release, including security fixes that are not handled by Dependabot security updates. Installing a version younger than 7 days fails until it ages in or the setting is deliberately overridden. Dependabot PRs for h3 2.x and TypeScript 7.x are expected to fail and should be closed or ignored until the lifting conditions are met. Node 24 is no longer supported by `engines`.

## Alternatives considered

- Apply the 7-day age to a single upgrade only: rejected; config covers Dependabot and every future install.
- Migrate to h3 v2 or TypeScript 7 now: rejected; both break checks without a clear, small fix.
- Keep Node 24: rejected; Node 26 is the chosen baseline.

## Links

- [ADR 0002: M0 bootstrap baseline](0002-m0-bootstrap-baseline.md)
- [ADR 0060: Track pnpm as a Dependabot dependency](0060-pnpm-dependabot-tracking.md)
- `package.json`, `pnpm-workspace.yaml`, `.github/workflows/check.yml`, `.github/dependabot.yml`, `Dockerfile`
