import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTemporalClient } from '../../../../temporal/client';
import { pauseMonitoringSignal } from '../../../../temporal/workflows/index';
import { workflowId as buildWorkflowId } from '../../../../lib/ids';
import { requireApiKey } from '../../../../lib/utils/require-api-key';
import { log } from '../../../../lib/logger';

const pauseSchema = z.object({
  obligationId: z.string().uuid('obligationId must be a UUID'),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authError = requireApiKey(req);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = pauseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { obligationId } = parsed.data;
  const wfId = buildWorkflowId(obligationId);

  try {
    const client = await getTemporalClient();
    const handle = client.workflow.getHandle(wfId);
    await handle.signal(pauseMonitoringSignal);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('not found') || message.includes('WORKFLOW_NOT_FOUND')) {
      return NextResponse.json(
        { error: `Workflow not found for obligation ${obligationId}` },
        { status: 404 },
      );
    }
    log.error('[pause] Failed to send signal', { err });
    return NextResponse.json({ error: 'Failed to send signal' }, { status: 500 });
  }
}
