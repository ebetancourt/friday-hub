import { action, defineConnector, oauth2, z } from '@friday-hub/sdk'

// Todoist API v1. Check the OAuth URLs and token-expiry behaviour against
// https://developer.todoist.com before provisioning the OAuth app.
export default defineConnector({
  id: 'todoist',
  name: 'Todoist',
  auth: oauth2({
    authorizeUrl: 'https://todoist.com/oauth/authorize',
    tokenUrl: 'https://todoist.com/oauth/access_token',
    scopes: ['data:read_write', 'data:delete'],
    scopeSeparator: ',',
    pkce: false,
  }),
  baseUrl: 'https://api.todoist.com/api/v1',
  identify: async (ctx) => {
    const me = await ctx.json<{ id: string; email: string }>('/user')
    return { externalId: String(me.id), name: me.email }
  },
  scopes: {
    'todoist:read': 'Read tasks and projects',
    'todoist:write': 'Create and change tasks and projects',
    'todoist:delete': 'Delete tasks and projects',
  },
  actions: {
    listTasks: action({
      method: 'GET',
      path: '/tasks',
      scope: 'todoist:read',
      summary: 'List active tasks',
      input: z.object({ project_id: z.string().optional(), cursor: z.string().optional() }),
      run: (ctx, input) => {
        const qs = new URLSearchParams(Object.entries(input).filter((e): e is [string, string] => e[1] !== undefined))
        return ctx.json(`/tasks?${qs}`)
      },
    }),
  },
})
