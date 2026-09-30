FROM node:24-bookworm-slim AS base
WORKDIR /app

FROM base AS dependencies
RUN corepack enable && corepack prepare pnpm@12.8.1 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM dependencies AS build
COPY . .
RUN NODE_ENV=production \
    DATABASE_URL=postgres://build:build@127.0.0.1:5432/nxmr \
    BETTER_AUTH_SECRET=nxmr-docker-build-placeholder-secret-32-chars \
    BETTER_AUTH_URL=http://localhost:3000 \
    GITHUB_CLIENT_ID=build-placeholder \
    GITHUB_CLIENT_SECRET=build-placeholder \
    pnpm build

FROM base AS production-dependencies
RUN corepack enable && corepack prepare pnpm@12.8.1 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

FROM base AS runtime
ENV NODE_ENV=production \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=3000

COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.output ./.output
COPY --chown=node:node drizzle ./drizzle
COPY --chown=node:node scripts/migrate.mjs ./scripts/migrate.mjs

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["sh", "-c", "node scripts/migrate.mjs && exec node .output/server/index.mjs"]
