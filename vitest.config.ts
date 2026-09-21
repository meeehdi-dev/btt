import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    setupFiles: ['./tests/setup-env.ts'],
    environment: 'happy-dom',
    coverage: { enabled: false },
  },
})
