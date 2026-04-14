import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/server/db';
import { deploymentStatus } from '@/server/db/schema';
import { safeEqual } from '@/lib/utils/safe-equal';

const recordSchema = z.object({
  environment: z.enum(['production', 'staging']),
  status: z.enum(['success', 'failed']),
  commit: z.string().min(1).max(50),
  workflowRun: z.string().min(1).max(50),
});

function assertDeployToken(req: NextRequest): boolean {
  const token = req.headers.get('x-deploy-token');
  const expected = process.env.DEPLOY_RECORD_TOKEN;
  return Boolean(expected && token && safeEqual(token, expected));
}

/**
 * Records a deployment event written by the GitHub Actions workflow.
 * Guarded by DEPLOY_RECORD_TOKEN (same secret used by the recovery endpoint).
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!assertDeployToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = recordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { environment, status, commit, workflowRun } = parsed.data;

  const [row] = await db
    .insert(deploymentStatus)
    .values({ environment, status, commit, workflowRun })
    .returning({ id: deploymentStatus.id });

  return NextResponse.json({ id: row.id, recorded: true }, { status: 201 });
}
