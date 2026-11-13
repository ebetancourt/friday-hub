import { connectors } from '@friday-hub/connectors'
import { z } from 'zod'
import type { App } from '../app.ts'

const ConnectorSummary = z.object({
  id: z.string(),
  name: z.string(),
  auth: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('oauth2') }),
    /** fields: JSON Schema for the connect form. */
    z.object({ kind: z.literal('api_key'), fields: z.record(z.string(), z.unknown()) }),
  ]),
  scopes: z.array(z.object({ id: z.string(), description: z.string() })),
  surfaces: z.array(z.enum(['actions', 'streams', 'proxy', 'mcp'])),
})

/** The catalogue the web app builds its connect screens from. */
export async function connectorRoutes(app: App) {
  app.get(
    '/v1/connectors',
    {
      schema: {
        operationId: 'listConnectors',
        tags: ['Connectors'],
        summary: 'List the connection types this server supports',
        response: { 200: z.object({ connectors: z.array(ConnectorSummary) }) },
      },
    },
    () => ({
      connectors: connectors.map((c) => ({
        id: c.id,
        name: c.name,
        auth:
          c.auth.kind === 'api_key'
            ? { kind: 'api_key' as const, fields: z.toJSONSchema(c.auth.fields) as Record<string, unknown> }
            : { kind: 'oauth2' as const },
        scopes: Object.entries(c.scopes).map(([id, description]) => ({ id, description })),
        surfaces: (['actions', 'streams', 'proxy', 'mcp'] as const).filter((s) => c[s]),
      })),
    }),
  )
}
