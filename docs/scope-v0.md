# v0 scope

v0 proves one loop end to end. A person signs up and connects Google and Todoist. Friday Hub syncs their data on a schedule, and their apps read and change it through a scoped REST API. The database enforces tenant isolation.

## Decisions

- Multi-tenant from the first migration. The tenant is a **workspace**.
- v0 providers: **Google** (Gmail, Calendar, Drive) and **Todoist**, both read-write.
- Every connection type supports **multiple accounts** per workspace.
- New connection types (OAuth, API key, MCP proxy) are added through one [connector contract](adding-a-connector.md), without migrations or web changes.

## Stack

| Layer | Choice |
| --- | --- |
| Front end | React 19 + Vite. React rather than Preact because the design system is built on React Aria Components. |
| API | Fastify 5, REST, zod schemas → OpenAPI → generated client |
| ORM | Drizzle |
| Database | Postgres, with row-level security |
| Jobs | BullMQ + Redis. Postgres is the source of truth; Redis only delivers jobs. |
| Secrets | AES-256-GCM encrypted columns, master key from env or a KMS |
| Auth | Real user sign-in plus scoped API tokens |
| Repo | pnpm workspace monorepo |

## Multi-tenancy model

Every tenant-owned row carries `workspace_id`, and Postgres row-level security enforces it, so a missed `WHERE` cannot leak data. RLS ships in the first migration because retrofitting it means migrating data.

- **Tenant shape.** Users join a workspace through `memberships` from day one. v0 exposes only the owner; invites come later.
- **Isolation.** The app connects as `friday_app`, a role without `BYPASSRLS` that does not own the tables. Each request and each job runs in a transaction that sets `app.workspace_id`. Policies are declared in Drizzle (`pgPolicy`) beside the tables they guard.
- **Auth.** Sign-in with email and Google. The library is an open question (below).
- **API tokens.** Per-workspace and scoped (`gmail:read`, `todoist:write`), optionally limited to specific connections. They are shown once and stored as SHA-256 hashes.
- **Provider credentials.** Encrypted per row with a `key_version` for rotation. A refresh takes `SELECT … FOR UPDATE` on the credential row, so only one process rotates a token at a time.
- **Jobs.** Every BullMQ payload carries `workspaceId` and `connectionId`, and the worker sets the RLS tenant before it reads anything. Each connection and stream has one job scheduler.
- **Fairness.** v0 uses global worker concurrency. Per-tenant rate limits come when one noisy tenant shows they are needed.

The listener is public: it has to accept internet traffic and provider OAuth callbacks. TLS, rate limiting on auth routes, CSRF protection for the web session and a threat model are v0 work, not polish.

## In v0

- Sign-up and sign-in, with one workspace per new user
- Connect, reconnect and disconnect Google and Todoist over OAuth, any number of accounts each, with the scopes below
- Encrypted credential storage with serialised token refresh
- A scheduled incremental sync per connection: Gmail history ID, Calendar sync tokens, the Drive changes feed and the Todoist sync token
- Writes through the API: Gmail labels, archive and drafts; Calendar events; Drive files; Todoist tasks and projects. Each write needs a write-scoped token and an idempotency key, and each delete needs explicit confirmation.
- Connection health: last success, last error and a needs-reconnect state
- A REST API for reads and writes, API token management and an OpenAPI document
- Web pages: Connections, Sync activity, API tokens, Account, Sign in
- Row-level-security tests that prove one workspace cannot read another's rows (written: `packages/db/src/rls.test.ts`)

## Later

- The raw provider passthrough and the MCP proxy (the contract supports both; v0.1 candidates)
- More connectors: any OAuth, API-key or MCP service
- An approval gate for agent-initiated writes (in v0 the token holder is trusted)
- Team invites and roles, billing and plans
- Provider push notifications (Gmail Pub/Sub, Calendar and Drive watch channels, Todoist webhooks)
- Per-tenant rate limits and data residency
- Per-workspace "bring your own OAuth app"

## Provider constraints

Google's review process, not the code, sets the date of a public launch. `gmail.modify` and `drive` are restricted scopes, so the app stays capped at 100 test users, behind an "unverified app" warning, until it passes Google's annual security assessment (CASA). That cap is fine for a private beta. These review details are approximate; check them against current Google and Todoist documentation before provisioning.

| Provider | Scopes | Google tier and what it requires |
| --- | --- | --- |
| Google sign-in | `openid`, `email`, `profile` | None beyond the consent screen |
| Gmail | `gmail.modify` (read, label, archive, drafts) | Restricted: verification plus an annual CASA assessment |
| Calendar | `calendar` | Sensitive: verification with a verified domain, privacy policy, scope justification and demo video |
| Drive | `drive`, full read-write, needed to read existing documents such as meeting notes | Restricted: covered by the same CASA assessment as Gmail |
| Todoist | `data:read_write`, `data:delete` | Registered app in the Todoist App Management Console; no review gate. Confirm current token-expiry behaviour. |

Friday Hub's OAuth clients must be its own, never shared with another deployment, so neither can revoke the other's tokens.

## Open questions

- [ ] Licence. AGPL keeps hosted forks open; MIT does not.
- [ ] Auth library: Better Auth (Drizzle adapter, organisation model) or hand-rolled sessions with Google sign-in
- [ ] Hosting: managed Postgres and Redis, or both on one VPS
- [ ] When to start the CASA assessment, which gates the public launch
- [ ] How the API-token middleware finds the workspace before RLS applies: a workspace id in the token prefix, or a `SECURITY DEFINER` lookup function
