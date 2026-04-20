import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard', '/operator', '/vendor'];

export async function proxy(request: NextRequest) {
  const session = request.cookies.get('session');

  // If the route is protected and the user lacks a session, redirect to login
  if (PROTECTED_ROUTES.some((r) => request.nextUrl.pathname.startsWith(r))) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // In Edge middleware, we can't directly use firebase-admin.
    // So we validate role claims by calling an internal API route or
    // relying on the presence of the session token.
    // For stringent RBAC, an API call is required, but for latency sake:
    // We expect the session cookie to store roles securely if encoded as JWT.

    // This is a minimal check. Hard verification happens in API routes/Server Actions
    // and layout components.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/operator/:path*', '/vendor/:path*'],
};
