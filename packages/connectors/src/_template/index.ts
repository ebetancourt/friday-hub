// Copy this folder to packages/connectors/src/<id>/, fill it in, and add it
// to registry.ts. See docs/adding-a-connector.md.
import { action, apiKey, defineConnector, z } from '@friday-hub/sdk'

export default defineConnector({
  id: 'example',
  name: 'Example',

  // Pick one auth strategy:
  //   oauth2({ authorizeUrl, tokenUrl, scopes })  static OAuth app (env: FRIDAY_<ID>_CLIENT_ID/SECRET)
  //   oauth2({ discover: 'mcp' })                  MCP server with dynamic client registration
  //   apiKey({ fields, header, format })           user pastes a key
  auth: apiKey({
    fields: z.object({ key: z.string().min(1).describe('API key') }),
    header: 'Authorization',
    format: 'Bearer {key}',
  }),
  baseUrl: 'https://api.example.com/v1',

  // Required. Must return a stable ID for the upstream account so that
  // reconnecting the same account updates its connection instead of adding one.
  identify: async (ctx) => {
    const me = await ctx.json<{ id: string; email: string }>('/me')
    return { externalId: me.id, name: me.email }
  },

  // Every scope an action, the proxy or MCP uses must be declared here.
  scopes: {
    'example:read': 'Read things',
  },

  // Any of these four surfaces; all optional.
  actions: {
    listThings: action({
      method: 'GET',
      path: '/things',
      scope: 'example:read',
      input: z.object({ cursor: z.string().optional() }),
      run: (ctx, input) => ctx.json(`/things${input.cursor ? `?cursor=${encodeURIComponent(input.cursor)}` : ''}`),
    }),
  },
  // streams: { things: stream({ every: '15m', run: async (ctx, cursor) => ({ records: [], cursor, done: true }) }) },
  // proxy: { allow: ['GET /things*'] },     // needs 'example:proxy'
  // mcp: { url: 'https://mcp.example.com/mcp' }, // needs 'example:mcp'
})
