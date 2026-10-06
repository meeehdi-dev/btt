# ADR 0036: Coolify source-build deployment

- Status: Accepted
- Date: 2026-09-30
- Supersedes: None
- Superseded by: None

## Context

M0 deferred release and deployment automation to a separately approved follow-up. The roadmap initially pointed toward the `tt` release-please → GHCR image publish → Coolify API deployment workflow. For the first production deployment, that adds a registry, image-tag coordination, API credentials, and a release gate that are not needed for one app deployed by Coolify.

## Decision

- Connect Coolify directly to the Git repository through its GitHub App and select the repository's Dockerfile build method.
- Build the app image on the Coolify host from the selected source commit. Do not require GHCR, another image registry, release-please, or a GitHub Actions image-publish/Coolify-API workflow.
- Keep GitHub Actions as the quality-check workflow. Use protected `main` with required checks before enabling Coolify auto-deploy; otherwise deploy manually in Coolify after checks pass.
- Keep runtime secrets in Coolify's environment configuration, not Docker build arguments or committed files.
- Run committed Drizzle migrations before Nuxt starts serving from the new container. Keep migrations compatible with the previous app during container replacement; plan explicit backup/maintenance/recovery for destructive schema changes.
- Use a non-sensitive HTTP health endpoint to report process readiness. The initial deployment is one app instance; database location and production data preservation are operational prerequisites to confirm before provisioning/migration.

## Consequences

Coolify owns source checkout, image build, runtime configuration, and container replacement. There is no registry image promotion or reusable immutable image artifact. Builds use host resources and the Dockerfile/base image require maintenance. Main-branch auto-deploy depends on repository branch protection; without it, the safe approved fallback is manual deployment after quality checks. Database recovery depends on verified backups, preferably copied off the Coolify host.

## Alternatives considered

- Release-please → GHCR → Coolify API: rejected for the initial deployment because it introduces publishing/tag/API credential steps without a current need for image promotion or release-based deployment.
- Coolify Nixpacks/buildpack: valid and simpler for a conventional Node app, but not selected because the project benefits from explicit Node/pnpm setup, Nuxt/Nitro startup, health check, and migration ordering in a version-controlled Dockerfile.
- Publish an image from CI and let Coolify pull it: rejected for the same registry/auth/tagging overhead; revisit if multiple environments need promotion of the exact same immutable artifact.
- Add a GitHub Actions Coolify webhook: deferred; use only if green-CI-gated automatic deployment becomes necessary beyond protected merges or manual deployment.

## Links

- `docs/milestones/m24-first-release-deployment.md`
- `PLAN.md`
- [Coolify deployment methods](https://coolify.io/docs/applications/choose-deployment-method)
- [Coolify Dockerfile builds](https://coolify.io/docs/applications/builds/dockerfile)
- [Coolify GitHub auto-deploy](https://coolify.io/docs/applications/sources/github/auto-deploy)
