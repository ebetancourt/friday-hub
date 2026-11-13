import { action, defineConnector, oauth2, z } from '@friday-hub/sdk'

// One Google connection = one Google account, covering Gmail, Calendar and Drive.
// gmail.modify and drive are restricted scopes: see docs/scope-v0.md (Provider constraints).
export default defineConnector({
  id: 'google',
  name: 'Google',
  auth: oauth2({
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/drive',
    ],
    // offline: get a refresh token. select_account: a second connect offers the
    // account chooser instead of silently reusing the signed-in account.
    authorizeParams: { access_type: 'offline', prompt: 'consent select_account' },
  }),
  identify: async (ctx) => {
    const me = await ctx.json<{ sub: string; email: string }>('https://openidconnect.googleapis.com/v1/userinfo')
    return { externalId: me.sub, name: me.email }
  },
  scopes: {
    'gmail:read': 'Read Gmail messages and labels',
    'gmail:write': 'Label, archive and draft Gmail messages',
    'calendar:read': 'Read Calendar events',
    'calendar:write': 'Create and change Calendar events',
    'drive:read': 'Read Drive files',
    'drive:write': 'Create and change Drive files',
  },
  actions: {
    listMessages: action({
      method: 'GET',
      path: '/gmail/messages',
      scope: 'gmail:read',
      summary: 'Search Gmail messages',
      input: z.object({ q: z.string().optional(), pageToken: z.string().optional() }),
      run: (ctx, input) =>
        ctx.json(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${new URLSearchParams(clean(input))}`),
    }),
    listEvents: action({
      method: 'GET',
      path: '/calendar/events',
      scope: 'calendar:read',
      summary: 'List events on the primary calendar',
      input: z.object({ timeMin: z.iso.datetime().optional(), pageToken: z.string().optional() }),
      run: (ctx, input) =>
        ctx.json(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${new URLSearchParams(clean(input))}`),
    }),
    listFiles: action({
      method: 'GET',
      path: '/drive/files',
      scope: 'drive:read',
      summary: 'Search Drive files',
      input: z.object({ q: z.string().optional(), pageToken: z.string().optional() }),
      run: (ctx, input) => ctx.json(`https://www.googleapis.com/drive/v3/files?${new URLSearchParams(clean(input))}`),
    }),
  },
})

const clean = (o: Record<string, string | undefined>) =>
  Object.fromEntries(Object.entries(o).filter((e): e is [string, string] => e[1] !== undefined))
