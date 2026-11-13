# Working on Friday Hub

Read [docs/architecture.md](docs/architecture.md) before changing anything across packages.

## Rules that keep the system safe

- **Tenancy.** Every tenant-owned table has `workspace_id`, a `tenantPolicy(...)` and, if it hangs off a connection, the composite `connectionFk(...)`. The app only touches those tables inside `withTenant(db, workspaceId, fn)`. Never connect the app as the owner role.
- **Secrets.** Connector code never sees a credential. It gets a `ctx` whose `fetch` is already signed. Secrets are encrypted at rest, and refreshes take `SELECT … FOR UPDATE` on the credential row.
- **Multiple accounts.** Everything downstream keys on `connection_id`, never on `connector_id`.
- **Writes.** Non-GET actions need an `Idempotency-Key`; DELETE actions need `confirm: true` and the caller's confirmation.

## Conventions

- Node 24+ runs TypeScript directly; the server has no build step. Imports use `.ts` extensions, and only erasable syntax is allowed (no `enum`, `namespace` or parameter properties).
- `packages/client/openapi.json` and `src/schema.ts` are generated. After changing a route or a connector, run `pnpm gen` and commit the result. CI fails if they are stale.
- Typechecking uses TypeScript 7. `packages/client` pins TypeScript 5 because `openapi-typescript` needs the JavaScript compiler API.
- UI tiers: atoms → blocks → templates, and imports only point downward. Templates take data through props and never fetch. Every component has stories, and the accessibility check must pass.
- Adding a connector: follow [docs/adding-a-connector.md](docs/adding-a-connector.md). It needs no migration and no web code.
- Prefer the smallest change that works. Add an abstraction when the second caller arrives, not before.

## Before you push

```sh
pnpm typecheck && pnpm test
```

`pnpm test` needs `docker compose up -d` (for the RLS test) and Chromium (for the story tests).
