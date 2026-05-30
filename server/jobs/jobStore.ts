import { randomUUID } from 'node:crypto';

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface JobRecord {
  id: string;
  status: JobStatus;
  result?: Record<string, unknown>;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

const memStore = new Map<string, JobRecord>();

export async function createJob(id = randomUUID()): Promise<JobRecord> {
  const now = new Date().toISOString();
  const record: JobRecord = { id, status: 'queued', createdAt: now, updatedAt: now };
  memStore.set(id, record);
  return record;
}

export async function updateJob(id: string, patch: Partial<JobRecord>): Promise<void> {
  const existing = memStore.get(id);
  if (existing) {
    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    memStore.set(id, updated);
  }
}

export async function getJob(id: string): Promise<JobRecord | null> {
  return memStore.get(id) ?? null;
}
