/** Every job names its workspace and connection; the worker sets the RLS tenant
 * from workspaceId before it reads anything. */
export type SyncJob = { workspaceId: string; connectionId: string; stream: string }

export const SYNC_QUEUE = 'sync'

/** One job scheduler per connection and stream (Queue.upsertJobScheduler). */
export const schedulerId = (j: Pick<SyncJob, 'connectionId' | 'stream'>) => `${j.connectionId}:${j.stream}`
