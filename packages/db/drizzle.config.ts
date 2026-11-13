import { defineConfig } from 'drizzle-kit'

try {
  process.loadEnvFile('../../.env')
} catch {}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './migrations',
  casing: 'snake_case',
  // Migrations run as the owner role; the app role cannot create tables.
  dbCredentials: { url: process.env.MIGRATION_DATABASE_URL! },
})
