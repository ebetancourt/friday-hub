import swagger from '@fastify/swagger'
import Fastify, { type FastifyServerOptions } from 'fastify'
import { jsonSchemaTransform, serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod'
import { connectors } from '@friday-hub/connectors'
import { validateConnector } from '@friday-hub/sdk'
import { connectorRoutes } from './routes/connectors.ts'
import { gatewayRoutes } from './routes/gateway.ts'
import { healthRoutes } from './routes/health.ts'

/** The whole HTTP surface. Used by server.ts and by openapi.ts (spec generation). */
export async function buildApp(opts: FastifyServerOptions = {}) {
  const problems = connectors.flatMap(validateConnector)
  if (problems.length) throw new Error(`Invalid connectors:\n${problems.join('\n')}`)

  const app = Fastify(opts).withTypeProvider<ZodTypeProvider>()
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  await app.register(swagger, {
    openapi: {
      info: { title: 'Friday Hub API', version: '0.0.0' },
      components: { securitySchemes: { token: { type: 'http', scheme: 'bearer' } } },
    },
    transform: jsonSchemaTransform,
  })

  await app.register(healthRoutes)
  await app.register(connectorRoutes)
  await app.register(gatewayRoutes)
  return app
}

export type App = Awaited<ReturnType<typeof buildApp>>
