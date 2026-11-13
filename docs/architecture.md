# Architecture

## Runtime

```
              browser ──► apps/web (Vite SPA) ──┐ same origin (/v1 proxied in dev)
                                                ▼
 apps and agents ── Bearer token ──► apps/server  server.ts  (Fastify REST + OpenAPI)
                                         │   ▲
                         enqueue jobs    │   │ read/write under RLS
                                         ▼   │
                    Redis (BullMQ) ◄──► apps/server  worker.ts  (sync streams)
                                             │
                                   Postgres ◄┘  (source of truth, RLS per workspace)
                                             │
                                upstream APIs: Google, Todoist, … (signed by the server)
```

The API and the worker never call each other. They meet only in Postgres and the queue, so either can be scaled or restarted alone.

## Workspaces

| Workspace | Owns |
| --- | --- |
| `apps/web` | Routes. Each route fetches with the generated hooks and renders a template from `packages/ui`. No markup of its own. |
| `apps/server` | HTTP routes, the gateway that mounts connector actions, auth strategies, credential handling, jobs. |
| `packages/db` | The models: `src/schema.ts` (tables, constraints, RLS policies), `migrations/`, `withTenant()`. |
| `packages/sdk` | The connector contract. Connectors import only this, so they cannot reach server internals. |
| `packages/connectors` | One folder per connector, plus `registry.ts`. |
| `packages/client` | Generated from the server's spec. Also publishable as the public JavaScript SDK. |
| `packages/ui` | Tokens, atoms, blocks, page templates and Storybook. See [its README](../packages/ui/README.md). |

Drizzle has no model classes. A model is a table in `schema.ts` plus the types Drizzle infers from it, and services query through `withTenant` directly, with no repository layer.

## Tenancy

The workspace is the tenant. Tables in two groups:

- **Not tenant-scoped:** `users`, `workspaces`, `memberships`. They are read before a workspace is chosen. Queries on them must filter by the signed-in user.
- **Tenant-scoped:** `connections`, `credentials`, `api_tokens`, `sync_state`, `sync_runs`, `records`. Each has `workspace_id` and the policy `workspace_id = current_setting('app.workspace_id')`.

The app connects as `friday_app` (`docker/postgres/init.sql`), which is not a superuser, does not own the tables and lacks `BYPASSRLS`. Migrations run as the owner. `withTenant(db, workspaceId, fn)` opens a transaction and sets `app.workspace_id` locally, so the setting cannot leak to the next request that reuses the connection. With no workspace set, tenant tables return no rows.

Child tables reference a connection by the composite key `(connection_id, workspace_id)`, so the database rejects a row that points at another workspace's connection even if RLS were bypassed.

## Connections and multiple accounts

A **connector** is code: a declaration in `packages/connectors`. A **connection** is a row: one workspace's authenticated link to one upstream account.

- Everything downstream keys on `connection_id`, never on `connector_id`: credentials, jobs, records, sync runs, API paths and token restrictions.
- `connections` is unique on `(workspace_id, connector_id, external_account_id)`. Reconnecting an account updates its row; a different account creates a new one. `external_account_id` comes from the connector's required `identify()`.
- Each connection has an editable `label` ("Work", "Personal") beside the upstream account name.
- An API token can be limited to a list of `connection_ids`.
- Google's authorize request sends `prompt=consent select_account`, so connecting a second time offers the account chooser.

See [adding-a-connector.md](adding-a-connector.md) for the contract.

## The gateway

Each surface a connector declares becomes routes:

| Surface | Route | Status |
| --- | --- | --- |
| Actions | `{METHOD} /v1/{connectorId}/{connectionId}{path}` | Mounted and typed in the spec; handlers return 501 until credentials land |
| Streams | Worker jobs, one scheduler per connection and stream | Job shape defined; processor not built |
| Raw proxy | `/v1/{connectorId}/{connectionId}/proxy/*`, allowlisted, `<id>:proxy` scope | v0.1 |
| MCP proxy | `/mcp/{connectionId}`, streamable HTTP passthrough, `<id>:mcp` scope | v0.1 |

A request through the gateway goes through these steps:
1. Hash the bearer token and find it.
2. Check that the token isn't revoked or expired, that it holds the action's scope, and that its connection allowlist includes this connection.
3. Run `withTenant(workspace)` and load the connection, which RLS confirms belongs to the workspace.
4. Load the credential, refreshing it under `FOR UPDATE` if it has expired.
5. Build `ctx` with a signed `fetch`.
6. Validate the input with the action's zod schema.
7. Enforce the idempotency key for writes and the confirmation for deletes.
8. Run `action.run(ctx, input)`.
9. Write the audit entry.

The connector code never sees the credential.

The MCP proxy forwards bytes and the `Mcp-Session-Id` header without parsing MCP, swapping the client's Friday token for the upstream credential. Filtering which tools a client may use needs parsing and comes later. A connector whose MCP URL the user types in needs an SSRF guard: resolve the host, refuse private and link-local addresses, and pin the resolved IP.

## API and client codegen

```
zod schemas on routes and connector actions
  └─► fastify-type-provider-zod + @fastify/swagger ─► packages/client/openapi.json   (pnpm gen)
        └─► openapi-typescript ─► packages/client/src/schema.ts
              └─► openapi-fetch + openapi-react-query ─► createApi(): typed fetch + useQuery hooks
```

Only types are generated; the runtime is two small libraries. Because connector actions are real routes, each new connector shows up in the spec and in the client with full types. CI regenerates the client and fails if the committed files differ.

## Secrets

Provider credentials are encrypted with AES-256-GCM under `SECRETS_KEY`. Each row stores `key_version`, so rotation is: add the new key, re-encrypt rows lazily or in a job, then retire the old key. The key comes from the environment locally and from a KMS in production.

## Local development

`docker-compose.yml` runs Postgres 18 and Redis 8 only; the apps run on the host. Redis runs with `noeviction` because an evicted key is a lost job. Ports default to 5460 and 6390 to avoid clashing with other local stacks; override them with `POSTGRES_PORT` and `REDIS_PORT`.
