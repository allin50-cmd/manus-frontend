import { Worker, NativeConnection } from '@temporalio/worker';
import { env } from '../lib/env';
import * as activities from './activities/index';

async function main(): Promise<void> {
  const connection = await NativeConnection.connect({
    address: env.TEMPORAL_ADDRESS,
  });

  const worker = await Worker.create({
    connection,
    namespace: env.TEMPORAL_NAMESPACE,
    taskQueue: env.TEMPORAL_TASK_QUEUE,
    // Temporal's bundler resolves all workflow imports from this entry point.
    workflowsPath: require.resolve('./workflows/index'),
    activities,
  });

  console.log(
    `[Worker] Starting on task queue "${env.TEMPORAL_TASK_QUEUE}" → ${env.TEMPORAL_ADDRESS}`,
  );

  // Graceful shutdown: allow in-flight activities to complete.
  const shutdown = async (signal: string) => {
    console.log(`[Worker] Received ${signal} — initiating graceful shutdown…`);
    worker.shutdown();
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));

  await worker.run();
  console.log('[Worker] Shut down cleanly.');
  await connection.close();
}

main().catch((err) => {
  console.error('[Worker] Fatal error:', err);
  process.exit(1);
});
