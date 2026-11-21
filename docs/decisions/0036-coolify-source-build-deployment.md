# ADR 0036: Source-build deployment

- Status: Accepted
- Date: 2026-09-30
- Supersedes: None
- Superseded by: None

## Context

A release-please → image registry → deploy-API pipeline adds a registry, tag coordination, API credentials, and a release gate that one app on one host does not need.

## Goal

Deploy simply and safely: the host builds from source, secrets stay out of images and the repo, and CI is the quality gate.

## Decision

- The deployment host builds the app image from the selected Git commit using the repository's Dockerfile. No image registry, release automation, or CI-driven deploy API is required.
- CI remains the quality-check workflow. Auto-deploy from `main` is enabled only when branch protection requires those checks; otherwise deploy manually after checks pass.
- Runtime secrets live in the host's environment configuration, not in build arguments or committed files.
- Committed database migrations run before the new container serves traffic and must stay compatible with the previous app version during replacement. Destructive schema changes need explicit backup, maintenance, and recovery planning.
- A non-sensitive health endpoint reports process readiness. Production runs one app instance; database location and data preservation are operational prerequisites to confirm before provisioning.

## Consequences

The host owns checkout, build, configuration, and container replacement. There is no immutable promoted artifact; builds use host resources and the Dockerfile needs maintenance. Recovery depends on verified, preferably off-host, backups.

## Implementation notes (non-binding)

The host is Coolify, connected through its GitHub App with the Dockerfile build method.

## Alternatives considered

- Release pipeline with registry images and deploy API: rejected; overhead without a need for promotion.
- Buildpack builds: simpler, but an explicit Dockerfile keeps runtime setup, health check, and migration order under version control.
- CI-published image pulled by the host: rejected for the same overhead; revisit for multi-environment promotion.
- CI webhook deploy: deferred until green-CI-gated deploys are needed beyond branch protection.

## Revisions

- 2026-11-21: Rewritten to goal-level form; host product moved to notes.
