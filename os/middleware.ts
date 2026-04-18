import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';

const PUBLIC_PATHS = [
  '/', '/login', '/signup', '/pricing',
  '/robots.txt', '/sitemap.xml',
];
const PUBLIC_PREFIXES = [
  '/api/auth/', '/api/webhooks/', '/api/gateway/', '/api/demo/',
  '/api/revenue/', '/api/law/', '/api/compliance/',
  '/sitemap/', '/_next/', '/favicon', '/assets/',
];

const PRO_PREFIXES = ['/law', '/compliance'];
const PRO_API_PREFIXES: string[] = [];

function isPublic(path: string): boolean {
  if (PUBLIC_PATHS.includes(path)) return true;
  return PUBLIC_PREFIXES.some((p) => path.startsWith(p));
}

function requiresPro(path: string): boolean {
  return (
    PRO_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`)) ||
    PRO_API_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  let session;
  try {
    session = await getSessionFromRequest(req);
  } catch {
    session = null;
  }

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (requiresPro(pathname)) {
    const isPro = session.plan === 'pro';
    if (!isPro) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Upgrade required', code: 'plan_required' },
          { status: 402 },
        );
      }
      const url = req.nextUrl.clone();
      url.pathname = '/pricing';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets/|images/).*)',
  ],
};
