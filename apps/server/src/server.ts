import { buildApp } from './app.ts'
import { loadEnv } from './env.ts'

const env = loadEnv()
const app = await buildApp({ logger: true })
await app.listen({ port: env.PORT, host: env.HOST })
