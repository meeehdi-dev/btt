# nxmr

A work-only organizer combining ticket-based projects with agenda-first time tracking.

## M0 development

Requirements: Node 24+ and pnpm 10.

```sh
pnpm install
pnpm dev
```

Open <http://localhost:3000>. M0 includes a clearly labeled development-only demo sign-in. It is not authentication and must not be used to protect data. Production builds fail closed until Better Auth is added in M1.

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
