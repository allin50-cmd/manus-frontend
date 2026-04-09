import { NextRequest, NextResponse } from 'next/server';

/**
 * Guard for internal/admin API routes.
 *
 * Callers must include: `x-api-key: <MONITORING_API_KEY>`
 * Set MONITORING_API_KEY in environment variables (generate with openssl rand -hex 32).
 *
 * Returns a 401 NextResponse if the key is missing or wrong, null if valid.
 * Usage:
 *   const authError = requireApiKey(req);
 *   if (authError) return authError;
 */
export function requireApiKey(req: NextRequest): NextResponse | null {
  const key = req.headers.get('x-api-key');
  const expected = process.env.MONITORING_API_KEY;

  if (!expected) {
    // Env var not set — fail closed; misconfiguration is worse than a hard stop
    return NextResponse.json(
      { error: 'Service not configured — MONITORING_API_KEY missing' },
      { status: 503 },
    );
  }

  if (!key || key !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
