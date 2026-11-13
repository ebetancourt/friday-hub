// The models. Tables, constraints and RLS policies live together.
// Tenant = workspace. Every tenant-owned table carries workspace_id and a policy
// that matches it against the transaction's app.workspace_id (see withTenant).
import { sql } from 'drizzle-orm'
import {
  foreignKey,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgRole,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'

/** The role the app connects as. Created outside migrations (docker/postgres/init.sql). */
export const appRole = pgRole('friday_app').existing()

const currentWorkspace = sql`nullif(current_setting('app.workspace_id', true), '')::uuid`

const tenantPolicy = (table: string) =>
  pgPolicy(`${table}_tenant_isolation`, {
    for: 'all',
    to: appRole,
    using: sql`workspace_id = ${currentWorkspace}`,
    withCheck: sql`workspace_id = ${currentWorkspace}`,
  })

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date())

// ---- Identity (not tenant-scoped: read before a workspace is chosen) --------
// ponytail: minimal users table; the auth library (open question) will own or extend it.

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  name: text(),
  createdAt: createdAt(),
})

export const workspaces = pgTable('workspaces', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  createdAt: createdAt(),
})

export const memberships = pgTable(
  'memberships',
  {
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text().notNull().default('owner'),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.userId] })],
)

// ---- Connections: one row per connected upstream account --------------------

export const connections = pgTable(
  'connections',
  {
    id: uuid().primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    /** Connector id from packages/connectors (code, not a table). */
    connectorId: text('connector_id').notNull(),
    /** From connector.identify(): the upstream account's stable id. */
    externalAccountId: text('external_account_id').notNull(),
    /** From connector.identify(): e.g. the account email. */
    displayName: text('display_name').notNull(),
    /** User-editable, e.g. "Work". */
    label: text(),
    status: text({ enum: ['active', 'needs_reconnect', 'disabled', 'error'] })
      .notNull()
      .default('active'),
    /** Upstream scopes actually granted. */
    grantedScopes: text('granted_scopes').array().notNull().default(sql`'{}'`),
    settings: jsonb().notNull().default({}),
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
    lastError: text('last_error'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    // Reconnecting the same account updates it; another account is a new row.
    unique('connections_account').on(t.workspaceId, t.connectorId, t.externalAccountId),
    // Target for the composite FKs below, so a child row can never point at
    // another workspace's connection.
    unique('connections_id_workspace').on(t.id, t.workspaceId),
    tenantPolicy('connections'),
  ],
)

const connectionFk = (table: string, t: { connectionId: any; workspaceId: any }) =>
  foreignKey({
    name: `${table}_connection_fk`,
    columns: [t.connectionId, t.workspaceId],
    foreignColumns: [connections.id, connections.workspaceId],
  }).onDelete('cascade')

/** Encrypted secrets, apart from connections so listing never touches them. */
export const credentials = pgTable(
  'credentials',
  {
    connectionId: uuid('connection_id').primaryKey(),
    workspaceId: uuid('workspace_id').notNull(),
    /** AES-256-GCM, base64(iv | tag | ciphertext) of the JSON secret. */
    ciphertext: text().notNull(),
    keyVersion: integer('key_version').notNull(),
    /** Access-token expiry; refresh takes SELECT ... FOR UPDATE on this row. */
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    updatedAt: updatedAt(),
  },
  (t) => [connectionFk('credentials', t), tenantPolicy('credentials')],
)

// ---- API tokens ------------------------------------------------------------

export const apiTokens = pgTable(
  'api_tokens',
  {
    id: uuid().primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    /** SHA-256 of the secret. The secret is shown once and never stored. */
    tokenHash: text('token_hash').notNull().unique(),
    /** Friday scopes, e.g. gmail:read, todoist:write. */
    scopes: text().array().notNull(),
    /** null = every connection in the workspace. */
    connectionIds: uuid('connection_ids').array(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [tenantPolicy('api_tokens')],
)

// ---- Sync ------------------------------------------------------------------

export const syncState = pgTable(
  'sync_state',
  {
    connectionId: uuid('connection_id').notNull(),
    workspaceId: uuid('workspace_id').notNull(),
    stream: text().notNull(),
    cursor: jsonb(),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.connectionId, t.stream] }), connectionFk('sync_state', t), tenantPolicy('sync_state')],
)

export const syncRuns = pgTable(
  'sync_runs',
  {
    id: uuid().primaryKey().defaultRandom(),
    connectionId: uuid('connection_id').notNull(),
    workspaceId: uuid('workspace_id').notNull(),
    stream: text().notNull(),
    status: text({ enum: ['running', 'ok', 'failed'] }).notNull(),
    recordCount: integer('record_count').notNull().default(0),
    error: text(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (t) => [index('sync_runs_recent').on(t.connectionId, t.startedAt.desc()), connectionFk('sync_runs', t), tenantPolicy('sync_runs')],
)

/** Synced upstream records. ponytail: one jsonb table for every stream; give a
 * connector its own tables when it needs real queries over its data. */
export const records = pgTable(
  'records',
  {
    connectionId: uuid('connection_id').notNull(),
    workspaceId: uuid('workspace_id').notNull(),
    stream: text().notNull(),
    externalId: text('external_id').notNull(),
    data: jsonb().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.connectionId, t.stream, t.externalId] }), connectionFk('records', t), tenantPolicy('records')],
)
