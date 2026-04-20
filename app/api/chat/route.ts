import { NextRequest, NextResponse } from 'next/server';
import { askVenueAssistant } from '../../../lib/gemini/assistant';
import { adminAuth } from '../../../lib/firebase/admin';
import { AppError } from '../../../lib/security/errors';

/**
 * API Route: /api/chat
 *
 * Handles conversational queries from attendees.
 *
 * DESIGN DECISION: HYBRID AI + SECURITY
 * Uses Gemini 1.5 Pro for response generation, but requires a valid
 * Firebase session cookie for access. Implements strict input validation.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate via Session Cookie
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Double check session with Admin SDK (Strict security)
    try {
      await adminAuth.verifySessionCookie(sessionCookie, true);
    } catch {
      return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
    }

    // 2. Parse and Validate Input
    const { query, context } = await request.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    // 3. Resolve AI response
    const responseText = await askVenueAssistant(query, context);

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error('Chat API Error:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
