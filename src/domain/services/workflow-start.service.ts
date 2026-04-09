import { WorkflowIdReusePolicy, WorkflowExecutionAlreadyStartedError } from '@temporalio/client';
import { getTemporalClient } from '../../temporal/client';
import { env } from '../../lib/env';
import { workflowId as buildWorkflowId } from '../../lib/ids';
import { insertWorkflowInstance } from '../../repositories/workflow-instance.repository';
import { updateObligationWorkflowId } from '../../repositories/obligation.repository';
import type { ObligationType } from '../types/obligation';
import type { ComplianceObligationWorkflowInput } from '../../temporal/workflows/compliance-obligation.workflow';
import { log } from '../../lib/logger';

export interface StartObligationWorkflowInput {
  tenantId: string;
  obligationId: string;
  monitoredCompanyId: string;
  obligationType: ObligationType;
  companyNumber?: string;
}

export interface StartObligationWorkflowResult {
  workflowId: string;
  alreadyRunning: boolean;
}

/**
 * Start a Temporal compliance obligation workflow and record it in the database.
 *
 * Uses REJECT_DUPLICATE policy: if a workflow with the same ID is already
 * running or completed, we skip the start and return alreadyRunning=true.
 * This makes the function safe to call on activation retry.
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
    ...(input.companyNumber ? { companyNumber: input.companyNumber } : {}),
  };

  const client = await getTemporalClient();

  try {
    await client.workflow.start('complianceObligationWorkflow', {
      taskQueue: env.TEMPORAL_TASK_QUEUE,
      workflowId: wfId,
      workflowIdReusePolicy: WorkflowIdReusePolicy.REJECT_DUPLICATE,
      args: [workflowArgs],
    });
  } catch (err) {
    if (err instanceof WorkflowExecutionAlreadyStartedError) {
      log.warn('workflow already running — skipping start', {
        workflowId: wfId,
        obligationId: input.obligationId,
        obligationType: input.obligationType,
      });
      await updateObligationWorkflowId(input.obligationId, wfId);
      return { workflowId: wfId, alreadyRunning: true };
    }
    throw err;
  }

  await insertWorkflowInstance({
    tenantId: input.tenantId,
    obligationId: input.obligationId,
    workflowId: wfId,
    taskQueue: env.TEMPORAL_TASK_QUEUE,
  });

  await updateObligationWorkflowId(input.obligationId, wfId);

  log.info('temporal workflow started', {
    workflowId: wfId,
    obligationId: input.obligationId,
    obligationType: input.obligationType,
  });

  return { workflowId: wfId, alreadyRunning: false };
}
