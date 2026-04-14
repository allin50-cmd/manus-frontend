import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { safeEqual } from '@/lib/utils/safe-equal';

const SESSION_COOKIE = 'fg_session';

/**
 * Returns true when the request carries a valid admin session cookie.
 * Reads from the Next.js cookies() API (server components / route handlers).
 */
export function hasValidSession(): boolean {
  const expected = process.env.ADMIN_SESSION_TOKEN;
  if (!expected) return false;
  const store = cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return safeEqual(token, expected);
}

/**
 * Guard for API route handlers.
 * Returns a 401 NextResponse when the session is invalid, null when valid.
 *
 * Usage:
 *   const unauth = requireSession(req);
 *   if (unauth) return unauth;
 */
export function requireSession(_req: NextRequest): NextResponse | null {
  if (!hasValidSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
