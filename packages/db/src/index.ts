import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.ts'

export * as schema from './schema.ts'

export const createDb = (url: string) => drizzle(postgres(url), { schema, casing: 'snake_case' })

export type Db = ReturnType<typeof createDb>
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]

/** Run fn in a transaction scoped to one workspace. RLS hides every other
 * workspace's rows; this is the only way the app should touch tenant tables. */
export function withTenant<T>(db: Db, workspaceId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.workspace_id', ${workspaceId}, true)`)
    return fn(tx)
  })
}
