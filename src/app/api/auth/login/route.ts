import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'fg_session';
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

export async function POST(req: NextRequest): Promise<NextResponse> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionToken = process.env.ADMIN_SESSION_TOKEN;

  if (!adminPassword || !sessionToken) {
    return NextResponse.json(
      { error: 'Auth not configured' },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const password =
    body != null && typeof body === 'object' && 'password' in body
      ? (body as Record<string, unknown>).password
      : undefined;

  if (typeof password !== 'string' || password !== adminPassword) {
    // Constant-time feel: always return same error regardless of which check fails
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Set HttpOnly session cookie
  const from =
    typeof req.nextUrl.searchParams.get('from') === 'string'
      ? decodeURIComponent(req.nextUrl.searchParams.get('from')!)
      : '/dashboard';

  const res = NextResponse.json({ ok: true, redirect: from });
  res.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });

  return res;
}
