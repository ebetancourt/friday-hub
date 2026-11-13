# 0003. Connector contract and multiple accounts

Status: accepted, 2026-11-13

## Decision

Connection types are declarations made with `defineConnector` from `packages/sdk`, one folder each in `packages/connectors`, listed in `registry.ts`. A connector declares its auth strategy (`oauth2`, `oauth2` with MCP discovery, or `apiKey`), a required `identify()`, its token scopes, and any of four surfaces: typed actions, sync streams, a raw proxy and an MCP upstream. The server implements every flow that touches secrets; connectors get a pre-signed `ctx`.

A connection is one upstream account. Connections are unique on `(workspace_id, connector_id, external_account_id)`, and everything downstream keys on `connection_id`.

## Why

- Adding a provider, an API-key service or an MCP server should be the same small, reviewable change, with no migration, routes or web code.
- Keeping secrets out of connector code makes connectors safe to accept from contributors.
- `identify()` is the only reliable way to tell "reconnect this account" from "add another account".

## Consequences

- New auth kinds are rare and go in the SDK and server, not in connectors.
- Synced data lands in one jsonb `records` table until a connector needs its own tables.
- Validation (`validateConnector`) runs in tests and at server start.
