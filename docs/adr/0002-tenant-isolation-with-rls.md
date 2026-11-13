# 0002. Tenant isolation with row-level security

Status: accepted, 2026-11-12

## Decision

The workspace is the tenant. Every tenant-owned table has `workspace_id` and a Postgres RLS policy matching it against `app.workspace_id`, set per transaction by `withTenant()`. The app connects as `friday_app`, which has no `BYPASSRLS`, is not a superuser and does not own the tables. Child rows reference connections by `(connection_id, workspace_id)`.

## Why

A forgotten `WHERE workspace_id = …` is the classic multi-tenant leak. With RLS, the database refuses to return another workspace's rows whatever the query says. Retrofitting RLS onto existing data is a migration project, so it ships in the first migration.

## Consequences

- Every request and every job runs in a transaction that sets the tenant. Jobs carry `workspaceId`.
- Anything that must run before the tenant is known (sign-in, API-token lookup, the OAuth callback) needs an explicit design. The token lookup is still an open question.
- `packages/db/src/rls.test.ts` must keep passing. Add a case to it for every new tenant table.
