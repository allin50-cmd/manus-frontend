import { Client, Connection } from '@temporalio/client';
import { env } from '../lib/env';

/**
 * Temporal client singleton.
 * Uses TEMPORAL_ADDRESS and TEMPORAL_NAMESPACE from validated env.
 *
 * Always use getTemporalClient() to obtain the resolved instance —
 * this defers the TCP connection until first use, which is safe in
 * Next.js where modules are imported at build time.
 */
let _clientInstance: Client | null = null;

export async function getTemporalClient(): Promise<Client> {
  if (_clientInstance) {
    return _clientInstance;
  }

  const connection = await Connection.connect({
    address: env.TEMPORAL_ADDRESS,
  });

  _clientInstance = new Client({
    connection,
    namespace: env.TEMPORAL_NAMESPACE,
  });

  return _clientInstance;
}

/**
 * Convenience re-export for callers that need a typed placeholder.
 * Do NOT call methods on this directly — use getTemporalClient() first.
 *
 * @deprecated Use getTemporalClient() directly.
 */
export const temporalClient = {
  /** @use getTemporalClient() */
  get workflow() {
    throw new Error(
      'Use getTemporalClient() to obtain the Temporal Client instance before calling workflow methods.',
    );
  },
} as unknown as Client;
