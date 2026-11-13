# Build plan to v0

Each slice ships with tests and leaves `main` working. Do them in order: later slices depend on earlier ones.

## Done: skeleton

- Monorepo, `docker-compose.yml` for Postgres and Redis, CI
- `packages/db`: schema, RLS policies, first migration, `withTenant`, RLS isolation test
- `packages/sdk` and `packages/connectors`: contract, validation, Google and Todoist declarations, template
- `apps/server`: Fastify with zod and OpenAPI, connector catalogue (`GET /v1/connectors`), connector actions mounted as typed routes (501), worker entrypoint
- `packages/client`: generated types plus fetch client and React Query hooks
- `packages/ui`: tokens, 8 components across atoms, blocks and templates, Storybook with a11y tests
- `apps/web`: Connections page reading the catalogue through the generated client

## Slices

1. **Secrets.** `apps/server/src/services/secrets.ts`: AES-256-GCM encrypt and decrypt with `key_version`. Tests cover a round trip, a wrong key and tampered ciphertext.
2. **Auth and sessions.** Settle the auth-library question. Sign-up creates a user, a workspace and an owner membership. Add session cookies, CSRF protection and rate limits on auth routes, plus a Sign in page (`SignInPage` template).
3. **Connections API.** `GET/PATCH/DELETE /v1/connections` under `withTenant`: list, rename the label, disconnect. Wire the Connections page to it.
4. **OAuth connect.**
   - `POST /v1/connections {connectorId}` returns the authorize URL. The state and PKCE verifier go into Redis with a 10-minute TTL.
   - `GET /v1/oauth/callback` exchanges the code, calls `identify`, upserts on `(workspace, connector, external_account_id)` and stores the credential.
   - Reconnect is the same flow.
   - Tests: connecting a second account adds a row; reconnecting an existing account updates its row.
5. **API-key connect.** The same endpoint validates fields against the connector's schema, then `identify`, then upsert. The connect dialog renders from the catalogue's JSON Schema.
6. **Signed ctx and refresh.**
   - Load the credential and refresh it under `SELECT … FOR UPDATE`.
   - Mark the connection `needs_reconnect` on `invalid_grant`.
   - Build `ctx.fetch` and `ctx.json`.
   - Test that concurrent refreshes produce exactly one token exchange.
7. **API tokens.**
   - Create (shown once), list and revoke, plus the API tokens page.
   - Bearer middleware: hash lookup, expiry and revocation, scope check, connection allowlist, set the tenant.
   - Settle how the middleware finds the workspace before RLS applies (open question in the scope doc).
8. **Gateway actions.**
   - Replace the 501 handler with ctx and `action.run`.
   - `Idempotency-Key` for writes (stored response, 24 hours) and confirmation for deletes.
   - Add an `audit_log` table.
   - Add output schemas to the Google and Todoist actions, then add their write actions.
9. **Sync.**
   - On connect, `upsertJobScheduler` per connection and stream; remove the schedulers on disconnect.
   - The worker runs streams into `records`, `sync_state` and `sync_runs`.
   - Streams: Gmail history, Calendar sync tokens, Drive changes, Todoist sync.
   - Add the Sync activity page.
10. **Remaining pages and components.** Account page, plus the rest of the design-system components (see `packages/ui/README.md`).
11. **Public listener.**
    - TLS termination, security headers and request limits.
    - A threat model in `docs/threat-model.md`.
    - Container images for the server and worker.

## v0.1 candidates

- Raw proxy surface, with an allowlist and the `<id>:proxy` scope
- MCP proxy:
  - streamable HTTP passthrough
  - `oauth_clients` table for dynamic client registration
  - SSRF guard for MCP URLs that users supply
- Per-workspace OAuth apps
