import { NextRequest, NextResponse } from 'next/server';
import { log } from '../logger';
import { safeEqual } from './safe-equal';

/**
 * Guard for internal/admin API routes.
 *
 * Callers must include: `x-api-key: <MONITORING_API_KEY>`
 * Set MONITORING_API_KEY in environment variables (generate with openssl rand -hex 32).
 *
 * Returns a 401 NextResponse if the key is missing or wrong, null if valid.
 * Comparison is constant-time (HMAC-based) to prevent timing attacks.
 */
export function requireApiKey(req: NextRequest): NextResponse | null {
  const key = req.headers.get('x-api-key');
  const expected = process.env.MONITORING_API_KEY;

  if (!expected) {
    log.error('MONITORING_API_KEY env var not set — failing closed', {
      route: req.nextUrl.pathname,
    });
    return NextResponse.json(
      { error: 'Service not configured — MONITORING_API_KEY missing' },
      { status: 503 },
    );
  }

  if (!key || !safeEqual(key, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
