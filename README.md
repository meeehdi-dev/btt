# btt

A work-only organizer combining ticket-based projects with agenda-first time tracking.

## Development

Requirements: Node 24+, pnpm 12.8.1, and a PostgreSQL instance configured through `DATABASE_URL`.

```sh
pnpm install
cp .env.example .env
# Set DATABASE_URL and the other required values in .env
pnpm db:migrate
pnpm dev
```

Open <http://localhost:3000>. M1 uses Better Auth with GitHub OAuth. Configure the GitHub client credentials and a 32+ character `BETTER_AUTH_SECRET` in `.env`; never commit `.env`.

For production, set `BETTER_AUTH_URL=https://nxmr.meeehdi.dev` and register this GitHub callback:
`https://nxmr.meeehdi.dev/api/auth/callback/github`.

## Coolify deployment

The first-release deployment builds this repository's Dockerfile directly in Coolify. It does not require GHCR, a published image, or a release workflow.

1. Connect the private GitHub repository to Coolify using its GitHub App. Select the deployment branch (recommended: `main`) and the repository's `Dockerfile` build method. Set the app domain and expose the container's port `3000`.
2. Provision PostgreSQL as a separate Coolify database resource or choose an external PostgreSQL provider. Configure persistent storage and private app-to-database networking; do not publish the database port to the internet. Use the database resource's internal hostname in `DATABASE_URL`, not `localhost`.
3. Set these as **runtime** environment variables in Coolify, never as committed files or Docker build arguments: `DATABASE_URL`, `BETTER_AUTH_SECRET` (at least 32 characters), `BETTER_AUTH_URL=https://nxmr.meeehdi.dev`, `GITHUB_CLIENT_ID`, and `GITHUB_CLIENT_SECRET`. Register `https://nxmr.meeehdi.dev/api/auth/callback/github` in the GitHub OAuth application.
4. The container applies committed Drizzle migrations before starting the Nuxt server. Start with a new empty production database. Do not point this deployment at a database containing data to preserve until its backup, migration, and recovery plan has been reviewed; see the M2.5 caveat in `docs/milestones/m2.5-uuidv7-identifier-migration.md`.
5. Configure scheduled PostgreSQL backups and an off-server copy, then verify a restore into a disposable database. A backup only on the Coolify host does not protect against host loss.
6. Require GitHub quality checks before merging to `main` if enabling Coolify auto-deploy. If branch protection is not configured, deploy manually from Coolify after checks pass.

The Dockerfile exposes an HTTP health check at `/api/health`. Database location, production data state, TLS, OAuth, and backup/restore configuration must be verified in the target Coolify environment; they are not provisioned by this repository.

Automated tests use Better Auth Test Utils and do not contact GitHub.

## Quality checks

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm typecheck:tsgo
pnpm test
pnpm test:e2e
pnpm build
pnpm check:workflow
```

Playwright browser setup, when needed:

```sh
pnpm exec playwright install chromium
```

The canonical Nuxt/Vue typecheck uses TypeScript 6.0.3 because the current vue-tsc release is incompatible with TypeScript 7. The native TypeScript preview remains an experimental plain-TypeScript evaluation and does not replace Nuxt/Vue typechecking.
