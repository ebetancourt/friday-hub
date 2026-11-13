import { z } from 'zod'

/** Parsed once at process start; a missing variable fails fast with its name. */
export const loadEnv = () =>
  z
    .object({
      DATABASE_URL: z.url(),
      REDIS_URL: z.url(),
      PORT: z.coerce.number().default(3060),
      /** 127.0.0.1 locally; 0.0.0.0 in a container. */
      HOST: z.string().default('127.0.0.1'),
      PUBLIC_URL: z.url(),
      SECRETS_KEY: z.base64().refine((k) => Buffer.from(k, 'base64').length === 32, '32 bytes, base64'),
      SECRETS_KEY_VERSION: z.coerce.number().int().positive(),
    })
    .parse(process.env)

export type Env = ReturnType<typeof loadEnv>
