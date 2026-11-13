// The connector contract. A connector is a declaration: how to authenticate,
// how to tell which account a credential belongs to, and what it exposes
// (typed actions, synced streams, a raw passthrough, an MCP upstream).
// The server owns every flow that touches secrets. Connector code only ever
// gets a ctx whose fetch is already signed and refreshed.
import type { z } from 'zod'

export { z } from 'zod'

// ---- Auth strategies (closed set; a new kind = a constructor here + a
// strategy in apps/server/src/auth-strategies) -------------------------------

export type OAuth2Static = {
  kind: 'oauth2'
  authorizeUrl: string
  tokenUrl: string
  scopes: string[]
  scopeSeparator?: string // default ' '
  pkce?: boolean // default true
  authorizeParams?: Record<string, string>
}

/** MCP servers: discover the authorization server from the resource, register
 * a client dynamically, then run PKCE (MCP authorization spec). */
export type OAuth2Mcp = { kind: 'oauth2'; discover: 'mcp' }

export type OAuth2Auth = OAuth2Static | OAuth2Mcp

export type ApiKeyAuth = {
  kind: 'api_key'
  /** What the connect form asks for. Rendered by the web app from JSON Schema. */
  fields: z.ZodObject<Record<string, z.ZodString>>
  /** Header to set on every upstream request. */
  header: string
  /** Header value template; {field} placeholders are filled from `fields`. */
  format: string
}

export type Auth = OAuth2Auth | ApiKeyAuth

export const oauth2 = (config: Omit<OAuth2Static, 'kind'> | Omit<OAuth2Mcp, 'kind'>): OAuth2Auth =>
  ({ kind: 'oauth2', ...config }) as OAuth2Auth

export const apiKey = (config: Omit<ApiKeyAuth, 'kind'>): ApiKeyAuth => ({ kind: 'api_key', ...config })

// ---- Runtime context --------------------------------------------------------

export interface Ctx {
  connectionId: string
  workspaceId: string
  /** Signed fetch. Relative URLs resolve against the connector's baseUrl. */
  fetch(url: string, init?: RequestInit): Promise<Response>
  /** fetch + throw on non-2xx + parse JSON. */
  json<T = unknown>(url: string, init?: RequestInit): Promise<T>
}

export type Identity = { externalId: string; name: string }

// ---- What a connector exposes ---------------------------------------------

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface Action<I extends z.ZodType = z.ZodType, O extends z.ZodType = z.ZodType> {
  method: Method
  /** Mounted at /v1/{connectorId}/{connectionId}{path}. */
  path: string
  /** A Friday token scope this connector declares, e.g. 'gmail:read'. */
  scope: string
  summary?: string
  /** Query string for GET, JSON body otherwise. */
  input?: I
  output?: O
  /** Writes: the caller must send Idempotency-Key. Default true for non-GET. */
  idempotent?: boolean
  /** Deletes: the caller must send Confirm: true. */
  confirm?: boolean
  run(ctx: Ctx, input: z.infer<I>): Promise<z.infer<O>>
}

export const action = <I extends z.ZodType, O extends z.ZodType>(a: Action<I, O>) => a

export type SyncRecord = { externalId: string; data: unknown; deleted?: boolean }

export interface Stream {
  /** How often the worker runs it, e.g. '15m'. */
  every: string
  /** One page. Return done: false to be called again straight away with the new cursor. */
  run(ctx: Ctx, cursor: unknown): Promise<{ records: SyncRecord[]; cursor: unknown; done: boolean }>
}

export const stream = (s: Stream) => s

export interface Connector {
  /** Lowercase slug; becomes the URL segment and the scope namespace. */
  id: string
  name: string
  auth: Auth
  baseUrl?: string
  /** Required: which upstream account is this? Drives multi-account dedupe. */
  identify(ctx: Ctx): Promise<Identity>
  /** Friday token scopes, 'area:read|write|delete' -> description. */
  scopes: Record<string, string>
  actions?: Record<string, Action<any, any>>
  streams?: Record<string, Stream>
  /** Raw passthrough under /v1/{id}/{connectionId}/proxy/*. Opt-in, allowlisted. */
  proxy?: { allow: string[] }
  /** MCP upstream proxied at /mcp/{connectionId}. */
  mcp?: { url: string }
}

export const defineConnector = <C extends Connector>(c: C) => c

// ---- Validation (run by the registry test and at server start) -------------

const ID = /^[a-z][a-z0-9-]*$/
const SCOPE = /^[a-z][a-z0-9-]*:(read|write|delete|proxy|mcp)$/

export function validateConnector(c: Connector): string[] {
  const errors: string[] = []
  const at = (msg: string) => errors.push(`${c.id}: ${msg}`)
  if (!ID.test(c.id)) at(`id must match ${ID}`)
  for (const s of Object.keys(c.scopes)) if (!SCOPE.test(s)) at(`scope "${s}" must match ${SCOPE}`)
  const seen = new Set<string>()
  for (const [name, a] of Object.entries(c.actions ?? {})) {
    if (!(a.scope in c.scopes)) at(`action ${name} uses undeclared scope "${a.scope}"`)
    if (!a.path.startsWith('/')) at(`action ${name} path must start with /`)
    if (a.path.startsWith('/proxy')) at(`action ${name} path /proxy is reserved`)
    if (a.path.includes(':')) at(`action ${name}: path parameters are not supported yet; pass ids in input`)
    const key = `${a.method} ${a.path}`
    if (seen.has(key)) at(`duplicate route ${key}`)
    seen.add(key)
    if (a.method === 'DELETE' && !a.confirm) at(`action ${name} is a DELETE and must set confirm: true`)
  }
  if (c.proxy && !(`${c.id}:proxy` in c.scopes)) at(`proxy needs the "${c.id}:proxy" scope`)
  if (c.mcp && !(`${c.id}:mcp` in c.scopes)) at(`mcp needs the "${c.id}:mcp" scope`)
  return errors
}
