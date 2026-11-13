# Friday Hub

Friday Hub connects a person's Gmail, Calendar, Drive and Todoist and lets their apps and agents use them through one scoped REST API. It is a multi-tenant web service: each workspace connects its own accounts, and Postgres row-level security keeps workspaces apart.

> **Status: pre-v0.** The skeleton runs end to end (database with RLS, connector contract, typed API, generated client, web app, Storybook). Connecting accounts, syncing data and API tokens are not built yet. [docs/build-plan.md](docs/build-plan.md) lists what comes next, in order.

## Quick start

You need Node 24+, pnpm 12 and Docker.

```sh
cp .env.example .env            # then set SECRETS_KEY (command in the file)
docker compose up -d --wait     # Postgres 18 on :5460, Redis 8 on :6390
pnpm install
pnpm db:migrate
pnpm dev                        # API :3060, worker, web :5173
```

Open http://localhost:5173. Storybook runs with `pnpm storybook` on :6006.

To start the database from scratch: `docker compose down -v && docker compose up -d --wait && pnpm db:migrate`.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | API, worker and web app with reload |
| `pnpm test` | Unit tests, the RLS isolation test, and every Storybook story with accessibility checks (headless Chromium) |
| `pnpm typecheck` | `tsc` in every workspace |
| `pnpm gen` | Regenerate `packages/client` from the server's OpenAPI spec. Run it after changing a route or a connector, and commit the result. |
| `pnpm db:generate` | Write a migration from changes to `packages/db/src/schema.ts` |
| `pnpm db:migrate` | Apply migrations (as the owner role) |
| `pnpm storybook` | The design system in Storybook |

The first `pnpm test` needs a browser for the story tests: `pnpm --filter @friday-hub/ui exec playwright install chromium`.

## Layout

```
apps/web               Vite + React SPA. Routes fetch with the generated client and render ui templates.
apps/server            Fastify API (server.ts) and BullMQ worker (worker.ts): one codebase, two processes.
packages/db            The models: Drizzle schema, RLS policies, migrations, withTenant().
packages/sdk           The connector contract: defineConnector, oauth2(), apiKey(), action(), stream().
packages/connectors    One folder per connector (google, todoist) plus registry.ts.
packages/client        Generated: openapi.json, typed fetch client and React Query hooks.
packages/ui            Design system: tokens, atoms, blocks, page templates, Storybook.
docs/                  Scope, architecture, decisions (adr/), how to add a connector, build plan.
```

## Documentation

- [v0 scope](docs/scope-v0.md): what v0 does, what it leaves out, and provider constraints
- [Architecture](docs/architecture.md): runtime, tenancy, the gateway, multiple accounts and codegen
- [Adding a connector](docs/adding-a-connector.md): OAuth, API key and MCP connection types
- [Build plan](docs/build-plan.md): the slices that take this skeleton to v0
- [Decisions](docs/adr/): why the stack, RLS, the connector contract and the generated client
- [Design system](packages/ui/README.md): brand, tokens and component tiers

## Licence

Not chosen yet (see the open questions in [docs/scope-v0.md](docs/scope-v0.md)). Until a licence is added, all rights are reserved.
