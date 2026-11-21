# ADR 0066: Follow the latest Node LTS with mise

- Status: Accepted
- Date: 2026-11-21
- Supersedes: The CI `setup-node` version and Dockerfile base image clauses of [ADR 0065](0065-node-26-and-release-cooldown.md) only
- Superseded by: None

## Context

ADR 0065 pins Node 26 in CI (`node-version: 26`) and Docker (`node:26-bookworm-slim`). The local environment switched from fnm to mise, and the project should follow the active Node LTS without a manual bump per major.

## Decision

- `mise.toml` selects `node = "lts"` and the latest Corepack for local development.
- CI uses `actions/setup-node` with `node-version: lts/*`; Docker uses `node:lts-bookworm-slim`.
- `package.json` keeps `engines.node` at `>=26.0.0` as a minimum, not a pin. Raise it only when the code needs a newer major.

## Consequences

A new Node LTS major is picked up automatically by local installs, CI, and Docker builds. Builds are less reproducible across time, and a major upgrade can surface as a CI failure without a code change.

## Alternatives considered

- Keep a fixed major and bump it deliberately: rejected; the user wants the latest LTS.
