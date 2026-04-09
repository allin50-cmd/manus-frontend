import { getTemporalClient } from '../../temporal/client';
import { env } from '../../lib/env';
import { workflowId as buildWorkflowId } from '../../lib/ids';
import { insertWorkflowInstance } from '../../repositories/workflow-instance.repository';
import { updateObligationWorkflowId } from '../../repositories/obligation.repository';
import type { ObligationType } from '../types/obligation';
import type { ComplianceObligationWorkflowInput } from '../../temporal/workflows/compliance-obligation.workflow';

export interface StartObligationWorkflowInput {
  tenantId: string;
  obligationId: string;
  monitoredCompanyId: string;
  obligationType: ObligationType;
}

export interface StartObligationWorkflowResult {
  workflowId: string;
}

/**
 * Start a Temporal compliance obligation workflow and record it in the database.
 *
 * Steps:
 * 1. Compute the canonical workflowId
 * 2. Start the workflow via Temporal client (using workflow function name string)
 * 3. Persist a workflow_instances record
 * 4. Update the obligation with the workflowId
 *
 * Note: We reference the workflow by its exported function name string rather
 * than importing the function itself, to avoid pulling the workflow sandbox
 * bundle into the Next.js server bundle.
 */
export async function startObligationWorkflow(
  input: StartObligationWorkflowInput,
): Promise<StartObligationWorkflowResult> {
  const wfId = buildWorkflowId(input.obligationId);

  const workflowArgs: ComplianceObligationWorkflowInput = {
    obligationId: input.obligationId,
    tenantId: input.tenantId,
    monitoredCompanyId: input.monitoredCompanyId,
    obligationType: input.obligationType,
  };

  const client = await getTemporalClient();

  await client.workflow.start('complianceObligationWorkflow', {
    taskQueue: env.TEMPORAL_TASK_QUEUE,
    workflowId: wfId,
    args: [workflowArgs],
  });

  await insertWorkflowInstance({
    tenantId: input.tenantId,
    obligationId: input.obligationId,
    workflowId: wfId,
    taskQueue: env.TEMPORAL_TASK_QUEUE,
  });

  await updateObligationWorkflowId(input.obligationId, wfId);

  return { workflowId: wfId };
}
