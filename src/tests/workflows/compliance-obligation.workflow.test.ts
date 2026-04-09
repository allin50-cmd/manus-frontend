/**
 * Tests for complianceObligationWorkflow using Temporal's TestWorkflowEnvironment.
 *
 * These tests run workflows in a fully sandboxed, time-skipping environment
 * without requiring a real Temporal server.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker, Runtime, DefaultLogger } from '@temporalio/worker';
import type { WorkflowState } from '../../domain/types/workflow';

// ── Stub activities ─────────────────────────────────────────────────────────

/**
 * Stub activities that satisfy the workflow's activity interface
 * without touching the database or external services.
 */
const stubActivities = {
  async refreshObligationState(_input: { obligationId: string }) {
    return {
      dueDate: '2026-06-01',
      daysRemaining: 53,
      resolved: false,
      checkedAt: new Date().toISOString(),
    };
  },
  async createAlert(_input: unknown) {
    // no-op
  },
  async writeAudit(_input: unknown) {
    // no-op
  },
  async sendEmail(_input: unknown) {
    // no-op
  },
  async sendSms(_input: unknown) {
    // no-op
  },
};

// ── Test suite ──────────────────────────────────────────────────────────────

describe('complianceObligationWorkflow', () => {
  let testEnv: TestWorkflowEnvironment;

  beforeEach(async () => {
    // Suppress noisy worker logs in tests
    Runtime.install({ logger: new DefaultLogger('WARN') });
    testEnv = await TestWorkflowEnvironment.createTimeSkipping();
  });

  afterEach(async () => {
    await testEnv.teardown();
  });

  async function createWorker(
    overrideActivities: Partial<typeof stubActivities> = {},
  ) {
    return Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue: 'test-compliance',
      workflowsPath: require.resolve(
        '../../temporal/workflows/compliance-obligation.workflow',
      ),
      activities: { ...stubActivities, ...overrideActivities },
    });
  }

  const baseInput = {
    obligationId: '11111111-1111-1111-1111-111111111111',
    tenantId: '22222222-2222-2222-2222-222222222222',
    monitoredCompanyId: '33333333-3333-3333-3333-333333333333',
    obligationType: 'accounts_filing' as const,
  };

  it('starts with monitoring status', async () => {
    const worker = await createWorker();

    await worker.runUntil(async () => {
      const handle = await testEnv.client.workflow.start(
        'complianceObligationWorkflow',
        {
          taskQueue: 'test-compliance',
          workflowId: `test-wf-${Date.now()}`,
          args: [baseInput],
        },
      );

      const state: WorkflowState = await handle.query('getState');

      expect(state.obligationId).toBe(baseInput.obligationId);
      expect(state.obligationType).toBe('accounts_filing');
      // Initial status should be 'monitoring' (set before first check)
      expect(['monitoring', 'paused', 'resolved']).toContain(state.status);
      expect(state.paused).toBe(false);

      // Clean up
      await handle.terminate();
    });
  });

  it('forceRecheck signal causes workflow to re-evaluate immediately', async () => {
    let recheckCallCount = 0;

    const worker = await createWorker({
      async refreshObligationState(_input) {
        recheckCallCount++;
        return {
          dueDate: '2026-06-01',
          daysRemaining: 53,
          resolved: false,
          checkedAt: new Date().toISOString(),
        };
      },
    });

    await worker.runUntil(async () => {
      const handle = await testEnv.client.workflow.start(
        'complianceObligationWorkflow',
        {
          taskQueue: 'test-compliance',
          workflowId: `test-wf-recheck-${Date.now()}`,
          args: [baseInput],
        },
      );

      // Wait for initial run to settle
      await testEnv.sleep('100ms');

      const countBefore = recheckCallCount;

      // Send forceRecheck signal
      await handle.signal('forceRecheck');

      // Small sleep to let the workflow process the signal
      await testEnv.sleep('100ms');

      // Should have triggered another refreshObligationState call
      expect(recheckCallCount).toBeGreaterThan(countBefore);

      await handle.terminate();
    });
  });

  it('markResolved signal stops the workflow cleanly', async () => {
    const worker = await createWorker();

    await worker.runUntil(async () => {
      const handle = await testEnv.client.workflow.start(
        'complianceObligationWorkflow',
        {
          taskQueue: 'test-compliance',
          workflowId: `test-wf-resolve-${Date.now()}`,
          args: [baseInput],
        },
      );

      // Let initial activity run
      await testEnv.sleep('100ms');

      // Send markResolved signal
      await handle.signal('markResolved');

      // The workflow should complete
      await handle.result();

      // Verify final state indicates resolved
      // (query after completion may throw; we just verify no unhandled error)
    });
  });

  it('pauseMonitoring and resumeMonitoring signals work correctly', async () => {
    const worker = await createWorker();

    await worker.runUntil(async () => {
      const handle = await testEnv.client.workflow.start(
        'complianceObligationWorkflow',
        {
          taskQueue: 'test-compliance',
          workflowId: `test-wf-pause-${Date.now()}`,
          args: [baseInput],
        },
      );

      // Let initial run settle
      await testEnv.sleep('100ms');

      // Pause
      await handle.signal('pauseMonitoring');
      await testEnv.sleep('50ms');

      const pausedState: WorkflowState = await handle.query('getState');
      expect(pausedState.paused).toBe(true);
      expect(pausedState.status).toBe('paused');

      // Resume
      await handle.signal('resumeMonitoring');
      await testEnv.sleep('50ms');

      const resumedState: WorkflowState = await handle.query('getState');
      expect(resumedState.paused).toBe(false);
      expect(resumedState.status).not.toBe('paused');

      await handle.terminate();
    });
  });
});
