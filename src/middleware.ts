/**
 * Next.js middleware.
 *
 * Responsibilities:
 * 1. Dashboard session auth — redirects to /login when cookie is absent/invalid.
 * 2. CSP nonce — generates a per-request nonce and sets a strict Content-Security-Policy.
 *    The nonce is forwarded in the `x-nonce` request header so Server Components can
 *    read it via `headers()` and attach it to any inline <Script> elements.
 *
 * Security notes:
 * - `unsafe-eval` is intentionally absent; production Next.js builds don't need it.
 * - `strict-dynamic` supersedes `unsafe-inline` in supporting browsers; the
 *   `unsafe-inline` fallback remains for old browsers that don't understand strict-dynamic.
 * - `frame-ancestors 'none'` duplicates X-Frame-Options: DENY for CSP Level 2+.
 */
import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'fg_session';

// ── Nonce helpers ─────────────────────────────────────────────────────────────

function generateNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Buffer.from(bytes).toString('base64');
}

function buildCsp(nonce: string): string {
  // In development allow unsafe-eval so HMR works.
  const scriptSrc =
    process.env.NODE_ENV === 'development'
      ? `'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' 'unsafe-eval'`
      : `'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline'`;

  return [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https:`,
    `font-src 'self' data:`,
    `connect-src 'self' https:`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
  ].join('; ');
}

// ── Middleware ────────────────────────────────────────────────────────────────

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;

  // API routes return JSON — browsers don't enforce CSP on them.
  // Skip nonce generation and header injection to reduce per-request overhead.
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Dashboard auth guard
  if (pathname.startsWith('/dashboard')) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const expected = process.env.ADMIN_SESSION_TOKEN;

    if (!expected || token !== expected) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('from', encodeURIComponent(pathname));
      return NextResponse.redirect(loginUrl);
    }
  }

  // Generate nonce and forward to Server Components via request header
  const nonce = generateNonce();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);

  const res = NextResponse.next({ request: { headers: requestHeaders } });

  // Apply CSP on the response (overrides next.config.mjs CSP for all matched routes)
  res.headers.set('Content-Security-Policy', buildCsp(nonce));

  return res;
}

export const config = {
  // Skip Next.js internals, static files, and images — they don't need CSP or auth.
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|svg|gif|ico|webp)).*)',
  ],
};
