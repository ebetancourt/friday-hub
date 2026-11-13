# 0001. Stack

Status: accepted, 2026-11-12

## Decision

React 19 and Vite on the front end; Fastify 5 with zod schemas and OpenAPI for the REST API; Drizzle on Postgres; BullMQ on Redis for jobs; a pnpm workspace monorepo. The API and the worker are two entrypoints of one package.

## Why

- **React, not Preact:** the design system is built on React Aria Components, which do not officially support Preact.
- **Postgres:** row-level security gives tenant isolation in the database (ADR 0002), and `SELECT … FOR UPDATE SKIP LOCKED` gives safe job claims and token refreshes.
- **BullMQ:** repeatable per-connection schedules (`upsertJobScheduler`) and retries out of the box. Postgres stays the source of truth; Redis only delivers jobs.
- **One server package, two processes:** the API and the worker share models and connector code but scale and restart separately. They never call each other directly.
- **No build step for the server:** Node 24+ runs TypeScript directly, so the code that runs is the code that was written.

## Consequences

Every store call is async and runs in a transaction. Only erasable TypeScript syntax is allowed.
