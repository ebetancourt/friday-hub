import { defineConfig } from 'vitest/config'

try {
  process.loadEnvFile('.env')
} catch {}

export default defineConfig({
  test: {
    projects: [
      { test: { name: 'unit', include: ['{apps,packages}/*/src/**/*.test.ts'] } },
      'packages/ui', // stories + a11y, in a real browser
    ],
  },
})
