import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { db } from '../db'
import { authSchema } from '../db/schema'

const isProduction = process.env.NODE_ENV === 'production'
const secret = process.env.BETTER_AUTH_SECRET

if (isProduction && (!secret || secret.length < 32)) {
  throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters in production')
}

const githubClientId = process.env.GITHUB_CLIENT_ID
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET

if (isProduction && (!githubClientId || !githubClientSecret)) {
  throw new Error('GitHub OAuth credentials are required in production')
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: authSchema,
  }),
  secret: secret ?? 'nxmr-local-development-secret-change-me-32',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  socialProviders: {
    github: {
      clientId: githubClientId ?? 'test-github-client-id',
      clientSecret: githubClientSecret ?? 'test-github-client-secret',
    },
  },
})
