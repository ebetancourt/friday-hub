// Runs every story as a test in headless Chromium, with the a11y addon.
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { join } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), storybookTest({ configDir: join(import.meta.dirname, '.storybook') })],
  test: {
    name: 'storybook',
    browser: { enabled: true, headless: true, provider: playwright(), instances: [{ browser: 'chromium' }] },
  },
})
