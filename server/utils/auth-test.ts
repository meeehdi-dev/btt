import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { testUtils } from 'better-auth/plugins'
import { db } from '../db'
import { authSchema } from '../db/schema'
import { generateId } from './id'

export const testAuth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: authSchema,
  }),
  secret: process.env.BETTER_AUTH_SECRET ?? 'nxmr-local-development-secret-change-me-32',
  advanced: {
    database: {
      generateId,
    },
  },
  baseURL: 'http://127.0.0.1:3000',
  plugins: [testUtils()],
})
