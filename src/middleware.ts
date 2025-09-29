import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/images',
  '/assets',
  '/public',
];

// Only protect specific routes instead of everything
const PROTECTED_PREFIXES = ['/', '/dashboard', '/chats', '/contacts', '/conversations', '/agents', '/analytics', '/settings'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Never guard API or static file requests
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') // /file.css, /file.js, etc.
  ) {
    return NextResponse.next();
  }

  // Public routes: let them pass
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // If you only want to guard a subset:
  const shouldProtect = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (!shouldProtect) return NextResponse.next();

  // Basic cookie check
  const hasSession = Boolean(req.cookies.get('twiliochat_session')?.value);
  if (!hasSession) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// ✅ Ensure matcher doesn't include API or asset paths
export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
