import { Worker } from 'bullmq'
import { Redis } from 'ioredis'
import { loadEnv } from './env.ts'
import { SYNC_QUEUE, type SyncJob } from './jobs/sync.ts'

const env = loadEnv()

const worker = new Worker<SyncJob>(
  SYNC_QUEUE,
  async (job) => {
    // Not built yet: withTenant(job.data.workspaceId) -> load connection and
    // cursor -> connector.streams[stream].run(ctx, cursor) until done -> upsert
    // records, save cursor, write sync_runs. See docs/build-plan.md.
    throw new Error(`sync not implemented: ${job.data.connectionId}/${job.data.stream}`)
  },
  // BullMQ workers need maxRetriesPerRequest: null (blocking commands).
  { connection: new Redis(env.REDIS_URL, { maxRetriesPerRequest: null }) },
)

worker.on('ready', () => console.log(`worker listening on queue "${SYNC_QUEUE}"`))
worker.on('failed', (job, err) => console.error(`job ${job?.id} failed: ${err.message}`))

for (const sig of ['SIGINT', 'SIGTERM']) process.once(sig, () => void worker.close().then(() => process.exit(0)))
