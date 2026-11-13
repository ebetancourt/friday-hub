import { connectors } from '@friday-hub/connectors'
import { z } from 'zod'
import type { App } from '../app.ts'

/**
 * Mounts every connector action as a typed route:
 *   {method} /v1/{connectorId}/{connectionId}{action.path}
 * so each connector appears in the OpenAPI spec and the generated client.
 *
 * Not built yet: token auth + scope check, connection lookup under RLS,
 * credential decrypt/refresh, the signed ctx, idempotency and confirm headers,
 * the raw proxy and the MCP proxy. See docs/build-plan.md.
 */
export async function gatewayRoutes(app: App) {
  for (const c of connectors) {
    for (const [name, a] of Object.entries(c.actions ?? {})) {
      app.route({
        method: a.method,
        url: `/v1/${c.id}/:connectionId${a.path}`,
        schema: {
          operationId: `${c.id}.${name}`,
          tags: [c.name],
          summary: a.summary,
          description: `Requires the \`${a.scope}\` scope.`,
          security: [{ token: [] }],
          params: z.object({ connectionId: z.uuid() }),
          ...(a.input ? (a.method === 'GET' ? { querystring: a.input } : { body: a.input }) : {}),
          ...(a.output ? { response: { 200: a.output } } : {}),
        },
        handler: (_req, reply) => reply.code(501).send({ error: 'not_implemented' }),
      })
    }
  }
}
