# 0004. Generated API client

Status: accepted, 2026-11-13

## Decision

The server's zod schemas produce the OpenAPI spec (`@fastify/swagger` with `fastify-type-provider-zod`). `openapi-typescript` generates types from it, and the web app uses them through `openapi-fetch` and `openapi-react-query`. `pnpm gen` regenerates `packages/client`, the output is committed, and CI fails if it is stale.

## Why

- The spec is a product in its own right: third parties call Friday Hub's API, so it has to be accurate. Generating the client from it means the web app tests that accuracy every day.
- Connector actions are real routes, so new connectors appear in the client with full types without anyone writing client code.
- Only types are generated. The runtime is two small libraries, so there is no generated code to review.

## Consequences

`openapi-typescript` needs the TypeScript 5 compiler API, so `packages/client` pins TypeScript 5 while the rest of the repo typechecks with TypeScript 7.
