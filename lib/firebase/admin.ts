import * as admin from 'firebase-admin';

/**
 * Firebase Admin SDK Singleton
 *
 * Manages server-side access to Firebase services (Auth, Realtime DB).
 * Uses lazy initialization and environment checks to ensure local builds
 * don't fail when secrets are missing.
 */

const isConfigured =
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY;

if (!admin.apps.length && isConfigured) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

/**
 * Typed Admin Auth instance.
 * Falls back to an empty object during build-time to prevent initialization errors.
 */
export const adminAuth = isConfigured ? admin.auth() : ({} as admin.auth.Auth);

/**
 * Typed Admin Database instance.
 */
export const adminDb = isConfigured ? admin.database() : ({} as admin.database.Database);

/**
 * Verifies a Firebase session cookie and returns the decoded claims.
 *
 * @param token - The session cookie string from the request headers
 * @returns The decoded claims or null if verification fails
 */
export async function verifyFirebaseToken(token: string) {
  try {
    return await adminAuth.verifySessionCookie(token, true);
  } catch {
    return null;
  }
}
