import { randomUUID } from 'node:crypto';
import { fgQueue } from '../queue/fgQueue.js';
import { createJob } from '../jobs/jobStore.js';

export interface EnqueueResult {
  jobId: string;
  correlationId: string;
  status: 'queued' | 'rejected';
  reason?: string;
}

export async function enqueueVaultLineJob(data: Record<string, unknown>): Promise<EnqueueResult> {
  const correlationId = randomUUID();

  try {
    const jobRecord = await createJob(correlationId);

    const job = await fgQueue.add('vaultline-audit', { ...data, correlationId, jobId: jobRecord.id }, {
      jobId: correlationId,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { age: 86400 },
    });

    return { jobId: job.id ?? correlationId, correlationId, status: 'queued' };
  } catch (err) {
    return {
      jobId: '',
      correlationId,
      status: 'rejected',
      reason: err instanceof Error ? err.message : 'Queue unavailable'
    };
  }
}
