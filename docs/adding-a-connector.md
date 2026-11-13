# Adding a connector

A connector is a declaration in `packages/connectors/src/<id>/index.ts`. Adding one needs no migration, no hand-written route and no web code.

## Steps

1. Copy `packages/connectors/src/_template/` to `packages/connectors/src/<id>/`.
2. Fill in `defineConnector({...})`: auth, `identify`, scopes, and any of actions, streams, proxy or mcp.
3. Add it to `connectors` in `packages/connectors/src/registry.ts`.
4. For static OAuth, register an app with the provider (redirect URI: `<PUBLIC_URL>/v1/oauth/callback`) and set `FRIDAY_<ID>_CLIENT_ID` and `FRIDAY_<ID>_CLIENT_SECRET`.
5. Run `pnpm test`. The registry test checks the connector against the contract.
6. Run `pnpm gen` and commit the regenerated client. Your actions are now typed routes.

## The contract

```ts
defineConnector({
  id: 'todoist',              // lowercase slug: URL segment and scope namespace
  name: 'Todoist',
  auth: oauth2({ ... }),      // or apiKey({ ... }), see below
  baseUrl: 'https://api.todoist.com/api/v1',
  identify: async (ctx) => ({ externalId, name }),  // required
  scopes: { 'todoist:read': 'Read tasks', ... },    // every scope you use, declared
  actions: { ... },           // optional: typed routes
  streams: { ... },           // optional: background sync into `records`
  proxy: { allow: [...] },    // optional: raw passthrough (needs '<id>:proxy')
  mcp: { url },               // optional: MCP upstream (needs '<id>:mcp')
})
```

**`identify` is how multiple accounts work.** It returns the upstream account's stable ID. Reconnecting the same account updates its connection; another account creates a new one. If the provider exposes no account ID, return a fingerprint of the credential.

**`ctx` is all you get.** `ctx.fetch` and `ctx.json` are already signed with the connection's credential and refreshed when needed. Relative URLs resolve against `baseUrl`. Connector code never reads a secret.

**Scopes** are Friday token scopes, `area:read|write|delete|proxy|mcp`. One connector may declare several areas (Google declares `gmail:*`, `calendar:*` and `drive:*`). The token UI is built from these.

## Auth strategies

```ts
// Static OAuth app
auth: oauth2({
  authorizeUrl: 'https://example.com/oauth/authorize',
  tokenUrl: 'https://example.com/oauth/token',
  scopes: ['read', 'write'],
  scopeSeparator: ',',          // default ' '
  pkce: true,                   // default true
  authorizeParams: { access_type: 'offline' },
})

// API key: the connect form is rendered from `fields` (zod → JSON Schema)
auth: apiKey({
  fields: z.object({ key: z.string().min(1).describe('API key') }),
  header: 'Authorization',
  format: 'Bearer {key}',
})

// MCP server with OAuth: discovery + dynamic client registration + PKCE
auth: oauth2({ discover: 'mcp' })
```

A new kind of auth, such as a service account, is added once: a constructor in `packages/sdk` and a strategy in `apps/server/src/auth-strategies/`. It isn't added per connector.

## Actions

```ts
actions: {
  listTasks: action({
    method: 'GET',
    path: '/tasks',             // mounted at /v1/todoist/{connectionId}/tasks
    scope: 'todoist:read',
    summary: 'List active tasks',
    input: z.object({ cursor: z.string().optional() }),   // query for GET, body otherwise
    output: z.object({ ... }),  // optional, but gives the client a typed response
    run: (ctx, input) => ctx.json(`/tasks?${new URLSearchParams(...)}`),
  }),
  deleteTask: action({ method: 'DELETE', path: '/tasks', scope: 'todoist:delete', confirm: true, input: z.object({ id: z.string() }), ... }),
}
```

Path parameters (`/tasks/:id`) aren't supported yet; pass IDs in `input`. Non-GET actions require an `Idempotency-Key` header. DELETE actions must set `confirm: true`, and callers must confirm.

## Streams

```ts
streams: {
  tasks: stream({
    every: '15m',
    run: async (ctx, cursor) => ({ records: [{ externalId, data }], cursor: next, done: true }),
  }),
}
```

The worker calls `run` with the saved cursor until `done`, upserts `records` and writes a `sync_runs` row. If a connector needs real queries over its data, give it its own tables in `packages/db` rather than querying jsonb.

## MCP proxy connectors

```ts
defineConnector({
  id: 'acme-mcp',
  name: 'Acme',
  auth: apiKey({ fields: z.object({ key: z.string() }), header: 'Authorization', format: 'Bearer {key}' }),
  identify: async (ctx) => ({ externalId: '…', name: '…' }),
  scopes: { 'acme-mcp:mcp': 'Use Acme tools' },
  mcp: { url: 'https://mcp.acme.example/mcp' },
})
```

Clients call `/mcp/{connectionId}` with a Friday token holding `acme-mcp:mcp`. The server swaps in the upstream credential. (The MCP proxy is planned for v0.1; see [build-plan.md](build-plan.md).)

## Checklist

- [ ] `identify` returns a stable upstream account ID
- [ ] Every action's scope is declared, and writes use `write` or `delete` scopes
- [ ] DELETE actions set `confirm: true`
- [ ] Endpoint URLs checked against the provider's current docs
- [ ] `pnpm test` and `pnpm gen` pass, and the regenerated client is committed
