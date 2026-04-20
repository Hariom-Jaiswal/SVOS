import * as admin from 'firebase-admin';

// Initialize Firebase Admin globally to avoid multiple initializations in dev environment
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Handle newline characters in private key
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.database();

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
