import { ServiceBusClient as AzureServiceBusClient } from '@azure/service-bus';

// ─── Config ───────────────────────────────────────────────────────────────────

const CONNECTION_STRING = process.env.AZURE_SERVICE_BUS_CONNECTION_STRING ?? '';
const NAMESPACE = process.env.AZURE_SERVICE_BUS_NAMESPACE ?? '';

// ─── Lazy client ──────────────────────────────────────────────────────────────

let _client: AzureServiceBusClient | null = null;

function getSBClient(): AzureServiceBusClient | null {
  if (_client) return _client;
  if (CONNECTION_STRING) {
    try {
      _client = new AzureServiceBusClient(CONNECTION_STRING);
      console.log('[ServiceBus] Connected via connection string');
      return _client;
    } catch (err) {
      console.warn('[ServiceBus] Failed to create client:', err);
    }
  }
  return null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const ServiceBusClient = {
  /**
   * Send a message to a Service Bus queue.
   * Silently no-ops if Service Bus is not configured (dev/test environments).
   */
  async send(queueName: string, body: Record<string, unknown>): Promise<boolean> {
    const client = getSBClient();
    if (!client) {
      console.debug(`[ServiceBus] Not configured — message to "${queueName}" dropped:`, body);
      return false;
    }

    const sender = client.createSender(queueName);
    try {
      await sender.sendMessages({ body });
      return true;
    } catch (err) {
      console.error(`[ServiceBus] Failed to send to "${queueName}":`, err);
      return false;
    } finally {
      await sender.close();
    }
  },

  /**
   * Register a message handler on a queue.
   * Only activates when Service Bus is configured.
   */
  async subscribe(
    queueName: string,
    handler: (body: unknown) => Promise<void>,
  ): Promise<void> {
    const client = getSBClient();
    if (!client) {
      console.info(`[ServiceBus] Not configured — skipping subscription to "${queueName}"`);
      return;
    }

    const receiver = client.createReceiver(queueName);
    receiver.subscribe({
      processMessage: async (msg) => {
        await handler(msg.body);
        await receiver.completeMessage(msg);
      },
      processError: async (err) => {
        console.error(`[ServiceBus] Error on "${queueName}":`, err);
      },
    });

    console.log(`[ServiceBus] Subscribed to "${queueName}"`);
  },
};
