import { NextRequest, NextResponse } from 'next/server';
import { getObligationById } from '../../../../../repositories/obligation.repository';
import { getTemporalClient } from '../../../../../temporal/client';
import { getStateQuery } from '../../../../../temporal/workflows/index';
import type { WorkflowState } from '../../../../../domain/types/workflow';

interface RouteContext {
  params: { id: string };
}

export async function GET(
  _req: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const { id } = context.params;

  if (!id) {
    return NextResponse.json({ error: 'Missing obligation id' }, { status: 400 });
  }

  const obligation = await getObligationById(id);
  if (!obligation) {
    return NextResponse.json(
      { error: `Obligation not found: ${id}` },
      { status: 404 },
    );
  }

  if (!obligation.workflowId) {
    return NextResponse.json(
      { error: 'No workflow associated with this obligation' },
      { status: 404 },
    );
  }

  try {
    const client = await getTemporalClient();
    const handle = client.workflow.getHandle(obligation.workflowId);
    const state: WorkflowState = await handle.query(getStateQuery);
    return NextResponse.json({ workflowState: state });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('not found') || message.includes('WORKFLOW_NOT_FOUND')) {
      return NextResponse.json(
        {
          error: 'Workflow not found or has completed',
          workflowId: obligation.workflowId,
        },
        { status: 404 },
      );
    }
    console.error('[workflow-state] Query failed', err);
    return NextResponse.json(
      { error: 'Failed to query workflow state' },
      { status: 500 },
    );
  }
}
