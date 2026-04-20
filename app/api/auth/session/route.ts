import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

// Session duration: 5 days in milliseconds
const SESSION_DURATION_MS = 60 * 60 * 24 * 5 * 1000;

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid idToken' }, { status: 400 });
    }

    // Mint a session cookie using Firebase Admin SDK
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    // Set the cookie on the response (HttpOnly, Secure, SameSite=Strict)
    const response = NextResponse.json({ status: 'ok' });
    response.cookies.set('session', sessionCookie, {
      maxAge: SESSION_DURATION_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// Sign-out: clear the session cookie
export async function DELETE() {
  const response = NextResponse.json({ status: 'signed-out' });
  response.cookies.set('session', '', { maxAge: 0, path: '/' });
  return response;
}
