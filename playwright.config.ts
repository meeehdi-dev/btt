import { defineConfig, devices } from '@playwright/test'
import { loadEnv } from 'vite'

Object.assign(process.env, loadEnv('development', process.cwd(), ''))
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set before running Playwright tests')
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  ...(process.env.PLAYWRIGHT_SKIP_DEV_SERVER
    ? {}
    : {
        webServer: {
          command: 'pnpm dev --host 127.0.0.1',
          url: 'http://127.0.0.1:3000',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }),
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
