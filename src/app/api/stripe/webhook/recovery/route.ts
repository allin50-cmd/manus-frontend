import { NextRequest, NextResponse } from 'next/server';
import {
  resetStaleProcessingEvents,
  listFailedEvents,
} from '@/server/services/billing/webhook-recovery.service';
import { safeEqual } from '@/lib/utils/safe-equal';

/**
 * Admin endpoint for webhook event recovery.
 *
 * GET  — list failed events (for inspection/replay decisions)
 * POST — reset stale processing events back to failed so Stripe can retry
 *
 * Guarded by DEPLOY_RECORD_TOKEN (same secret used by the deployment workflow).
 * Call from a cron job or manually after an incident.
 *
 * Example:
 *   curl -X POST /api/stripe/webhook/recovery \
 *     -H "x-admin-token: $DEPLOY_RECORD_TOKEN"
 */

function assertAdminToken(req: NextRequest): boolean {
  const token = req.headers.get('x-admin-token');
  const expected = process.env.DEPLOY_RECORD_TOKEN;
  return Boolean(expected && token && safeEqual(token, expected));
}

export async function GET(req: NextRequest) {
  if (!assertAdminToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const events = await listFailedEvents(100);
  return NextResponse.json({ failed: events.length, events });
}

export async function POST(req: NextRequest) {
  if (!assertAdminToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reset, deadLettered } = await resetStaleProcessingEvents();
  return NextResponse.json({
    reset: reset.length,
    deadLettered: deadLettered.length,
    resetIds: reset,
    deadLetteredIds: deadLettered,
  });
}
