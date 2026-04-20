import * as admin from 'firebase-admin';

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

// Export getters or proxies to prevent "The default Firebase app does not exist" error during build
export const adminAuth = isConfigured ? admin.auth() : {} as admin.auth.Auth;
export const adminDb = isConfigured ? admin.database() : {} as admin.database.Database;

/**
 * Verify a Firebase ID token or Session Cookie
 */
export async function verifyFirebaseToken(token: string) {
  try {
    return await adminAuth.verifySessionCookie(token, true);
  } catch {
    return null;
  }
}
