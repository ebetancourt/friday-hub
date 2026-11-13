// Proves one workspace cannot see or write another's rows. Needs the local
// database: docker compose up -d && pnpm db:migrate.
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { createDb, schema, withTenant } from './index.ts'

const ownerUrl = process.env.MIGRATION_DATABASE_URL
const appUrl = process.env.DATABASE_URL

describe.skipIf(!ownerUrl || !appUrl)('row-level security', () => {
  const owner = createDb(ownerUrl!) // bypasses RLS: fixtures only
  const app = createDb(appUrl!) // the role the server runs as
  let a: string
  let b: string

  beforeAll(async () => {
    const [wa, wb] = await owner.insert(schema.workspaces).values([{ name: 'A' }, { name: 'B' }]).returning()
    a = wa!.id
    b = wb!.id
    await owner.insert(schema.connections).values([
      { workspaceId: a, connectorId: 'google', externalAccountId: 'a-1', displayName: 'a@example.com' },
      { workspaceId: b, connectorId: 'google', externalAccountId: 'b-1', displayName: 'b@example.com' },
    ])
  })

  afterAll(async () => {
    await owner.delete(schema.workspaces).where(eq(schema.workspaces.id, a))
    await owner.delete(schema.workspaces).where(eq(schema.workspaces.id, b))
    await owner.$client.end()
    await app.$client.end()
  })

  test('a workspace sees only its own rows', async () => {
    const rows = await withTenant(app, a, (tx) => tx.select().from(schema.connections))
    expect(rows.map((r) => r.displayName)).toEqual(['a@example.com'])
  })

  test('no tenant set means no rows', async () => {
    expect(await app.select().from(schema.connections)).toEqual([])
  })

  test('cannot insert into another workspace', async () => {
    const insert = withTenant(app, a, (tx) =>
      tx.insert(schema.connections).values({ workspaceId: b, connectorId: 'todoist', externalAccountId: 'x', displayName: 'x' }),
    )
    await expect(insert).rejects.toMatchObject({ cause: { message: expect.stringMatching(/row-level security/) } })
  })

  test('the same account connects once per workspace; a second account is a new connection', async () => {
    const dupe = owner
      .insert(schema.connections)
      .values({ workspaceId: a, connectorId: 'google', externalAccountId: 'a-1', displayName: 'again' })
    await expect(dupe).rejects.toThrow()
    await owner
      .insert(schema.connections)
      .values({ workspaceId: a, connectorId: 'google', externalAccountId: 'a-2', displayName: 'a2@example.com' })
    const rows = await withTenant(app, a, (tx) => tx.select().from(schema.connections))
    expect(rows).toHaveLength(2)
  })
})
