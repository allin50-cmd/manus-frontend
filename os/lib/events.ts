import { prisma } from './prisma';
import { getRedis } from './redis';

export type EventPayload = Record<string, unknown>;

export async function emit(
  type: string,
  payload: EventPayload,
  tenantId: string,
  leadId?: string,
): Promise<void> {
  await prisma.event.create({
    data: {
      tenantId,
      type,
      leadId: leadId ?? null,
      metadata: payload as never,
    },
  });

  const redis = getRedis();
  if (redis) {
    await redis.publish(
      `tenant:${tenantId}:events`,
      JSON.stringify({ type, payload, leadId, at: new Date().toISOString() }),
    );
  }
}
