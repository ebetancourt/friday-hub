// Writes the OpenAPI spec without listening. `pnpm gen` runs this, then the
// client codegen. CI regenerates and fails if the committed files differ.
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildApp } from './app.ts'

const app = await buildApp()
await app.ready()
const out = join(import.meta.dirname, '../../../packages/client/openapi.json')
writeFileSync(out, `${JSON.stringify(app.swagger(), null, 2)}\n`)
await app.close()
console.log(`wrote ${out}`)
