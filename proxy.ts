import { NextRequest, NextResponse } from 'next/server';

/**
 * PROTECTED_ROUTES define parts of the app that require a valid session cookie.
 */
const PROTECTED_ROUTES = ['/dashboard', '/operator', '/vendor', '/api/chat'];

/**
 * DESIGN DECISION: SECURITY HARDENING (Rate Limiting)
 * We implement granular rate limiting for high-cost AI endpoints to prevent 
 * denial-of-wallet attacks and ensure fair usage of the Gemini API.
 */
const chatRateLimit = new Map<string, { count: number; reset: number }>();

export async function proxy(request: NextRequest) {
  const session = request.cookies.get('session');
  const pathname = request.nextUrl.pathname;

  // 1. Authentication Check
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 2. Granular Rate Limiting for AI Chat
  if (pathname.startsWith('/api/chat')) {
    const userId = session?.value || request.ip || 'anonymous';
    const now = Date.now();
    const limit = chatRateLimit.get(userId);

    if (limit && now < limit.reset) {
      if (limit.count >= 5) { // 5 requests per 1-minute window
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait a moment.' },
          { status: 429 }
        );
      }
      limit.count++;
    } else {
      chatRateLimit.set(userId, { count: 1, reset: now + 60000 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/operator/:path*', '/vendor/:path*', '/api/chat/:path*'],
};
