import { z } from 'zod';

const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

const envSchema = z.object({
  // Skip DATABASE_URL validation at build time — not available in the Docker
  // builder stage. Validated at runtime when the server actually starts.
  DATABASE_URL: isBuildPhase
    ? z.string().optional().default('')
    : z.string().min(1, 'DATABASE_URL is required'),
  // In production TEMPORAL_ADDRESS must be a real endpoint (Temporal Cloud or
  // self-hosted). The localhost default only works in local development.
  // NEXT_PHASE=phase-production-build is set by Next.js during `next build`;
  // we skip the check then so CI can build without TEMPORAL_ADDRESS configured.
  // The guard fires at runtime when the server actually starts.
  TEMPORAL_ADDRESS: z
    .string()
    .min(1)
    .refine(
      (v) =>
        process.env.NEXT_PHASE === 'phase-production-build' ||
        process.env.NODE_ENV !== 'production' ||
        !v.startsWith('localhost'),
      'TEMPORAL_ADDRESS must not be localhost in production — set a Temporal Cloud endpoint',
    )
    .default('localhost:7233'),
  TEMPORAL_NAMESPACE: z.string().default('default'),
  TEMPORAL_TASK_QUEUE: z.string().default('fineguard-compliance'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
  console.error('❌ Invalid environment variables:', _parsed.error.format());
  throw new Error(
    `Invalid environment variables:\n${JSON.stringify(_parsed.error.format(), null, 2)}`,
  );
}

export const env = _parsed.data;
