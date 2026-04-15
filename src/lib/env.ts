import { z } from 'zod';

const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

const envSchema = z.object({
  // Skip DATABASE_URL validation at build time — not available in the Docker
  // builder stage. Validated at runtime when the server actually starts.
  DATABASE_URL: isBuildPhase
    ? z.string().optional().default('')
    : z.string().min(1, 'DATABASE_URL is required'),
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
