import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../..', '')
  const api = `http://localhost:${env.PORT ?? 3060}`
  // Same origin in dev, so the session cookie and CSRF rules match production.
  return { plugins: [react()], server: { proxy: { '/v1': api, '/health': api } } }
})
