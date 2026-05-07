import { Queue } from 'bullmq';

const connection = {
  url: process.env.REDIS_URL ?? 'redis://localhost:6379',
};

export const fgQueue = new Queue('fineguard-jobs', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { age: 86400 },   // keep 24h
    removeOnFail: { age: 604800 },      // keep 7d
  },
});

export type AuditJobData = {
  tenantId: string;
  email: string;
  companyName?: string;
  companyNumber?: string;
  chamberSize?: string;
  painPoints?: string;
  leadId?: string;
};
