import { z } from 'zod'
import type { App } from '../app.ts'

export async function healthRoutes(app: App) {
  app.get('/health', { schema: { hide: true, response: { 200: z.object({ ok: z.literal(true) }) } } }, () => ({ ok: true as const }))
}
