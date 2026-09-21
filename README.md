# nxmr

A work-only organizer combining ticket-based projects with agenda-first time tracking.

## Development

Requirements: Node 24+, pnpm 10, and a PostgreSQL instance configured through `DATABASE_URL`.

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
